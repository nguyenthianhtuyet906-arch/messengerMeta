import { getMessagesCollection } from "@/lib/db/collections";

/**
 * Tìm kiếm hội thoại theo: tên khách, nội dung tin nhắn, hoặc số đơn hàng.
 * Một ô tìm kiếm duy nhất — server tự nhận diện loại truy vấn.
 */

export type SearchMode = "order" | "text";

export interface ParsedSearch {
  mode: SearchMode;
  /** Các segment số của số đơn (segment đầu là id chính). Chỉ có ở order mode. */
  orderIds: number[];
  /** Chuỗi đưa vào $text của messages. */
  textSearch: string;
}

// Trần số conversation lấy từ kết quả $text — tránh $in quá lớn cho truy vấn nội dung rộng.
// Với số đơn lượng khớp rất nhỏ nên không ảnh hưởng.
const MSG_MATCH_CAP = 2000;

// Số đơn: optional prefix chữ "+ dấu -" (DAV-, DACO-, FVAV-…), rồi nhóm số phân tách bởi "-".
// vd: 4084542824 | 4084542824-5099982646 | DAV-4084542824 | DAV-4084542824-5099982646
const ORDER_RE = /^([A-Za-z]{2,}-)?\d{4,}(-\d+)*$/;
const ALPHA_PREFIX_RE = /^[A-Za-z]+-/;

/** Phân tích chuỗi tìm kiếm thô thành mode + dữ liệu khớp. */
export function parseSearchQuery(raw: string): ParsedSearch {
  const trimmed = raw.trim().replace(/^#/, "").trim();

  if (ORDER_RE.test(trimmed)) {
    // Bỏ prefix chữ rồi tách các segment số.
    const digits = trimmed.replace(ALPHA_PREFIX_RE, "");
    const orderIds = digits
      .split("-")
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n > 0);
    return {
      mode: "order",
      orderIds,
      // $text tách "#4084542824-5099982646" thành các token số → join bằng dấu cách để khớp được.
      textSearch: orderIds.join(" "),
    };
  }

  return { mode: "text", orderIds: [], textSearch: raw.trim() };
}

/** conversation_id của các message khớp $text (đã dedupe, giới hạn CAP). */
async function findConversationIdsByMessageText(textSearch: string): Promise<number[]> {
  if (!textSearch) return [];
  const coll = await getMessagesCollection();
  const docs = await coll
    .find(
      { $text: { $search: textSearch } },
      { projection: { conversation_id: 1, _id: 0 } },
    )
    .limit(MSG_MATCH_CAP)
    .toArray();
  const ids = new Set<number>();
  for (const d of docs) {
    const id = (d as { conversation_id?: number }).conversation_id;
    if (typeof id === "number" && Number.isFinite(id)) ids.add(id);
  }
  return [...ids];
}

/**
 * Dựng 1 clause $or cho filter conversations từ chuỗi tìm kiếm.
 * Trả null nếu chuỗi rỗng (không lọc).
 */
export async function buildSearchClause(
  search: string,
): Promise<Record<string, unknown> | null> {
  const q = search.trim();
  if (!q) return null;

  const parsed = parseSearchQuery(q);
  const msgConvIds = await findConversationIdsByMessageText(parsed.textSearch);

  const or: Record<string, unknown>[] = [];

  if (parsed.mode === "order") {
    if (parsed.orderIds.length > 0) {
      or.push({
        "etsy.buyer_info.receipt_history.receipt_id": { $in: parsed.orderIds },
      });
      or.push({ "etsy.order_info.order_id": { $in: parsed.orderIds } });
    }
  } else {
    const rx = { $regex: q, $options: "i" };
    or.push(
      { "etsy.other_user.display_name": rx },
      { "etsy.buyer_info.buyer_profile.display_name": rx },
      { "etsy.title": rx },
      { "etsy.excerpt": rx },
    );
  }

  // Khớp số đơn dán trong tin nhắn / nội dung tin nhắn.
  if (msgConvIds.length > 0) {
    or.push({ "etsy.conversation_id": { $in: msgConvIds } });
  }

  if (or.length === 0) return null;
  return { $or: or };
}
