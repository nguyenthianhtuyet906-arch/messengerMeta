"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  AgentPerformanceResponse,
  AnalyticsFilters,
  ShopAnalyticsResponse,
  MessageOverviewResponse,
  TagsOverviewResponse,
} from "@/lib/types/etsy";

function buildParams(filters: AnalyticsFilters): string {
  const params = new URLSearchParams();
  if (filters.from != null) params.set("from", String(filters.from));
  if (filters.to != null) params.set("to", String(filters.to));
  if (filters.shopIds.length > 0) params.set("shopIds", filters.shopIds.join(","));
  return params.toString();
}

async function fetchJson<T>(path: string, filters: AnalyticsFilters): Promise<T> {
  const qs = buildParams(filters);
  const res = await fetch(`${path}${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

// Auto-refresh 10s (mirror DORA poll). staleTime ngắn hơn để không refetch thừa.
const COMMON = { refetchInterval: 10_000, staleTime: 8_000 } as const;

export function useMessageOverview(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ["analytics", "overview", filters],
    queryFn: () => fetchJson<MessageOverviewResponse>("/api/analytics/overview", filters),
    ...COMMON,
  });
}

export function useShopAnalytics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ["analytics", "shops", filters],
    queryFn: () => fetchJson<ShopAnalyticsResponse>("/api/analytics/shops", filters),
    ...COMMON,
  });
}

export function useAgentPerformance(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ["analytics", "agents", filters],
    queryFn: () =>
      fetchJson<AgentPerformanceResponse>("/api/analytics/agent-performance", filters),
    ...COMMON,
  });
}

export function useTagsOverview(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ["analytics", "tags", filters],
    queryFn: () => fetchJson<TagsOverviewResponse>("/api/analytics/tags-overview", filters),
    ...COMMON,
  });
}
