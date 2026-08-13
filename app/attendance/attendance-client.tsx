"use client";

import { useEffect, useMemo, useState } from "react";
import Select from "@/components/Select";
import { todayLocalDate } from "@/lib/date";
import type { ClassRow, StudentRow } from "@/lib/types";

async function parseError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return data.error ?? `Lỗi (${res.status})`;
}

export default function AttendanceClient({
  classes,
  students,
}: {
  classes: ClassRow[];
  students: StudentRow[];
}) {
  const [classId, setClassId] = useState(classes[0]?.classId ?? "");
  const [date, setDate] = useState(todayLocalDate());
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  // Mặc định true vì effect bên dưới sẽ luôn fetch ngay khi mount.
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Reset trạng thái ngay khi người dùng đổi lớp/ngày (gọi trong event handler,
  // không phải trong effect, để tránh setState đồng bộ trong useEffect).
  function handleClassChange(nextClassId: string) {
    setError(null);
    setSavedMessage(null);
    setLoading(true);
    setClassId(nextClassId);
  }

  function handleDateChange(nextDate: string) {
    setError(null);
    setSavedMessage(null);
    setLoading(true);
    setDate(nextDate);
  }

  const studentsInClass = useMemo(
    () =>
      students
        .filter((s) => s.classId === classId && s.status === "active")
        .sort((a, b) => a.name.localeCompare(b.name, "vi")),
    [students, classId]
  );

  useEffect(() => {
    if (!classId || !date) return;
    let cancelled = false;

    fetch(`/api/attendance?classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(date)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await parseError(res));
        return res.json();
      })
      .then((data: { attendance: Record<string, boolean> }) => {
        if (cancelled) return;
        // Mặc định học sinh chưa có bản ghi là "có mặt" để đỡ phải tick từng em,
        // giáo viên chỉ cần bỏ tick những em vắng.
        const next: Record<string, boolean> = {};
        for (const s of studentsInClass) {
          next[s.studentId] = data.attendance[s.studentId] ?? true;
        }
        setMarks(next);
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
    // studentsInClass phụ thuộc classId+students nên không cần thêm vào deps để tránh loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date]);

  function toggle(studentId: string) {
    setMarks((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  }

  function setAll(present: boolean) {
    const next: Record<string, boolean> = {};
    for (const s of studentsInClass) next[s.studentId] = present;
    setMarks(next);
  }

  async function handleSave() {
    setError(null);
    setSavedMessage(null);
    setSaving(true);
    try {
      const entries = studentsInClass.map((s) => ({
        studentId: s.studentId,
        present: marks[s.studentId] ?? false,
      }));
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, date, entries }),
      });
      if (!res.ok) throw new Error(await parseError(res));
      const presentCount = entries.filter((e) => e.present).length;
      setSavedMessage(`Đã lưu: ${presentCount}/${entries.length} học sinh có mặt`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {savedMessage && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{savedMessage}</p>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <label className="flex flex-1 min-w-40 flex-col gap-1 text-sm">
          Lớp
          <Select
            value={classId}
            onValueChange={handleClassChange}
            options={classes.map((c) => ({ value: c.classId, label: c.className }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Ngày học
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5"
          />
        </label>
      </div>

      {studentsInClass.length === 0 ? (
        <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">
          Lớp này chưa có học sinh đang học nào.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2 text-sm">
            <span className="text-gray-500">{studentsInClass.length} học sinh</span>
            <div className="flex gap-3">
              <button onClick={() => setAll(true)} className="text-gray-500 underline">
                Chọn tất cả có mặt
              </button>
              <button onClick={() => setAll(false)} className="text-gray-500 underline">
                Bỏ chọn tất cả
              </button>
            </div>
          </div>
          <ul>
            {studentsInClass.map((s) => (
              <li
                key={s.studentId}
                className="flex items-center justify-between border-b border-gray-50 px-4 py-2.5 text-sm last:border-b-0"
              >
                <span>{s.name}</span>
                <label className="flex items-center gap-2 text-gray-500">
                  {loading ? "..." : marks[s.studentId] ? "Có mặt" : "Vắng"}
                  <input
                    type="checkbox"
                    checked={Boolean(marks[s.studentId])}
                    disabled={loading}
                    onChange={() => toggle(s.studentId)}
                    className="h-4 w-4"
                  />
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || loading || studentsInClass.length === 0}
        className="self-start rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Đang lưu..." : "Lưu điểm danh"}
      </button>
    </div>
  );
}
