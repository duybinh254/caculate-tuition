import { google } from "googleapis";

/**
 * Wrapper mỏng quanh Google Sheets API v4.
 * Dùng Service Account để xác thực — không cần OAuth login vì app chỉ có 1 người dùng.
 *
 * Yêu cầu biến môi trường:
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL
 * - GOOGLE_PRIVATE_KEY   (giữ nguyên \n trong key, xem .env.local.example)
 * - GOOGLE_SPREADSHEET_ID
 */

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Thiếu biến môi trường ${name}. Xem README.md để cấu hình.`);
  }
  return value;
}

function getAuth() {
  const email = getEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  // Trên Vercel, xuống dòng trong env var thường bị escape thành "\\n" -> cần đổi lại thành "\n"
  const privateKey = getEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

function getSpreadsheetId(): string {
  return getEnv("GOOGLE_SPREADSHEET_ID");
}

/** Đọc dữ liệu một vùng, ví dụ range = "Classes!A2:D" */
export async function readRange(range: string): Promise<string[][]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range,
  });
  return (res.data.values as string[][]) ?? [];
}

/** Thêm các dòng mới vào cuối bảng, ví dụ range = "Classes!A:D" */
export async function appendRows(range: string, rows: (string | number)[][]) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  });
}

/** Ghi đè dữ liệu vào một vùng cụ thể, ví dụ range = "Classes!A2:D2" */
export async function updateRange(range: string, rows: (string | number)[][]) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
}

/** Ghi đè nhiều vùng khác nhau trong 1 lần gọi API (tiết kiệm quota khi cập nhật nhiều dòng). */
export async function batchUpdateRanges(updates: { range: string; values: (string | number)[][] }[]) {
  if (updates.length === 0) return;
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: updates.map((u) => ({ range: u.range, values: u.values })),
    },
  });
}

/** Xoá nội dung một vùng (không xoá dòng/cột, chỉ xoá giá trị) */
export async function clearRange(range: string) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: getSpreadsheetId(),
    range,
  });
}

// Cache sheetId (gid) theo tên tab trong bộ nhớ của tiến trình — tab không đổi tên/gid
// trong lúc chạy, nên không cần gọi lại API mỗi lần xoá dòng (đỡ 1 round-trip mạng).
// Trên serverless, cache này chỉ tồn tại trong 1 lambda "ấm" (warm), tự làm mới khi nguội.
const sheetIdCache = new Map<string, number>();

/** Tìm sheetId (gid) nội bộ của Google từ tên tab, cần cho việc xoá hẳn 1 dòng */
export async function getSheetIdByTitle(title: string): Promise<number> {
  const cached = sheetIdCache.get(title);
  if (cached !== undefined) return cached;

  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.get({
    spreadsheetId: getSpreadsheetId(),
    fields: "sheets.properties",
  });
  const match = res.data.sheets?.find((s) => s.properties?.title === title);
  const sheetId = match?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) {
    throw new Error(`Không tìm thấy tab "${title}" trong Google Sheet`);
  }
  sheetIdCache.set(title, sheetId);
  return sheetId;
}

/**
 * Xoá hẳn 1 dòng khỏi sheet (dịch các dòng bên dưới lên), theo chỉ số dòng
 * tính từ 0 trên toàn bộ tab (0 = dòng tiêu đề).
 */
export async function deleteSheetRow(sheetTitle: string, rowIndex0Based: number) {
  return deleteSheetRows(sheetTitle, [rowIndex0Based]);
}

/**
 * Xoá nhiều dòng cùng lúc trong 1 lần gọi API (thay vì gọi xoá từng dòng riêng lẻ — chậm
 * và tốn quota khi xoá cả loạt, ví dụ xoá hết học sinh của 1 lớp). Xoá từ dòng có chỉ số
 * lớn xuống nhỏ trong cùng batch để các dòng chưa xoá không bị lệch chỉ số giữa các request.
 */
export async function deleteSheetRows(sheetTitle: string, rowIndices0Based: number[]) {
  if (rowIndices0Based.length === 0) return;
  const sheets = getSheetsClient();
  const sheetId = await getSheetIdByTitle(sheetTitle);
  const sortedDescending = [...rowIndices0Based].sort((a, b) => b - a);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      requests: sortedDescending.map((idx) => ({
        deleteDimension: {
          range: { sheetId, dimension: "ROWS", startIndex: idx, endIndex: idx + 1 },
        },
      })),
    },
  });
}
