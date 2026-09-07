import type { WithId } from "mongodb";
import { getConversationsCollection } from "@/lib/db/collections";
import type { ConversationDoc, TagStat } from "@/lib/types/etsy";

/** Lỗi nghiệp vụ tag (mang theo HTTP status để route trả đúng mã). */
export class TagError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Lấy danh sách tag của 1 hội thoại. */
export async function getTags(conversationId: number): Promise<string[]> {
  const coll = await getConversationsCollection();
  const doc = (await coll.findOne(
    { "etsy.conversation_id": conversationId },
    { projection: { tags: 1 } },
  )) as WithId<ConversationDoc> | null;

  return Array.isArray(doc?.tags) ? doc!.tags : [];
}

/**
 * Gắn 1 tag. Cho phép gắn nhiều tag tùy ý, không ràng buộc đối nghịch.
 * `$addToSet` chống trùng. Trả về mảng tag mới.
 */
export async function addTag(conversationId: number, tag: string): Promise<string[]> {
  const name = tag.trim();
  if (!name) throw new TagError(400, "empty tag");

  const coll = await getConversationsCollection();
  const res = await coll.updateOne(
    { "etsy.conversation_id": conversationId },
    { $addToSet: { tags: name } },
  );
  if (res.matchedCount === 0) throw new TagError(404, "conversation not found");

  return getTags(conversationId);
}

/**
 * Thống kê số hội thoại theo từng tag (giảm dần theo count).
 * Có thể lọc theo shop (user_data.user_id) để khớp ngữ cảnh danh sách.
 */
export async function getTagStats(shopIds?: number[]): Promise<TagStat[]> {
  const coll = await getConversationsCollection();
  const match: Record<string, unknown> = { tags: { $exists: true, $ne: [] } };
  if (shopIds && shopIds.length > 0) {
    match["user_data.user_id"] = { $in: shopIds };
  }

  const rows = await coll
    .aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ])
    .toArray();

  return rows.map((r) => ({ tag: r._id, count: r.count }));
}

/** Gỡ 1 tag. Trả về mảng tag mới. */
export async function removeTag(conversationId: number, tag: string): Promise<string[]> {
  const name = tag.trim();
  if (!name) throw new TagError(400, "empty tag");

  const coll = await getConversationsCollection();
  const res = await coll.updateOne(
    { "etsy.conversation_id": conversationId },
    { $pull: { tags: name } },
  );
  if (res.matchedCount === 0) throw new TagError(404, "conversation not found");

  return getTags(conversationId);
}
