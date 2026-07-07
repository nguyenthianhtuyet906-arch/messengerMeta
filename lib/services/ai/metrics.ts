import { getAiSuggestionEventsCollection } from "@/lib/db/collections";
import type { SuggestionOutcome } from "@/lib/types/etsy";

/**
 * Giai đoạn 3 — Tổng hợp acceptance rate của gợi ý AI theo khoảng thời gian.
 * usageRate = (gửi y hệt + có sửa) / số lần có gợi ý.
 */

export interface IntentMetric {
  intentTag: string;
  withSuggestion: number;
  sentAsIs: number;
  edited: number;
  custom: number;
  usageRate: number;
}

export interface SuggestionMetrics {
  rangeDays: number;
  totals: {
    total: number;
    withSuggestion: number;
    sentAsIs: number;
    edited: number;
    custom: number;
    noSuggestion: number;
  };
  rates: { usageRate: number; acceptAsIsRate: number };
  byIntent: IntentMetric[];
}

export async function getSuggestionMetrics(opts: {
  days?: number;
  shopId?: number;
}): Promise<SuggestionMetrics> {
  const days = Math.min(Math.max(opts.days ?? 30, 1), 365);
  const from = new Date(Date.now() - days * 86_400_000);
  const match: Record<string, unknown> = { created_at: { $gte: from } };
  if (opts.shopId) match.shopId = opts.shopId;

  const coll = await getAiSuggestionEventsCollection();

  const byOutcome = await coll
    .aggregate<{ _id: SuggestionOutcome; count: number }>([
      { $match: match },
      { $group: { _id: "$outcome", count: { $sum: 1 } } },
    ])
    .toArray();

  const outMap = new Map<string, number>();
  for (const r of byOutcome) outMap.set(r._id, r.count);
  const sentAsIs = outMap.get("sent_asis") ?? 0;
  const edited = outMap.get("edited") ?? 0;
  const custom = outMap.get("custom") ?? 0;
  const noSuggestion = outMap.get("no_suggestion") ?? 0;
  const withSuggestion = sentAsIs + edited + custom;
  const total = withSuggestion + noSuggestion;

  const byIntentRaw = await coll
    .aggregate<{ _id: { intent: string; outcome: SuggestionOutcome }; count: number }>([
      { $match: { ...match, hadSuggestion: true } },
      { $group: { _id: { intent: "$intentTag", outcome: "$outcome" }, count: { $sum: 1 } } },
    ])
    .toArray();

  const intentMap = new Map<string, { sentAsIs: number; edited: number; custom: number }>();
  for (const r of byIntentRaw) {
    const key = r._id.intent || "(no tag)";
    const e = intentMap.get(key) ?? { sentAsIs: 0, edited: 0, custom: 0 };
    if (r._id.outcome === "sent_asis") e.sentAsIs += r.count;
    else if (r._id.outcome === "edited") e.edited += r.count;
    else if (r._id.outcome === "custom") e.custom += r.count;
    intentMap.set(key, e);
  }
  const byIntent: IntentMetric[] = [...intentMap.entries()]
    .map(([intentTag, e]) => {
      const ws = e.sentAsIs + e.edited + e.custom;
      return {
        intentTag,
        withSuggestion: ws,
        sentAsIs: e.sentAsIs,
        edited: e.edited,
        custom: e.custom,
        usageRate: ws ? (e.sentAsIs + e.edited) / ws : 0,
      };
    })
    .sort((a, b) => b.withSuggestion - a.withSuggestion);

  return {
    rangeDays: days,
    totals: { total, withSuggestion, sentAsIs, edited, custom, noSuggestion },
    rates: {
      usageRate: withSuggestion ? (sentAsIs + edited) / withSuggestion : 0,
      acceptAsIsRate: withSuggestion ? sentAsIs / withSuggestion : 0,
    },
    byIntent,
  };
}
