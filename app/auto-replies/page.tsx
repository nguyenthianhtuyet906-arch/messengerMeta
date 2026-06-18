"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";

interface Rule {
  _id: string;
  trigger: string;
  reply: string;
  enabled: boolean;
}

export default function AutoRepliesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [trigger, setTrigger] = useState("");
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auto-replies");
      const data = (await res.json()) as { items?: Rule[] };
      setRules(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setError(null);
    if (!trigger.trim() || !reply.trim()) {
      setError("Cần nhập cả trigger và nội dung trả lời.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auto-replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: trigger.trim(), reply: reply.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? `Lỗi ${res.status}`);
        return;
      }
      setTrigger("");
      setReply("");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (r: Rule) => {
    await fetch(`/api/auto-replies/${r._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !r.enabled }),
    });
    setRules((prev) =>
      prev.map((x) => (x._id === r._id ? { ...x, enabled: !x.enabled } : x)),
    );
  };

  const remove = async (id: string) => {
    if (!confirm("Xoá quy tắc này?")) return;
    await fetch(`/api/auto-replies/${id}`, { method: "DELETE" });
    setRules((prev) => prev.filter((x) => x._id !== id));
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/messages"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#5d6c7b] hover:bg-[#f1f4f7]"
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-medium tracking-tight text-[#0a1317]">
          Tự động trả lời
        </h1>
      </div>

      <p className="mb-4 text-sm text-[#5d6c7b]">
        Khi tin nhắn khách khớp <strong>chính xác</strong> một trigger (đã chuẩn hoá: thường
        hoá, bỏ dấu câu), hệ thống tự gửi nội dung trả lời tương ứng. Nhiều trigger ngăn cách
        bằng dấu phẩy.
      </p>

      {/* Form tạo mới */}
      <div className="mb-6 rounded-2xl border border-[#dee3e9] p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            placeholder="Trigger (vd: hello, hi)"
            className="rounded-xl border-0 bg-[#f1f4f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1876f2]"
          />
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Nội dung trả lời"
            className="rounded-xl border-0 bg-[#f1f4f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1876f2]"
          />
        </div>
        {error && <p className="mt-2 text-sm text-[#b42318]">{error}</p>}
        <button
          onClick={create}
          disabled={saving}
          className="mt-3 flex items-center gap-1.5 rounded-full bg-[#0064e0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0457cb] disabled:bg-[#bcc0c4]"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Thêm quy tắc
        </button>
      </div>

      {/* Danh sách */}
      {loading ? (
        <p className="py-8 text-center text-sm text-[#5d6c7b]">Đang tải…</p>
      ) : rules.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#5d6c7b]">Chưa có quy tắc nào.</p>
      ) : (
        <ul className="divide-y divide-[#eef1f4] rounded-2xl border border-[#dee3e9]">
          {rules.map((r) => (
            <li key={r._id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[#0a1317]">
                  {r.trigger}
                </div>
                <div className="truncate text-sm text-[#5d6c7b]">{r.reply}</div>
              </div>
              <button
                onClick={() => toggle(r)}
                className={
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium " +
                  (r.enabled
                    ? "bg-[#e6f4ea] text-[#1a7f37]"
                    : "bg-[#f1f4f7] text-[#5d6c7b]")
                }
              >
                {r.enabled ? "Bật" : "Tắt"}
              </button>
              <button
                onClick={() => remove(r._id)}
                aria-label="Xoá"
                className="shrink-0 text-[#5d6c7b] hover:text-[#b42318]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
