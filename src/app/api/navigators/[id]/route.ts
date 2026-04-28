import { NextRequest, NextResponse } from "next/server";
import { lambdaFetch } from "@/lib/lambda";

// Next.js 15 passes route params as a Promise in App Router handlers.
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const res = await lambdaFetch(`/navigators/${id}`);
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await req.json();
  const res = await lambdaFetch(`/navigators/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
