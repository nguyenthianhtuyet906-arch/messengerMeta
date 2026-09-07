"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  loading?: boolean;
  tools?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** Khung card chung cho mỗi panel dashboard (tiêu đề + tools + nội dung). */
export function PanelCard({ title, subtitle, loading, tools, className, children }: Props) {
  return (
    <section
      className={cn(
        "relative flex flex-col rounded-3xl border border-border bg-card p-6",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {tools}
        </div>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

/** 1 thẻ số liệu nhỏ (Total/Unread/Completed). */
export function StatCard({
  value,
  label,
  tone = "neutral",
  children,
}: {
  value: number | string;
  label: string;
  tone?: "neutral" | "danger" | "success";
  children?: React.ReactNode;
}) {
  const valueColor =
    tone === "danger" ? "text-destructive" : tone === "success" ? "text-success" : "text-foreground";
  const border =
    tone === "danger"
      ? "border-destructive-soft"
      : tone === "success"
        ? "border-success-soft"
        : "border-border";
  return (
    <div className={cn("flex flex-col rounded-2xl border bg-card p-4", border)}>
      <span className={cn("text-3xl font-medium tracking-tight", valueColor)}>{value}</span>
      <span className="mt-1 text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
