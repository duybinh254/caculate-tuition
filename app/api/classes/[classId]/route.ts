import { NextRequest, NextResponse } from "next/server";
import { deleteClass, updateClass, validateClassInput } from "@/lib/data/classes";
import { getUnpaidRowsForClass } from "@/lib/data/monthlySummary";
import { deleteStudentsByClassId } from "@/lib/data/students";

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
    // Chặn xoá nếu lớp còn tháng đã chốt học phí nhưng chưa đánh dấu "đã thu".
    const unpaidRows = await getUnpaidRowsForClass(classId);
    if (unpaidRows.length > 0) {
      const months = [...new Set(unpaidRows.map((r) => r.month))].sort();
      throw new Error(
        `Không thể xoá — lớp này còn ${unpaidRows.length} khoản học phí chưa thu đủ (tháng ${months.join(", ")}). ` +
          `Đánh dấu "Đã thu" ở trang Học phí trước khi xoá lớp.`
      );
    }

    // Đã đảm bảo học phí thu đủ -> xoá luôn toàn bộ học sinh thuộc lớp, rồi xoá lớp.
    const deletedStudentCount = await deleteStudentsByClassId(classId);
    await deleteClass(classId);
    return NextResponse.json({ ok: true, deletedStudentCount });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }
}
