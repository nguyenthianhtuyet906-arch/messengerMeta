"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { MessageTemplate } from "@/lib/types/etsy";

type Scope = "mine" | "all";

async function fetchTemplates(scope: Scope, q: string): Promise<MessageTemplate[]> {
  const params = new URLSearchParams({ scope });
  if (q) params.set("q", q);
  const res = await fetch(`/api/message-templates?${params}`);
  if (!res.ok) throw new Error(`templates ${res.status}`);
  const data = (await res.json()) as { items: MessageTemplate[] };
  return data.items;
}

async function postTemplate(title: string, content: string): Promise<MessageTemplate> {
  const res = await fetch("/api/message-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) throw new Error(`create template ${res.status}`);
  const data = (await res.json()) as { item: MessageTemplate };
  return data.item;
}

async function putTemplate(id: string, title: string, content: string): Promise<void> {
  const res = await fetch(`/api/message-templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) throw new Error(`update template ${res.status}`);
}

async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/message-templates/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`delete template ${res.status}`);
}

export function useMessageTemplates() {
  const qc = useQueryClient();
  const [scope, setScope] = useState<Scope>("mine");
  const [search, setSearch] = useState("");

  const key = ["message-templates", scope, search];

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchTemplates(scope, search),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["message-templates"] });

  const create = useMutation({
    mutationFn: ({ title, content }: { title: string; content: string }) =>
      postTemplate(title, content),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, title, content }: { id: string; title: string; content: string }) =>
      putTemplate(id, title, content),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: invalidate,
  });

  return {
    templates: query.data ?? [],
    isLoading: query.isLoading,
    scope,
    setScope,
    search,
    setSearch,
    create,
    update,
    remove,
  };
}
