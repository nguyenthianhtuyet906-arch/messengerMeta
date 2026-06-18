import { getConversationsCollection } from "@/lib/db/collections";
import type { ConversationDoc, EtsyRaw } from "@/lib/types/etsy";
import { asNumber, asString, decodeHtmlEntities, firstNumber } from "@/lib/services/etsy-utils";
import { getRepliesForIncoming } from "@/lib/services/auto-reply";
import { createOutgoingMessage } from "@/lib/services/message-send";
import { createAIResponse } from "@/lib/services/ai/conversation-ai";

/**
 * Port của dora-backend pushNewMessageEvent + generateAISuggestionsIfCustomerMessage.
 * Khi sync có tin MỚI: với mỗi conversation, xét tin đến mới nhất; nếu là tin của KHÁCH
 * (sender ≠ shop) → (1) auto-reply nếu khớp trigger, (2) sinh gợi ý AI ở nền.
 *
 * Guard recency: chỉ kích hoạt với tin trong cửa sổ gần đây để lần sync lịch sử (hàng nghìn
 * tin cũ) không gây bão auto-reply/AI. Đổi qua AUTO_ACTION_WINDOW_SECONDS (mặc định 900s).
 */
const WINDOW_SECONDS = Number(process.env.AUTO_ACTION_WINDOW_SECONDS ?? 900);

interface Candidate {
  conversationId: number;
  text: string;
  senderId: number;
  messageOrder: number;
  createDate: number;
}

/** Gom tin đến mới nhất (theo message_order) cho mỗi conversation từ các msg vừa upsert. */
export function pickLatestIncoming(newMsgs: EtsyRaw[]): Map<number, Candidate> {
  const best = new Map<number, Candidate>();
  for (const msg of newMsgs) {
    const conversationId = asNumber(msg["conversation_id"]) ?? 0;
    if (!conversationId) continue;
    if (msg["is_system_message"] === true) continue; // bỏ tin hệ thống
    const order = asNumber(msg["message_order"]) ?? 0;
    const cur = best.get(conversationId);
    if (!cur || order > cur.messageOrder) {
      best.set(conversationId, {
        conversationId,
        text: decodeHtmlEntities(asString(msg["message"])),
        senderId: asNumber(msg["sender_id"]) ?? 0,
        messageOrder: order,
        createDate: asNumber(msg["create_date"]) ?? 0,
      });
    }
  }
  return best;
}

/**
 * Chạy auto-reply + AI cho các conversation có tin mới. Fire-and-forget: nuốt mọi lỗi,
 * không chặn/đánh hỏng luồng sync.
 */
export async function processIncomingMessages(newMsgs: EtsyRaw[]): Promise<void> {
  const candidates = pickLatestIncoming(newMsgs);
  if (candidates.size === 0) return;

  const nowSec = Math.floor(Date.now() / 1000);
  const convColl = await getConversationsCollection();

  // Lấy shop user_id cho từng conversation để biết tin nào của khách.
  const ids = [...candidates.keys()];
  const convs = (await convColl
    .find(
      { "etsy.conversation_id": { $in: ids } },
      { projection: { "etsy.conversation_id": 1, "user_data.user_id": 1 } },
    )
    .toArray()) as ConversationDoc[];

  const shopUserIdByConv = new Map<number, number>();
  for (const c of convs) {
    const convId = asNumber((c.etsy ?? {})["conversation_id"]) ?? 0;
    if (convId) shopUserIdByConv.set(convId, firstNumber(c, ["user_data.user_id"]) ?? 0);
  }

  for (const cand of candidates.values()) {
    const shopUserId = shopUserIdByConv.get(cand.conversationId) ?? 0;
    // Bỏ tin do chính shop gửi (kể cả auto-reply của ta được sync ngược lại).
    if (shopUserId !== 0 && cand.senderId === shopUserId) continue;
    // Guard recency: bỏ tin cũ (sync lịch sử).
    if (WINDOW_SECONDS > 0 && cand.createDate > 0 && nowSec - cand.createDate > WINDOW_SECONDS) {
      continue;
    }

    // (1) Auto-reply
    try {
      const rules = await getRepliesForIncoming(cand.text);
      for (const rule of rules) {
        if (!rule.reply) continue;
        await createOutgoingMessage(cand.conversationId, rule.reply, "auto-reply").catch(
          (e) => console.warn("[auto-reply] send failed:", (e as Error)?.message),
        );
      }
    } catch (e) {
      console.warn("[auto-reply] error:", (e as Error)?.message);
    }

    // (2) Gợi ý AI ở nền (lưu sẵn + auto-tag).
    createAIResponse(cand.conversationId, "").catch((e) =>
      console.warn("[ai-suggest] error:", (e as Error)?.message),
    );
  }
}
