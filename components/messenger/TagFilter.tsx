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
            ? "border-primary bg-accent text-primary"
            : "border-border text-muted-foreground hover:bg-secondary",
        )}
      >
        <Tag className="h-3.5 w-3.5" />
        Thẻ
        {selected.length > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
            {selected.length}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-1 max-h-72 w-64 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg">
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="w-full px-3 py-1.5 text-left text-xs text-primary hover:bg-secondary"
            >
              Bỏ chọn tất cả
            </button>
          )}
          {isLoading ? (
            <p className="px-3 py-3 text-center text-xs text-muted-foreground">Đang tải…</p>
          ) : rows.length === 0 ? (
            <p className="px-3 py-3 text-center text-xs text-muted-foreground">Chưa có thẻ nào</p>
          ) : (
            rows.map(({ tag, count }) => {
              const isSel = selected.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggle(tag)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-secondary"
                >
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      tagClassName(tag),
                    )}
                  >
                    {tagLabel(tag)}
                  </span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                  {isSel && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
