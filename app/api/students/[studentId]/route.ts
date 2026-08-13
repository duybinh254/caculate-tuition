import { NextRequest, NextResponse } from "next/server";
import { deleteStudent, updateStudent, validateStudentInput } from "@/lib/data/students";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  try {
    const input = await validateStudentInput(await req.json());
    await updateStudent(studentId, input);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  try {
    await deleteStudent(studentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }
}
