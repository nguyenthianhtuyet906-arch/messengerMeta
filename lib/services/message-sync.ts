import type { AnyBulkWriteOperation } from "mongodb";
import { getMessagesCollection } from "@/lib/db/collections";
import type { EtsyRaw, MessageDoc } from "@/lib/types/etsy";
import { asNumber, asString, isObject } from "@/lib/services/etsy-utils";

export interface SyncMessagesResult {
  received: number;
  upserted: number;
  skipped: number;
}

/**
 * Port của dora-backend MessageService.SyncMessages (extension/services/message_service.go),
 * nhưng dùng bulkWrite + upsert keyed theo etsy.conversation_message_id để tránh N lần FindOne
 * — quan trọng cho hàng triệu bản ghi. Dedup nhờ unique sparse index.
 * (Bỏ phần Ably push / auto-reply / AI của DORA — ngoài scope.)
 */
export async function syncMessages(messages: EtsyRaw[]): Promise<SyncMessagesResult> {
  const coll = await getMessagesCollection();
  const now = new Date();

  const ops: AnyBulkWriteOperation<MessageDoc>[] = [];
  let skipped = 0;

  for (const msg of messages) {
    if (!isObject(msg)) {
      skipped++;
      continue;
    }
    const messageId = msg["conversation_message_id"];
    if (messageId === undefined || messageId === null) {
      // Không có id ổn định → không thể dedup an toàn bằng index, bỏ qua.
      skipped++;
      continue;
    }

    const conversationId = asNumber(msg["conversation_id"]) ?? 0;

    ops.push({
      updateOne: {
        filter: { "etsy.conversation_message_id": messageId },
        update: {
          $set: { etsy: msg, conversation_id: conversationId, updated_at: now },
          $setOnInsert: {
            created_at: now,
            message: asString(msg["message"]),
            attachments: [] as string[],
            sender_email: "",
            status: "" as const,
          },
        },
        upsert: true,
      },
    });
  }

  if (ops.length === 0) {
    return { received: messages.length, upserted: 0, skipped };
  }

  const res = await coll.bulkWrite(ops, { ordered: false });
  return { received: messages.length, upserted: res.upsertedCount, skipped };
}
