"use client";

import { useQuery } from "@tanstack/react-query";
import type { ShopItem } from "@/lib/types/etsy";

async function fetchShops(): Promise<ShopItem[]> {
  const res = await fetch("/api/shops");
  if (!res.ok) throw new Error(`shops ${res.status}`);
  const data = (await res.json()) as { shops: ShopItem[] };
  return data.shops ?? [];
}

export function useShops() {
  return useQuery({
    queryKey: ["shops"],
    queryFn: fetchShops,
    // Cập nhật online định kỳ (presence thay đổi).
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}
