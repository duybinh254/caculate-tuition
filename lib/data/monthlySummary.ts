import { appendRows, readRange, updateRange } from "@/lib/sheets";

const SHEET = "MonthlySummary";

export interface MonthlySummaryRow {
  rowNumber: number; // số dòng thật trên Sheet
  month: string;
  studentId: string;
  classId: string;
  sessionCount: number;
  feePerSession: number;
  totalAmount: number;
  paid: boolean;
}

async function readAll(): Promise<MonthlySummaryRow[]> {
  const rows = await readRange(`${SHEET}!A2:G`);
  return rows
    .map((r, i) => ({
      rowNumber: i + 2,
      month: r[0] ?? "",
      studentId: r[1] ?? "",
      classId: r[2] ?? "",
      sessionCount: Number(r[3] ?? 0),
      feePerSession: Number(r[4] ?? 0),
      totalAmount: Number(r[5] ?? 0),
      paid: r[6] === "TRUE" || r[6] === "true" || r[6] === "1",
    }))
    .filter((r) => r.month && r.studentId);
}

export async function getMonthlySummary(month: string): Promise<MonthlySummaryRow[]> {
  const rows = await readAll();
  return rows.filter((r) => r.month === month);
}

export interface FinalizeEntry {
  studentId: string;
  classId: string;
  sessionCount: number;
  feePerSession: number;
  totalAmount: number;
}

/**
 * Chốt học phí tháng: upsert theo (month, studentId). Dòng nào đã tồn tại thì bỏ qua
 * (không tính lại) để giữ nguyên số liệu đã chốt trước đó; chỉ ghi các dòng chưa có.
 */
export async function finalizeMonth(month: string, entries: FinalizeEntry[]): Promise<void> {
  if (entries.length === 0) return;

  const existing = await readAll();
  const existingStudentIds = new Set(existing.filter((r) => r.month === month).map((r) => r.studentId));

  const toAppend = entries
    .filter((e) => !existingStudentIds.has(e.studentId))
    .map((e) => [month, e.studentId, e.classId, e.sessionCount, e.feePerSession, e.totalAmount, "FALSE"]);

  if (toAppend.length > 0) await appendRows(`${SHEET}!A:G`, toAppend);
}

/** Đánh dấu đã thu / chưa thu cho 1 học sinh trong 1 tháng đã chốt. */
export async function setPaidStatus(month: string, studentId: string, paid: boolean): Promise<void> {
  const rows = await readAll();
  const row = rows.find((r) => r.month === month && r.studentId === studentId);
  if (!row) {
    throw new Error("Chưa chốt học phí tháng này cho học sinh — hãy bấm Chốt tháng trước.");
  }
  await updateRange(`${SHEET}!G${row.rowNumber}`, [[paid ? "TRUE" : "FALSE"]]);
}
