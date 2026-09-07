import type { NextRequest } from "next/server";
import { corsJson, OPTIONS } from "@/lib/http/cors";
import { mergeAndSyncConversation } from "@/lib/services/conversation-sync";
import type { EtsyRaw } from "@/lib/types/etsy";

export { OPTIONS };

// POST /v1/extension/conversations/sync/:conversation_id
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ conversation_id: string }> },
) {
  try {
    const { conversation_id } = await ctx.params;
    const conversationId = Number(conversation_id);
    if (!Number.isFinite(conversationId)) {
      return corsJson({ error: "invalid conversation_id" }, { status: 400 });
    }

    const body = (await req.json()) as EtsyRaw;
    await mergeAndSyncConversation(conversationId, body);
    return corsJson({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[conversations/sync/:id] error:", message);
    return corsJson({ error: message }, { status: 500 });
  }
}
