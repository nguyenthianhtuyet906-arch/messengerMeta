"use client";

import { useEffect, useRef, useState } from "react";
import { Store, Check, ChevronDown } from "lucide-react";
import { useShops } from "@/lib/hooks/useShops";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ShopFilter({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const { data: shops = [], isLoading } = useShops();
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

  const toggle = (userId: number) => {
    onChange(
      selected.includes(userId)
        ? selected.filter((id) => id !== userId)
        : [...selected, userId],
    );
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
          selected.length > 0
            ? "border-[#0064e0] bg-[#e7f0fb] text-[#0064e0]"
            : "border-[#dee3e9] text-[#5d6c7b] hover:bg-[#f1f4f7]",
        )}
      >
        <Store className="h-3.5 w-3.5" />
        Shop
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
          ) : shops.length === 0 ? (
            <p className="px-3 py-3 text-center text-xs text-[#5d6c7b]">Chưa có shop</p>
          ) : (
            shops.map((shop) => {
              const isSel = selected.includes(shop.userId);
              return (
                <button
                  key={shop.userId}
                  onClick={() => toggle(shop.userId)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[#f1f4f7]"
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-8 w-8">
                      {shop.avatar ? <AvatarImage src={shop.avatar} alt={shop.shopName} /> : null}
                      <AvatarFallback className="bg-[#e7f0fb] text-[10px] font-bold text-[#0064e0]">
                        {initials(shop.shopName)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white",
                        shop.online ? "bg-[#31a24c]" : "bg-[#bcc0c4]",
                      )}
                      title={shop.online ? "Online" : "Offline"}
                    />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm text-[#0a1317]">
                    {shop.shopName || `#${shop.userId}`}
                  </span>
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
