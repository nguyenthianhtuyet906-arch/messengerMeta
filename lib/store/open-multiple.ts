/**
 * Luồng "mở nhiều hội thoại" — mở thành các tab TRONG APP (qua openMany của TabsProvider),
 * không mở tab trình duyệt mới.
 *
 * 2 chặng (TabsProvider chỉ bọc /messages nên cần cầu nối qua sessionStorage):
 *  1. Panel dashboard → stage() → điều hướng /open-multiple (màn xác nhận).
 *  2. /open-multiple → setPending() → điều hướng /messages, nơi PendingOpenSync gọi openMany().
 */

/** 1 hội thoại cần mở (kèm meta để hiện tên/avatar trên tab). */
export interface OpenEntry {
  id: number;
  name?: string;
  avatar?: string;
}

const STAGE_KEY = "messenger.openMultiple.v1";
const PENDING_KEY = "messenger.pendingOpen.v1";

function read(key: string): OpenEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((e) => e && Number.isFinite(e.id));
    }
  } catch {
    /* ignore */
  }
  return [];
}

function write(key: string, entries: OpenEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

function remove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Chặng 1: lưu danh sách để màn /open-multiple hiển thị. */
export function stageOpenMultiple(entries: OpenEntry[]): void {
  write(STAGE_KEY, entries);
}
export function readStaged(): OpenEntry[] {
  return read(STAGE_KEY);
}
export function clearStaged(): void {
  remove(STAGE_KEY);
}

/** Chặng 2: lưu danh sách thực sự cần mở để /messages (PendingOpenSync) nhặt. */
export function setPendingOpen(entries: OpenEntry[]): void {
  write(PENDING_KEY, entries);
}
export function readPendingOpen(): OpenEntry[] {
  return read(PENDING_KEY);
}
export function clearPendingOpen(): void {
  remove(PENDING_KEY);
}
