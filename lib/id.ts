/** Sinh ID ngắn, đủ tránh trùng cho quy mô dữ liệu cá nhân (vài trăm bản ghi). */
export function generateId(prefix: string): string {
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `${prefix}_${random}`;
}
