"use client";

import { useEffect, useRef, useState } from "react";
import { formatVnd } from "@/lib/format";
import type { BillingRow } from "@/lib/data/billing";

async function parseError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return data.error ?? `Lỗi (${res.status})`;
}

export default function BillingClient({
  initialMonth,
  initialRows,
}: {
  initialMonth: string;
  initialRows: BillingRow[];
}) {
  const [month, setMonth] = useState(initialMonth);
  const [rows, setRows] = useState(initialRows);
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Bỏ qua lần chạy đầu vì initialRows đã tương ứng với initialMonth (tránh fetch trùng khi mount).
  const skipNextFetch = useRef(true);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    let cancelled = false;

    fetch(`/api/billing?month=${encodeURIComponent(month)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await parseError(res));
        return res.json();
      })
      .then((data: { rows: BillingRow[] }) => {
        if (!cancelled) setRows(data.rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [month]);

  function handleMonthChange(nextMonth: string) {
    if (!nextMonth) return;
    setError(null);
    setSavedMessage(null);
    setLoading(true);
    setMonth(nextMonth);
  }

  async function handleFinalize() {
    setError(null);
    setSavedMessage(null);
    setFinalizing(true);
    try {
      const res = await fetch("/api/billing/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      if (!res.ok) throw new Error(await parseError(res));
      const data: { rows: BillingRow[] } = await res.json();
      setRows(data.rows);
      setSavedMessage("Đã chốt học phí tháng này.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setFinalizing(false);
    }
  }

  async function handleTogglePaid(row: BillingRow) {
    if (!row.finalized) return;
    const nextPaid = !row.paid;
    setUpdatingIds((prev) => new Set(prev).add(row.studentId));
    setRows((prev) =>
      prev.map((r) => (r.studentId === row.studentId ? { ...r, paid: nextPaid } : r))
    );
    try {
      const res = await fetch("/api/billing/paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, studentId: row.studentId, paid: nextPaid }),
      });
      if (!res.ok) throw new Error(await parseError(res));
    } catch (err) {
      // rollback nếu lưu thất bại
      setRows((prev) =>
        prev.map((r) => (r.studentId === row.studentId ? { ...r, paid: row.paid } : r))
      );
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(row.studentId);
        return next;
      });
    }
  }

  const totalAmount = rows.reduce((sum, r) => sum + r.totalAmount, 0);
  const paidAmount = rows.filter((r) => r.paid).reduce((sum, r) => sum + r.totalAmount, 0);
  const unpaidAmount = totalAmount - paidAmount;
  const allFinalized = rows.length > 0 && rows.every((r) => r.finalized);

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {savedMessage && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{savedMessage}</p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <label className="flex flex-col gap-1 text-sm">
          Tháng
          <input
            type="month"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5"
          />
        </label>
        <button
          onClick={handleFinalize}
          disabled={finalizing || loading || rows.length === 0 || allFinalized}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {finalizing ? "Đang chốt..." : allFinalized ? "Đã chốt tháng này" : "Chốt học phí tháng"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">Tổng học phí</div>
          <div className="mt-1 text-lg font-semibold">{formatVnd(totalAmount)}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">Đã thu</div>
          <div className="mt-1 text-lg font-semibold text-green-600">{formatVnd(paidAmount)}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">Còn thiếu</div>
          <div className="mt-1 text-lg font-semibold text-red-500">{formatVnd(unpaidAmount)}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Học sinh</th>
              <th className="px-4 py-2 font-medium">Lớp</th>
              <th className="px-4 py-2 font-medium">Số buổi</th>
              <th className="px-4 py-2 font-medium">Đơn giá</th>
              <th className="px-4 py-2 font-medium">Thành tiền</th>
              <th className="px-4 py-2 font-medium">Trạng thái</th>
              <th className="px-4 py-2 font-medium">Đã thu</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  {loading ? "Đang tải..." : "Chưa có học sinh nào"}
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.studentId} className="border-t border-gray-100">
                <td className="px-4 py-2">{r.studentName}</td>
                <td className="px-4 py-2">{r.className}</td>
                <td className="px-4 py-2">{r.sessionCount}</td>
                <td className="px-4 py-2">{formatVnd(r.feePerSession)}</td>
                <td className="px-4 py-2 font-medium">{formatVnd(r.totalAmount)}</td>
                <td className="px-4 py-2">
                  {r.finalized ? (
                    <span className="text-gray-500">Đã chốt</span>
                  ) : (
                    <span className="text-amber-600">Chưa chốt</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={r.paid}
                    disabled={!r.finalized || updatingIds.has(r.studentId)}
                    onChange={() => handleTogglePaid(r)}
                    title={r.finalized ? undefined : "Chốt tháng trước khi đánh dấu đã thu"}
                    className="h-4 w-4"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        Học sinh &quot;Chưa chốt&quot; đang hiển thị số liệu tạm tính từ điểm danh hiện tại. Bấm
        &quot;Chốt học phí tháng&quot; để lưu cố định số buổi/số tiền (không đổi dù sau này sửa điểm danh),
        rồi mới đánh dấu được đã thu.
      </p>
    </div>
  );
}
