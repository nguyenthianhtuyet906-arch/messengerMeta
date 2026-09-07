"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ListFilter } from "lucide-react";
import { useShopAnalytics } from "@/lib/hooks/useAnalytics";
import type { AnalyticsFilters, ShopMetricKey } from "@/lib/types/etsy";
import { PanelCard } from "./PanelCard";
import { cn } from "@/lib/utils";

const METRICS: { key: ShopMetricKey; label: string; color: string }[] = [
  { key: "conversations", label: "Hội thoại", color: "var(--chart-1)" },
  { key: "orders", label: "Số đơn", color: "var(--chart-5)" },
];

export function ShopAnalytics({ filters }: { filters: AnalyticsFilters }) {
  const { data, isPending, isError } = useShopAnalytics(filters);
  const [metric, setMetric] = useState<ShopMetricKey>("conversations");
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [showFilter, setShowFilter] = useState(false);

  const allItems = data?.items ?? [];
  const active = METRICS.find((m) => m.key === metric) ?? METRICS[0];

  const chartData = useMemo(
    () =>
      allItems
        .filter((i) => !hidden.has(i.shopId))
        .map((i) => ({ name: i.shopName, value: i[metric], shopId: i.shopId }))
        .sort((a, b) => b.value - a.value),
    [allItems, hidden, metric],
  );

  const toggle = (shopId: number) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(shopId)) next.delete(shopId);
      else next.add(shopId);
      return next;
    });

  return (
    <PanelCard
      title="Phân tích shop"
      subtitle={`${active.label} theo từng shop`}
      loading={isPending}
      tools={
        <div className="flex items-center gap-2">
          {/* Chuyển chỉ số */}
          <div className="flex rounded-full border border-border bg-card p-0.5">
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMetric(m.key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold transition-colors",
                  metric === m.key ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Lọc shop */}
          {allItems.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilter((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-secondary"
              >
                <ListFilter className="h-3.5 w-3.5" />
                Lọc shop
              </button>
              {showFilter && (
                <div className="absolute right-0 z-10 mt-2 max-h-72 w-56 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-lg">
                  {allItems.map((i) => (
                    <label
                      key={i.shopId}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary"
                    >
                      <input
                        type="checkbox"
                        checked={!hidden.has(i.shopId)}
                        onChange={() => toggle(i.shopId)}
                        className="accent-primary"
                      />
                      <span className="min-w-0 flex-1 truncate text-foreground">{i.shopName}</span>
                      <span className="text-xs text-muted-foreground">{i[metric]}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      }
    >
      {isError ? (
        <p className="py-6 text-center text-sm text-destructive">Không tải được dữ liệu.</p>
      ) : chartData.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Chưa có dữ liệu.</p>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "var(--secondary)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                }}
              />
              <Bar
                dataKey="value"
                name={active.label}
                fill={active.color}
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </PanelCard>
  );
}
