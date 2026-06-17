"use client";

import { memo } from "react";
import { X } from "lucide-react";
import { useTabs } from "@/lib/store/tabs";
import { cn } from "@/lib/utils";

const Tab = memo(function Tab({
  id,
  label,
  active,
  onActivate,
  onClose,
}: {
  id: number;
  label: string;
  active: boolean;
  onActivate: () => void;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onActivate}
      className={cn(
        "group flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-t-lg border-b-2 px-3 text-sm transition-colors",
        active
          ? "border-[#0064e0] bg-white font-semibold text-[#0a1317]"
          : "border-transparent text-[#5d6c7b] hover:bg-[#f1f4f7]",
      )}
      title={label}
    >
      <span className="max-w-[140px] truncate">{label || `#${id}`}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="flex h-4 w-4 items-center justify-center rounded-full text-[#5d6c7b] opacity-60 hover:bg-[#dee3e9] hover:opacity-100"
        aria-label="Đóng tab"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
});

export function TabBar() {
  const { openTabs, activeTabId, meta, setActive, closeTab } = useTabs();
  if (openTabs.length === 0) return null;

  return (
    <div className="flex items-end gap-1 overflow-x-auto border-b border-[#dee3e9] bg-[#f7f9fb] px-2 pt-1">
      {openTabs.map((id) => (
        <Tab
          key={id}
          id={id}
          label={meta[id]?.name ?? ""}
          active={id === activeTabId}
          onActivate={() => setActive(id)}
          onClose={() => closeTab(id)}
        />
      ))}
    </div>
  );
}
