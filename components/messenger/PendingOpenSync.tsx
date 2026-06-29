"use client";

import { useEffect } from "react";
import { useTabs } from "@/lib/store/tabs";
import { clearBatch, readBatch } from "@/lib/store/open-multiple";

/**
 * Cầu nối "mở nhiều hội thoại": khi tab /messages được mở qua "?batch=<token>"
 * (TabsProvider đã ghi token vào sessionStorage lúc hydrate), nhặt đúng đợt hội thoại
 * của token đó rồi mở thành tab trong app qua openMany — cơ chế mở tin nhắn giữ nguyên.
 * Tiêu thụ một lần: xoá handoff + token để reload không mở lại.
 */
export function PendingOpenSync() {
  const { openMany, isHydrated } = useTabs();

  useEffect(() => {
    if (!isHydrated) return;

    let token: string | null = null;
    try {
      token = sessionStorage.getItem("messenger.batchToken");
    } catch {
      /* ignore */
    }
    if (!token) return;

    const entries = readBatch(token);
    clearBatch(token);
    try {
      sessionStorage.removeItem("messenger.batchToken");
    } catch {
      /* ignore */
    }
    if (entries.length === 0) return;

    openMany(
      entries.map((e) => ({
        id: e.id,
        meta:
          e.name || e.avatar ? { name: e.name ?? "", avatar: e.avatar ?? "" } : undefined,
      })),
    );
  }, [isHydrated, openMany]);

  return null;
}
