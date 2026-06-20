"use client";

import { useEffect, useRef, useState } from "react";
import { PackageCheck, Check, ChevronDown } from "lucide-react";
import { useStatusNames } from "@/lib/hooks/useSheets";
import { cn } from "@/lib/utils";

export function SheetStatusFilter({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (statuses: string[]) => void;
}) {
  const statuses = useStatusNames();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = (status: string) => {
    onChange(
      selected.includes(status)
        ? selected.filter((s) => s !== status)
        : [...selected, status],
    );
  };

  // Đảm bảo các status đang chọn nhưng không còn trong danh sách vẫn hiện để bỏ chọn được.
  const rows = [
    ...statuses,
    ...selected.filter((s) => !statuses.includes(s)),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
          selected.length > 0
            ? "border-[#0064e0] bg-[#e7f0fb] text-[#0064e0]"
            : "border-[#dee3e9] text-[#5d6c7b] hover:bg-[#f1f4f7]",
        )}
      >
        <PackageCheck className="h-3.5 w-3.5" />
        Status
        {selected.length > 0 && (
          <span className="rounded-full bg-[#0064e0] px-1.5 text-[10px] font-bold text-white">
            {selected.length}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-1 max-h-64 w-52 overflow-y-auto rounded-xl border border-[#dee3e9] bg-white py-1 shadow-lg">
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="w-full px-3 py-1.5 text-left text-xs text-[#0064e0] hover:bg-[#f1f4f7]"
            >
              Bỏ chọn tất cả
            </button>
          )}
          {rows.length === 0 ? (
            <p className="px-3 py-3 text-center text-xs text-[#5d6c7b]">Chưa có status nào</p>
          ) : (
            rows.map((status) => {
              const isSel = selected.includes(status);
              return (
                <button
                  key={status}
                  onClick={() => toggle(status)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#f1f4f7]"
                >
                  <span className="flex-1 truncate text-xs text-[#0a1317]">{status}</span>
                  {isSel && <Check className="h-4 w-4 shrink-0 text-[#0064e0]" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
