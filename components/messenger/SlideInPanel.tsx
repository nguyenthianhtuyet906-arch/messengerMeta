"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Wrapper trượt panel bên phải (mở/đóng mượt).
 * - Mở: mount ngay rồi animate width 0 → 20rem + fade in.
 * - Đóng: animate về 0 rồi mới unmount (sau khi transition kết thúc) → tránh fetch khi đang đóng.
 * Ẩn hẳn trên màn nhỏ (lg:block) giống hành vi panel cũ.
 */
export function SlideInPanel({
  open,
  children,
  widthClass = "w-80",
}: {
  open: boolean;
  children: ReactNode;
  /** Bề rộng panel khi mở (Tailwind width class). Mặc định w-80 (320px). */
  widthClass?: string;
}) {
  // render: có gắn DOM hay không. shown: trạng thái mở (để chạy transition).
  const [render, setRender] = useState(open);
  const [shown, setShown] = useState(open);

  useEffect(() => {
    if (open) {
      setRender(true);
      // Double rAF: đảm bảo trình duyệt đã paint trạng thái w-0 trước khi chuyển sang
      // w-80, nếu không transition sẽ bị bỏ qua (nhảy thẳng tới trạng thái mở).
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setShown(false); // bắt đầu animate đóng; unmount ở onTransitionEnd.
  }, [open]);

  if (!render) return null;

  return (
    <div
      className={cn(
        "hidden h-full shrink-0 overflow-hidden transition-all duration-300 ease-in-out lg:block",
        shown ? `${widthClass} opacity-100` : "w-0 opacity-0",
      )}
      onTransitionEnd={() => {
        if (!open) setRender(false);
      }}
    >
      <div className={cn("h-full", widthClass)}>{children}</div>
    </div>
  );
}
