import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
            <MessagesSquare className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">EtsyChat</h1>
          <p className="text-center text-sm text-muted-foreground">
            Đăng nhập để tiếp tục nhắn tin
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <Button type="submit" className="w-full" size="lg">
            <GoogleIcon className="h-4 w-4" />
            Đăng nhập với Google
          </Button>
        </form>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M21.8 10.2H12v3.9h5.6c-.8 2.3-3 4-5.6 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.5 0 2.9.6 4 1.5l2.8-2.8C16.9 3 14.6 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.5 0 9.8-4 9.8-10 0-.6-.1-1.2-.2-1.8z"
      />
      <path
        fill="#FF3D00"
        d="M3.2 7.3l3.2 2.4C7.4 7.7 9.5 6.1 12 6.1c1.5 0 2.9.6 4 1.5l2.8-2.8C16.9 3 14.6 2 12 2 8.2 2 5 4.1 3.2 7.3z"
      />
      <path
        fill="#4CAF50"
        d="M12 22c2.5 0 4.8-.9 6.5-2.5l-3-2.5c-1 .7-2.2 1.1-3.5 1.1-2.6 0-4.8-1.7-5.6-4l-3.1 2.4C5 19.9 8.2 22 12 22z"
      />
      <path
        fill="#1976D2"
        d="M21.8 10.2H12v3.9h5.6c-.4 1.1-1.1 2.1-2.1 2.8l3 2.5c1.8-1.7 3-4.1 3-7.4 0-.6-.1-1.2-.2-1.8z"
      />
    </svg>
  );
}
