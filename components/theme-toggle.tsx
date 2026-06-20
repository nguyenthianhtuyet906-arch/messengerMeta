"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Tránh hydration mismatch: chỉ phản ánh theme thật sau khi mount.
  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"
  const toggle = () => setTheme(isDark ? "light" : "dark")

  // Thu gọn: chỉ hiện nút icon vuông như các dòng nav khác.
  if (collapsed) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggle}
        title={isDark ? "Chế độ sáng" : "Chế độ tối"}
        aria-label={isDark ? "Chế độ sáng" : "Chế độ tối"}
        className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    )
  }

  // Mở rộng: hàng "Dark Mode" + công tắc gạt.
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggle}
      className="flex w-full items-center justify-between rounded-full px-4 py-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <span className="flex items-center gap-3">
        {isDark ? (
          <Sun className="h-5 w-5 shrink-0" />
        ) : (
          <Moon className="h-5 w-5 shrink-0" />
        )}
        <span>Dark Mode</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          isDark ? "bg-primary" : "bg-input-strong",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            isDark ? "translate-x-[22px]" : "translate-x-[2px]",
          )}
        />
      </span>
    </button>
  )
}
