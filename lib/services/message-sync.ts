import type { AnyBulkWriteOperation } from "mongodb";
import { getMessagesCollection } from "@/lib/db/collections";
import type { EtsyRaw, MessageDoc } from "@/lib/types/etsy";
import { asNumber, asString, isObject } from "@/lib/services/etsy-utils";
import { publishNewMessages } from "@/lib/services/ably-publish";
import { processIncomingMessages } from "@/lib/services/incoming-actions";

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
  // opConvIds[i] = conversation_id của op thứ i (để biết conversation nào có tin mới).
  const opConvIds: number[] = [];
  // opMsgs[i] = raw Etsy payload của op thứ i (để chạy auto-reply/AI cho tin mới).
  const opMsgs: EtsyRaw[] = [];
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
    opConvIds.push(conversationId);
    opMsgs.push(msg);

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

  // Phát realtime cho mỗi conversation có message MỚI (1 lần/conversation).
  const newConvIds = new Set<number>();
  const newMsgs: EtsyRaw[] = [];
  for (const idx of Object.keys(res.upsertedIds ?? {})) {
    const i = Number(idx);
    const convId = opConvIds[i];
    if (convId) newConvIds.add(convId);
    if (opMsgs[i]) newMsgs.push(opMsgs[i]);
  }
  if (newConvIds.size > 0) {
    await publishNewMessages([...newConvIds]);
  }

  // Auto-reply + gợi ý AI cho tin mới (port pushNewMessageEvent của DORA). Không chặn response.
  if (newMsgs.length > 0) {
    void processIncomingMessages(newMsgs).catch((e) =>
      console.warn("[message-sync] incoming actions error:", (e as Error)?.message),
    );
  }

  return { received: messages.length, upserted: res.upsertedCount, skipped };
}
