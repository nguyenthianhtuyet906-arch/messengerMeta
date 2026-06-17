"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { ConversationListItem, ConversationListResponse } from "@/lib/types/etsy";

async function fetchConversations(
  cursor: string | null,
  search: string,
): Promise<ConversationListResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (search) params.set("search", search);
  params.set("limit", "30");
  const res = await fetch(`/api/conversations?${params.toString()}`);
  if (!res.ok) throw new Error(`conversations ${res.status}`);
  return res.json();
}

export function useConversations(search: string) {
  const query = useInfiniteQuery({
    queryKey: ["conversations", search],
    queryFn: ({ pageParam }) => fetchConversations(pageParam, search),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const items: ConversationListItem[] = query.data?.pages.flatMap((p) => p.items) ?? [];
  return { ...query, items };
}
