"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Loader2 } from "lucide-react";
import { useState } from "react";

/**
 * Modal xác nhận (thay cho window.confirm() mặc định của trình duyệt) — dùng cho các thao tác xoá.
 * `onConfirm` có thể là async và có thể throw để báo huỷ thao tác (vd. bị chặn do ràng buộc dữ liệu):
 * dialog tự hiện trạng thái đang xử lý, và nếu onConfirm throw thì hiện lỗi ngay trong dialog,
 * KHÔNG tự đóng — người dùng đọc được lý do trước khi đóng, thay vì đóng câm rồi lỗi ẩn phía sau.
 *
 * Lưu ý cho nơi gọi: truyền `key` gắn theo ID đối tượng đang chờ xoá (vd. `key={deleteTarget?.id}`)
 * để React tự remount component mỗi lần đổi đối tượng — nhờ vậy state lỗi/loading cũ không dính lại.
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Xoá",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(); // thành công thì bên gọi tự đóng dialog (đổi prop `open`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-40 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-4 shadow-xl">
          <AlertDialog.Title className="text-base font-semibold text-gray-900">{title}</AlertDialog.Title>
          {description && (
            <AlertDialog.Description className="mt-1 text-sm text-gray-500">
              {description}
            </AlertDialog.Description>
          )}
          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialog.Cancel
              disabled={submitting}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 active:bg-gray-100 disabled:opacity-50"
            >
              Huỷ
            </AlertDialog.Cancel>
            {/* Dùng button thường thay vì AlertDialog.Action: Action tự đóng dialog ngay khi
                bấm, không đợi onConfirm (async) chạy xong — mất luôn trạng thái loading/lỗi. */}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white active:bg-red-700 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Đang xoá..." : confirmLabel}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
