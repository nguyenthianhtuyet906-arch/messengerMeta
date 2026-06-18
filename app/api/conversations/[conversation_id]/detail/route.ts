import { NextResponse, type NextRequest } from "next/server";
import { getConversationReceiptHistory } from "@/lib/services/conversation-detail";

// GET /api/conversations/:conversation_id/detail
// Trả receipt_history (lịch sử đơn hàng) cho sidebar phải.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ conversation_id: string }> },
) {
  try {
    const { conversation_id } = await ctx.params;
    const conversationId = Number(conversation_id);
    if (!Number.isFinite(conversationId)) {
      return NextResponse.json({ error: "invalid conversation_id" }, { status: 400 });
    }

    const data = await getConversationReceiptHistory(conversationId);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/conversations/:id/detail]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
