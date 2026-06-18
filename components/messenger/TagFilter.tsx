"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Tag, Check, ChevronDown } from "lucide-react";
import { useTagStats } from "@/lib/hooks/useTags";
import { tagClassName, tagLabel } from "@/lib/tags";
import { cn } from "@/lib/utils";

export function TagFilter({
  selected,
  onChange,
  shopIds = [],
}: {
  selected: string[];
  onChange: (tags: string[]) => void;
  shopIds?: number[];
}) {
  const { stats, isLoading } = useTagStats(shopIds);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Đóng khi click ra ngoài.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Tag đang chọn nhưng count = 0 (không còn trong stats) vẫn phải hiện để bỏ chọn.
  const rows = useMemo(() => {
    const map = new Map(stats.map((s) => [s.tag, s.count]));
    const extra = selected
      .filter((t) => !map.has(t))
      .map((t) => ({ tag: t, count: 0 }));
    return [...stats, ...extra];
  }, [stats, selected]);

  const toggle = (tag: string) => {
    onChange(
      selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag],
    );
  };

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
        <Tag className="h-3.5 w-3.5" />
        Thẻ
        {selected.length > 0 && (
          <span className="rounded-full bg-[#0064e0] px-1.5 text-[10px] font-bold text-white">
            {selected.length}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-1 max-h-72 w-64 overflow-y-auto rounded-xl border border-[#dee3e9] bg-white py-1 shadow-lg">
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="w-full px-3 py-1.5 text-left text-xs text-[#0064e0] hover:bg-[#f1f4f7]"
            >
              Bỏ chọn tất cả
            </button>
          )}
          {isLoading ? (
            <p className="px-3 py-3 text-center text-xs text-[#5d6c7b]">Đang tải…</p>
          ) : rows.length === 0 ? (
            <p className="px-3 py-3 text-center text-xs text-[#5d6c7b]">Chưa có thẻ nào</p>
          ) : (
            rows.map(({ tag, count }) => {
              const isSel = selected.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggle(tag)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#f1f4f7]"
                >
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      tagClassName(tag),
                    )}
                  >
                    {tagLabel(tag)}
                  </span>
                  <span className="text-xs text-[#9aa6b2]">{count}</span>
                  {isSel && <Check className="ml-auto h-4 w-4 shrink-0 text-[#0064e0]" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
