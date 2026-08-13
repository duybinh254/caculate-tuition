"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Dropdown tự vẽ giao diện (dùng Radix UI Select) thay cho <select> gốc của trình
 * duyệt/OS — <select> gốc không style được phần danh sách option khi xổ xuống.
 */
export default function Select({
  value,
  onValueChange,
  options,
  placeholder,
  className = "",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        className={`flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none data-[placeholder]:text-gray-400 ${className}`}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-40 max-h-72 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className="relative flex cursor-pointer scroll-my-1 items-center rounded-lg py-2 pr-3 pl-8 text-sm text-gray-900 outline-none select-none data-[highlighted]:bg-gray-100"
              >
                <SelectPrimitive.ItemIndicator className="absolute left-2 flex items-center">
                  <Check className="h-4 w-4" />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
