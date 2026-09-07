import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  deleteAutoReply,
  getAutoReply,
  hasConflictingTrigger,
  updateAutoReply,
} from "@/lib/services/auto-reply";

async function requireAuth() {
  const session = await auth();
  return session?.user?.email ?? null;
}

// GET /api/auto-replies/:id
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const item = await getAutoReply(id);
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ item });
}

// PUT /api/auto-replies/:id  body: { trigger?, reply?, enabled? }
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      trigger?: string;
      reply?: string;
      enabled?: boolean;
    };
    if (body.trigger !== undefined && (await hasConflictingTrigger(body.trigger, id))) {
      return NextResponse.json({ error: "trigger đã tồn tại" }, { status: 409 });
    }
    const ok = await updateAutoReply(id, body);
    if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[PUT /api/auto-replies/:id]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/auto-replies/:id
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const ok = await deleteAutoReply(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
