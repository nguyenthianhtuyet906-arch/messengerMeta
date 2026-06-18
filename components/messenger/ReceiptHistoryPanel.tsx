"use client";

import { useState } from "react";
import { X, Package, ChevronDown } from "lucide-react";
import { useConversationDetail } from "@/lib/hooks/useConversationDetail";
import type { ReceiptHistoryItem } from "@/lib/types/etsy";

function ReceiptCard({ r }: { r: ReceiptHistoryItem }) {
  // Mặc định mở sẵn để nhìn đủ sản phẩm.
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-[#dee3e9]">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-start gap-2 p-3 text-left"
      >
        <ChevronDown
          className={
            "mt-0.5 h-4 w-4 shrink-0 text-[#5d6c7b] transition-transform " +
            (open ? "" : "-rotate-90")
          }
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-[#5d6c7b]">{r.date || "—"}</p>
              {r.receiptId ? (
                <p
                  onClick={(e) => e.stopPropagation()}
                  className="cursor-text select-text text-xs text-[#9aa6b2]"
                >
                  #{r.receiptId}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 text-sm font-bold text-[#0a1317]">{r.value || "—"}</span>
          </div>
        </div>
      </div>

      {open ? (
        <div className="flex flex-col gap-2 px-3 pb-3">
          {r.transactions.map((t) => (
            <div key={t.transactionId} className="flex items-start gap-2">
              {t.image ? (
                <img
                  src={t.image}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f1f4f7] text-[#9aa6b2]">
                  <Package className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="break-words text-xs text-[#0a1317]">{t.title || "—"}</p>
                <p className="text-xs text-[#5d6c7b]">
                  {t.quantity} × {t.value}
                </p>
                <p className="cursor-text select-text break-all text-xs text-[#9aa6b2]">
                  #{r.receiptId}-{t.transactionId}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ReceiptHistoryPanel({
  conversationId,
  onClose,
}: {
  conversationId: number;
  onClose?: () => void;
}) {
  const { data, isLoading, isError } = useConversationDetail(conversationId);
  const receipts = data?.receiptHistory ?? [];

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-[#dee3e9] bg-white lg:flex">
      <header className="flex shrink-0 items-center justify-between border-b border-[#dee3e9] px-4 py-3">
        <h3 className="font-bold text-[#0a1317]">Lịch sử đơn hàng</h3>
        {onClose ? (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5d6c7b] transition-colors hover:bg-[#f1f4f7]"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <p className="px-1 py-4 text-sm text-[#5d6c7b]">Đang tải…</p>
        ) : isError ? (
          <p className="px-1 py-4 text-sm text-[#c41e3a]">Không tải được lịch sử đơn hàng.</p>
        ) : receipts.length === 0 ? (
          <p className="px-1 py-4 text-sm text-[#5d6c7b]">Khách chưa có đơn hàng.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {receipts.map((r) => (
              <ReceiptCard key={r.receiptId} r={r} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
