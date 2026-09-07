import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { deleteNote, editNote, NoteError } from "@/lib/services/note";

function parseConversationId(raw: string): number | null {
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

// PATCH /api/conversations/:conversation_id/notes/:note_id  body: { body: string }
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ conversation_id: string; note_id: string }> },
) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { conversation_id, note_id } = await ctx.params;
    const conversationId = parseConversationId(conversation_id);
    if (conversationId === null) {
      return NextResponse.json({ error: "invalid conversation_id" }, { status: 400 });
    }

    const payload = (await req.json()) as { body?: string };
    const updated = await editNote(conversationId, note_id, email, payload.body ?? "");
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof NoteError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[PATCH /api/conversations/:id/notes/:noteId]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/conversations/:conversation_id/notes/:note_id
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ conversation_id: string; note_id: string }> },
) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { conversation_id, note_id } = await ctx.params;
    const conversationId = parseConversationId(conversation_id);
    if (conversationId === null) {
      return NextResponse.json({ error: "invalid conversation_id" }, { status: 400 });
    }

    await deleteNote(conversationId, note_id, email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof NoteError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[DELETE /api/conversations/:id/notes/:noteId]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
