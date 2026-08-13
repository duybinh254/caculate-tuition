import NavBar from "@/components/NavBar";
import { getClasses } from "@/lib/data/classes";
import ClassesClient from "./classes-client";

// Dữ liệu lấy trực tiếp từ Google Sheets ở mỗi request, không thể prerender tĩnh lúc build.
export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const classes = await getClasses();

  return (
    <div className="flex flex-1 flex-col">
      <NavBar title="Lớp học" />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4 pb-24">
        <ClassesClient initialClasses={classes} />
      </main>
    </div>
  );
}
