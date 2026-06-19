"use client";

import { useEffect } from "react";
import { TabsProvider, useTabs } from "@/lib/store/tabs";
import { ConversationList } from "@/components/messenger/ConversationList";
import { TabBar } from "@/components/messenger/TabBar";
import { ChatPanel } from "@/components/messenger/ChatPanel";
import { UrlSync } from "@/components/messenger/RouteSync";
import { PendingOpenSync } from "@/components/messenger/PendingOpenSync";
import { useRealtimeMessages } from "@/lib/hooks/useRealtimeMessages";
import { usePrefetchTabs } from "@/lib/hooks/usePrefetchTabs";

function RealtimeBridge() {
  useRealtimeMessages();
  return null;
}

function PrefetchController() {
  usePrefetchTabs();
  return null;
}

// Ctrl+`  → tab kế tiếp; Ctrl+Shift+`  → tab trước.
function TabHotkeys() {
  const { cycleActive } = useTabs();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.code === "Backquote" || e.key === "`")) {
        e.preventDefault();
        cycleActive(e.shiftKey ? -1 : 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycleActive]);
  return null;
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <TabsProvider>
      <RealtimeBridge />
      <PrefetchController />
      <TabHotkeys />
      <UrlSync />
      <PendingOpenSync />
      {/* children = page sync deep-link (không render gì hiển thị). */}
      {children}
      <div className="flex h-full">
        <ConversationList />
        <div className="hidden flex-1 flex-col overflow-hidden md:flex">
          <TabBar />
          <ChatPanel />
        </div>
      </div>
    </TabsProvider>
  );
}
