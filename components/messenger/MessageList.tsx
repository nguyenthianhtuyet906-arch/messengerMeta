"use client";

import { memo, useEffect, useLayoutEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMessages } from "@/lib/hooks/useMessages";
import type { MessageItem } from "@/lib/types/etsy";
import { cn } from "@/lib/utils";

const Bubble = memo(function Bubble({ m }: { m: MessageItem }) {
  if (m.isSystem) {
    return (
      <div className="my-1 flex justify-center px-6">
        <span className="rounded-full bg-[#eef1f4] px-3 py-1 text-xs text-[#5d6c7b]">
          {m.message}
        </span>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex px-6 py-1",
        m.fromMe ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
          m.fromMe ? "bg-[#0064e0] text-white" : "bg-[#f1f4f7] text-[#0a1317]",
        )}
      >
        {m.message}
        {m.images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {m.images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                className="h-32 w-32 rounded-lg object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export function MessageList({ conversationId }: { conversationId: number }) {
  const { items, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useMessages(conversationId);

  const parentRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(0);
  const fetchingOlderRef = useRef(false);
  const didInitialScrollRef = useRef(false);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  // Reset khi đổi conversation.
  useEffect(() => {
    didInitialScrollRef.current = false;
    prevLenRef.current = 0;
    fetchingOlderRef.current = false;
  }, [conversationId]);

  // Giữ vị trí scroll khi prepend tin cũ / cuộn đáy khi tin mới.
  useLayoutEffect(() => {
    const added = items.length - prevLenRef.current;
    if (added <= 0) {
      prevLenRef.current = items.length;
      return;
    }

    if (!didInitialScrollRef.current && items.length > 0) {
      // Lần đầu: nhảy xuống tin mới nhất.
      virtualizer.scrollToIndex(items.length - 1, { align: "end" });
      didInitialScrollRef.current = true;
    } else if (fetchingOlderRef.current) {
      // Vừa prepend tin cũ: giữ item đang xem tại chỗ.
      virtualizer.scrollToIndex(added, { align: "start" });
      fetchingOlderRef.current = false;
    } else {
      // Tin mới đến: cuộn xuống đáy.
      virtualizer.scrollToIndex(items.length - 1, { align: "end" });
    }
    prevLenRef.current = items.length;
  }, [items.length, virtualizer]);

  // Cuộn lên đầu → load tin cũ hơn.
  const virtualItems = virtualizer.getVirtualItems();
  useEffect(() => {
    const first = virtualItems[0];
    if (!first) return;
    if (first.index <= 2 && hasNextPage && !isFetchingNextPage) {
      fetchingOlderRef.current = true;
      fetchNextPage();
    }
  }, [virtualItems, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto bg-white py-4">
      {isLoading ? (
        <p className="py-8 text-center text-sm text-[#5d6c7b]">Đang tải tin nhắn…</p>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#5d6c7b]">Chưa có tin nhắn.</p>
      ) : (
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {isFetchingNextPage && (
            <div className="absolute left-0 top-0 w-full text-center text-xs text-[#5d6c7b]">
              Đang tải tin cũ…
            </div>
          )}
          {virtualItems.map((v) => {
            const m = items[v.index];
            return (
              <div
                key={m.id}
                ref={virtualizer.measureElement}
                data-index={v.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${v.start}px)`,
                }}
              >
                <Bubble m={m} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
