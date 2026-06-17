import { NextResponse, type NextRequest } from "next/server";
import { getConversationMessages } from "@/lib/services/message-read";

// GET /api/conversations/:conversation_id/messages?before=&limit=
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ conversation_id: string }> },
) {
  try {
    const { conversation_id } = await ctx.params;
    const conversationId = Number(conversation_id);
    if (!Number.isFinite(conversationId)) {
      return NextResponse.json({ error: "invalid conversation_id" }, { status: 400 });
    }

    const sp = req.nextUrl.searchParams;
    const beforeRaw = sp.get("before");
    const data = await getConversationMessages({
      conversationId,
      before: beforeRaw !== null && beforeRaw !== "" ? Number(beforeRaw) : null,
      limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
    });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/conversations/:id/messages]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
