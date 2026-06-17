"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface TabMeta {
  name: string;
  avatar: string;
}

interface TabsState {
  openTabs: number[];
  activeTabId: number | null;
  meta: Record<number, TabMeta>;
  openTab: (id: number, meta?: TabMeta) => void;
  closeTab: (id: number) => void;
  setActive: (id: number) => void;
}

const TabsContext = createContext<TabsState | null>(null);
const STORAGE_KEY = "messenger.tabs.v1";

interface Persisted {
  openTabs: number[];
  activeTabId: number | null;
  meta: Record<number, TabMeta>;
}

export function TabsProvider({ children }: { children: React.ReactNode }) {
  const [openTabs, setOpenTabs] = useState<number[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [meta, setMeta] = useState<Record<number, TabMeta>>({});
  const hydrated = useRef(false);

  // Khôi phục tab từ localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Persisted;
        setOpenTabs(p.openTabs ?? []);
        setActiveTabId(p.activeTabId ?? null);
        setMeta(p.meta ?? {});
      }
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, []);

  // Persist mỗi khi thay đổi (sau hydrate).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ openTabs, activeTabId, meta } satisfies Persisted),
      );
    } catch {
      /* ignore */
    }
  }, [openTabs, activeTabId, meta]);

  const openTab = useCallback((id: number, m?: TabMeta) => {
    setOpenTabs((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveTabId(id);
    if (m) setMeta((prev) => ({ ...prev, [id]: m }));
  }, []);

  const closeTab = useCallback((id: number) => {
    setOpenTabs((prev) => {
      const idx = prev.indexOf(id);
      const next = prev.filter((t) => t !== id);
      setActiveTabId((cur) => {
        if (cur !== id) return cur;
        if (next.length === 0) return null;
        // Active sang tab kế bên.
        return next[Math.min(idx, next.length - 1)];
      });
      return next;
    });
  }, []);

  const setActive = useCallback((id: number) => setActiveTabId(id), []);

  const value = useMemo<TabsState>(
    () => ({ openTabs, activeTabId, meta, openTab, closeTab, setActive }),
    [openTabs, activeTabId, meta, openTab, closeTab, setActive],
  );

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

export function useTabs(): TabsState {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("useTabs must be used within TabsProvider");
  return ctx;
}
