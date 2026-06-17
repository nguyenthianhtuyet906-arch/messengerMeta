import { ObjectId, type Filter, type WithId } from "mongodb";
import { getConversationsCollection } from "@/lib/db/collections";
import type {
  ConversationDoc,
  ConversationListItem,
  ConversationListResponse,
} from "@/lib/types/etsy";
import { asNumber, firstNumber, firstString } from "@/lib/services/etsy-utils";

// Projection: chỉ lấy subfield cần cho sidebar, TRÁNH kéo nguyên blob etsy
// (buyer_info.receipt_history, coupons, detail.messages... rất nặng).
const LIST_PROJECTION = {
  "etsy.conversation_id": 1,
  "etsy.other_user": 1,
  "etsy.buyer_info.buyer_profile": 1,
  "etsy.excerpt": 1,
  "etsy.preview": 1,
  "etsy.title": 1,
  "etsy.message_count": 1,
  "etsy.has_replied": 1,
  lastMessageDate: 1,
  "user_data.user_id": 1,
} as const;

interface Cursor {
  d: number;
  id: string;
}

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

function decodeCursor(raw: string | null): Cursor | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(Buffer.from(raw, "base64url").toString()) as Cursor;
    if (typeof c.d === "number" && typeof c.id === "string") return c;
  } catch {
    /* ignore */
  }
  return null;
}

export function mapConversation(doc: WithId<ConversationDoc>): ConversationListItem {
  const etsy = doc.etsy ?? {};
  return {
    conversationId: asNumber(etsy["conversation_id"]) ?? 0,
    name: firstString(etsy, [
      "other_user.display_name",
      "other_user.name",
      "buyer_info.buyer_profile.display_name",
      "buyer_info.buyer_profile.username",
    ]),
    avatar: firstString(etsy, [
      "other_user.im_avatar",
      "other_user.avatar_url",
      "buyer_info.buyer_profile.avatar_url",
    ]),
    excerpt: firstString(etsy, ["excerpt", "preview", "title"]),
    lastMessageDate: doc.lastMessageDate ?? 0,
    messageCount: asNumber(etsy["message_count"]) ?? 0,
    hasReplied: etsy["has_replied"] === true,
    shopUserId: firstNumber(doc, ["user_data.user_id"]) ?? 0,
  };
}

export interface ConversationFilterOpts {
  cursor?: string | null;
  limit?: number;
  search?: string;
  notReplied?: boolean;
  hasOrder?: boolean;
  orderHelp?: boolean;
  shopIds?: number[];
}

export async function getConversations(
  opts: ConversationFilterOpts,
): Promise<ConversationListResponse> {
  const coll = await getConversationsCollection();
  const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100);

  // Gom từng điều kiện thành clause rồi kết hợp bằng $and (mirror dora buildBaseFilter).
  const clauses: Record<string, unknown>[] = [];

  const cursor = decodeCursor(opts.cursor ?? null);
  if (cursor) {
    clauses.push({
      $or: [
        { lastMessageDate: { $lt: cursor.d } },
        { lastMessageDate: cursor.d, _id: { $lt: new ObjectId(cursor.id) } },
      ],
    });
  }

  const search = opts.search?.trim();
  if (search) {
    const rx = { $regex: search, $options: "i" };
    clauses.push({
      $or: [
        { "etsy.other_user.display_name": rx },
        { "etsy.buyer_info.buyer_profile.display_name": rx },
        { "etsy.title": rx },
        { "etsy.excerpt": rx },
      ],
    });
  }

  // Help request
  if (opts.orderHelp) clauses.push({ "etsy.is_order_help_request": true });

  // Not Replied: chưa trả lời và chưa được đánh dấu xử lý
  if (opts.notReplied) {
    clauses.push({ "etsy.has_replied": false });
    clauses.push({ tags: { $nin: ["handled", "approved"] } });
  }

  // Has Order: buyer có đơn hàng
  if (opts.hasOrder) {
    clauses.push({ "etsy.buyer_info.past_order_history.total_orders": { $gt: 0 } });
  }

  // Lọc theo shop (user_data.user_id top-level)
  if (opts.shopIds && opts.shopIds.length > 0) {
    clauses.push({ "user_data.user_id": { $in: opts.shopIds } });
  }

  const filter: Filter<ConversationDoc> =
    clauses.length > 0 ? ({ $and: clauses } as Filter<ConversationDoc>) : {};

  // limit+1 để biết còn trang sau không.
  const docs = (await coll
    .find(filter, { projection: LIST_PROJECTION })
    .sort({ lastMessageDate: -1, _id: -1 })
    .limit(limit + 1)
    .toArray()) as WithId<ConversationDoc>[];

  const hasMore = docs.length > limit;
  const page = hasMore ? docs.slice(0, limit) : docs;

  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeCursor({ d: last.lastMessageDate ?? 0, id: last._id.toHexString() })
      : null;

  return { items: page.map(mapConversation), nextCursor };
}
