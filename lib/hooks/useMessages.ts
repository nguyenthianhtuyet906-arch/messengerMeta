"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { MessageItem, MessageListResponse } from "@/lib/types/etsy";

async function fetchMessages(
  conversationId: number,
  before: string | null,
): Promise<MessageListResponse> {
  const params = new URLSearchParams();
  if (before) params.set("before", before);
  params.set("limit", "40");
  const res = await fetch(
    `/api/conversations/${conversationId}/messages?${params.toString()}`,
  );
  if (!res.ok) throw new Error(`messages ${res.status}`);
  return res.json();
}

export function useMessages(conversationId: number | null) {
  const query = useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) => fetchMessages(conversationId!, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor, // cursor = load tin CŨ hơn
    enabled: conversationId !== null,
  });

  // page[0] = mới nhất; page[n] = cũ dần. Đảo để hiển thị cũ → mới.
  const items: MessageItem[] =
    query.data?.pages
      .slice()
      .reverse()
      .flatMap((p) => p.items) ?? [];

  const header = query.data?.pages[0];

  return {
    ...query,
    items,
    name: header?.name ?? "",
    avatar: header?.avatar ?? "",
    shopUserId: header?.shopUserId ?? 0,
  };
}
