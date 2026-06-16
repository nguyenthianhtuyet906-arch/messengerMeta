import { NextResponse } from "next/server"
import { getMessages, sendMessage } from "@/lib/messages"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params
  const messages = await getMessages(userId)
  return NextResponse.json({ messages })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params
  const body = await req.json().catch(() => null)
  const text = body?.text
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Tin nhắn trống" }, { status: 400 })
  }
  try {
    await sendMessage(userId, text)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: "Không gửi được" }, { status: 401 })
  }
}
