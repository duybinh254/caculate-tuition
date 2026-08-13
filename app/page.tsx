import Link from "next/link";
import NavBar from "@/components/NavBar";
import { computeBilling } from "@/lib/data/billing";
import { getStudents } from "@/lib/data/students";
import { currentLocalMonth, formatMonthLabel } from "@/lib/date";
import { formatVnd } from "@/lib/format";

// Dữ liệu lấy trực tiếp từ Google Sheets ở mỗi request, không thể prerender tĩnh lúc build.
export const dynamic = "force-dynamic";

export default async function Home() {
  const month = currentLocalMonth();
  const [students, billingRows] = await Promise.all([getStudents(), computeBilling(month)]);

  const activeStudentCount = students.filter((s) => s.status === "active").length;
  const totalAmount = billingRows.reduce((sum, r) => sum + r.totalAmount, 0);
  const paidAmount = billingRows.filter((r) => r.paid).reduce((sum, r) => sum + r.totalAmount, 0);
  const unpaidAmount = totalAmount - paidAmount;

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 pb-24">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-1 font-medium">{formatMonthLabel(month)}</h2>
          <p className="text-sm text-gray-500">
            Quản lý lớp học, học sinh, điểm danh và tính học phí theo tháng.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Học sinh đang học</div>
            <div className="mt-1 text-lg font-semibold">{activeStudentCount}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Học phí dự kiến tháng này</div>
            <div className="mt-1 text-lg font-semibold">{formatVnd(totalAmount)}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Đã thu</div>
            <div className="mt-1 text-lg font-semibold text-green-600">{formatVnd(paidAmount)}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Còn thiếu</div>
            <div className="mt-1 text-lg font-semibold text-red-500">{formatVnd(unpaidAmount)}</div>
          </div>
        </section>

        <Link href="/billing" className="self-start text-sm text-gray-500 underline">
          Xem chi tiết học phí tháng này →
        </Link>
      </main>
    </div>
  );
}
