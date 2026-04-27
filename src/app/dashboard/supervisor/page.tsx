import { auth0 } from "@/lib/auth0";
import { lambdaFetch } from "@/lib/lambda";
import { redirect } from "next/navigation";
import Link from "next/link";
import moment from "moment";
import { ChevronDown } from "lucide-react";

interface Session {
  id: string;
  navigator_id: string | null;
  need_category: string;
  language: string | null;
  status: string;
  created_at: string;
  closed_at: string | null;
  submitted_for_review: boolean | null;
  approved: boolean | null;
  notes: string | null;
  outcome: string[] | null;
  follow_up_date: string | null;
  coaching_notes: string | null;
}

interface NavProfile {
  id: string;
  auth0_user_id: string;
  nav_group: string;
  status: string;
  capacity: number;
}

const AVATAR_COLORS = [
  "bg-blue-400",
  "bg-green-500",
  "bg-purple-400",
  "bg-rose-400",
  "bg-amber-400",
  "bg-teal-500",
];

function avatarInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function SessionRow({ session, badge }: { session: Session; badge?: React.ReactNode }) {
  return (
    <Link
      href={`/dashboard/supervisor/${session.id}`}
      className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 hover:shadow-sm transition"
    >
      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">#{session.id.slice(-5).toUpperCase()}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
            {session.need_category.replace(/_/g, " ")}
          </span>
          {badge}
          <span className="text-xs text-gray-400" suppressHydrationWarning>
            {moment(session.created_at).calendar(null, {
              sameDay: "[Today at] h:mm A",
              lastDay: "[Yesterday at] h:mm A",
              lastWeek: "MMM D [at] h:mm A",
              sameElse: "MMM D, YYYY [at] h:mm A",
            })}
          </span>
        </div>
      </div>
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
        {session.status === "closed" ? "Closed" : "Active"}
      </span>
    </Link>
  );
}

const BAR_WIDTHS = [
  "w-0", "w-[10%]", "w-[20%]", "w-[30%]", "w-[40%]",
  "w-[50%]", "w-[60%]", "w-[70%]", "w-[80%]", "w-[90%]", "w-full",
] as const;

function barWidth(load: number): string {
  return BAR_WIDTHS[Math.min(10, Math.round(Math.min(1, load) * 10))];
}

function NavigatorRow({ nav, sessions }: { nav: NavProfile; sessions: Session[] }) {
  const navSessions = sessions.filter((s) => s.navigator_id === nav.id);
  const active = navSessions.filter((s) => s.status !== "closed");
  const closed = navSessions.filter((s) => s.status === "closed");
  const load = nav.capacity > 0 ? active.length / nav.capacity : 0;
  const barColor = load > 1 ? "bg-orange-400" : load >= 0.8 ? "bg-amber-400" : "bg-green-400";
  const initials = avatarInitials(nav.nav_group);
  const bg = avatarColor(nav.nav_group);

  return (
    <details className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
      <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none select-none hover:bg-gray-50 transition">
        <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
          <span className="text-xs font-semibold text-white">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{nav.nav_group}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            <span className="text-green-600 font-medium">{active.length} active</span>
            {"  ·  "}
            <span>{closed.length} closed</span>
            {"  ·  "}
            <span className={load > 1 ? "text-orange-500 font-medium" : ""}>{active.length}/{nav.capacity}</span>
          </p>
          <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${barColor} rounded-full ${barWidth(load)}`} />
          </div>
        </div>
        <ChevronDown size={16} className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
      </summary>
      {active.length > 0 && (
        <div className="px-4 pb-3 pt-2 space-y-2 border-t border-gray-100">
          {active.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </div>
      )}
      {active.length === 0 && (
        <div className="px-4 pb-3 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">No active sessions.</p>
        </div>
      )}
    </details>
  );
}

export default async function SupervisorDashboardPage() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login");

  const [sessionsRes, navsRes] = await Promise.all([
    lambdaFetch("/sessions"),
    lambdaFetch("/navigators"),
  ]);

  const sessionsBody = await sessionsRes.json().catch(() => []);
  const navsBody = await navsRes.json().catch(() => []);

  const allSessions: Session[] = sessionsRes.ok
    ? Array.isArray(sessionsBody) ? sessionsBody : (sessionsBody.sessions ?? [])
    : [];
  const navigators: NavProfile[] = navsRes.ok
    ? Array.isArray(navsBody) ? navsBody : (navsBody.navigators ?? [])
    : [];

  const byRecent = (a: Session, b: Session) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

  const needsReview = allSessions
    .filter((s) => s.submitted_for_review === true && s.approved !== true)
    .sort(byRecent);

  const active = allSessions.filter((s) => s.status !== "closed");
  const newRequests = allSessions.filter((s) => s.navigator_id === null);
  const approvedArchive = allSessions.filter((s) => s.approved === true).sort(byRecent);
  const navigatorsWithSessions = navigators.filter((n) =>
    allSessions.some((s) => s.navigator_id === n.id)
  );

  const stats = [
    { label: "Total Sessions", value: allSessions.length, valueColor: "text-gray-900", labelColor: "text-gray-400" },
    { label: "Active", value: active.length, valueColor: "text-green-700", labelColor: "text-green-600" },
    { label: "New Requests", value: newRequests.length, valueColor: newRequests.length > 0 ? "text-amber-600" : "text-gray-900", labelColor: newRequests.length > 0 ? "text-amber-600" : "text-gray-400" },
    { label: "Awaiting Review", value: needsReview.length, valueColor: needsReview.length > 0 ? "text-amber-600" : "text-gray-900", labelColor: needsReview.length > 0 ? "text-amber-600" : "text-gray-400" },
  ];

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0 sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-3">
          <Link href="/" className="font-medium text-sm text-gray-900 hover:opacity-70 transition-opacity">
            StreetLives
          </Link>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-yellow text-gray-900">
            Supervisor
          </span>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 pb-4 pt-0.5">
          <h1 className="text-xl font-normal text-gray-900 tracking-tight">Sessions</h1>
        </div>
      </header>

      {/* Two-column body */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: Needs Review */}
        <div className="flex-[2] min-w-0 overflow-y-auto border-r border-gray-200 px-5 py-5 space-y-3">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
            Needs Review
            {needsReview.length > 0 && (
              <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                {needsReview.length}
              </span>
            )}
          </h2>
          {needsReview.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-8 text-center">
              <p className="text-sm text-gray-400">No sessions pending review</p>
            </div>
          ) : (
            needsReview.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                badge={
                  <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">
                    Needs Review
                  </span>
                }
              />
            ))
          )}
        </div>

        {/* Right: Metrics + By Navigator + Approved Archive */}
        <div className="flex-[3] min-w-0 overflow-y-auto px-5 py-5 space-y-6">
          {/* Metrics strip */}
          <div className="grid grid-cols-4 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white border border-gray-200 rounded-xl px-3 py-4 text-center">
                <p className={`text-2xl font-normal ${stat.valueColor}`}>{stat.value}</p>
                <p className={`text-xs font-medium mt-0.5 ${stat.labelColor}`}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* By Navigator */}
          <section className="space-y-2">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">By Navigator</h2>
            {navigatorsWithSessions.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl px-5 py-8 text-center">
                <p className="text-sm text-gray-400">No navigators found</p>
              </div>
            ) : (
              navigatorsWithSessions.map((nav) => (
                <NavigatorRow key={nav.id} nav={nav} sessions={allSessions} />
              ))
            )}
          </section>

          {/* Approved Archive */}
          <section className="space-y-2">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Approved Archive</h2>
            {approvedArchive.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl px-5 py-8 text-center">
                <p className="text-sm text-gray-400">No approved sessions yet</p>
              </div>
            ) : (
              approvedArchive.map((s) => <SessionRow key={s.id} session={s} />)
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
