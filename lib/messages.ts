import "server-only"
import { headers } from "next/headers"
import { getDb } from "@/lib/mongodb"
import { auth } from "@/lib/auth"

export type ChatMessage = {
  id: string
  fromMe: boolean
  text: string
  time: string
  createdAt: number
}

export type ChatConversation = {
  id: string // the other user's id
  name: string
  initials: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatTime(date: Date) {
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return "Hôm qua"
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
}

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

type UserDoc = { id?: string; _id?: unknown; name?: string; email?: string }

export async function getConversations(): Promise<ChatConversation[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const db = await getDb()

  // Better Auth stores users in the "user" collection
  const userDocs = (await db.collection<UserDoc>("user").find({}).toArray()) as UserDoc[]
  const others = userDocs.filter((u) => (u.id ?? String(u._id)) !== user.id)

  const messages = db.collection("messages")

  const result: ChatConversation[] = []
  for (const u of others) {
    const otherId = u.id ?? String(u._id)
    const last = await messages
      .find({
        $or: [
          { senderId: user.id, recipientId: otherId },
          { senderId: otherId, recipientId: user.id },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray()

    const unread = await messages.countDocuments({
      senderId: otherId,
      recipientId: user.id,
      read: false,
    })

    const lastDoc = last[0]
    result.push({
      id: otherId,
      name: u.name ?? u.email ?? "Người dùng",
      initials: initialsOf(u.name ?? u.email ?? "?"),
      lastMessage: lastDoc?.text ?? "Hãy bắt đầu trò chuyện",
      time: lastDoc ? formatTime(new Date(lastDoc.createdAt)) : "",
      unread,
      online: false,
    })
  }

  // Sort: conversations with messages first, by most recent
  return result
}

export async function getMessages(otherId: string): Promise<ChatMessage[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const db = await getDb()
  const messages = db.collection("messages")

  const docs = await messages
    .find({
      $or: [
        { senderId: user.id, recipientId: otherId },
        { senderId: otherId, recipientId: user.id },
      ],
    })
    .sort({ createdAt: 1 })
    .toArray()

  // Mark messages from the other user as read
  await messages.updateMany(
    { senderId: otherId, recipientId: user.id, read: false },
    { $set: { read: true } },
  )

  return docs.map((d) => ({
    id: String(d._id),
    fromMe: d.senderId === user.id,
    text: d.text,
    time: formatTime(new Date(d.createdAt)),
    createdAt: d.createdAt,
  }))
}

export async function sendMessage(recipientId: string, text: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  const trimmed = text.trim()
  if (!trimmed) throw new Error("Empty message")

  const db = await getDb()
  await db.collection("messages").insertOne({
    senderId: user.id,
    recipientId,
    text: trimmed,
    read: false,
    createdAt: Date.now(),
  })
}
