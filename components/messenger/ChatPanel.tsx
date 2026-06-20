"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { ConversationView } from "@/components/messenger/ConversationView";
import { ReceiptHistoryPanel } from "@/components/messenger/ReceiptHistoryPanel";
import { NotesPanel } from "@/components/messenger/NotesPanel";
import { SlideInPanel } from "@/components/messenger/SlideInPanel";
import { useTabs } from "@/lib/store/tabs";

export function ChatPanel() {
  const { activeTabId, meta } = useTabs();
  const [infoOpen, setInfoOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);

  // Mở sẵn panel đơn hàng, đóng panel ghi chú mỗi khi vào/đổi hội thoại.
  useEffect(() => {
    setInfoOpen(true);
    setNotesOpen(false);
  }, [activeTabId]);

  if (activeTabId === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-card text-muted-foreground">
        <MessageSquare className="h-12 w-12 opacity-40" />
        <p className="mt-3 text-sm">Chọn một đoạn chat để bắt đầu</p>
      </div>
    );
  }

  // key=activeTabId → đổi conversation thì remount sạch (pending/scroll riêng từng hội thoại).
  return (
    <div className="flex min-h-0 flex-1">
      <ConversationView
        key={activeTabId}
        conversationId={activeTabId}
        meta={meta[activeTabId]}
        infoOpen={infoOpen}
        onToggleInfo={() => setInfoOpen((v) => !v)}
        notesOpen={notesOpen}
        onToggleNotes={() => setNotesOpen((v) => !v)}
      />
      <SlideInPanel open={notesOpen}>
        <NotesPanel
          key={`notes-${activeTabId}`}
          conversationId={activeTabId}
          onClose={() => setNotesOpen(false)}
        />
      </SlideInPanel>
      <SlideInPanel open={infoOpen} widthClass="w-96">
        <ReceiptHistoryPanel
          conversationId={activeTabId}
          onClose={() => setInfoOpen(false)}
        />
      </SlideInPanel>
    </div>
  );
}
