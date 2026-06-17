"use client";

import { MessageSquare } from "lucide-react";
import { MessageList } from "@/components/messenger/MessageList";
import { useTabs } from "@/lib/store/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";

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

  const m = meta[activeTabId];
  const name = m?.name || `#${activeTabId}`;

  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-[#dee3e9] px-6 py-3">
        <Avatar className="h-10 w-10">
          {m?.avatar ? <AvatarImage src={m.avatar} alt={name} /> : null}
          <AvatarFallback className="bg-[#e7f0fb] text-[#0064e0] font-bold">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <h2 className="font-bold leading-tight text-[#0a1317]">{name}</h2>
      </header>

      {/* key=activeTabId → đổi conversation thì remount sạch state cuộn */}
      <MessageList key={activeTabId} conversationId={activeTabId} />

      {/* Composer read-only (chưa làm gửi tin) */}
      <div className="border-t border-[#dee3e9] px-6 py-4">
        <div className="flex h-11 items-center rounded-full bg-[#f1f4f7] px-4 text-sm text-[#9aa6b2]">
          Chế độ chỉ xem — chưa hỗ trợ gửi tin
        </div>
      </div>
    </div>
  );
}
