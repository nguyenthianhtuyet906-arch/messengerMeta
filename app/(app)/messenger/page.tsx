import { Suspense } from "react"
import { Messenger } from "@/components/messenger"

export default function MessengerPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-muted-foreground">Đang tải...</div>}>
      <Messenger />
    </Suspense>
  )
}
