"use client";

import { TabsProvider } from "@/lib/store/tabs";
import { ConversationList } from "@/components/messenger/ConversationList";
import { TabBar } from "@/components/messenger/TabBar";
import { ChatPanel } from "@/components/messenger/ChatPanel";
import { useRealtimeMessages } from "@/lib/hooks/useRealtimeMessages";

function RealtimeBridge() {
  useRealtimeMessages();
  return null;
}

export function MessengerWorkspace() {
  return (
    <TabsProvider>
      <RealtimeBridge />
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
