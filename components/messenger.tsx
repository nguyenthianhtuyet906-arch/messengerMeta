"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import useSWR, { mutate } from "swr"
import { Search, Send, Phone, Video, Info, Smile } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type Conversation = {
  id: string
  name: string
  initials: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
}

type Message = {
  id: string
  fromMe: boolean
  text: string
  time: string
  createdAt: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function Messenger() {
  const searchParams = useSearchParams()
  const initialUser = searchParams.get("u")
  const [activeId, setActiveId] = useState<string | null>(initialUser)
  const [draft, setDraft] = useState("")
  const [query, setQuery] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: convoData } = useSWR<{ conversations: Conversation[] }>(
    "/api/conversations",
    fetcher,
    { refreshInterval: 4000 },
  )
  const convos = convoData?.conversations ?? []

  // Default to first conversation once loaded
  useEffect(() => {
    if (!activeId && convos.length > 0) {
      setActiveId(convos[0].id)
    }
  }, [activeId, convos])

  const { data: msgData } = useSWR<{ messages: Message[] }>(
    activeId ? `/api/messages/${activeId}` : null,
    fetcher,
    { refreshInterval: 3000 },
  )
  const messages = msgData?.messages ?? []

  const active = convos.find((c) => c.id === activeId) ?? null
  const filtered = convos.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages.length, activeId])

  async function sendMessage() {
    const text = draft.trim()
    if (!text || !activeId) return
    setDraft("")
    await fetch(`/api/messages/${activeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
    mutate(`/api/messages/${activeId}`)
    mutate("/api/conversations")
  }

  return (
    <div className="flex h-full">
      {/* Conversation list */}
      <div className="flex w-full max-w-sm flex-col border-r border-border bg-card md:w-80 lg:w-96">
        <div className="px-5 pt-5 pb-3">
          <h1 className="text-2xl font-bold tracking-tight">Đoạn chat</h1>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm trên Chatly"
              className="rounded-full border-0 bg-muted pl-9 focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <ul className="px-2 pb-4">
            {filtered.map((c) => {
              const isActive = c.id === activeId
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                      isActive ? "bg-accent" : "hover:bg-muted",
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{c.initials}</AvatarFallback>
                      </Avatar>
                      {c.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-bold text-sm">{c.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{c.time}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm",
                            c.unread > 0 ? "font-semibold text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {c.lastMessage}
                        </span>
                        {c.unread > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
            {filtered.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                {convos.length === 0 ? "Chưa có người dùng nào khác." : "Không tìm thấy đoạn chat nào."}
              </li>
            )}
          </ul>
        </ScrollArea>
      </div>

      {/* Chat window */}
      <div className="hidden flex-1 flex-col md:flex">
        {active ? (
          <>
            <header className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{active.initials}</AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h2 className="font-bold leading-tight">{active.name}</h2>
                  <p className="text-xs text-muted-foreground">Nhấn để xem thông tin</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-primary">
                <button className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent" aria-label="Gọi thoại">
                  <Phone className="h-5 w-5" />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent" aria-label="Gọi video">
                  <Video className="h-5 w-5" />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent" aria-label="Thông tin">
                  <Info className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-col gap-2">
                {messages.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Chưa có tin nhắn. Hãy gửi lời chào đầu tiên!
                  </p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex items-end gap-2", m.fromMe ? "justify-end" : "justify-start")}>
                    {!m.fromMe && (
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {active.initials}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] rounded-3xl px-4 py-2 text-sm leading-relaxed",
                        m.fromMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-border px-5 py-3">
              <div className="relative flex-1">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage()
                  }}
                  placeholder="Aa"
                  className="rounded-full border-0 bg-muted pr-10 focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-primary transition-colors hover:text-primary/80"
                  aria-label="Biểu cảm"
                >
                  <Smile className="h-5 w-5" />
                </button>
              </div>
              <button
                onClick={sendMessage}
                disabled={!draft.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                aria-label="Gửi tin nhắn"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Chọn một đoạn chat để bắt đầu
          </div>
        )}
      </div>
    </div>
  )
}
