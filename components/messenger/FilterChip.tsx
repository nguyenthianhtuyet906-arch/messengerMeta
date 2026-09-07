"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

/** Nút bật/tắt 1 bộ lọc dạng pill — dùng chung cho sidebar chat và Bảng xử lý. */
export const FilterChip = memo(function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-full border px-3 py-1.5 text-center text-xs font-medium transition-colors",
        active
          ? "border-primary bg-accent text-primary"
          : "border-border text-muted-foreground hover:bg-secondary",
      )}
    >
      {label}
    </button>
  );
});
