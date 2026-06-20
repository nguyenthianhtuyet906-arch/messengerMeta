"use client"

import { useState } from "react"
import { Search, Send, Phone, Video, Info, Smile } from "lucide-react"
import { conversations as initialConversations, type Conversation, type Message } from "@/lib/chat-data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export function Messenger() {
  const [convos, setConvos] = useState<Conversation[]>(initialConversations)
  const [activeId, setActiveId] = useState<string>(initialConversations[0].id)
  const [draft, setDraft] = useState("")
  const [query, setQuery] = useState("")

  const active = convos.find((c) => c.id === activeId)!

  const filtered = convos.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))

  function sendMessage() {
    const text = draft.trim()
    if (!text) return
    const newMsg: Message = {
      id: `m${Date.now()}`,
      fromMe: true,
      text,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    }
    setConvos((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, messages: [...c.messages, newMsg], lastMessage: text, time: "Vừa xong" } : c,
      ),
    )
    setDraft("")
  }

  return (
    <div className="flex h-full">
      {/* Conversation list */}
      <div className="flex w-full max-w-sm flex-col border-r border-border bg-card md:w-80 lg:w-96">
        <div className="px-5 pt-6 pb-3">
          <h1 className="text-2xl font-medium tracking-tight text-foreground">Đoạn chat</h1>
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm trên EtsyChat"
              className="h-10 rounded-full border-0 bg-secondary pl-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
                      isActive ? "bg-accent" : "hover:bg-secondary",
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-accent text-primary font-bold">{c.initials}</AvatarFallback>
                      </Avatar>
                      {c.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-success" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-bold text-sm text-foreground">{c.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{c.time}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm",
                            c.unread > 0 ? "font-bold text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {c.lastMessage}
                        </span>
                        {c.unread > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
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
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">Không tìm thấy đoạn chat nào.</li>
            )}
          </ul>
        </ScrollArea>
      </div>

      {/* Chat window */}
      <div className="hidden flex-1 flex-col md:flex">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-accent text-primary font-bold">{active.initials}</AvatarFallback>
              </Avatar>
              {active.online && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-success" />
              )}
            </div>
            <div>
              <h2 className="font-bold leading-tight text-foreground">{active.name}</h2>
              <p className="text-xs text-muted-foreground">{active.online ? "Đang hoạt động" : "Hoạt động gần đây"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-primary">
            <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-secondary" aria-label="Gọi thoại">
              <Phone className="h-5 w-5" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-secondary" aria-label="Gọi video">
              <Video className="h-5 w-5" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-secondary" aria-label="Thông tin">
              <Info className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 bg-card px-6 py-5">
          <div className="flex flex-col gap-2">
            {active.messages.map((m) => (
              <div key={m.id} className={cn("flex items-end gap-2", m.fromMe ? "justify-end" : "justify-start")}>
                {!m.fromMe && (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-accent text-primary text-xs font-bold">
                      {active.initials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed",
                    m.fromMe
                      ? "bg-primary text-white"
                      : "bg-secondary text-foreground",
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Composer */}
        <div className="flex items-center gap-2 border-t border-border bg-card px-6 py-4">
          <div className="relative flex-1">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage()
              }}
              placeholder="Aa"
              className="h-11 rounded-full border-0 bg-secondary pr-12 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary transition-colors hover:text-accent-foreground"
              aria-label="Biểu cảm"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={sendMessage}
            disabled={!draft.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90 disabled:bg-input-strong disabled:text-white"
            aria-label="Gửi tin nhắn"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
