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

/** Xoá nội dung một vùng (không xoá dòng/cột, chỉ xoá giá trị) */
export async function clearRange(range: string) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: getSpreadsheetId(),
    range,
  });
}

/** Tìm sheetId (gid) nội bộ của Google từ tên tab, cần cho việc xoá hẳn 1 dòng */
export async function getSheetIdByTitle(title: string): Promise<number> {
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
  return sheetId;
}

/**
 * Xoá hẳn 1 dòng khỏi sheet (dịch các dòng bên dưới lên), theo chỉ số dòng
 * tính từ 0 trên toàn bộ tab (0 = dòng tiêu đề).
 */
export async function deleteSheetRow(sheetTitle: string, rowIndex0Based: number) {
  const sheets = getSheetsClient();
  const sheetId = await getSheetIdByTitle(sheetTitle);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex0Based,
              endIndex: rowIndex0Based + 1,
            },
          },
        },
      ],
    },
  });
}
