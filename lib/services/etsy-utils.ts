import type { EtsyRaw } from "@/lib/types/etsy";

/** Ép kiểu an toàn từ payload Etsy (số có thể là number hoặc chuỗi số). */
export function asNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return undefined;
}

export function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function isObject(v: unknown): v is EtsyRaw {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Lấy message cuối cùng trong etsy.detail.messages (mảng Etsy). */
export function getLastMessage(etsy: EtsyRaw): EtsyRaw | undefined {
  const detail = etsy["detail"];
  if (!isObject(detail)) return undefined;
  const messages = detail["messages"];
  if (!Array.isArray(messages) || messages.length === 0) return undefined;
  const last = messages[messages.length - 1];
  return isObject(last) ? last : undefined;
}

/** lastMessageDate = create_date của message cuối cùng. */
export function extractLastMessageDate(etsy: EtsyRaw): number {
  const last = getLastMessage(etsy);
  if (!last) return 0;
  return asNumber(last["create_date"]) ?? 0;
}
