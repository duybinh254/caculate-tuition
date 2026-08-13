import { NextRequest, NextResponse } from "next/server";
import { getUnpaidRowsForStudent } from "@/lib/data/monthlySummary";
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
    // Chặn xoá nếu học sinh còn tháng đã chốt học phí nhưng chưa đánh dấu "đã thu"
    // (đồng nhất với quy tắc xoá lớp — không để mất dấu vết công nợ).
    const unpaidRows = await getUnpaidRowsForStudent(studentId);
    if (unpaidRows.length > 0) {
      const months = [...new Set(unpaidRows.map((r) => r.month))].sort();
      throw new Error(
        `Không thể xoá — học sinh này còn ${unpaidRows.length} khoản học phí chưa thu đủ (tháng ${months.join(", ")}). ` +
          `Đánh dấu "Đã thu" ở trang Học phí trước khi xoá học sinh.`
      );
    }

    await deleteStudent(studentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }
}
