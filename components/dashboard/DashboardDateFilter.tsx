"use client";

import {
  PRESETS,
  type DateRange,
  type PresetKey,
  dateInputToFrom,
  dateInputToTo,
  rangeForPreset,
  secToDateInput,
} from "@/lib/dashboard/date-presets";
import { cn } from "@/lib/utils";

interface Props {
  presetKey: PresetKey;
  range: DateRange;
  onChange: (presetKey: PresetKey, range: DateRange) => void;
}

/** Bộ lọc thời gian global: preset buttons + 2 ô ngày tuỳ chỉnh. */
export function DashboardDateFilter({ presetKey, range, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange(p.key, rangeForPreset(p.key))}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-bold transition-colors",
            presetKey === p.key
              ? "bg-primary text-white"
              : "border border-border bg-card text-muted-foreground hover:bg-secondary",
          )}
        >
          {p.label}
        </button>
      ))}

      <div className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5">
        <input
          type="date"
          value={secToDateInput(range.from)}
          onChange={(e) =>
            onChange("custom", { from: dateInputToFrom(e.target.value), to: range.to })
          }
          className="bg-transparent text-sm text-foreground outline-none"
        />
        <span className="text-muted-foreground">–</span>
        <input
          type="date"
          value={secToDateInput(range.to)}
          onChange={(e) =>
            onChange("custom", { from: range.from, to: dateInputToTo(e.target.value) })
          }
          className="bg-transparent text-sm text-foreground outline-none"
        />
      </div>
    </div>
  );
}
