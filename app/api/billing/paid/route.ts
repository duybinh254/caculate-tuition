import { NextRequest, NextResponse } from "next/server";
import { updatePaidStatus } from "@/lib/data/billing";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const month = String(body.month ?? "");
    const studentId = String(body.studentId ?? "");
    const paid = Boolean(body.paid);

    if (!month) return NextResponse.json({ error: "Thiếu month" }, { status: 400 });
    if (!studentId) return NextResponse.json({ error: "Thiếu studentId" }, { status: 400 });

    await updatePaidStatus(month, studentId, paid);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }
}
