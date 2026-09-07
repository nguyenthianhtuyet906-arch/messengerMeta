import { NextResponse, type NextRequest } from "next/server";
import { getConversationReceiptHistory } from "@/lib/services/conversation-detail";
import { publishFetchPersonalization } from "@/lib/services/ably-publish";

// POST /api/conversations/:conversation_id/personalization/refresh
// Yêu cầu extension GET lại ảnh khách upload ("Your Photo") cho TẤT CẢ đơn của hội thoại.
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ conversation_id: string }> },
) {
  try {
    const { conversation_id } = await ctx.params;
    const conversationId = Number(conversation_id);
    if (!Number.isFinite(conversationId)) {
      return NextResponse.json({ error: "invalid conversation_id" }, { status: 400 });
    }

    const detail = await getConversationReceiptHistory(conversationId);
    const receiptIds = detail.receiptHistory.map((r) => r.receiptId).filter((id) => id > 0);
    const shopName = detail.storeName;

    if (!shopName) {
      return NextResponse.json({ online: false, error: "shop_name not found" }, { status: 409 });
    }
    if (receiptIds.length === 0) {
      return NextResponse.json({ online: true, receiptIds: 0 });
    }

    const clientId = await publishFetchPersonalization(shopName, {
      conversation_id: conversationId,
      receipt_ids: receiptIds,
    });
    if (!clientId) {
      return NextResponse.json(
        { online: false, error: "Không có extension nào online cho shop này" },
        { status: 409 },
      );
    }

    return NextResponse.json({ online: true, clientId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/conversations/:id/personalization/refresh]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
