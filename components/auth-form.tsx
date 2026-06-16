"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessagesSquare } from "lucide-react"
import { signIn, signUp } from "@/lib/auth-client"
import { Input } from "@/components/ui/input"

export function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === "register") {
        const { error } = await signUp.email({ name, email, password })
        if (error) {
          setError(error.message ?? "Đăng ký thất bại")
          setLoading(false)
          return
        }
      } else {
        const { error } = await signIn.email({ email, password })
        if (error) {
          setError(error.message ?? "Email hoặc mật khẩu không đúng")
          setLoading(false)
          return
        }
      }
      router.push("/")
      router.refresh()
    } catch {
      setError("Đã có lỗi xảy ra, vui lòng thử lại")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
            <MessagesSquare className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Chatly</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Đăng nhập để tiếp tục trò chuyện" : "Tạo tài khoản mới để bắt đầu"}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-bold">
                  Họ và tên
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Nguyễn Văn A"
                  className="rounded-xl bg-muted"
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-bold">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@example.com"
                className="rounded-xl bg-muted"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-bold">
                Mật khẩu
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Tối thiểu 8 ký tự"
                className="rounded-xl bg-muted"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login")
              setError(null)
            }}
            className="font-bold text-primary hover:underline"
          >
            {mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
          </button>
        </p>
      </div>
    </div>
  )
}
