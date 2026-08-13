import { NextRequest, NextResponse } from "next/server";
import { getAttendance, saveAttendance, validateAttendanceInput } from "@/lib/data/attendance";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId") ?? "";
    const date = searchParams.get("date") ?? "";
    if (!classId || !date) {
      return NextResponse.json({ error: "Thiếu classId hoặc date" }, { status: 400 });
    }
    const attendance = await getAttendance(classId, date);
    return NextResponse.json({ attendance });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = validateAttendanceInput(await req.json());
    await saveAttendance(input);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }
}
