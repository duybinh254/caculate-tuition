import { appendRows, batchUpdateRanges, readRange } from "@/lib/sheets";

const SHEET = "Attendance";

interface RawRow {
  rowNumber: number; // số dòng thật trên Sheet (1-based, đã tính hàng tiêu đề)
  date: string;
  classId: string;
  studentId: string;
  present: boolean;
}

async function readAll(): Promise<RawRow[]> {
  const rows = await readRange(`${SHEET}!A2:D`);
  return rows
    .map((r, i) => ({
      rowNumber: i + 2, // +2: bù 1 vì 1-based, bù 1 nữa vì bỏ qua hàng tiêu đề
      date: r[0] ?? "",
      classId: r[1] ?? "",
      studentId: r[2] ?? "",
      present: r[3] === "TRUE" || r[3] === "true" || r[3] === "1",
    }))
    .filter((r) => r.date && r.classId && r.studentId);
}

export interface AttendanceEntry {
  studentId: string;
  present: boolean;
}

export interface AttendanceInput {
  classId: string;
  date: string;
  entries: AttendanceEntry[];
}

export function validateAttendanceInput(body: unknown): AttendanceInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const classId = String(b.classId ?? "").trim();
  const date = String(b.date ?? "").trim();
  const entriesRaw = Array.isArray(b.entries) ? b.entries : [];

  if (!classId) throw new Error("Thiếu lớp");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Ngày không hợp lệ (định dạng YYYY-MM-DD)");
  if (entriesRaw.length === 0) throw new Error("Chưa có học sinh nào để điểm danh");

  const entries = entriesRaw.map((raw): AttendanceEntry => {
    const e = (raw ?? {}) as Record<string, unknown>;
    const studentId = String(e.studentId ?? "").trim();
    if (!studentId) throw new Error("Thiếu studentId trong danh sách điểm danh");
    return { studentId, present: Boolean(e.present) };
  });

  return { classId, date, entries };
}

/** Lấy trạng thái điểm danh đã lưu của 1 lớp trong 1 ngày: { studentId: present } */
export async function getAttendance(classId: string, date: string): Promise<Record<string, boolean>> {
  const rows = await readAll();
  const result: Record<string, boolean> = {};
  for (const r of rows) {
    if (r.classId === classId && r.date === date) result[r.studentId] = r.present;
  }
  return result;
}

/** Đếm số buổi có mặt (present) của 1 học sinh trong 1 lớp, theo khoảng ngày [fromDate, toDate] (YYYY-MM-DD, cả 2 đầu). */
export async function countPresentSessions(
  classId: string,
  studentId: string,
  fromDate: string,
  toDate: string
): Promise<number> {
  const rows = await readAll();
  return rows.filter(
    (r) =>
      r.classId === classId &&
      r.studentId === studentId &&
      r.present &&
      r.date >= fromDate &&
      r.date <= toDate
  ).length;
}

/** Lưu điểm danh cho 1 lớp/1 ngày: cập nhật dòng đã có, thêm mới dòng chưa có. */
export async function saveAttendance(input: AttendanceInput): Promise<void> {
  const { classId, date, entries } = input;
  const existingRows = await readAll();
  const rowNumberByKey = new Map(
    existingRows.map((r) => [`${r.date}|${r.classId}|${r.studentId}`, r.rowNumber])
  );

  const updates: { range: string; values: (string | number)[][] }[] = [];
  const toAppend: (string | number)[][] = [];

  for (const entry of entries) {
    const key = `${date}|${classId}|${entry.studentId}`;
    const rowNumber = rowNumberByKey.get(key);
    const values = [date, classId, entry.studentId, entry.present ? "TRUE" : "FALSE"];
    if (rowNumber) {
      updates.push({ range: `${SHEET}!A${rowNumber}:D${rowNumber}`, values: [values] });
    } else {
      toAppend.push(values);
    }
  }

  if (updates.length > 0) await batchUpdateRanges(updates);
  if (toAppend.length > 0) await appendRows(`${SHEET}!A:D`, toAppend);
}
