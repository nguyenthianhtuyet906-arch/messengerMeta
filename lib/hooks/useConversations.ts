"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type {
  ConversationFilters,
  ConversationListItem,
  ConversationListResponse,
} from "@/lib/types/etsy";

async function fetchConversations(
  cursor: string | null,
  filters: ConversationFilters,
): Promise<ConversationListResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (filters.search) params.set("search", filters.search);
  if (filters.notReplied) params.set("notReplied", "true");
  if (filters.hasOrder) params.set("hasOrder", "true");
  if (filters.orderHelp) params.set("orderHelp", "true");
  if (filters.hasNote) params.set("hasNote", "true");
  if (filters.shopIds.length > 0) params.set("shopIds", filters.shopIds.join(","));
  if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
  if (filters.sheetStatuses.length > 0) params.set("sheetStatuses", filters.sheetStatuses.join(","));
  if (filters.sort === "asc") params.set("sort", "asc");
  params.set("limit", "30");
  const res = await fetch(`/api/conversations?${params.toString()}`);
  if (!res.ok) throw new Error(`conversations ${res.status}`);
  return res.json();
}

export function useConversations(filters: ConversationFilters) {
  const query = useInfiniteQuery({
    queryKey: ["conversations", filters],
    queryFn: ({ pageParam }) => fetchConversations(pageParam, filters),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const items: ConversationListItem[] = query.data?.pages.flatMap((p) => p.items) ?? [];
  return { ...query, items };
}
