import { generateId } from "@/lib/id";
import { sheetTable } from "@/lib/sheetsTable";
import type { StudentRow } from "@/lib/types";
import { getClasses } from "./classes";

const SHEET = "Students";
const COLUMNS = ["studentId", "name", "classId", "studentPhone", "parentPhone", "status"];
const table = sheetTable(SHEET, COLUMNS.length);

function mapRow(cells: string[]): StudentRow {
  return {
    studentId: cells[0] ?? "",
    name: cells[1] ?? "",
    classId: cells[2] ?? "",
    studentPhone: cells[3] ?? "",
    parentPhone: cells[4] ?? "",
    status: cells[5] === "inactive" ? "inactive" : "active",
  };
}

export interface StudentInput {
  name: string;
  classId: string;
  studentPhone?: string;
  parentPhone?: string;
  status: "active" | "inactive";
}

export async function validateStudentInput(body: unknown): Promise<StudentInput> {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = String(b.name ?? "").trim();
  const classId = String(b.classId ?? "").trim();
  const studentPhone = typeof b.studentPhone === "string" ? b.studentPhone.trim() : "";
  const parentPhone = typeof b.parentPhone === "string" ? b.parentPhone.trim() : "";
  const status = b.status === "inactive" ? "inactive" : "active";

  if (!name) throw new Error("Thiếu tên học sinh");
  if (!classId) throw new Error("Chưa chọn lớp");

  const classes = await getClasses();
  if (!classes.some((c) => c.classId === classId)) {
    throw new Error("Lớp đã chọn không tồn tại");
  }

  return { name, classId, studentPhone, parentPhone, status };
}

export async function getStudents(): Promise<StudentRow[]> {
  const rows = await table.list(mapRow);
  return rows.sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

export async function createStudent(input: StudentInput): Promise<StudentRow> {
  const row: StudentRow = { studentId: generateId("s"), ...input };
  await table.append([
    row.studentId,
    row.name,
    row.classId,
    row.studentPhone ?? "",
    row.parentPhone ?? "",
    row.status,
  ]);
  return row;
}

export async function updateStudent(studentId: string, input: StudentInput): Promise<void> {
  await table.updateById(studentId, [
    studentId,
    input.name,
    input.classId,
    input.studentPhone ?? "",
    input.parentPhone ?? "",
    input.status,
  ]);
}

export async function deleteStudent(studentId: string): Promise<void> {
  await table.deleteById(studentId);
}

/** Xoá toàn bộ học sinh thuộc 1 lớp trong 1 lần gọi API. Trả về số học sinh đã xoá. */
export async function deleteStudentsByClassId(classId: string): Promise<number> {
  const students = await getStudents();
  const ids = students.filter((s) => s.classId === classId).map((s) => s.studentId);
  await table.deleteManyById(ids);
  return ids.length;
}
