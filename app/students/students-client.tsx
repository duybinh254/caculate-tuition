"use client";

import { Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomSheet from "@/components/BottomSheet";
import ConfirmDialog from "@/components/ConfirmDialog";
import Select from "@/components/Select";
import type { ClassRow, StudentRow } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "active", label: "Đang học" },
  { value: "inactive", label: "Nghỉ học" },
];

interface FormState {
  name: string;
  classId: string;
  studentPhone: string;
  parentPhone: string;
  status: "active" | "inactive";
}

function emptyForm(defaultClassId: string): FormState {
  return { name: "", classId: defaultClassId, studentPhone: "", parentPhone: "", status: "active" };
}

async function parseError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return data.error ?? `Lỗi (${res.status})`;
}

export default function StudentsClient({
  initialStudents,
  classes,
}: {
  initialStudents: StudentRow[];
  classes: ClassRow[];
}) {
  const router = useRouter();
  const classNameById = new Map(classes.map((c) => [c.classId, c.className]));

  const [students, setStudents] = useState(initialStudents);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null = đang thêm mới
  const [form, setForm] = useState<FormState>(emptyForm(classes[0]?.classId ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudentRow | null>(null);

  function sortStudents(list: StudentRow[]) {
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }

  const groups = useMemo(() => {
    const byClass = new Map<string, { classId: string; className: string; students: StudentRow[] }>();
    for (const s of students) {
      const className = classNameById.get(s.classId) ?? "Chưa rõ lớp";
      if (!byClass.has(s.classId)) {
        byClass.set(s.classId, { classId: s.classId, className, students: [] });
      }
      byClass.get(s.classId)!.students.push(s);
    }
    return [...byClass.values()].sort((a, b) => a.className.localeCompare(b.className, "vi"));
    // classNameById được tạo lại mỗi render từ `classes`, nên dùng classes làm dep thay vì map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, classes]);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm(classes[0]?.classId ?? ""));
    setError(null);
    setSheetOpen(true);
  }

  function openEdit(s: StudentRow) {
    setEditingId(s.studentId);
    setForm({
      name: s.name,
      classId: s.classId,
      studentPhone: s.studentPhone ?? "",
      parentPhone: s.parentPhone ?? "",
      status: s.status,
    });
    setError(null);
    setSheetOpen(true);
  }

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/students/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error(await parseError(res));
        setStudents((prev) =>
          sortStudents(prev.map((s) => (s.studentId === editingId ? { ...s, ...form } : s)))
        );
      } else {
        const res = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error(await parseError(res));
        const { student: created } = await res.json();
        setStudents((prev) => sortStudents([...prev, created]));
      }
      setSheetOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(studentId: string) {
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await parseError(res));
      setStudents((prev) => prev.filter((s) => s.studentId !== studentId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && !sheetOpen && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {students.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
          Chưa có học sinh nào
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.classId}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h3 className="text-sm font-semibold text-gray-700">{group.className}</h3>
                <span className="text-xs text-gray-400">{group.students.length} học sinh</span>
              </div>
              <div className="flex flex-col gap-2">
                {group.students.map((s) => (
                  <div key={s.studentId} className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.name}</span>
                      {s.status === "active" ? (
                        <span className="text-xs text-green-600">Đang học</span>
                      ) : (
                        <span className="text-xs text-gray-400">Nghỉ học</span>
                      )}
                    </div>
                    {(s.studentPhone || s.parentPhone) && (
                      <div className="mt-1 text-xs text-gray-400">
                        {s.studentPhone && <span>HS: {s.studentPhone}</span>}
                        {s.studentPhone && s.parentPhone && <span> · </span>}
                        {s.parentPhone && <span>PH: {s.parentPhone}</span>}
                      </div>
                    )}
                    <div className="mt-2 flex justify-end gap-3 border-t border-gray-100 pt-2 text-sm">
                      <button onClick={() => openEdit(s)} className="text-gray-500 underline">
                        Sửa
                      </button>
                      <button onClick={() => setDeleteTarget(s)} className="text-red-500 underline">
                        Xoá
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={openAdd}
        aria-label="Thêm học sinh"
        className="fixed bottom-20 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingId ? "Sửa học sinh" : "Thêm học sinh"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <label className="flex flex-col gap-1 text-sm">
            Tên học sinh
            <input
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Lớp
            <Select
              value={form.classId}
              onValueChange={(v) => setForm({ ...form, classId: v })}
              options={classes.map((c) => ({ value: c.classId, label: c.className }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            SĐT học sinh
            <input
              value={form.studentPhone}
              onChange={(e) => setForm({ ...form, studentPhone: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            SĐT phụ huynh
            <input
              value={form.parentPhone}
              onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          {editingId && (
            <label className="flex flex-col gap-1 text-sm">
              Trạng thái
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}
                options={STATUS_OPTIONS}
              />
            </label>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm học sinh"}
          </button>
        </form>
      </BottomSheet>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xoá học sinh?"
        description={deleteTarget ? `Xoá học sinh "${deleteTarget.name}"? Không thể hoàn tác.` : undefined}
        onConfirm={async () => {
          if (deleteTarget) await handleDelete(deleteTarget.studentId);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
