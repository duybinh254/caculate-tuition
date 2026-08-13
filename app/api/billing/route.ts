import { NextRequest, NextResponse } from "next/server";
import { computeBilling } from "@/lib/data/billing";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function GET(req: NextRequest) {
  try {
    const month = new URL(req.url).searchParams.get("month") ?? "";
    if (!month) return NextResponse.json({ error: "Thiếu month" }, { status: 400 });
    const rows = await computeBilling(month);
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }
}
