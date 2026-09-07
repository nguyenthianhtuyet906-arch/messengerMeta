"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NoteItem, NotesResponse } from "@/lib/types/etsy";

async function fetchNotes(conversationId: number): Promise<NotesResponse> {
  const res = await fetch(`/api/conversations/${conversationId}/notes`);
  if (!res.ok) throw new Error(`notes ${res.status}`);
  return res.json();
}

async function postNote(conversationId: number, body: string): Promise<NoteItem> {
  const res = await fetch(`/api/conversations/${conversationId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`add note ${res.status}`);
  return res.json();
}

async function patchNote(
  conversationId: number,
  noteId: string,
  body: string,
): Promise<NoteItem> {
  const res = await fetch(`/api/conversations/${conversationId}/notes/${noteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`edit note ${res.status}`);
  return res.json();
}

async function removeNote(conversationId: number, noteId: string): Promise<void> {
  const res = await fetch(`/api/conversations/${conversationId}/notes/${noteId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`delete note ${res.status}`);
}

export function useNotes(conversationId: number) {
  const qc = useQueryClient();
  const key = ["notes", conversationId];

  // Thêm/xoá note đổi kết quả filter "Has note" → làm mới cả danh sách hội thoại.
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["conversations"] });
  };

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchNotes(conversationId),
  });

  const add = useMutation({
    mutationFn: (body: string) => postNote(conversationId, body),
    onSuccess: invalidate,
  });

  const edit = useMutation({
    mutationFn: ({ noteId, body }: { noteId: string; body: string }) =>
      patchNote(conversationId, noteId, body),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (noteId: string) => removeNote(conversationId, noteId),
    onSuccess: invalidate,
  });

  return {
    notes: query.data?.items ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    add,
    edit,
    remove,
  };
}
