import type { NextRequest } from "next/server";
import { corsJson, OPTIONS } from "@/lib/http/cors";
import { syncMessages } from "@/lib/services/message-sync";
import type { MessageSyncBody } from "@/lib/types/etsy";

export { OPTIONS };

// POST /v1/extension/messages/sync   body: { messages: [...] }
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MessageSyncBody;
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const result = await syncMessages(messages);
    return corsJson(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[messages/sync] error:", message);
    return corsJson({ error: message }, { status: 500 });
  }
}
