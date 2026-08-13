import { generateId } from "@/lib/id";
import { sheetTable } from "@/lib/sheetsTable";
import type { ClassRow } from "@/lib/types";

const SHEET = "Classes";
const COLUMNS = ["classId", "className", "feePerSession", "note"];
const table = sheetTable(SHEET, COLUMNS.length);

function mapRow(cells: string[]): ClassRow {
  return {
    classId: cells[0] ?? "",
    className: cells[1] ?? "",
    feePerSession: Number(cells[2] ?? 0),
    note: cells[3] ?? "",
  };
}

export interface ClassInput {
  className: string;
  feePerSession: number;
  note?: string;
}

export function validateClassInput(body: unknown): ClassInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const className = String(b.className ?? "").trim();
  const feePerSession = Number(b.feePerSession);
  const note = typeof b.note === "string" ? b.note.trim() : "";

  if (!className) throw new Error("Thiếu tên lớp");
  if (!Number.isFinite(feePerSession) || feePerSession < 0) {
    throw new Error("Học phí/buổi không hợp lệ");
  }
  return { className, feePerSession, note };
}

export async function getClasses(): Promise<ClassRow[]> {
  const rows = await table.list(mapRow);
  return rows.sort((a, b) => a.className.localeCompare(b.className, "vi"));
}

export async function createClass(input: ClassInput): Promise<ClassRow> {
  const row: ClassRow = { classId: generateId("c"), ...input, note: input.note ?? "" };
  await table.append([row.classId, row.className, row.feePerSession, row.note ?? ""]);
  return row;
}

export async function updateClass(classId: string, input: ClassInput): Promise<void> {
  await table.updateById(classId, [classId, input.className, input.feePerSession, input.note ?? ""]);
}

export async function deleteClass(classId: string): Promise<void> {
  await table.deleteById(classId);
}
