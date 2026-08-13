import NavBar from "@/components/NavBar";
import { getClasses } from "@/lib/data/classes";
import { getStudents } from "@/lib/data/students";
import StudentsClient from "./students-client";

// Dữ liệu lấy trực tiếp từ Google Sheets ở mỗi request, không thể prerender tĩnh lúc build.
export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const [students, classes] = await Promise.all([getStudents(), getClasses()]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
        <h1 className="text-xl font-semibold">Học sinh</h1>
        {classes.length === 0 ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Chưa có lớp nào — vào trang <a className="underline" href="/classes">Lớp học</a> để tạo lớp
            trước khi thêm học sinh.
          </p>
        ) : (
          <StudentsClient initialStudents={students} classes={classes} />
        )}
      </main>
    </div>
  );
}
