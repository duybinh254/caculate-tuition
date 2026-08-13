import { NextRequest, NextResponse } from "next/server";
import { finalizeMonth } from "@/lib/data/billing";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const month = String((body as Record<string, unknown>).month ?? "");
    if (!month) return NextResponse.json({ error: "Thiếu month" }, { status: 400 });
    const rows = await finalizeMonth(month);
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }
}
