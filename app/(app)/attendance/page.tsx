import { getClasses } from "@/lib/data/classes";
import { getStudents } from "@/lib/data/students";
import AttendanceClient from "./attendance-client";

// Dữ liệu lấy trực tiếp từ Google Sheets ở mỗi request, không thể prerender tĩnh lúc build.
export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const [classes, students] = await Promise.all([getClasses(), getStudents()]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4 pb-24">
      {classes.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Chưa có lớp nào — vào trang <a className="underline" href="/classes">Lớp học</a> để tạo lớp
          trước.
        </p>
      ) : (
        <AttendanceClient classes={classes} students={students} />
      )}
    </main>
  );
}
