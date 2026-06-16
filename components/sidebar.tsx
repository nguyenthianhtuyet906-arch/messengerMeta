"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, MessageCircle, LogOut, MessagesSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "@/lib/auth-client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/messenger", label: "Messenger", icon: MessageCircle },
]

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Sidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="flex h-full w-16 flex-col items-center border-r border-sidebar-border bg-sidebar py-4 md:w-64 md:items-stretch md:px-3">
      {/* Logo */}
      <div className="flex items-center gap-2 px-0 md:px-2 pb-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <MessagesSquare className="h-5 w-5" />
        </div>
        <span className="hidden text-lg font-bold tracking-tight md:inline">Chatly</span>
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
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
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
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center gap-3 rounded-full py-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:justify-start md:px-4"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="hidden md:inline">Đăng xuất</span>
        </button>
        <div className="flex items-center justify-center gap-3 rounded-full py-2 md:justify-start md:px-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
              {initialsOf(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 flex-col md:flex">
            <span className="truncate text-sm font-bold leading-tight">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground leading-tight">{user.email}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
