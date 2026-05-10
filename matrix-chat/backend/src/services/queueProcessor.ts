/**
 * Queue processor — re-routes unassigned sessions when navigator availability changes.
 *
 * Triggered after:
 *   - A session is closed (frees one slot on the assigned navigator)
 *   - A navigator profile is updated (status, capacity, schedule, or languages changed)
 *
 * Processing rules:
 *   - Sessions are processed oldest-first (FIFO) to honour wait order.
 *   - Each session is routed with the same algorithm used at creation time
 *     (schedule check, language match, category preference, load balancing).
 *   - If a session cannot be assigned yet, it stays unassigned; the next trigger
 *     will retry.
 *   - The active-load counter is updated after each assignment within the loop,
 *     so subsequent iterations see the correct load for navigators already assigned
 *     in this batch.
 *
 * Dependency injection keeps the processor testable without singleton side effects.
 * Use makeDefaultDeps() to build the standard deps from the real stores, then call
 * processQueue(makeDefaultDeps(BASE_URL)) in route handlers.
 */

import { assignNavigator } from "./routingService.js";
import { sessionStore } from "./sessionStore.js";
import { navigatorStore } from "./navigatorStore.js";
import { sessionEventStore } from "./sessionEventStore.js";
import { inviteToRoom } from "./matrixService.js";
import type { NavigatorProfile, RoutingReason, RoutingInput, Session } from "../types.js";

// ── Dependency interface ──────────────────────────────────────────────────────

export interface QueueProcessorDeps {
  /** Returns all sessions currently awaiting assignment (status === "unassigned"). */
  listUnassigned: () => Session[];
  /** Returns the full navigator roster for routing decisions. */
  listNavigators: () => NavigatorProfile[];
  /** Returns the current active-session count for a navigator (queried per iteration). */
  getActiveLoad: (navigatorId: string) => number;
  /**
   * Atomically commits a successful queue assignment:
   *   - sets assignedNavigatorId, routingVersion, routingReason on the session
   *   - clears routingFailReason
   *   - transitions session status to "active"
   */
  commitAssignment: (args: {
    sessionId: string;
    navigatorId: string;
    routingVersion: string;
    routingReason: RoutingReason;
  }) => void;
  /** Records a session lifecycle event (fire-and-forget; return value ignored). */
  recordEvent: (args: {
    sessionId: string;
    eventType: "assigned";
    actor: string | null;
    metadata: Record<string, unknown>;
  }) => void;
  /** Invites the navigator to the Matrix room (fire-and-forget; errors non-fatal). */
  inviteNavigator: (matrixRoomId: string, navigatorUserId: string) => void;
}

// ── Core processor ────────────────────────────────────────────────────────────

/**
 * Attempts to assign every unassigned session using the full routing algorithm.
 * Returns the number of sessions successfully assigned in this pass.
 *
 * @param deps - Injected dependencies (use makeDefaultDeps() in production)
 * @param now  - Timestamp used for schedule evaluation; defaults to current time
 */
export async function processQueue(
  deps: QueueProcessorDeps,
  now: Date = new Date(),
): Promise<number> {
  const sessions = deps
    .listUnassigned()
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (sessions.length === 0) return 0;

  const navigators = deps.listNavigators();
  let assigned = 0;

  for (const session of sessions) {
    const input: RoutingInput = {
      needCategory: session.needCategory ?? "other",
      language: session.language ?? undefined,
    };

    const outcome = assignNavigator(input, navigators, deps.getActiveLoad, "initial", now);
    if (!outcome.assigned) continue;

    deps.commitAssignment({
      sessionId: session.sessionId,
      navigatorId: outcome.navigator.id,
      routingVersion: outcome.routingVersion,
      routingReason: outcome.routingReason,
    });

    deps.recordEvent({
      sessionId: session.sessionId,
      eventType: "assigned",
      actor: "system",
      metadata: {
        navigatorId: outcome.navigator.id,
        navigatorUserId: outcome.navigator.userId,
        routingVersion: outcome.routingVersion,
        routingReason: outcome.routingReason,
        fromQueue: true,
      },
    });

    deps.inviteNavigator(session.matrixRoomId, outcome.navigator.userId);

    console.log(
      `[queueProcessor] session=${session.sessionId} assigned to navigator=${outcome.navigator.id} loadRatio=${outcome.routingReason.loadRatio.toFixed(3)}`,
    );
    assigned++;
  }

  if (sessions.length > 0) {
    console.log(
      `[queueProcessor] processed ${sessions.length} queued session(s), assigned ${assigned}`,
    );
  }

  return assigned;
}

// ── Singleton deps factory ────────────────────────────────────────────────────

/**
 * Builds the standard QueueProcessorDeps wired to the real stores.
 * Pass the result directly to processQueue():
 *
 *   processQueue(makeDefaultDeps(BASE_URL)).catch(...)
 */
export function makeDefaultDeps(baseUrl: string): QueueProcessorDeps {
  return {
    listUnassigned: () =>
      sessionStore.list().filter((s) => s.status === "unassigned"),

    listNavigators: () => navigatorStore.list(),

    getActiveLoad: (id) => sessionStore.countActiveByNavigator(id),

    commitAssignment: ({ sessionId, navigatorId, routingVersion, routingReason }) => {
      sessionStore.setNavigatorAssignment(sessionId, navigatorId, routingVersion, routingReason);
      sessionStore.updateStatus(sessionId, "active");
    },

    recordEvent: (args) => { sessionEventStore.append(args); },

    inviteNavigator: (roomId, userId) => {
      inviteToRoom(baseUrl, roomId, userId).catch((err: unknown) => {
        console.error("[queueProcessor] Matrix invite error (non-fatal):", err);
      });
    },
  };
}
