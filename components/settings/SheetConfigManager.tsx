"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import {
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useGoogleStatus, useSheetConfigs, ApiError } from "@/lib/hooks/useSheets";
import type { SheetConfigDTO } from "@/lib/types/sheets";

function fmtTime(sec: number | null): string {
  if (!sec) return "chưa đồng bộ";
  return new Date(sec * 1000).toLocaleString("vi-VN");
}

function GoogleCard() {
  const { data, isLoading } = useGoogleStatus();
  const connected = data?.connected && data?.scopeOk;

  return (
    <div className="mb-6 rounded-2xl border border-border p-4">
      <div className="flex items-center gap-3">
        {connected ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success-foreground" />
        ) : (
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {isLoading
              ? "Đang kiểm tra kết nối Google…"
              : connected
                ? `Đã kết nối Google Sheets${data?.email ? ` (${data.email})` : ""}`
                : "Chưa cấp quyền Google Sheets"}
          </p>
          {!connected && !isLoading ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Cần cấp quyền đọc/ghi Google Sheets để dùng tính năng cập nhật đơn.
            </p>
          ) : null}
        </div>
        {!connected && !isLoading ? (
          <button
            onClick={() => signIn("google", { redirectTo: "/settings" })}
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Kết nối Google Sheets
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ConfigRow({ cfg }: { cfg: SheetConfigDTO }) {
  const { update, remove, sync } = useSheetConfigs();

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-foreground">{cfg.title}</span>
          <a
            href={cfg.spreadsheetUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-muted-foreground hover:text-primary"
            aria-label="Mở Google Sheet"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="truncate text-xs text-muted-foreground">
          Tab: {cfg.dataTabName} · {cfg.rowCount} dòng · {fmtTime(cfg.lastSyncedAt)}
        </div>
        {cfg.shopNames.length > 0 ? (
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            Store: {cfg.shopNames.join(", ")}
          </div>
        ) : null}
        {cfg.lastSyncError ? (
          <div className="mt-0.5 truncate text-xs text-destructive">Lỗi: {cfg.lastSyncError}</div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => sync.mutate(cfg.id)}
          disabled={sync.isPending}
          className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          {sync.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Đồng bộ
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={cfg.enabled}
          aria-label={cfg.enabled ? "Tắt" : "Bật"}
          onClick={() => update.mutate({ id: cfg.id, patch: { enabled: !cfg.enabled } })}
          className={
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors " +
            (cfg.enabled ? "bg-success-foreground" : "bg-border")
          }
        >
          <span
            className={
              "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform " +
              (cfg.enabled ? "translate-x-[22px]" : "translate-x-[2px]")
            }
          />
        </button>
        <button
          onClick={() => {
            if (confirm(`Xoá kết nối "${cfg.title}"?`)) remove.mutate(cfg.id);
          }}
          aria-label="Xoá"
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

export function SheetConfigManager() {
  const { configs, query, add } = useSheetConfigs();
  const [url, setUrl] = useState("");
  const [dataTabName, setDataTabName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!url.trim()) {
      setError("Nhập URL Google Sheet.");
      return;
    }
    try {
      await add.mutateAsync({
        url: url.trim(),
        dataTabName: dataTabName.trim() || undefined,
      });
      setUrl("");
      setDataTabName("");
    } catch (err) {
      if (err instanceof ApiError && err.code === "google_not_connected") {
        setError("Chưa kết nối Google Sheets — bấm 'Kết nối Google Sheets' phía trên.");
      } else {
        setError(err instanceof Error ? err.message : "Lỗi không xác định");
      }
    }
  };

  return (
    <div>
      <GoogleCard />

      <h2 className="mb-3 text-base font-semibold text-foreground">Sheet đã kết nối</h2>

      {/* Form thêm */}
      <div className="mb-6 rounded-2xl border border-border p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Dán URL Google Sheet…"
            className="rounded-xl border-0 bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={dataTabName}
            onChange={(e) => setDataTabName(e.target.value)}
            placeholder="Tab dữ liệu (mặc định: Order)"
            className="rounded-xl border-0 bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <button
          onClick={submit}
          disabled={add.isPending}
          className="mt-3 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:bg-input-strong"
        >
          {add.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Thêm sheet
        </button>
      </div>

      {/* Danh sách */}
      {query.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Đang tải…</p>
      ) : configs.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Chưa kết nối sheet nào.</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {configs.map((cfg) => (
            <ConfigRow key={cfg.id} cfg={cfg} />
          ))}
        </ul>
      )}
    </div>
  );
}
