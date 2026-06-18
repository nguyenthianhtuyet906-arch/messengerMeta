"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useConversations } from "@/lib/hooks/useConversations";
import { ShopFilter } from "@/components/messenger/ShopFilter";
import { useTabs } from "@/lib/store/tabs";
import type { ConversationFilters, ConversationListItem } from "@/lib/types/etsy";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { initials, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const ROW_HEIGHT = 76;

const Row = memo(function Row({
  c,
  active,
  onClick,
}: {
  c: ConversationListItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
        active ? "bg-[#e7f0fb]" : "hover:bg-[#f1f4f7]",
      )}
    >
      <Avatar className="h-12 w-12 shrink-0">
        {c.avatar ? <AvatarImage src={c.avatar} alt={c.name} /> : null}
        <AvatarFallback className="bg-[#e7f0fb] text-[#0064e0] font-bold">
          {initials(c.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-bold text-sm text-[#0a1317]">
            {c.name || `#${c.conversationId}`}
          </span>
          <span className="shrink-0 text-xs text-[#5d6c7b]">
            {formatTime(c.lastMessageDate)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              c.hasReplied ? "text-[#5d6c7b]" : "font-semibold text-[#0a1317]",
            )}
          >
            {c.excerpt || "—"}
          </span>
          {!c.hasReplied && (
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#0064e0]" />
          )}
        </div>
      </div>
    </button>
  );
});

const FilterChip = memo(function FilterChip({
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
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-[#0064e0] bg-[#e7f0fb] text-[#0064e0]"
          : "border-[#dee3e9] text-[#5d6c7b] hover:bg-[#f1f4f7]",
      )}
    >
      {label}
    </button>
  );
});

export function ConversationList() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [orderHelp, setOrderHelp] = useState(false);
  const [notReplied, setNotReplied] = useState(false);
  const [hasOrder, setHasOrder] = useState(false);
  const [shopIds, setShopIds] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const { openTab, openMany, activeTabId } = useTabs();

  // Debounce search.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filters: ConversationFilters = useMemo(
    () => ({ search, orderHelp, notReplied, hasOrder, shopIds }),
    [search, orderHelp, notReplied, hasOrder, shopIds],
  );

  const { items, data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useConversations(filters);

  // Mở nhanh N hội thoại đầu danh sách (tự load đủ trang trước khi mở).
  const BULK_CAP = 100; // trần an toàn cho "Tất cả"
  const bulkOpen = async (target: number | "all") => {
    if (bulkLoading) return;
    setBulkLoading(true);
    try {
      const cap = target === "all" ? BULK_CAP : target;
      let flat = (data?.pages ?? []).flatMap((p) => p.items);
      let canMore = hasNextPage;
      let guard = 0;
      while (flat.length < cap && canMore && guard < 30) {
        const res = await fetchNextPage();
        flat = (res.data?.pages ?? []).flatMap((p) => p.items);
        canMore = !!res.hasNextPage;
        guard++;
      }
      openMany(
        flat
          .slice(0, cap)
          .map((c) => ({ id: c.conversationId, meta: { name: c.name, avatar: c.avatar } })),
      );
    } finally {
      setBulkLoading(false);
    }
  };

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  // Infinite scroll: gần cuối → load thêm.
  const virtualItems = virtualizer.getVirtualItems();
  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1];
    if (!last) return;
    if (last.index >= items.length - 5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [virtualItems, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex w-full max-w-sm flex-col border-r border-[#dee3e9] bg-white md:w-80 lg:w-96">
      <div className="px-5 pt-6 pb-3">
        <h1 className="text-2xl font-medium tracking-tight text-[#0a1317]">Đoạn chat</h1>
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5d6c7b]" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm tên, nội dung tin nhắn, hoặc số đơn (#...)"
            className="h-10 rounded-full border-0 bg-[#f1f4f7] pl-10 text-sm text-[#0a1317] placeholder:text-[#5d6c7b] focus-visible:ring-2 focus-visible:ring-[#1876f2]"
          />
        </div>

        {/* Bộ lọc */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <FilterChip
            label="Help request"
            active={orderHelp}
            onClick={() => setOrderHelp((v) => !v)}
          />
          <FilterChip
            label="Not Replied"
            active={notReplied}
            onClick={() => setNotReplied((v) => !v)}
          />
          <FilterChip
            label="Has Order"
            active={hasOrder}
            onClick={() => setHasOrder((v) => !v)}
          />
          <ShopFilter selected={shopIds} onChange={setShopIds} />
        </div>

        {/* Mở nhanh nhiều hội thoại */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-medium text-[#5d6c7b]">Mở nhanh:</span>
          {([10, 25, 50, "all"] as const).map((n) => (
            <button
              key={String(n)}
              onClick={() => bulkOpen(n)}
              disabled={bulkLoading}
              className="rounded-full bg-[#0064e0] px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#0457cb] disabled:bg-[#bcc0c4]"
            >
              {n === "all" ? "Tất cả" : n}
            </button>
          ))}
          {bulkLoading && <span className="text-xs text-[#5d6c7b]">Đang mở…</span>}
        </div>
      </div>

      <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-[#5d6c7b]">Đang tải…</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#5d6c7b]">
            Không có đoạn chat nào.
          </p>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualItems.map((v) => {
              const c = items[v.index];
              return (
                <div
                  key={c.conversationId}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${v.start}px)`,
                  }}
                >
                  <Row
                    c={c}
                    active={activeTabId === c.conversationId}
                    onClick={() =>
                      openTab(c.conversationId, { name: c.name, avatar: c.avatar })
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
