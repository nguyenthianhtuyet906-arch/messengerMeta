import { NextResponse, type NextRequest } from "next/server";
import { getConversationMessages } from "@/lib/services/message-read";
import { createOutgoingMessage } from "@/lib/services/message-send";
import { auth } from "@/auth";

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

// POST /api/conversations/:conversation_id/messages  body: { message: string }
// Tạo tin nhắn đi → đẩy Ably "chat-message" tới extension gửi lên Etsy.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ conversation_id: string }> },
) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { conversation_id } = await ctx.params;
    const conversationId = Number(conversation_id);
    if (!Number.isFinite(conversationId)) {
      return NextResponse.json({ error: "invalid conversation_id" }, { status: 400 });
    }

    const body = (await req.json()) as { message?: string; attachments?: string[] };
    const text = (body.message ?? "").trim();
    const attachments = Array.isArray(body.attachments)
      ? body.attachments.filter((u): u is string => typeof u === "string" && u !== "")
      : [];
    // Cho phép gửi khi chỉ có ảnh (text rỗng) — giống DORA.
    if (!text && attachments.length === 0) {
      return NextResponse.json({ error: "empty message" }, { status: 400 });
    }

    const created = await createOutgoingMessage(conversationId, text, email, attachments);
    return NextResponse.json(created);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/conversations/:id/messages]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
