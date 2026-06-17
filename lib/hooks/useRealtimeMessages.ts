"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAblyClient, ABLY_CHANNEL, NEW_MESSAGE_EVENT } from "@/lib/ably/client";

/**
 * Mount 1 lần ở trang messenger. Nghe new-message-event trên channel "all"
 * → invalidate list hội thoại + messages của conversation tương ứng.
 */
export function useRealtimeMessages() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ably = getAblyClient();
    const channel = ably.channels.get(ABLY_CHANNEL);

    const handler = (msg: { data?: unknown }) => {
      const data = msg.data as { conversation_id?: number } | undefined;
      // Cập nhật danh sách (đổi thứ tự / excerpt).
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      // Cập nhật messages của đúng conversation nếu đang mở.
      if (typeof data?.conversation_id === "number") {
        queryClient.invalidateQueries({
          queryKey: ["messages", data.conversation_id],
        });
      }
    };

    channel.subscribe(NEW_MESSAGE_EVENT, handler);
    return () => {
      channel.unsubscribe(NEW_MESSAGE_EVENT, handler);
    };
  }, [queryClient]);
}
