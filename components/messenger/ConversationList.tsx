"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useConversations } from "@/lib/hooks/useConversations";
import { useTabs } from "@/lib/store/tabs";
import type { ConversationListItem } from "@/lib/types/etsy";
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

export function ConversationList() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const { openTab, activeTabId } = useTabs();
  const { items, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useConversations(search);

  // Debounce search.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

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
            placeholder="Tìm kiếm trên EtsyChat"
            className="h-10 rounded-full border-0 bg-[#f1f4f7] pl-10 text-sm text-[#0a1317] placeholder:text-[#5d6c7b] focus-visible:ring-2 focus-visible:ring-[#1876f2]"
          />
        </div>
      </div>

      <div ref={parentRef} className="flex-1 overflow-y-auto px-2 pb-4">
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
