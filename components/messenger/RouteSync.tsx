"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTabs } from "@/lib/store/tabs";

const BASE = "/messages";

/** Cập nhật URL theo tab đang active (tab đổi → /messages/<id>). */
export function UrlSync() {
  const { activeTabId, isHydrated } = useTabs();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) return;
    const target = activeTabId === null ? BASE : `${BASE}/${activeTabId}`;
    if (pathname !== target) router.replace(target);
  }, [activeTabId, isHydrated, pathname, router]);

  return null;
}

/**
 * Mở/ kích hoạt tab theo conversation_id trên URL (deep-link).
 * CHỈ phản ứng theo `id` (URL) — KHÔNG phụ thuộc activeTabId, tránh loop khi
 * page cũ chưa unmount kịp lúc chuyển route làm nhảy tab qua lại.
 */
export function OpenFromRoute({ id }: { id: number }) {
  const { openTab, isHydrated } = useTabs();

  useEffect(() => {
    if (!isHydrated) return;
    if (Number.isFinite(id)) openTab(id);
  }, [id, isHydrated, openTab]);

  return null;
}
