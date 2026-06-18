"use client";

import { useState, type KeyboardEvent } from "react";
import { X, Plus, Tag } from "lucide-react";
import { useTags } from "@/lib/hooks/useTags";
import { SYSTEM_TAGS, tagClassName, tagLabel } from "@/lib/tags";
import { cn } from "@/lib/utils";

/**
 * Khối quản lý thẻ cấp hội thoại — nhúng trong sidebar (Lịch sử đơn hàng).
 * Bố cục mô phỏng khu tag của DORA ChatSideBar: đã gắn / thẻ hệ thống / nhập tùy ý.
 */
export function TagEditor({ conversationId }: { conversationId: number }) {
  const { tags, isLoading, isError, add, remove } = useTags(conversationId);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const availableSystem = SYSTEM_TAGS.filter((t) => !tags.includes(t.name));

  const submitCustom = () => {
    const name = draft.trim();
    if (!name) {
      setError("Thẻ không được để trống");
      return;
    }
    if (tags.includes(name)) {
      setError("Thẻ đã tồn tại");
      return;
    }
    setError("");
    add.mutate(name, { onSuccess: () => setDraft("") });
  };

  return (
    <section className="rounded-2xl border border-[#dee3e9] p-3">
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#5d6c7b]">
        <Tag className="h-3.5 w-3.5" />
        Thẻ
      </h4>

      {isLoading ? (
        <p className="text-sm text-[#5d6c7b]">Đang tải…</p>
      ) : isError ? (
        <p className="text-sm text-[#c41e3a]">Không tải được thẻ.</p>
      ) : (
        <>
          {/* Đã gắn */}
          {tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    tagClassName(tag),
                  )}
                >
                  {tagLabel(tag)}
                  <button
                    onClick={() => remove.mutate(tag)}
                    aria-label={`Gỡ thẻ ${tagLabel(tag)}`}
                    className="flex h-3.5 w-3.5 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Thẻ hệ thống chưa gắn */}
          {availableSystem.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {availableSystem.map((t) => (
                <button
                  key={t.name}
                  onClick={() => add.mutate(t.name)}
                  disabled={add.isPending}
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium opacity-70 transition-opacity hover:opacity-100 disabled:opacity-40",
                    t.className,
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Nhập thẻ tùy ý */}
          {error ? <p className="mb-1 text-xs text-[#c41e3a]">{error}</p> : null}
          <div className="flex items-center gap-1.5">
            <input
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitCustom();
                }
              }}
              placeholder="Thêm thẻ… (Enter)"
              className="h-8 flex-1 rounded-full border-0 bg-[#f1f4f7] px-3 text-sm text-[#0a1317] placeholder:text-[#9aa6b2] focus:outline-none focus:ring-2 focus:ring-[#1876f2]"
            />
            <button
              onClick={submitCustom}
              disabled={!draft.trim() || add.isPending}
              aria-label="Thêm thẻ"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0064e0] text-white transition-colors hover:bg-[#0457cb] disabled:bg-[#bcc0c4]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
