import { NextRequest, NextResponse } from "next/server";
import { createStudent, getStudents, validateStudentInput } from "@/lib/data/students";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function GET() {
  try {
    const students = await getStudents();
    return NextResponse.json({ students });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = await validateStudentInput(await req.json());
    const created = await createStudent(input);
    return NextResponse.json({ student: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }
}
