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
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#5d6c7b] transition-colors hover:text-[#0a1317]"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        <h1 className="text-2xl font-medium tracking-tight text-[#0a1317]">
          Mở nhiều hội thoại
        </h1>
        <p className="mt-1 text-sm text-[#5d6c7b]">
          {entries.length} hội thoại sẵn sàng. Chọn số lượng muốn mở thành các tab trong Messenger.
        </p>

        {/* Nút mở */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => open(entries.length)}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-[#0064e0] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0457cb] disabled:opacity-40"
          >
            <ExternalLink className="h-4 w-4" />
            Mở tất cả ({entries.length})
          </button>
          {BATCH_SIZES.filter((n) => n < entries.length).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => open(n)}
              className="inline-flex items-center gap-2 rounded-full border border-[#dee3e9] bg-white px-4 py-2.5 text-sm font-bold text-[#0a1317] transition-colors hover:bg-[#f1f4f7]"
            >
              Mở {n}
            </button>
          ))}
          <button
            type="button"
            onClick={cancel}
            className="inline-flex items-center gap-2 rounded-full border border-[#dee3e9] bg-white px-4 py-2.5 text-sm font-bold text-[#5d6c7b] transition-colors hover:bg-[#f1f4f7]"
          >
            <X className="h-4 w-4" />
            Huỷ
          </button>
        </div>

        {/* Danh sách */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-[#dee3e9] bg-white">
          {entries.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-[#5d6c7b]">
              Không có hội thoại nào. Hãy mở lại từ Dashboard.
            </div>
          ) : (
            <ul className="divide-y divide-[#dee3e9]">
              {entries.slice(0, 200).map((e, idx) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 px-6 py-3 text-sm"
                >
                  <span className="w-6 shrink-0 text-xs text-[#5d6c7b]">{idx + 1}</span>
                  <MessageCircle className="h-4 w-4 shrink-0 text-[#0064e0]" />
                  <span className="min-w-0 flex-1 truncate font-bold text-[#0a1317]">
                    {e.name || `Hội thoại ${e.id}`}
                  </span>
                  <span className="shrink-0 text-xs text-[#5d6c7b]">#{e.id}</span>
                </li>
              ))}
            </ul>
          )}
          {entries.length > 200 && (
            <div className="px-6 py-3 text-center text-xs text-[#5d6c7b]">
              + {entries.length - 200} hội thoại khác
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
