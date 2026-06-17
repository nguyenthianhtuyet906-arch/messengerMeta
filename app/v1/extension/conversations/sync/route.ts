import type { NextRequest } from "next/server";
import { corsJson, OPTIONS } from "@/lib/http/cors";
import { syncConversationList } from "@/lib/services/conversation-sync";
import type { ConversationSyncBody } from "@/lib/types/etsy";

export { OPTIONS };

// POST /v1/extension/conversations/sync
// Trả về MẢNG conversation_id cần sync chi tiết (extension lặp trực tiếp trên kết quả).
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ConversationSyncBody;
    const ids = await syncConversationList(body);
    return corsJson(ids);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[conversations/sync] error:", message);
    return corsJson({ error: message }, { status: 500 });
  }
}
