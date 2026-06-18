"use client";

import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { useMessageOverview } from "@/lib/hooks/useAnalytics";
import type { AnalyticsFilters, UnreadConvItem } from "@/lib/types/etsy";
import { PanelCard, StatCard } from "./PanelCard";
import { useOpenMultiple } from "./useOpenMultiple";

export function MessageOverview({ filters }: { filters: AnalyticsFilters }) {
  const { data, isPending, isError } = useMessageOverview(filters);
  const openMultiple = useOpenMultiple();

  const totals = data?.totals ?? { total: 0, unread: 0, completed: 0 };
  const shops = data?.shopBreakdown ?? [];

  // Gộp toàn bộ hội thoại chưa trả lời (cho nút "Mở tất cả tin chưa đọc").
  const allUnread = useMemo<UnreadConvItem[]>(
    () => shops.flatMap((s) => s.unreadConversations),
    [shops],
  );

  return (
    <PanelCard
      title="Tổng quan tin nhắn"
      subtitle="Theo từng shop"
      loading={isPending}
      className="xl:col-span-1"
    >
      {/* 3 thẻ số liệu */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={totals.total} label="Tổng tin" />
        <StatCard value={totals.unread} label="Chưa trả lời" tone="danger">
          {allUnread.length > 0 && (
            <button
              type="button"
              onClick={() => openMultiple(allUnread)}
              className="mt-2 inline-flex items-center gap-1 self-start rounded-full border border-[#e41e3f] px-3 py-1 text-xs font-bold text-[#e41e3f] transition-colors hover:bg-[#fdecee]"
            >
              <ExternalLink className="h-3 w-3" />
              Mở tin
            </button>
          )}
        </StatCard>
        <StatCard value={totals.completed} label="Đã xong" tone="success" />
      </div>

      {/* Bảng theo shop */}
      <div className="mt-5 overflow-x-auto">
        {isError ? (
          <p className="py-6 text-center text-sm text-[#e41e3f]">Không tải được dữ liệu.</p>
        ) : shops.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#5d6c7b]">Chưa có dữ liệu.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#dee3e9] text-left text-xs font-bold uppercase tracking-wide text-[#5d6c7b]">
                <th className="py-2 pr-3 font-bold">Shop</th>
                <th className="px-2 py-2 text-center font-bold">Tổng</th>
                <th className="px-2 py-2 text-center font-bold">Chưa trả lời</th>
                <th className="px-2 py-2 text-center font-bold">Đã xong</th>
                <th className="py-2 pl-2 text-right font-bold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f4f7]">
              {shops.map((s) => (
                <tr key={s.shopId}>
                  <td className="py-2.5 pr-3">
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${s.online ? "bg-[#31a24c]" : "bg-[#f2a918]"}`}
                      />
                      <span className="truncate font-bold text-[#0a1317]">{s.shopName}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center font-bold text-[#0a1317]">{s.total}</td>
                  <td className="px-2 py-2.5 text-center">
                    <span
                      className={`inline-flex min-w-6 justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                        s.unread > 0
                          ? "bg-[#fdecee] text-[#e41e3f]"
                          : "bg-[#eaf6ec] text-[#31a24c]"
                      }`}
                    >
                      {s.unread}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center font-bold text-[#31a24c]">
                    {s.completed}
                  </td>
                  <td className="py-2.5 pl-2 text-right">
                    {s.unreadConversations.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => openMultiple(s.unreadConversations)}
                        className="inline-flex items-center gap-1 rounded-full border border-[#dee3e9] px-3 py-1 text-xs font-bold text-[#0064e0] transition-colors hover:bg-[#e7f0fb]"
                      >
                        Mở {s.unreadConversations.length}
                      </button>
                    ) : (
                      <span className="text-xs text-[#5d6c7b]">—</span>
                    )}
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
