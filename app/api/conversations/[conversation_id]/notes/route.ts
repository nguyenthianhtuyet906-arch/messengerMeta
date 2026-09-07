import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { addNote, getNotes, NoteError } from "@/lib/services/note";

function parseConversationId(raw: string): number | null {
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

// GET /api/conversations/:conversation_id/notes — danh sách ghi chú.
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

    const data = await getNotes(conversationId, email);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/conversations/:id/notes]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/conversations/:conversation_id/notes  body: { body: string }
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

    const payload = (await req.json()) as { body?: string };
    const created = await addNote(conversationId, email, payload.body ?? "");
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof NoteError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/conversations/:id/notes]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
