import Link from "next/link"
import { MessageCircle, Users, Clock, ArrowRight } from "lucide-react"
import { conversations } from "@/lib/chat-data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function DashboardPage() {
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)
  const onlineCount = conversations.filter((c) => c.online).length

  const stats = [
    { label: "Tin nhắn chưa đọc", value: totalUnread, icon: MessageCircle },
    { label: "Đoạn chat", value: conversations.length, icon: Users },
    { label: "Đang hoạt động", value: onlineCount, icon: Clock },
  ]

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-4xl px-6 py-8 md:px-10 md:py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-balance">Chào mừng trở lại, An Tuyết 👋</h1>
          <p className="mt-2 text-muted-foreground">Đây là tổng quan hoạt động trò chuyện của bạn hôm nay.</p>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-3xl border border-border bg-card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-3xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            )
          })}
        </section>

        {/* Recent conversations */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Đoạn chat gần đây</h2>
            <Link
              href="/messenger"
              className="flex items-center gap-1 text-sm font-bold text-primary transition-opacity hover:opacity-80"
            >
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {conversations.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link
                    href="/messenger"
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11">
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
                      <p className="truncate text-sm text-muted-foreground">{c.lastMessage}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                        {c.unread}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
