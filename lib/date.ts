/** Ngày hôm nay theo giờ địa phương, định dạng YYYY-MM-DD (tránh lệch ngày do quy đổi UTC). */
export function todayLocalDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Tháng hiện tại theo giờ địa phương, định dạng YYYY-MM. */
export function currentLocalMonth(): string {
  return todayLocalDate().slice(0, 7);
}
