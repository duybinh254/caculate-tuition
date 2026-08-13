import NavBar from "@/components/NavBar";
import { getClasses } from "@/lib/data/classes";
import ClassesClient from "./classes-client";

// Dữ liệu lấy trực tiếp từ Google Sheets ở mỗi request, không thể prerender tĩnh lúc build.
export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const classes = await getClasses();

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
        <h1 className="text-xl font-semibold">Lớp học</h1>
        <ClassesClient initialClasses={classes} />
      </main>
    </div>
  );
}
