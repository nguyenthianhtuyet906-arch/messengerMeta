"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/messages", label: "Messenger", icon: MessageCircle },
]

const COLLAPSE_KEY = "sidebar.collapsed.v1"

export function Sidebar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Khôi phục trạng thái thu gọn từ localStorage.
  useEffect(() => {
    const saved = localStorage.getItem(COLLAPSE_KEY)
    if (saved !== null) setCollapsed(saved === "1")
    setHydrated(true)
  }, [])

  // Lưu lại mỗi khi đổi (sau hydrate).
  useEffect(() => {
    if (hydrated) localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0")
  }, [collapsed, hydrated])

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login") {
      signOut({ redirectTo: "/login" })
    }
  }, [status, pathname])

  if (pathname === "/login") return null

  const user = session?.user
  const displayName = user?.name ?? "Khách"
  const initials = (user?.name ?? "?")
    .split(" ")
    .map((s) => s[0])
    .slice(-2)
    .join("")
    .toUpperCase()

  // Class chung cho 1 dòng (nav/footer): nút vuông bo góc khi thu gọn, pill đầy đủ khi mở.
  const rowClass = cn(
    "flex items-center text-sm font-bold transition-colors",
    collapsed
      ? "mx-auto h-11 w-11 justify-center rounded-2xl"
      : "w-full justify-start gap-3 rounded-full px-4 py-3",
  )

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar py-5 transition-[width] duration-200",
        collapsed ? "w-20 items-center px-3" : "w-64 items-stretch px-4",
      )}
    >
      {/* Logo + nút thu gọn */}
      <div
        className={cn(
          "pb-8",
          collapsed ? "flex flex-col items-center gap-3" : "flex items-center gap-2 px-2",
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <MessagesSquare className="h-5 w-5" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">EtsyChat</span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            !collapsed && "ml-auto",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                rowClass,
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto flex flex-col gap-1 pt-4">
        <Link
          href="/settings"
          title={collapsed ? "Cài đặt" : undefined}
          className={cn(
            rowClass,
            pathname.startsWith("/settings")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Cài đặt</span>}
        </Link>
        <ThemeToggle collapsed={collapsed} />
        <div
          className={cn(
            "flex items-center gap-3 rounded-full py-2",
            collapsed ? "mx-auto h-11 w-11 justify-center px-0" : "justify-start px-2",
          )}
        >
          <Avatar className="h-9 w-9">
            {user?.image ? (
              <AvatarImage src={user.image} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight">{displayName}</span>
              <span className="text-xs text-muted-foreground leading-tight">
                {user ? "Đang hoạt động" : "Chưa đăng nhập"}
              </span>
            </div>
          )}
        </div>
        {user ? (
          <button
            type="button"
            onClick={() => signOut({ redirectTo: "/login" })}
            title={collapsed ? "Đăng xuất" : undefined}
            className={cn(
              rowClass,
              "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        ) : null}
      </div>
    </aside>
  )
}
