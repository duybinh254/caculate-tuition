import { NextRequest, NextResponse } from "next/server";
import { deleteClass, updateClass, validateClassInput } from "@/lib/data/classes";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  try {
    const input = validateClassInput(await req.json());
    await updateClass(classId, input);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  try {
    await deleteClass(classId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }
}
