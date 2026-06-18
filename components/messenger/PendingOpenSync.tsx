"use client";

import { useEffect } from "react";
import { useTabs } from "@/lib/store/tabs";
import { clearPendingOpen, readPendingOpen } from "@/lib/store/open-multiple";

/**
 * Cầu nối "mở nhiều hội thoại": sau khi tab đã hydrate, nhặt danh sách pending
 * (do màn /open-multiple ghi) và mở thành nhiều tab trong app qua openMany.
 * Xoá key ngay sau khi mở để tránh mở lại khi reload /messages.
 */
export function PendingOpenSync() {
  const { openMany, isHydrated } = useTabs();

  useEffect(() => {
    if (!isHydrated) return;
    const pending = readPendingOpen();
    if (pending.length === 0) return;
    openMany(
      pending.map((e) => ({
        id: e.id,
        meta: e.name || e.avatar ? { name: e.name ?? "", avatar: e.avatar ?? "" } : undefined,
      })),
    );
    clearPendingOpen();
  }, [isHydrated, openMany]);

  return null;
}
