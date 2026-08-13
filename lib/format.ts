const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

// Định dạng vi-VN dùng dấu "." ngăn cách hàng nghìn theo mặc định — đổi sang dấu ","
// theo yêu cầu, vẫn giữ nguyên cách hiện ký hiệu tiền tệ/vị trí của Intl.
function dotToComma(formatted: string): string {
  return formatted.replace(/\./g, ",");
}

export function formatVnd(amount: number): string {
  return dotToComma(currencyFormatter.format(amount));
}

/** "500000" -> "500,000" (dùng để hiện khi gõ số tiền trong input) */
export function formatDigitsWithSeparators(rawDigits: string): string {
  if (!rawDigits) return "";
  return dotToComma(numberFormatter.format(Number(rawDigits)));
}

/** Bỏ mọi ký tự không phải số, vd. "500,000đ" -> "500000" */
export function toRawDigits(value: string): string {
  return value.replace(/\D/g, "");
}
