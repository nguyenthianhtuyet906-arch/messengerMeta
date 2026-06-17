"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, LogOut, MessageCircle, Settings, MessagesSquare } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/messenger", label: "Messenger", icon: MessageCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  if (pathname === "/login") return null

  const user = session?.user
  const displayName = user?.name ?? "Khách"
  const initials = (user?.name ?? "?")
    .split(" ")
    .map((s) => s[0])
    .slice(-2)
    .join("")
    .toUpperCase()

  return (
    <aside className="flex h-full w-16 flex-col items-center border-r border-sidebar-border bg-sidebar py-5 md:w-64 md:items-stretch md:px-4">
      {/* Logo */}
      <div className="flex items-center gap-2 px-0 md:px-2 pb-8">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0064e0] text-white">
          <MessagesSquare className="h-5 w-5" />
        </div>
        <span className="hidden text-lg font-bold tracking-tight md:inline">EtsyChat</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center gap-3 rounded-full px-0 py-3 text-sm font-bold transition-colors md:justify-start md:px-4",
                active
                  ? "bg-[#0064e0] text-white"
                  : "text-[#5d6c7b] hover:bg-[#f1f4f7] hover:text-[#0a1317]",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto flex flex-col gap-1 pt-4">
        <Link
          href="#"
          className="flex items-center justify-center gap-3 rounded-full py-3 text-sm font-bold text-[#5d6c7b] transition-colors hover:bg-[#f1f4f7] hover:text-[#0a1317] md:justify-start md:px-4"
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className="hidden md:inline">Cài đặt</span>
        </Link>
        <div className="flex items-center justify-center gap-3 rounded-full py-2 md:justify-start md:px-2">
          <Avatar className="h-9 w-9">
            {user?.image ? (
              <AvatarImage src={user.image} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col md:flex">
            <span className="text-sm font-bold leading-tight">{displayName}</span>
            <span className="text-xs text-muted-foreground leading-tight">
              {user ? "Đang hoạt động" : "Chưa đăng nhập"}
            </span>
          </div>
        </div>
        {user ? (
          <button
            type="button"
            onClick={() => signOut({ redirectTo: "/login" })}
            className="flex items-center justify-center gap-3 rounded-full py-3 text-sm font-bold text-[#5d6c7b] transition-colors hover:bg-[#f1f4f7] hover:text-[#0a1317] md:justify-start md:px-4"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="hidden md:inline">Đăng xuất</span>
          </button>
        ) : null}
      </div>
    </aside>
  )
}
