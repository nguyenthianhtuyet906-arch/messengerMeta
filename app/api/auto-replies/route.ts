import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  createAutoReply,
  hasConflictingTrigger,
  listAutoReplies,
} from "@/lib/services/auto-reply";

// GET /api/auto-replies — danh sách quy tắc
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const items = await listAutoReplies();
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/auto-replies]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/auto-replies  body: { trigger, reply, enabled? }
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const body = (await req.json()) as {
      trigger?: string;
      reply?: string;
      enabled?: boolean;
    };
    const trigger = (body.trigger ?? "").trim();
    const reply = (body.reply ?? "").trim();
    if (!trigger) {
      return NextResponse.json({ error: "trigger bắt buộc" }, { status: 400 });
    }
    if (!reply) {
      return NextResponse.json({ error: "reply bắt buộc" }, { status: 400 });
    }
    if (await hasConflictingTrigger(trigger)) {
      return NextResponse.json({ error: "trigger đã tồn tại" }, { status: 409 });
    }
    const item = await createAutoReply({ trigger, reply, enabled: body.enabled });
    return NextResponse.json({ item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/auto-replies]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
