"use client";

import { useQuery } from "@tanstack/react-query";
import type { ConversationDetailResponse } from "@/lib/types/etsy";

async function fetchDetail(conversationId: number): Promise<ConversationDetailResponse> {
  const res = await fetch(`/api/conversations/${conversationId}/detail`);
  if (!res.ok) throw new Error(`detail ${res.status}`);
  return res.json();
}

export function useConversationDetail(conversationId: number | null) {
  return useQuery({
    queryKey: ["conversation-detail", conversationId],
    queryFn: () => fetchDetail(conversationId!),
    enabled: conversationId !== null,
    staleTime: 5 * 60 * 1000, // receipt_history ít đổi
  });
}
