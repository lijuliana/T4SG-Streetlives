import { NextRequest, NextResponse } from "next/server";
import { lambdaFetch } from "@/lib/lambda";

export async function GET() {
  const res = await lambdaFetch("/navigators/me");
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}

// Upsert the current navigator's profile.
//
// The Lambda uses PATCH /navigators/:id for updates (not PUT).
// GET /navigators/me returns 404 for incomplete profiles, so we fall back to
// scanning GET /navigators (all) to find the row by userId / auth0_user_id,
// then PATCH it. If no row exists at all, POST /navigators creates one.
export async function PUT(req: NextRequest) {
  const body = await req.json();

  // Step 1: GET /navigators/me — works for complete profiles.
  const meRes = await lambdaFetch("/navigators/me");
  if (meRes.ok) {
    const me = await meRes.json().catch(() => null) as { id?: string } | null;
    if (me?.id) {
      const patchRes = await lambdaFetch(`/navigators/${me.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return NextResponse.json(await patchRes.json().catch(() => null), { status: patchRes.status });
    }
  }

  // Step 2: GET /navigators/me returned 404 (incomplete profile).
  // Scan the full list and match on userId or auth0_user_id from the request body.
  const auth0UserId: string | undefined = body.auth0_user_id ?? body.userId;
  if (auth0UserId) {
    const allRes = await lambdaFetch("/navigators");
    if (allRes.ok) {
      const all = await allRes.json().catch(() => []) as Array<{
        id: string;
        userId?: string;
        auth0_user_id?: string;
      }>;
      if (Array.isArray(all)) {
        const existing = all.find(
          (n) => n.userId === auth0UserId || n.auth0_user_id === auth0UserId
        );
        if (existing?.id) {
          const patchRes = await lambdaFetch(`/navigators/${existing.id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
          });
          return NextResponse.json(await patchRes.json().catch(() => null), { status: patchRes.status });
        }
      }
    }
  }

  // Step 3: No existing row found — create a new profile.
  const createRes = await lambdaFetch("/navigators", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return NextResponse.json(await createRes.json().catch(() => null), { status: createRes.status });
}
