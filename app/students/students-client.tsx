"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClassRow, StudentRow } from "@/lib/types";

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
  const [form, setForm] = useState<FormState>(emptyForm(classes[0]?.classId ?? ""));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm(classes[0]?.classId ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function sortStudents(list: StudentRow[]) {
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }

  async function handleAdd(e: React.SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await parseError(res));
      const { student: created } = await res.json();
      setStudents((prev) => sortStudents([...prev, created]));
      setForm(emptyForm(classes[0]?.classId ?? ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(s: StudentRow) {
    setEditingId(s.studentId);
    setEditForm({
      name: s.name,
      classId: s.classId,
      studentPhone: s.studentPhone ?? "",
      parentPhone: s.parentPhone ?? "",
      status: s.status,
    });
    setError(null);
  }

  async function handleSaveEdit(studentId: string) {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error(await parseError(res));
      setStudents((prev) =>
        sortStudents(prev.map((s) => (s.studentId === studentId ? { ...s, ...editForm } : s)))
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(studentId: string) {
    if (!confirm("Xoá học sinh này? Không thể hoàn tác.")) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await parseError(res));
      setStudents((prev) => prev.filter((s) => s.studentId !== studentId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={handleAdd}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          Tên học sinh
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-1.5"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Lớp
          <select
            required
            value={form.classId}
            onChange={(e) => setForm({ ...form, classId: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-1.5"
          >
            {classes.map((c) => (
              <option key={c.classId} value={c.classId}>
                {c.className}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          SĐT học sinh
          <input
            value={form.studentPhone}
            onChange={(e) => setForm({ ...form, studentPhone: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-1.5"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          SĐT phụ huynh
          <input
            value={form.parentPhone}
            onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-1.5"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Thêm học sinh
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Tên học sinh</th>
              <th className="px-4 py-2 font-medium">Lớp</th>
              <th className="px-4 py-2 font-medium">SĐT học sinh</th>
              <th className="px-4 py-2 font-medium">SĐT phụ huynh</th>
              <th className="px-4 py-2 font-medium">Trạng thái</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Chưa có học sinh nào
                </td>
              </tr>
            )}
            {students.map((s) =>
              editingId === s.studentId ? (
                <tr key={s.studentId} className="border-t border-gray-100">
                  <td className="px-4 py-2">
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full rounded border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={editForm.classId}
                      onChange={(e) => setEditForm({ ...editForm, classId: e.target.value })}
                      className="rounded border border-gray-300 px-2 py-1"
                    >
                      {classes.map((c) => (
                        <option key={c.classId} value={c.classId}>
                          {c.className}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={editForm.studentPhone}
                      onChange={(e) => setEditForm({ ...editForm, studentPhone: e.target.value })}
                      className="w-full rounded border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={editForm.parentPhone}
                      onChange={(e) => setEditForm({ ...editForm, parentPhone: e.target.value })}
                      className="w-full rounded border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value as "active" | "inactive" })
                      }
                      className="rounded border border-gray-300 px-2 py-1"
                    >
                      <option value="active">Đang học</option>
                      <option value="inactive">Nghỉ học</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleSaveEdit(s.studentId)}
                      disabled={submitting}
                      className="mr-2 text-gray-900 underline"
                    >
                      Lưu
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 underline">
                      Huỷ
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={s.studentId} className="border-t border-gray-100">
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{classNameById.get(s.classId) ?? "—"}</td>
                  <td className="px-4 py-2 text-gray-500">{s.studentPhone}</td>
                  <td className="px-4 py-2 text-gray-500">{s.parentPhone}</td>
                  <td className="px-4 py-2">
                    {s.status === "active" ? (
                      <span className="text-green-600">Đang học</span>
                    ) : (
                      <span className="text-gray-400">Nghỉ học</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(s)} className="mr-3 text-gray-500 underline">
                      Sửa
                    </button>
                    <button onClick={() => handleDelete(s.studentId)} className="text-red-500 underline">
                      Xoá
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
