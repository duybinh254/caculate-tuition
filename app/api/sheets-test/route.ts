import { NextResponse } from "next/server";
import { readRange } from "@/lib/sheets";

/**
 * Route kiểm tra kết nối Google Sheets (dùng tạm ở giai đoạn setup).
 * Gọi GET /api/sheets-test để xác nhận Service Account + Spreadsheet ID đã đúng.
 * Yêu cầu Sheet có tab "Classes" với dòng tiêu đề ở hàng 1.
 */
export async function GET() {
  try {
    const rows = await readRange("Classes!A1:D1");
    return NextResponse.json({ ok: true, headerRow: rows[0] ?? [] });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
