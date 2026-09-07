/** Khoảng thời gian (unix giây). null = không giới hạn (All Time). */
export interface DateRange {
  from: number | null;
  to: number | null;
}

export type PresetKey = "today" | "7days" | "30days" | "all" | "custom";

export const PRESETS: { key: Exclude<PresetKey, "custom">; label: string }[] = [
  { key: "today", label: "Hôm nay" },
  { key: "7days", label: "7 ngày" },
  { key: "30days", label: "30 ngày" },
  { key: "all", label: "Tất cả" },
];

const SECONDS = 1000;

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / SECONDS);
}

function nowSec(): number {
  return Math.floor(Date.now() / SECONDS);
}

/** Tính khoảng thời gian cho 1 preset (trừ custom). */
export function rangeForPreset(key: Exclude<PresetKey, "custom">): DateRange {
  const to = nowSec();
  switch (key) {
    case "today":
      return { from: startOfToday(), to };
    case "7days":
      return { from: to - 7 * 24 * 3600, to };
    case "30days":
      return { from: to - 30 * 24 * 3600, to };
    case "all":
    default:
      return { from: null, to: null };
  }
}

/** yyyy-mm-dd (input[type=date]) → unix giây (đầu ngày). */
export function dateInputToFrom(value: string): number | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : Math.floor(d.getTime() / SECONDS);
}

/** yyyy-mm-dd (input[type=date]) → unix giây (cuối ngày). */
export function dateInputToTo(value: string): number | null {
  if (!value) return null;
  const d = new Date(`${value}T23:59:59`);
  return Number.isNaN(d.getTime()) ? null : Math.floor(d.getTime() / SECONDS);
}

/** unix giây → yyyy-mm-dd cho input[type=date]. */
export function secToDateInput(sec: number | null): string {
  if (sec == null) return "";
  const d = new Date(sec * SECONDS);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
