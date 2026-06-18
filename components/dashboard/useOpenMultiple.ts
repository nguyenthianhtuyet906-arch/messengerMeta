"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { stageOpenMultiple, type OpenEntry } from "@/lib/store/open-multiple";
import type { UnreadConvItem } from "@/lib/types/etsy";

/**
 * Hook trả về hàm mở nhiều hội thoại: stage danh sách rồi điều hướng sang màn
 * /open-multiple để xác nhận. (Mở thành tab trong app, không mở tab trình duyệt.)
 */
export function useOpenMultiple() {
  const router = useRouter();
  return useCallback(
    (convs: UnreadConvItem[], count?: number) => {
      if (!convs || convs.length === 0) return;
      const slice = typeof count === "number" ? convs.slice(0, count) : convs;
      const entries: OpenEntry[] = slice.map((c) => ({
        id: c.conversationId,
        name: c.name,
        avatar: c.avatar,
      }));
      stageOpenMultiple(entries);
      router.push("/open-multiple");
    },
    [router],
  );
}
