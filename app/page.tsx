const NAV_ITEMS = [
  { href: "/classes", label: "Lớp học", status: "Giai đoạn 2" },
  { href: "/students", label: "Học sinh", status: "Giai đoạn 2" },
  { href: "/attendance", label: "Điểm danh", status: "Giai đoạn 3" },
  { href: "/billing", label: "Tính học phí", status: "Giai đoạn 4" },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tính học phí</h1>
        <form action="/api/login" method="DELETE">
          {/* logout thật sự sẽ thêm client component ở giai đoạn sau nếu cần */}
        </form>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-1 font-medium">Khung dự án đã sẵn sàng ✅</h2>
        <p className="text-sm text-gray-500">
          Đã kết nối mật khẩu bảo vệ + wrapper Google Sheets API. Các trang quản lý bên dưới sẽ
          được xây ở các giai đoạn tiếp theo.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.href}
            className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-400"
          >
            <div className="font-medium text-gray-700">{item.label}</div>
            <div className="mt-1">{item.status}</div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
        Kiểm tra kết nối Google Sheets:{" "}
        <a className="underline" href="/api/sheets-test" target="_blank" rel="noreferrer">
          /api/sheets-test
        </a>
      </section>
    </main>
  );
}
