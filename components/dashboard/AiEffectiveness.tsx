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
import { useAiEffectiveness } from "@/lib/hooks/useAnalytics";
import type { AiMetricKey, AnalyticsFilters } from "@/lib/types/etsy";
import { PanelCard } from "./PanelCard";
import { cn } from "@/lib/utils";

const METRICS: { key: AiMetricKey; label: string; color: string }[] = [
  { key: "used", label: "Số lần dùng", color: "var(--chart-2)" },
  { key: "usageRate", label: "Tỉ lệ dùng", color: "var(--chart-4)" },
];

export function AiEffectiveness({ filters }: { filters: AnalyticsFilters }) {
  const { data, isPending, isError } = useAiEffectiveness(filters);
  const [metric, setMetric] = useState<AiMetricKey>("used");
  const active = METRICS.find((m) => m.key === metric) ?? METRICS[0];

  const chartData = useMemo(
    () =>
      (data?.items ?? [])
        // Tên nhân viên: phần trước @ cho gọn trục X.
        .map((i) => ({ name: i.senderEmail.split("@")[0], value: i[metric] }))
        .sort((a, b) => b.value - a.value),
    [data?.items, metric],
  );

  return (
    <PanelCard
      title="Hiệu quả gợi ý AI"
      subtitle={`${active.label} theo từng nhân viên`}
      loading={isPending}
      tools={
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
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                allowDecimals={false}
                domain={metric === "usageRate" ? [0, 100] : undefined}
              />
              <Tooltip
                cursor={{ fill: "var(--secondary)" }}
                formatter={(v) => (metric === "usageRate" ? `${v}%` : v)}
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
