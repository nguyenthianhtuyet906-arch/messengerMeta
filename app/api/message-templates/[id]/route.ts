import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getMessageTemplatesCollection } from "@/lib/db/collections";

async function requireEmail(): Promise<string | null> {
  const session = await auth();
  return session?.user?.email ?? null;
}

// PUT /api/message-templates/:id  body: { title?, content? }
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const email = await requireEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    const { id } = await ctx.params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

    const body = (await req.json()) as { title?: string; content?: string };
    const update: Record<string, unknown> = { updated_at: new Date() };
    if (body.title !== undefined) update.title = body.title.trim();
    if (body.content !== undefined) update.content = body.content.trim();

    const col = await getMessageTemplatesCollection();
    const result = await col.updateOne(
      { _id: new ObjectId(id), email },
      { $set: update },
    );
    if (result.matchedCount === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[PUT /api/message-templates/:id]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/message-templates/:id
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const email = await requireEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    const { id } = await ctx.params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

    const col = await getMessageTemplatesCollection();
    const result = await col.deleteOne({ _id: new ObjectId(id), email });
    if (result.deletedCount === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[DELETE /api/message-templates/:id]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
