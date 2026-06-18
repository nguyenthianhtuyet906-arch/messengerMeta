"use client";

import { useState, type KeyboardEvent } from "react";
import { Send, Info, StickyNote } from "lucide-react";
import { MessageList } from "@/components/messenger/MessageList";
import { useSendMessage } from "@/lib/hooks/useSendMessage";
import type { TabMeta } from "@/lib/store/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";

export function ConversationView({
  conversationId,
  meta,
  infoOpen = false,
  onToggleInfo,
  notesOpen = false,
  onToggleNotes,
}: {
  conversationId: number;
  meta?: TabMeta;
  infoOpen?: boolean;
  onToggleInfo?: () => void;
  notesOpen?: boolean;
  onToggleNotes?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const { pending, send } = useSendMessage(conversationId);
  const name = meta?.name || `#${conversationId}`;

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    send(text);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="flex shrink-0 items-center gap-2.5 border-b border-[#dee3e9] px-4 py-3">
        <Avatar className="h-8 w-8">
          {meta?.avatar ? <AvatarImage src={meta.avatar} alt={name} /> : null}
          <AvatarFallback className="bg-[#e7f0fb] text-xs font-bold text-[#0064e0]">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <h2 className="font-bold leading-tight text-[#0a1317]">{name}</h2>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {onToggleNotes ? (
            <button
              onClick={onToggleNotes}
              aria-label="Ghi chú"
              aria-pressed={notesOpen}
              className={
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors " +
                (notesOpen
                  ? "bg-[#e7f0fb] text-[#0064e0]"
                  : "text-[#5d6c7b] hover:bg-[#f1f4f7]")
              }
            >
              <StickyNote className="h-4 w-4" />
            </button>
          ) : null}
          {onToggleInfo ? (
            <button
              onClick={onToggleInfo}
              aria-label="Lịch sử đơn hàng"
              aria-pressed={infoOpen}
              className={
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors " +
                (infoOpen
                  ? "bg-[#e7f0fb] text-[#0064e0]"
                  : "text-[#5d6c7b] hover:bg-[#f1f4f7]")
              }
            >
              <Info className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </header>

      <MessageList conversationId={conversationId} pending={pending} />

      {/* Composer */}
      <div className="flex shrink-0 items-end gap-2 border-t border-[#dee3e9] px-6 py-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Nhập tin nhắn… (Enter để gửi, Shift+Enter xuống dòng)"
          className="max-h-32 flex-1 resize-none rounded-2xl border-0 bg-[#f1f4f7] px-4 py-2.5 text-sm text-[#0a1317] placeholder:text-[#9aa6b2] focus:outline-none focus:ring-2 focus:ring-[#1876f2]"
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0064e0] text-white transition-colors hover:bg-[#0457cb] disabled:bg-[#bcc0c4]"
          aria-label="Gửi tin nhắn"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
