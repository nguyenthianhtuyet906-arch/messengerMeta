"use client";

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Send, Info, StickyNote, Paperclip, X, Loader2, Sparkles } from "lucide-react";
import { MessageList } from "@/components/messenger/MessageList";
import { useSendMessage } from "@/lib/hooks/useSendMessage";
import type { TabMeta } from "@/lib/store/tabs";
import type { AIResponse } from "@/lib/types/etsy";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";

export function ConversationView({
  conversationId,
  meta,
  infoOpen = false,
  onToggleInfo,
  notesOpen = false,
  onToggleNotes,
}: {
  conversationId: number;
  meta?: TabMeta;
  infoOpen?: boolean;
  onToggleInfo?: () => void;
  notesOpen?: boolean;
  onToggleNotes?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pending, send } = useSendMessage(conversationId);
  const name = meta?.name || `#${conversationId}`;

  const submit = () => {
    const text = draft.trim();
    if (!text && attachments.length === 0) return;
    if (uploading) return;
    send(text, attachments);
    setDraft("");
    setAttachments([]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onPickFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;
    setUploading(true);
    try {
      const form = new FormData();
      for (const f of files) form.append("files", f);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = (await res.json()) as { urls?: string[]; error?: string };
      if (!res.ok || !data.urls) {
        alert(`Tải ảnh thất bại: ${data.error ?? res.status}`);
        return;
      }
      setAttachments((prev) => [...prev, ...data.urls!]);
    } catch (err) {
      alert(`Tải ảnh thất bại: ${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (url: string) =>
    setAttachments((prev) => prev.filter((u) => u !== url));

  // ---- Gợi ý AI (dùng chính ô chat làm định hướng) ----
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);

  // Nội dung đang gõ trong ô chat = định hướng (input) cho AI; rỗng cũng được.
  const fetchAI = async () => {
    setAiLoading(true);
    try {
      const guide = draft.trim();
      const qs = guide ? `?input=${encodeURIComponent(guide)}` : "";
      const res = await fetch(`/api/conversations/${conversationId}/ai${qs}`);
      const data = (await res.json()) as AIResponse & { error?: string };
      if (!res.ok) {
        alert(`Gợi ý AI thất bại: ${data.error ?? res.status}`);
        return;
      }
      setAiResult(data);
    } catch (err) {
      alert(`Gợi ý AI thất bại: ${(err as Error).message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const toggleAi = () => {
    const next = !aiOpen;
    setAiOpen(next);
    if (next) void fetchAI();
  };

  const useSuggestion = (text: string) => {
    if (text) setDraft(text);
    setAiOpen(false);
  };

  const aiOptions: { key: string; label: string; text: string }[] = aiResult
    ? [
        { key: "agree", label: "Đồng ý", text: aiResult.agree },
        { key: "neutral", label: "Trung lập", text: aiResult.neutral },
        { key: "apologize", label: "Xin lỗi", text: aiResult.apologize },
      ].filter((o) => o.text)
    : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="flex shrink-0 items-center gap-2.5 border-b border-[#dee3e9] px-4 py-3">
        <Avatar className="h-8 w-8">
          {meta?.avatar ? <AvatarImage src={meta.avatar} alt={name} /> : null}
          <AvatarFallback className="bg-[#e7f0fb] text-xs font-bold text-[#0064e0]">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <h2 className="font-bold leading-tight text-[#0a1317]">{name}</h2>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {onToggleNotes ? (
            <button
              onClick={onToggleNotes}
              aria-label="Ghi chú"
              aria-pressed={notesOpen}
              className={
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors " +
                (notesOpen
                  ? "bg-[#e7f0fb] text-[#0064e0]"
                  : "text-[#5d6c7b] hover:bg-[#f1f4f7]")
              }
            >
              <StickyNote className="h-4 w-4" />
            </button>
          ) : null}
          {onToggleInfo ? (
            <button
              onClick={onToggleInfo}
              aria-label="Lịch sử đơn hàng"
              aria-pressed={infoOpen}
              className={
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors " +
                (infoOpen
                  ? "bg-[#e7f0fb] text-[#0064e0]"
                  : "text-[#5d6c7b] hover:bg-[#f1f4f7]")
              }
            >
              <Info className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </header>

      <MessageList conversationId={conversationId} pending={pending} />

      {/* Panel gợi ý AI — bám sát ô chat, dùng nội dung đang gõ làm định hướng */}
      {aiOpen && (
        <div className="shrink-0 border-t border-[#dee3e9] bg-[#faf8ff] px-6 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 font-semibold text-[#8b3df2]">
              <Sparkles className="h-3.5 w-3.5" /> Gợi ý AI
            </span>
            {aiResult?.suggested_tag ? (
              <span className="rounded-full bg-[#f3e8ff] px-2 py-0.5 font-medium text-[#8b3df2]">
                {aiResult.suggested_tag}
              </span>
            ) : null}
            <button
              onClick={fetchAI}
              disabled={aiLoading}
              className="ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-[#8b3df2] hover:bg-[#f3e8ff] disabled:opacity-50"
            >
              {aiLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Tạo lại
            </button>
            <button
              onClick={() => setAiOpen(false)}
              aria-label="Đóng"
              className="flex h-5 w-5 items-center justify-center rounded-full text-[#5d6c7b] hover:bg-[#eee]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {aiLoading && aiOptions.length === 0 ? (
            <p className="mt-2 text-xs text-[#5d6c7b]">Đang tạo gợi ý…</p>
          ) : aiOptions.length > 0 ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {aiOptions.map((o) => (
                <button
                  key={o.key}
                  onClick={() => useSuggestion(o.text)}
                  title="Bấm để đưa vào ô chat"
                  className="rounded-xl border border-[#e6dbfa] bg-white p-2.5 text-left text-sm text-[#0a1317] transition-colors hover:border-[#8b3df2] hover:bg-[#f7f2ff]"
                >
                  <div className="mb-1 text-xs font-semibold text-[#8b3df2]">{o.label}</div>
                  <div className="line-clamp-4 whitespace-pre-wrap break-words">{o.text}</div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Composer */}
      <div className="shrink-0 border-t border-[#dee3e9] px-6 py-4">
        {/* Preview ảnh đã chọn */}
        {(attachments.length > 0 || uploading) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((url) => (
              <div key={url} className="relative h-20 w-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-20 w-20 rounded-lg border border-[#dee3e9] object-cover"
                />
                <button
                  onClick={() => removeAttachment(url)}
                  aria-label="Xoá ảnh"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0a1317] text-white hover:bg-black"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {uploading && (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-[#bcc0c4] text-[#5d6c7b]">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onPickFiles}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Đính kèm ảnh"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#5d6c7b] transition-colors hover:bg-[#f1f4f7] disabled:opacity-50"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Nhập tin nhắn… (Enter để gửi, Shift+Enter xuống dòng)"
            className="max-h-32 flex-1 resize-none rounded-2xl border-0 bg-[#f1f4f7] px-4 py-2.5 text-sm text-[#0a1317] placeholder:text-[#9aa6b2] focus:outline-none focus:ring-2 focus:ring-[#1876f2]"
          />
          <button
            onClick={toggleAi}
            aria-label="Gợi ý AI"
            aria-pressed={aiOpen}
            className={
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors " +
              (aiOpen
                ? "bg-[#f3e8ff] text-[#8b3df2]"
                : "text-[#8b3df2] hover:bg-[#f3e8ff]")
            }
          >
            <Sparkles className="h-5 w-5" />
          </button>
          <button
            onClick={submit}
            disabled={(!draft.trim() && attachments.length === 0) || uploading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0064e0] text-white transition-colors hover:bg-[#0457cb] disabled:bg-[#bcc0c4]"
            aria-label="Gửi tin nhắn"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
