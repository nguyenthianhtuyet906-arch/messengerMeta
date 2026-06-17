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
      <div className="mx-auto max-w-5xl px-6 py-10 md:px-12 md:py-14">
        {/* Stats */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="rounded-3xl border border-[#dee3e9] bg-white p-8 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f0fb] text-[#0064e0]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-6 text-4xl font-medium tracking-tight text-[#0a1317]">{s.value}</p>
                <p className="mt-1 text-sm text-[#5d6c7b]">{s.label}</p>
              </div>
            )
          })}
        </section>

        {/* Recent conversations */}
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-medium tracking-tight text-[#0a1317]">Đoạn chat gần đây</h2>
            <Link
              href="/messenger"
              className="inline-flex items-center gap-2 rounded-full bg-[#0064e0] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0457cb]"
            >
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[#dee3e9] bg-white">
            <ul className="divide-y divide-[#dee3e9]">
              {conversations.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link
                    href="/messenger"
                    className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-[#f1f4f7]"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className="bg-[#e7f0fb] text-[#0064e0] font-bold">{c.initials}</AvatarFallback>
                      </Avatar>
                      {c.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#31a24c]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-bold text-sm text-[#0a1317]">{c.name}</span>
                        <span className="shrink-0 text-xs text-[#5d6c7b]">{c.time}</span>
                      </div>
                      <p className="truncate text-sm text-[#5d6c7b]">{c.lastMessage}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#0064e0] px-1.5 text-xs font-bold text-white">
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
