import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { addTag, getTags, removeTag, TagError } from "@/lib/services/tag";

function parseConversationId(raw: string): number | null {
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

// GET /api/conversations/:conversation_id/tags — danh sách tag.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ conversation_id: string }> },
) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { conversation_id } = await ctx.params;
    const conversationId = parseConversationId(conversation_id);
    if (conversationId === null) {
      return NextResponse.json({ error: "invalid conversation_id" }, { status: 400 });
    }

    const tags = await getTags(conversationId);
    return NextResponse.json({ conversationId, tags });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/conversations/:id/tags]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/conversations/:conversation_id/tags  body: { tag: string }
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
    const conversationId = parseConversationId(conversation_id);
    if (conversationId === null) {
      return NextResponse.json({ error: "invalid conversation_id" }, { status: 400 });
    }

    const payload = (await req.json()) as { tag?: string };
    const tags = await addTag(conversationId, payload.tag ?? "");
    return NextResponse.json({ conversationId, tags });
  } catch (err) {
    if (err instanceof TagError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/conversations/:id/tags]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/conversations/:conversation_id/tags  body: { tag: string }
export async function DELETE(
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
    const conversationId = parseConversationId(conversation_id);
    if (conversationId === null) {
      return NextResponse.json({ error: "invalid conversation_id" }, { status: 400 });
    }

    const payload = (await req.json()) as { tag?: string };
    const tags = await removeTag(conversationId, payload.tag ?? "");
    return NextResponse.json({ conversationId, tags });
  } catch (err) {
    if (err instanceof TagError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[DELETE /api/conversations/:id/tags]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
