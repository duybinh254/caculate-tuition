import { getPresentCountsForMonth } from "./attendance";
import { getClasses } from "./classes";
import { finalizeMonth as finalizeMonthRaw, getMonthlySummary, setPaidStatus } from "./monthlySummary";
import { getStudents } from "./students";

export interface BillingRow {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  sessionCount: number;
  feePerSession: number;
  totalAmount: number;
  paid: boolean;
  /** true nếu đã "chốt" (có snapshot trong MonthlySummary) — số liệu không đổi dù điểm danh sau đó có sửa. */
  finalized: boolean;
}

export function isValidMonth(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

function assertValidMonth(month: string) {
  if (!isValidMonth(month)) throw new Error("Tháng không hợp lệ (định dạng YYYY-MM)");
}

/**
 * Bảng học phí của 1 tháng: học sinh nào đã "chốt" thì lấy đúng số liệu đã lưu
 * (không đổi dù sau này sửa điểm danh); học sinh chưa chốt thì tính "live" từ
 * điểm danh + học phí/buổi hiện tại của lớp (bảng xem trước, có thể còn thay đổi).
 */
export async function computeBilling(month: string): Promise<BillingRow[]> {
  assertValidMonth(month);

  const [classes, students, presentCounts, summary] = await Promise.all([
    getClasses(),
    getStudents(),
    getPresentCountsForMonth(month),
    getMonthlySummary(month),
  ]);

  const classById = new Map(classes.map((c) => [c.classId, c]));
  const studentById = new Map(students.map((s) => [s.studentId, s]));
  const summaryByStudent = new Map(summary.map((s) => [s.studentId, s]));

  const studentIds = new Set([
    ...students.filter((s) => s.status === "active").map((s) => s.studentId),
    ...summary.map((s) => s.studentId),
  ]);

  const rows: BillingRow[] = [];
  for (const studentId of studentIds) {
    const student = studentById.get(studentId);
    if (!student) continue; // học sinh đã bị xoá hẳn khỏi Sheet, bỏ qua

    const saved = summaryByStudent.get(studentId);
    if (saved) {
      rows.push({
        studentId,
        studentName: student.name,
        classId: saved.classId,
        className: classById.get(saved.classId)?.className ?? "—",
        sessionCount: saved.sessionCount,
        feePerSession: saved.feePerSession,
        totalAmount: saved.totalAmount,
        paid: saved.paid,
        finalized: true,
      });
    } else {
      const cls = classById.get(student.classId);
      const sessionCount = presentCounts[`${student.classId}|${studentId}`] ?? 0;
      const feePerSession = cls?.feePerSession ?? 0;
      rows.push({
        studentId,
        studentName: student.name,
        classId: student.classId,
        className: cls?.className ?? "—",
        sessionCount,
        feePerSession,
        totalAmount: sessionCount * feePerSession,
        paid: false,
        finalized: false,
      });
    }
  }

  return rows
    // Ẩn học sinh chưa chốt mà 0 buổi trong tháng (vd. lớp/học sinh chưa tồn tại ở tháng đó,
    // hoặc chỉ đơn giản là chưa điểm danh buổi nào) — tránh hiện dòng 0đ gây hiểu lầm.
    // Dòng đã chốt thì luôn giữ lại để không mất dữ liệu đã lưu.
    .filter((r) => r.finalized || r.sessionCount > 0)
    .sort((a, b) => a.studentName.localeCompare(b.studentName, "vi"));
}

/** Chốt học phí tháng: lưu snapshot cho các học sinh chưa chốt (giữ nguyên dòng đã chốt trước đó). */
export async function finalizeMonth(month: string): Promise<BillingRow[]> {
  assertValidMonth(month);
  const rows = await computeBilling(month);
  const entries = rows
    .filter((r) => !r.finalized)
    .map((r) => ({
      studentId: r.studentId,
      classId: r.classId,
      sessionCount: r.sessionCount,
      feePerSession: r.feePerSession,
      totalAmount: r.totalAmount,
    }));
  await finalizeMonthRaw(month, entries);
  return computeBilling(month);
}

export async function updatePaidStatus(month: string, studentId: string, paid: boolean): Promise<void> {
  assertValidMonth(month);
  await setPaidStatus(month, studentId, paid);
}
