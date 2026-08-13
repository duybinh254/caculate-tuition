import { appendRows, deleteSheetRow, deleteSheetRows, readRange, updateRange } from "./sheets";

/** Chuyển số cột (1-based) thành chữ cái cột kiểu Sheets: 1 -> A, 27 -> AA ... */
function columnLetter(n: number): string {
  let s = "";
  let x = n;
  while (x > 0) {
    const rem = (x - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

/**
 * Lớp helper coi 1 tab Google Sheet như 1 "bảng" đơn giản: hàng 1 là tiêu đề,
 * 1 cột đóng vai trò khoá chính (ID). Dùng chung cho Classes/Students/... để
 * không lặp lại logic đọc/ghi/xoá theo ID ở từng API route.
 */
export function sheetTable(sheetName: string, columnCount: number, idColumnIndex = 0) {
  const lastCol = columnLetter(columnCount);
  const idCol = columnLetter(idColumnIndex + 1);

  async function findRowIndex(id: string): Promise<number> {
    const idCells = await readRange(`${sheetName}!${idCol}2:${idCol}`);
    return idCells.findIndex((row) => row[0] === id);
  }

  return {
    /** Đọc toàn bộ dữ liệu (bỏ qua hàng tiêu đề và các dòng trống). */
    async list<T>(mapRow: (cells: string[]) => T): Promise<T[]> {
      const rows = await readRange(`${sheetName}!A2:${lastCol}`);
      return rows.filter((row) => row.some((cell) => cell !== "")).map(mapRow);
    },

    /** Thêm 1 dòng mới vào cuối bảng. */
    async append(values: (string | number)[]): Promise<void> {
      await appendRows(`${sheetName}!A:${lastCol}`, [values]);
    },

    /** Cập nhật dòng có ID trùng khớp. Ném lỗi nếu không tìm thấy. */
    async updateById(id: string, values: (string | number)[]): Promise<void> {
      const rowIndex = await findRowIndex(id);
      if (rowIndex === -1) throw new Error(`Không tìm thấy bản ghi có ID "${id}"`);
      const rowNumber = rowIndex + 2; // +1 vì 1-based, +1 nữa vì bỏ qua hàng tiêu đề
      await updateRange(`${sheetName}!A${rowNumber}:${lastCol}${rowNumber}`, [values]);
    },

    /** Xoá hẳn dòng có ID trùng khớp. Ném lỗi nếu không tìm thấy. */
    async deleteById(id: string): Promise<void> {
      const rowIndex = await findRowIndex(id);
      if (rowIndex === -1) throw new Error(`Không tìm thấy bản ghi có ID "${id}"`);
      await deleteSheetRow(sheetName, rowIndex + 1); // +1 vì hàng 0 là tiêu đề
    },

    /** Xoá nhiều dòng theo danh sách ID trong 1 lần gọi API. Bỏ qua ID không tìm thấy. */
    async deleteManyById(ids: string[]): Promise<void> {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      const idCells = await readRange(`${sheetName}!${idCol}2:${idCol}`);
      const rowIndices = idCells
        .map((row, i) => (idSet.has(row[0]) ? i + 1 : -1)) // +1 vì hàng 0 là tiêu đề
        .filter((i) => i !== -1);
      await deleteSheetRows(sheetName, rowIndices);
    },
  };
}
