"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BottomSheet from "@/components/BottomSheet";
import ConfirmDialog from "@/components/ConfirmDialog";
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null = đang thêm mới
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClassRow | null>(null);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setSheetOpen(true);
  }

  function openEdit(c: ClassRow) {
    setEditingId(c.classId);
    setForm({ className: c.className, feePerSession: String(c.feePerSession), note: c.note ?? "" });
    setError(null);
    setSheetOpen(true);
  }

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        className: form.className,
        feePerSession: Number(form.feePerSession),
        note: form.note,
      };

      if (editingId) {
        const res = await fetch(`/api/classes/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await parseError(res));
        setClasses((prev) =>
          prev
            .map((c) => (c.classId === editingId ? { ...c, ...payload } : c))
            .sort((a, b) => a.className.localeCompare(b.className, "vi"))
        );
      } else {
        const res = await fetch("/api/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await parseError(res));
        const { class: created } = await res.json();
        setClasses((prev) => [...prev, created].sort((a, b) => a.className.localeCompare(b.className, "vi")));
      }
      setSheetOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(classId: string) {
    setError(null);
    try {
      const res = await fetch(`/api/classes/${classId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await parseError(res));
      setClasses((prev) => prev.filter((c) => c.classId !== classId));
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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Tên lớp</th>
              <th className="px-4 py-2 font-medium">Học phí/buổi</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  Chưa có lớp nào
                </td>
              </tr>
            )}
            {classes.map((c) => (
              <tr key={c.classId} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  <div>{c.className}</div>
                  {c.note && <div className="text-xs text-gray-400">{c.note}</div>}
                </td>
                <td className="px-4 py-2">{formatVnd(c.feePerSession)}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button onClick={() => openEdit(c)} className="mr-3 text-gray-500 underline">
                    Sửa
                  </button>
                  <button onClick={() => setDeleteTarget(c)} className="text-red-500 underline">
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={openAdd}
        aria-label="Thêm lớp"
        className="fixed bottom-20 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingId ? "Sửa lớp" : "Thêm lớp"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <label className="flex flex-col gap-1 text-sm">
            Tên lớp
            <input
              required
              autoFocus
              value={form.className}
              onChange={(e) => setForm({ ...form, className: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2"
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
              className="rounded-lg border border-gray-300 px-3 py-2"
              placeholder="100000"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Ghi chú
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm lớp"}
          </button>
        </form>
      </BottomSheet>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xoá lớp?"
        description={
          deleteTarget ? `Xoá lớp "${deleteTarget.className}"? Không thể hoàn tác.` : undefined
        }
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget.classId);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
