import type { NextRequest } from "next/server";
import type { AnalyticsOpts } from "@/lib/services/analytics";

/** Parse from/to (unix giây) + shopIds từ query string của 1 request analytics. */
export function parseAnalyticsParams(req: NextRequest): AnalyticsOpts {
  const sp = req.nextUrl.searchParams;

  const num = (key: string): number | null => {
    const raw = sp.get(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  const shopIdsRaw = sp.get("shopIds");
  const shopIds = shopIdsRaw
    ? shopIdsRaw.split(",").map(Number).filter(Number.isFinite)
    : [];

  return { from: num("from"), to: num("to"), shopIds };
}
