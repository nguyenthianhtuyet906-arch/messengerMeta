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
              ? "bg-[#0064e0] text-white"
              : "border border-[#dee3e9] bg-white text-[#5d6c7b] hover:bg-[#f1f4f7]",
          )}
        >
          {p.label}
        </button>
      ))}

      <div className="flex items-center gap-1 rounded-full border border-[#dee3e9] bg-white px-3 py-1.5">
        <input
          type="date"
          value={secToDateInput(range.from)}
          onChange={(e) =>
            onChange("custom", { from: dateInputToFrom(e.target.value), to: range.to })
          }
          className="bg-transparent text-sm text-[#0a1317] outline-none"
        />
        <span className="text-[#5d6c7b]">–</span>
        <input
          type="date"
          value={secToDateInput(range.to)}
          onChange={(e) =>
            onChange("custom", { from: range.from, to: dateInputToTo(e.target.value) })
          }
          className="bg-transparent text-sm text-[#0a1317] outline-none"
        />
      </div>
    </div>
  );
}
