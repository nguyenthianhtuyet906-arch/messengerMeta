"use client";

import { useRef, useState, useEffect, type ChangeEvent, type KeyboardEvent } from "react";
import { useSession } from "next-auth/react";
import { Search, Plus, ArrowLeft, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { useMessageTemplates } from "@/lib/hooks/useMessageTemplates";
import type { MessageTemplate } from "@/lib/types/etsy";

type View = "list" | "form";

export function TemplatePicker({
  onSelect,
  onClose,
}: {
  onSelect: (content: string) => void;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const myEmail = session?.user?.email ?? "";

  const { templates, isLoading, scope, setScope, search, setSearch, create, update, remove } =
    useMessageTemplates();

  const [view, setView] = useState<View>("list");
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);
  const formContentRef = useRef<HTMLTextAreaElement>(null);

  // Focus search khi mở popup
  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  // Auto-resize content textarea trong form
  useEffect(() => {
    const el = formContentRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [formContent]);

  const openCreate = () => {
    setEditing(null);
    setFormTitle("");
    setFormContent("");
    setView("form");
  };

  const openEdit = (t: MessageTemplate) => {
    setEditing(t);
    setFormTitle(t.title);
    setFormContent(t.content);
    setView("form");
  };

  const backToList = () => {
    setView("list");
    setEditing(null);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const saveForm = async () => {
    const title = formTitle.trim();
    const content = formContent.trim();
    if (!title || !content) return;

    if (editing) {
      await update.mutateAsync({ id: editing._id, title, content });
    } else {
      await create.mutateAsync({ title, content });
    }
    backToList();
  };

  const handleDelete = async (t: MessageTemplate) => {
    if (!confirm(`Xoá mẫu câu "${t.title}"?`)) return;
    await remove.mutateAsync(t._id);
  };

  const onFormKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void saveForm();
    }
  };

  const isSaving = create.isPending || update.isPending;

  return (
    <div
      className="absolute bottom-full left-0 mb-2 w-[420px] rounded-xl border border-border bg-card shadow-lg"
      style={{ zIndex: 50 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        {view === "form" ? (
          <button
            onClick={backToList}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <span className="flex-1 text-sm font-semibold text-foreground">
          {view === "form" ? (editing ? "Sửa mẫu câu" : "Thêm mẫu câu") : "Mẫu câu sẵn"}
        </span>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
          aria-label="Đóng"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {view === "list" ? (
        <>
          {/* Search */}
          <div className="border-b border-border px-3 py-2">
            <div className="flex items-center gap-2 rounded-lg bg-secondary px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder="Tìm kiếm..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {search ? (
                <button onClick={() => setSearch("")} className="shrink-0 text-muted-foreground hover:text-muted-foreground">
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Scope tabs */}
          <div className="flex gap-1 border-b border-border px-3 py-1.5">
            {(["mine", "all"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={
                  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors " +
                  (scope === s
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-secondary")
                }
              >
                {s === "mine" ? "Của tôi" : "Tất cả"}
              </button>
            ))}
          </div>

          {/* Template list */}
          <div className="max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="px-3 py-5 text-center text-xs text-muted-foreground">
                {search ? "Không tìm thấy mẫu câu nào" : "Chưa có mẫu câu nào"}
              </div>
            ) : (
              templates.map((t) => (
                <div
                  key={t._id}
                  className="group flex cursor-pointer items-start gap-2 px-3 py-2.5 hover:bg-secondary"
                  onClick={() => { onSelect(t.content); onClose(); }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-foreground">{t.title}</div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">{t.content}</div>
                  </div>
                  {t.email === myEmail ? (
                    <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                        aria-label="Sửa"
                        className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-border"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); void handleDelete(t); }}
                        aria-label="Xoá"
                        className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          {/* Add button */}
          <div className="border-t border-border px-3 py-2">
            <button
              onClick={openCreate}
              className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-primary hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm mẫu câu mới
            </button>
          </div>
        </>
      ) : (
        /* Form view */
        <div className="px-3 py-3">
          <div className="mb-2">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Tên mẫu câu</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormTitle(e.target.value)}
              placeholder="Ví dụ: Chào hỏi khách mới"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Nội dung <span className="text-muted-foreground">(Ctrl+Enter để lưu)</span>
            </label>
            <textarea
              ref={formContentRef}
              value={formContent}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormContent(e.target.value)}
              onKeyDown={onFormKeyDown}
              placeholder="Nhập nội dung mẫu câu..."
              rows={3}
              className="w-full resize-none overflow-y-hidden rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={backToList}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary"
            >
              Huỷ
            </button>
            <button
              onClick={() => void saveForm()}
              disabled={!formTitle.trim() || !formContent.trim() || isSaving}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:bg-input-strong"
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Lưu mẫu câu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
