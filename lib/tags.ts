/**
 * Catalog tag hệ thống — mirror SystemTags & opposingTags của DORA
 * (dora-backend/modules/web/conversation/services/tag_service.go + types/types.go).
 * Tag lưu ở cấp hội thoại: ConversationDoc.tags.
 */

export interface SystemTag {
  /** Giá trị lưu DB (khớp DORA). */
  name: string;
  /** Nhãn hiển thị tiếng Việt. */
  label: string;
  /** Lớp Tailwind (nền + chữ) theo palette Meta. */
  className: string;
}

/** Bộ tag dựng sẵn — bấm để gắn nhanh. */
export const SYSTEM_TAGS: SystemTag[] = [
  { name: "handled", label: "Đã xử lý", className: "bg-[#e7f0fb] text-[#0064e0]" },
  { name: "approved", label: "Đã duyệt", className: "bg-[#e3f7ea] text-[#1a7f47]" },
  { name: "needs_attention", label: "Cần chú ý", className: "bg-[#fde8e8] text-[#b42318]" },
  { name: "order_issue", label: "Lỗi đơn", className: "bg-[#fff4e5] text-[#b54708]" },
  { name: "shipping_delay", label: "Giao trễ", className: "bg-[#fef6da] text-[#8c6d1f]" },
  { name: "refund_request", label: "Yêu cầu hoàn", className: "bg-[#f3e8ff] text-[#8b3df2]" },
];

/** Màu mặc định cho tag tự nhập (không thuộc bộ hệ thống). */
const DEFAULT_TAG_CLASS = "bg-[#eef1f4] text-[#5d6c7b]";

const SYSTEM_TAG_MAP = new Map(SYSTEM_TAGS.map((t) => [t.name, t]));

/** Lớp Tailwind cho 1 tag (system → màu riêng, còn lại → mặc định). */
export function tagClassName(name: string): string {
  return SYSTEM_TAG_MAP.get(name)?.className ?? DEFAULT_TAG_CLASS;
}

/** Nhãn hiển thị (system → tiếng Việt, tự nhập → giữ nguyên). */
export function tagLabel(name: string): string {
  return SYSTEM_TAG_MAP.get(name)?.label ?? name;
}
