"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TagStatsResponse, TagsResponse } from "@/lib/types/etsy";

async function fetchTags(conversationId: number): Promise<TagsResponse> {
  const res = await fetch(`/api/conversations/${conversationId}/tags`);
  if (!res.ok) throw new Error(`tags ${res.status}`);
  return res.json();
}

async function postTag(conversationId: number, tag: string): Promise<TagsResponse> {
  const res = await fetch(`/api/conversations/${conversationId}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag }),
  });
  if (!res.ok) throw new Error(`add tag ${res.status}`);
  return res.json();
}

async function deleteTag(conversationId: number, tag: string): Promise<TagsResponse> {
  const res = await fetch(`/api/conversations/${conversationId}/tags`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag }),
  });
  if (!res.ok) throw new Error(`delete tag ${res.status}`);
  return res.json();
}

export function useTags(conversationId: number) {
  const qc = useQueryClient();
  const key = ["tags", conversationId];

  // Gắn/gỡ tag đổi pill ở danh sách + bộ lọc tag → làm mới danh sách + thống kê tag.
  const onSuccess = (data: TagsResponse) => {
    qc.setQueryData(key, data);
    qc.invalidateQueries({ queryKey: ["conversations"] });
    qc.invalidateQueries({ queryKey: ["tag-stats"] });
  };

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchTags(conversationId),
  });

  const add = useMutation({
    mutationFn: (tag: string) => postTag(conversationId, tag),
    onSuccess,
  });

  const remove = useMutation({
    mutationFn: (tag: string) => deleteTag(conversationId, tag),
    onSuccess,
  });

  return {
    tags: query.data?.tags ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    add,
    remove,
  };
}

async function fetchTagStats(shopIds: number[]): Promise<TagStatsResponse> {
  const qs = shopIds.length > 0 ? `?shopIds=${shopIds.join(",")}` : "";
  const res = await fetch(`/api/conversations/tag-stats${qs}`);
  if (!res.ok) throw new Error(`tag-stats ${res.status}`);
  return res.json();
}

/** Thống kê số hội thoại theo từng tag (cho dropdown lọc). */
export function useTagStats(shopIds: number[] = []) {
  const query = useQuery({
    queryKey: ["tag-stats", shopIds],
    queryFn: () => fetchTagStats(shopIds),
  });
  return { stats: query.data?.stats ?? [], isLoading: query.isLoading };
}
