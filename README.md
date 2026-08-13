# Tính học phí

Web app cá nhân để quản lý lớp học, học sinh, điểm danh và tính học phí theo tháng
(số buổi đi học × học phí/buổi của từng lớp). Dữ liệu lưu trên Google Sheet.

## Trạng thái hiện tại (Giai đoạn 0–1: hoàn thành)

- ✅ Khung Next.js (TypeScript + Tailwind + App Router)
- ✅ Wrapper kết nối Google Sheets API (`lib/sheets.ts`)
- ✅ Bảo vệ app bằng mật khẩu (`middleware.ts`, trang `/login`)
- ⏳ Các trang quản lý Lớp / Học sinh / Điểm danh / Tính học phí — sẽ làm ở các giai đoạn sau

## Việc bạn cần làm 1 lần: chuẩn bị Google Cloud + Google Sheet

### 1. Tạo Google Cloud project & bật Sheets API

1. Vào https://console.cloud.google.com/ → tạo project mới (hoặc dùng project có sẵn).
2. Vào **APIs & Services → Library**, tìm **Google Sheets API** → bấm **Enable**.

### 2. Tạo Service Account

1. Vào **APIs & Services → Credentials → Create Credentials → Service Account**.
2. Đặt tên bất kỳ (vd. `tinh-hoc-phi`), bấm **Create and Continue** → **Done** (không cần cấp role gì thêm).
3. Vào Service Account vừa tạo → tab **Keys** → **Add Key → Create new key → JSON** → tải file JSON về.
4. Mở file JSON, bạn sẽ cần 2 giá trị:
   - `client_email` → dán vào `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → dán vào `GOOGLE_PRIVATE_KEY`

⚠️ Giữ bí mật file JSON này, không commit lên git / chia sẻ cho ai.

### 3. Tạo Google Sheet

1. Tạo 1 Google Sheet mới, đặt tên tuỳ ý (vd. "Học phí - Dữ liệu").
2. Tạo 4 tab (sheet con) với tên và dòng tiêu đề **chính xác** như sau:

   **Classes**
   | classId | className | feePerSession | note |
   |---|---|---|---|

   **Students**
   | studentId | name | classId | parentPhone | status |
   |---|---|---|---|---|

   **Attendance**
   | date | classId | studentId | present |
   |---|---|---|---|

   **MonthlySummary**
   | month | studentId | classId | sessionCount | feePerSession | totalAmount | paid |
   |---|---|---|---|---|---|---|

3. Bấm **Share** (Chia sẻ) trên Sheet → thêm email trong `client_email` (bước 2) → quyền **Editor**.
4. Copy **Spreadsheet ID** từ URL:
   `https://docs.google.com/spreadsheets/d/ĐÂY_LÀ_SPREADSHEET_ID/edit` → dán vào `GOOGLE_SPREADSHEET_ID`.

### 4. Cấu hình biến môi trường cho project

```bash
cp .env.local.example .env.local
```

Mở `.env.local` và điền đủ 4 giá trị: `APP_PASSWORD`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
`GOOGLE_PRIVATE_KEY`, `GOOGLE_SPREADSHEET_ID`.

## Chạy thử ở local

```bash
npm run dev
```

Mở http://localhost:3000 → nếu bị chuyển tới `/login`, nhập đúng `APP_PASSWORD` bạn đã đặt.

Kiểm tra kết nối Google Sheets: mở http://localhost:3000/api/sheets-test
— nếu trả về `{"ok": true, "headerRow": [...]}` nghĩa là kết nối thành công.

## Deploy lên Vercel (free)

1. Push code lên GitHub.
2. Vào https://vercel.com → **Add New Project** → chọn repo.
3. Trong **Environment Variables**, thêm đúng 4 biến như trong `.env.local`
   (lưu ý `GOOGLE_PRIVATE_KEY` giữ nguyên các `\n`).
4. Deploy.

## Cấu trúc thư mục đáng chú ý

```
lib/sheets.ts     -> đọc/ghi Google Sheet (readRange, appendRows, updateRange, clearRange)
lib/types.ts      -> kiểu dữ liệu cho các sheet (Class, Student, Attendance, MonthlySummary)
lib/auth.ts       -> tạo/kiểm tra session token cho đăng nhập bằng mật khẩu
middleware.ts     -> chặn mọi trang nếu chưa đăng nhập
app/login/        -> trang đăng nhập
app/api/login/    -> API đăng nhập/đăng xuất
app/api/sheets-test/ -> API tạm để test kết nối Sheet
```
