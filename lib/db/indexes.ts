import type { Db, IndexSpecification, CreateIndexesOptions } from "mongodb";

/**
 * Tạo index cho các collection tin nhắn. Idempotent: bỏ qua lỗi "index đã tồn tại".
 * Mirror dora-backend/services/db_indexes.go — cần thiết cho hàng triệu bản ghi.
 */
type IndexDef = { keys: IndexSpecification; options: CreateIndexesOptions };

const CONVERSATION_INDEXES: IndexDef[] = [
  // Key upsert + dedup conversation
  {
    keys: { "etsy.conversation_id": 1 },
    options: { name: "uq_etsy_conversation_id", unique: true },
  },
  // Sort inbox + cursor pagination: phải compound với _id để sort
  // {lastMessageDate:-1, _id:-1} được index phục vụ (tránh in-memory SORT khi nhiều bản ghi).
  {
    keys: { lastMessageDate: -1, _id: -1 },
    options: { name: "idx_lastMessageDate_id" },
  },
  { keys: { updated_at: -1 }, options: { name: "idx_updated_at" } },
];

const MESSAGE_INDEXES: IndexDef[] = [
  // Dedup + cho phép bulk upsert nhanh. sparse: bỏ qua doc thiếu field.
  {
    keys: { "etsy.conversation_message_id": 1 },
    options: { name: "uq_etsy_conversation_message_id", unique: true, sparse: true },
  },
  // Lấy message mới nhất / phân trang trong 1 conversation
  {
    keys: { "etsy.conversation_id": 1, "etsy.message_order": -1 },
    options: { name: "idx_conv_message_order" },
  },
  { keys: { conversation_id: 1 }, options: { name: "idx_conversation_id" } },
];

function isAlreadyExistsError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("already exists") ||
    msg.includes("IndexOptionsConflict") ||
    msg.includes("index with name") ||
    msg.includes("An equivalent index already exists")
  );
}

async function createIndexes(db: Db, collName: string, defs: IndexDef[]): Promise<void> {
  const coll = db.collection(collName);
  for (const def of defs) {
    try {
      await coll.createIndex(def.keys, def.options);
    } catch (err) {
      if (isAlreadyExistsError(err)) continue;
      throw err;
    }
  }
}

export async function ensureIndexes(db: Db): Promise<void> {
  await createIndexes(db, "conversations", CONVERSATION_INDEXES);
  await createIndexes(db, "messages", MESSAGE_INDEXES);
}
