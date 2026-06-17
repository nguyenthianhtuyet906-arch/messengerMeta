"use client";

import { MessageSquare } from "lucide-react";
import { ConversationView } from "@/components/messenger/ConversationView";
import { useTabs } from "@/lib/store/tabs";

export function ChatPanel() {
  const { activeTabId, meta } = useTabs();

  if (activeTabId === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-white text-[#5d6c7b]">
        <MessageSquare className="h-12 w-12 opacity-40" />
        <p className="mt-3 text-sm">Chọn một đoạn chat để bắt đầu</p>
      </div>
    );
  }

  // key=activeTabId → đổi conversation thì remount sạch (pending/scroll riêng từng hội thoại).
  return (
    <ConversationView
      key={activeTabId}
      conversationId={activeTabId}
      meta={meta[activeTabId]}
    />
  );
}
