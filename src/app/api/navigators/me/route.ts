import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { lambdaFetch } from "@/lib/lambda";
import {
  mapNavigatorUpsertBodyForLambda,
  normalizeNavigatorFromLambda,
} from "@/lib/navigatorProfile";

export async function GET() {
  const session = await auth0.getSession();
  const res = await lambdaFetch("/navigators/me");
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if ((res.status === 403 || res.status === 404) && session?.user?.sub) {
      const allRes = await lambdaFetch("/navigators");
      const allData = await allRes.json().catch(() => []);
      if (allRes.ok) {
        const rows = Array.isArray(allData)
          ? allData
          : ((allData as { navigators?: unknown[] })?.navigators ?? []);
        const me = rows.find((row) => {
          if (!row || typeof row !== "object") return false;
          const r = row as Record<string, unknown>;
          return r.auth0_user_id === session.user.sub || r.userId === session.user.sub;
        });
        if (me) {
          const profile = normalizeNavigatorFromLambda(
            me,
            session.user?.name ?? null,
            session.user?.sub ?? null
          );
          return NextResponse.json(profile ?? me, { status: 200 });
        }
      }
    }
    return NextResponse.json(data, { status: res.status });
  }
  const profile = normalizeNavigatorFromLambda(
    data,
    session?.user?.name ?? null,
    session?.user?.sub ?? null
  );
  return NextResponse.json(profile ?? data, { status: profile ? 200 : res.status });
}

// Upsert the current navigator's profile.
//
// The Lambda uses PATCH /navigators/:id for updates (not PUT).
// GET /navigators/me returns 404 when no row exists yet.
export async function PUT(req: NextRequest) {
  const session = await auth0.getSession();
  const body = (await req.json()) as Record<string, unknown>;
  const payload = JSON.stringify(mapNavigatorUpsertBodyForLambda(body));
  const displayNameFallback =
    (typeof body.name === "string" ? body.name : null) ?? session?.user?.name ?? null;

  const meRes = await lambdaFetch("/navigators/me");
  if (meRes.ok) {
    const me = (await meRes.json().catch(() => null)) as { id?: string } | null;
    if (me?.id) {
      const patchRes = await lambdaFetch(`/navigators/${me.id}`, {
        method: "PATCH",
        body: payload,
      });
      const raw = await patchRes.json().catch(() => null);
      const profile = normalizeNavigatorFromLambda(raw, displayNameFallback, session?.user?.sub ?? null);
      return NextResponse.json(profile ?? raw, { status: patchRes.status });
    }
  }

  const auth0UserId: string | undefined =
    typeof body.auth0_user_id === "string"
      ? body.auth0_user_id
      : typeof body.userId === "string"
        ? body.userId
        : undefined;
  if (auth0UserId) {
    const allRes = await lambdaFetch("/navigators");
    if (allRes.ok) {
      const all = (await allRes.json().catch(() => [])) as Array<{
        id: string;
        userId?: string;
        auth0_user_id?: string;
      }>;
      if (Array.isArray(all)) {
        const existing = all.find(
          (n) => n.userId === auth0UserId || n.auth0_user_id === auth0UserId,
        );
        if (existing?.id) {
          const patchRes = await lambdaFetch(`/navigators/${existing.id}`, {
            method: "PATCH",
            body: payload,
          });
          const raw = await patchRes.json().catch(() => null);
          const profile = normalizeNavigatorFromLambda(raw, displayNameFallback, session?.user?.sub ?? null);
          return NextResponse.json(profile ?? raw, { status: patchRes.status });
        }
      }
    }
  }

  const createRes = await lambdaFetch("/navigators", {
    method: "POST",
    body: payload,
  });
  const raw = await createRes.json().catch(() => null);
  const profile = normalizeNavigatorFromLambda(raw, displayNameFallback, session?.user?.sub ?? null);
  return NextResponse.json(profile ?? raw, { status: createRes.status });
}
