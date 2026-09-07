"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Pencil, Check, X } from "lucide-react";
import { useOrderStatuses } from "@/lib/hooks/useSheets";
import type { OrderStatusDTO } from "@/lib/types/order-status";

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-border"
      style={{ backgroundColor: color || "transparent" }}
      title={color}
    />
  );
}

const isHex = (c: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c.trim());
const PRESET_COLORS = [
  "#3498db",
  "#2ecc71",
  "#f1c40f",
  "#f5a623",
  "#e67e22",
  "#e74c3c",
  "#9b59b6",
  "#91917f",
];

/** Ô chọn màu: bảng màu (native picker) + preset bấm nhanh + gõ tay (tên màu/hex). */
function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 rounded-lg bg-secondary px-2 py-1">
        <input
          type="color"
          aria-label="Chọn màu"
          value={isHex(value) ? value : "#cccccc"}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Màu (vd green, #f5a623)"
          className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
        />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            title={c}
            aria-label={`Chọn ${c}`}
            className={
              "h-5 w-5 rounded-full border transition-transform hover:scale-110 " +
              (value.trim().toLowerCase() === c ? "border-foreground" : "border-border")
            }
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

function StatusRow({ s }: { s: OrderStatusDTO }) {
  const { update, remove } = useOrderStatuses();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(s.name);
  const [color, setColor] = useState(s.color);
  const [description, setDescription] = useState(s.description);

  const save = async () => {
    if (!name.trim()) return;
    await update.mutateAsync({ id: s.id, patch: { name: name.trim(), color, description } });
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="flex flex-col gap-2 px-3 py-2.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên trạng thái"
          className="rounded-lg border-0 bg-secondary px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <ColorField value={color} onChange={setColor} />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả"
          className="rounded-lg border-0 bg-secondary px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={update.isPending}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:bg-input-strong"
          >
            {update.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Lưu
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
            Huỷ
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2.5 px-3 py-2.5">
      <Swatch color={s.color} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">{s.name}</div>
        {s.description ? (
          <div className="truncate text-xs text-muted-foreground">{s.description}</div>
        ) : null}
      </div>
      <button
        onClick={() => {
          setName(s.name);
          setColor(s.color);
          setDescription(s.description);
          setEditing(true);
        }}
        aria-label="Sửa"
        className="shrink-0 text-muted-foreground hover:text-primary"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={() => {
          if (confirm(`Xoá trạng thái "${s.name}"?`)) remove.mutate(s.id);
        }}
        aria-label="Xoá"
        className="shrink-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

export function OrderStatusManager() {
  const { statuses, query, add } = useOrderStatuses();
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Nhập tên trạng thái.");
      return;
    }
    try {
      await add.mutateAsync({ name: name.trim(), color: color.trim(), description: description.trim() });
      setName("");
      setColor("");
      setDescription("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    }
  };

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-base font-semibold text-foreground">Trạng thái đơn</h2>

      <div className="mb-4 rounded-2xl border border-border p-4">
        <div className="flex flex-col gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên trạng thái (vd CONFIRMED)"
            className="rounded-lg border-0 bg-secondary px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <ColorField value={color} onChange={setColor} />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả (tuỳ chọn)"
            className="w-full rounded-lg border-0 bg-secondary px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <button
          onClick={submit}
          disabled={add.isPending}
          className="mt-3 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:bg-input-strong"
        >
          {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Thêm trạng thái
        </button>
      </div>

      {query.isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Đang tải…</p>
      ) : statuses.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Chưa có trạng thái nào.</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {statuses.map((s) => (
            <StatusRow key={s.id} s={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
