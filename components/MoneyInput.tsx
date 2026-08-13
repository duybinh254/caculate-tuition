"use client";

import { formatDigitsWithSeparators, toRawDigits } from "@/lib/format";

/**
 * Input số tiền: hiện dấu phẩy ngăn cách hàng nghìn khi gõ (500000 -> 500,000),
 * nhưng `value`/`onChange` vẫn làm việc với chuỗi số thô (không dấu phẩy) để dễ
 * chuyển sang number lúc submit.
 */
export default function MoneyInput({
  value,
  onChange,
  placeholder,
  required,
  autoFocus,
  id,
}: {
  value: string;
  onChange: (rawDigits: string) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  id?: string;
}) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      required={required}
      autoFocus={autoFocus}
      value={formatDigitsWithSeparators(value)}
      onChange={(e) => onChange(toRawDigits(e.target.value))}
      placeholder={placeholder}
      className="rounded-lg border border-gray-300 px-3 py-2"
    />
  );
}
