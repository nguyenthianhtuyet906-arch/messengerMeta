"use client";

import { useSession } from "next-auth/react";
import { useSheetAutoSync } from "@/lib/hooks/useSheets";

/**
 * Bộ đồng bộ Google Sheets tự động — chạy nền 2 phút/lần, không cần người dùng bấm.
 * Mount 1 lần ở Providers cho toàn app. Chỉ chạy khi đã đăng nhập; server lo việc
 * chống đồng bộ trùng giữa nhiều user (xem /api/sheets/sync-stale).
 */
export function SheetAutoSync() {
  const { status } = useSession();
  useSheetAutoSync(status === "authenticated");
  return null;
}
