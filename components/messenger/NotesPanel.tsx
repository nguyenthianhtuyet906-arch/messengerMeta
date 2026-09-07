"use client";

import { useState, type KeyboardEvent } from "react";
import { X, Pencil, Trash2, Check, Send } from "lucide-react";
import { useNotes } from "@/lib/hooks/useNotes";
import type { NoteItem } from "@/lib/types/etsy";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, timeAgo } from "@/lib/format";

function NoteCard({
  note,
  onEdit,
  onDelete,
}: {
  note: NoteItem;
  onEdit: (noteId: string, body: string) => void;
  onDelete: (noteId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.body);

  const save = () => {
    const text = draft.trim();
    if (!text || text === note.body) {
      setEditing(false);
      setDraft(note.body);
      return;
    }
    onEdit(note.id, text);
    setEditing(false);
  };

  return (
    <div className="rounded-2xl border border-border p-3">
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7 shrink-0">
          {note.authorAvatar ? (
            <AvatarImage src={note.authorAvatar} alt={note.authorName} />
          ) : null}
          <AvatarFallback className="bg-accent text-[10px] font-bold text-primary">
            {initials(note.authorName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-foreground">{note.authorName}</p>
          <p className="text-[11px] text-muted-foreground">
            {timeAgo(note.createdAt)}
            {note.updatedAt > note.createdAt ? " · đã sửa" : ""}
          </p>
        </div>
        {note.mine && !editing ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => {
                setDraft(note.body);
                setEditing(true);
              }}
              aria-label="Sửa ghi chú"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                if (confirm("Xoá ghi chú này?")) onDelete(note.id);
              }}
              aria-label="Xoá ghi chú"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-2 flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                save();
              }
              if (e.key === "Escape") {
                setEditing(false);
                setDraft(note.body);
              }
            }}
            rows={2}
            autoFocus
            className="max-h-32 flex-1 resize-none rounded-xl border-0 bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={save}
            aria-label="Lưu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90"
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">
          {note.body}
        </p>
      )}
    </div>
  );
}

export function NotesPanel({
  conversationId,
  onClose,
}: {
  conversationId: number;
  onClose?: () => void;
}) {
  const { notes, isLoading, isError, add, edit, remove } = useNotes(conversationId);
  const [draft, setDraft] = useState("");

  const submit = () => {
    const text = draft.trim();
    if (!text || add.isPending) return;
    add.mutate(text, { onSuccess: () => setDraft("") });
  };

  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-card">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-bold text-foreground">Ghi chú</h3>
        {onClose ? (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <p className="px-1 py-4 text-sm text-muted-foreground">Đang tải…</p>
        ) : isError ? (
          <p className="px-1 py-4 text-sm text-destructive">Không tải được ghi chú.</p>
        ) : notes.length === 0 ? (
          <p className="px-1 py-4 text-sm text-muted-foreground">Chưa có ghi chú nào.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {notes.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onEdit={(noteId, body) => edit.mutate({ noteId, body })}
                onDelete={(noteId) => remove.mutate(noteId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Composer thêm ghi chú — đồng bộ kích thước với khung nhập tin nhắn */}
      <div className="flex shrink-0 items-end gap-2 border-t border-border px-4 py-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Thêm ghi chú… (Enter để lưu)"
          className="max-h-32 flex-1 resize-none rounded-2xl border-0 bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={submit}
          disabled={!draft.trim() || add.isPending}
          aria-label="Thêm ghi chú"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90 disabled:bg-input-strong"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}
