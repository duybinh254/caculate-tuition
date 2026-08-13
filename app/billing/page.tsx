import NavBar from "@/components/NavBar";
import { computeBilling } from "@/lib/data/billing";
import { currentLocalMonth } from "@/lib/date";
import BillingClient from "./billing-client";

// Dữ liệu lấy trực tiếp từ Google Sheets ở mỗi request, không thể prerender tĩnh lúc build.
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const month = currentLocalMonth();
  const rows = await computeBilling(month);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar title="Học phí" />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4 pb-24">
        <BillingClient initialMonth={month} initialRows={rows} />
      </main>
    </div>
  );
}
