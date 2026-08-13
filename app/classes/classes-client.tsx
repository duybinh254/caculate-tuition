"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatVnd } from "@/lib/format";
import type { ClassRow } from "@/lib/types";

interface FormState {
  className: string;
  feePerSession: string;
  note: string;
}

const EMPTY_FORM: FormState = { className: "", feePerSession: "", note: "" };

async function parseError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return data.error ?? `Lỗi (${res.status})`;
}

export default function ClassesClient({ initialClasses }: { initialClasses: ClassRow[] }) {
  const router = useRouter();
  const [classes, setClasses] = useState(initialClasses);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    router.refresh();
  }

  async function handleAdd(e: React.SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: form.className,
          feePerSession: Number(form.feePerSession),
          note: form.note,
        }),
      });
      if (!res.ok) throw new Error(await parseError(res));
      const { class: created } = await res.json();
      setClasses((prev) => [...prev, created].sort((a, b) => a.className.localeCompare(b.className, "vi")));
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(c: ClassRow) {
    setEditingId(c.classId);
    setEditForm({ className: c.className, feePerSession: String(c.feePerSession), note: c.note ?? "" });
    setError(null);
  }

  async function handleSaveEdit(classId: string) {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: editForm.className,
          feePerSession: Number(editForm.feePerSession),
          note: editForm.note,
        }),
      });
      if (!res.ok) throw new Error(await parseError(res));
      setClasses((prev) =>
        prev
          .map((c) =>
            c.classId === classId
              ? { ...c, className: editForm.className, feePerSession: Number(editForm.feePerSession), note: editForm.note }
              : c
          )
          .sort((a, b) => a.className.localeCompare(b.className, "vi"))
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(classId: string) {
    if (!confirm("Xoá lớp này? Không thể hoàn tác.")) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/classes/${classId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await parseError(res));
      setClasses((prev) => prev.filter((c) => c.classId !== classId));
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <form
        onSubmit={handleAdd}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          Tên lớp
          <input
            required
            value={form.className}
            onChange={(e) => setForm({ ...form, className: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-1.5"
            placeholder="Lớp A"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Học phí/buổi (đ)
          <input
            required
            type="number"
            min={0}
            value={form.feePerSession}
            onChange={(e) => setForm({ ...form, feePerSession: e.target.value })}
            className="w-36 rounded-lg border border-gray-300 px-3 py-1.5"
            placeholder="100000"
          />
        </label>
        <label className="flex flex-1 min-w-40 flex-col gap-1 text-sm">
          Ghi chú
          <input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-1.5"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Thêm lớp
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Tên lớp</th>
              <th className="px-4 py-2 font-medium">Học phí/buổi</th>
              <th className="px-4 py-2 font-medium">Ghi chú</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Chưa có lớp nào
                </td>
              </tr>
            )}
            {classes.map((c) =>
              editingId === c.classId ? (
                <tr key={c.classId} className="border-t border-gray-100">
                  <td className="px-4 py-2">
                    <input
                      value={editForm.className}
                      onChange={(e) => setEditForm({ ...editForm, className: e.target.value })}
                      className="w-full rounded border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      value={editForm.feePerSession}
                      onChange={(e) => setEditForm({ ...editForm, feePerSession: e.target.value })}
                      className="w-28 rounded border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={editForm.note}
                      onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                      className="w-full rounded border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleSaveEdit(c.classId)}
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
                <tr key={c.classId} className="border-t border-gray-100">
                  <td className="px-4 py-2">{c.className}</td>
                  <td className="px-4 py-2">{formatVnd(c.feePerSession)}</td>
                  <td className="px-4 py-2 text-gray-500">{c.note}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(c)} className="mr-3 text-gray-500 underline">
                      Sửa
                    </button>
                    <button onClick={() => handleDelete(c.classId)} className="text-red-500 underline">
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
