"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, MessageCircle, X } from "lucide-react";
import {
  clearStaged,
  readStaged,
  setPendingOpen,
  type OpenEntry,
} from "@/lib/store/open-multiple";

const BATCH_SIZES = [5, 10, 15, 20, 30, 50];

export default function OpenMultiplePage() {
  const router = useRouter();
  const [entries, setEntries] = useState<OpenEntry[]>([]);

  useEffect(() => {
    setEntries(readStaged());
  }, []);

  // Mở N hội thoại đầu tiên thành tab trong app: ghi pending rồi sang /messages.
  const open = (count: number) => {
    const slice = entries.slice(0, count);
    if (slice.length === 0) return;
    setPendingOpen(slice);
    clearStaged();
    router.push("/messages");
  };

  const cancel = () => {
    clearStaged();
    router.back();
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10 md:px-12 md:py-14">
        <button
          type="button"
          onClick={cancel}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Mở nhiều hội thoại
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {entries.length} hội thoại sẵn sàng. Chọn số lượng muốn mở thành các tab trong Messenger.
        </p>

        {/* Nút mở */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => open(entries.length)}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            <ExternalLink className="h-4 w-4" />
            Mở tất cả ({entries.length})
          </button>
          {BATCH_SIZES.filter((n) => n < entries.length).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => open(n)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
            >
              Mở {n}
            </button>
          ))}
          <button
            type="button"
            onClick={cancel}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary"
          >
            <X className="h-4 w-4" />
            Huỷ
          </button>
        </div>

        {/* Danh sách */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card">
          {entries.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              Không có hội thoại nào. Hãy mở lại từ Dashboard.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {entries.slice(0, 200).map((e, idx) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 px-6 py-3 text-sm"
                >
                  <span className="w-6 shrink-0 text-xs text-muted-foreground">{idx + 1}</span>
                  <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate font-bold text-foreground">
                    {e.name || `Hội thoại ${e.id}`}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">#{e.id}</span>
                </li>
              ))}
            </ul>
          )}
          {entries.length > 200 && (
            <div className="px-6 py-3 text-center text-xs text-muted-foreground">
              + {entries.length - 200} hội thoại khác
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
