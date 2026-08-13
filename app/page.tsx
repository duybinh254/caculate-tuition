import NavBar from "@/components/NavBar";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h1 className="mb-1 font-medium">Tính học phí</h1>
          <p className="text-sm text-gray-500">
            Quản lý lớp học, học sinh, điểm danh và tính học phí theo tháng.
          </p>
        </section>

        <section className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
          Kiểm tra kết nối Google Sheets:{" "}
          <a className="underline" href="/api/sheets-test" target="_blank" rel="noreferrer">
            /api/sheets-test
          </a>
        </section>
      </main>
    </div>
  );
}
