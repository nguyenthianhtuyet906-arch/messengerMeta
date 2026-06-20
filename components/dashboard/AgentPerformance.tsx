"use client";

import { useAgentPerformance } from "@/lib/hooks/useAnalytics";
import type { AnalyticsFilters } from "@/lib/types/etsy";
import { PanelCard } from "./PanelCard";

export function AgentPerformance({ filters }: { filters: AnalyticsFilters }) {
  const { data, isPending, isError } = useAgentPerformance(filters);
  const rows = data?.items ?? [];

  return (
    <PanelCard
      title="Năng suất nhân viên"
      subtitle="Số tin nhắn đã gửi"
      loading={isPending}
    >
      <div className="max-h-80 overflow-y-auto">
        {isError ? (
          <p className="py-6 text-center text-sm text-destructive">Không tải được dữ liệu.</p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Chưa có dữ liệu.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-bold">Nhân viên</th>
                <th className="py-2 px-2 text-center font-bold">Conversations</th>
                <th className="py-2 pl-2 text-center font-bold">Messages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary">
              {rows.map((r) => (
                <tr key={r.senderEmail}>
                  <td className="py-2.5 pr-3">
                    <span className="truncate font-bold text-foreground">{r.senderEmail}</span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-primary">
                    {r.conversationCount}
                  </td>
                  <td className="py-2.5 pl-2 text-center font-bold text-primary">
                    {r.messageCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PanelCard>
  );
}
