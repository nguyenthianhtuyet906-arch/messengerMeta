"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

/** 1 tin cần gửi trong đợt bulk. */
export interface DispatchItem {
  conversationId: number;
  message: string;
  attachments?: string[];
}

/** Kết quả gửi 1 tin (để ô tô màu xanh/đỏ). */
export type DispatchOutcome = "ok" | "fail";

export interface DispatchState {
  running: boolean;
  /** Tổng số tin trong đợt đang chạy. */
  total: number;
  /** Số tin đã xử lý (thành công + thất bại). */
  done: number;
  ok: number;
  fail: number;
  /** conversationId đang gửi (null khi nghỉ). */
  current: number | null;
}

const IDLE: DispatchState = { running: false, total: 0, done: 0, ok: 0, fail: 0, current: null };

// Khoảng cách giữa 2 tin — chỉ MỘT extension nhận qua Ably nên gửi tuần tự, giãn nhẹ
// để không dồn cục. ~400ms đủ mượt mà không quá chậm cho vài chục tin.
const GAP_MS = 400;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Gửi 1 tin qua API messages. Dùng chung cho gửi lẻ (1 ô) và gửi hàng loạt. */
export async function postMessage(item: DispatchItem): Promise<DispatchOutcome> {
  try {
    const res = await fetch(`/api/conversations/${item.conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: item.message.trim(), attachments: item.attachments ?? [] }),
    });
    if (!res.ok) return "fail";
    const created = (await res.json()) as { status?: string };
    return created.status === "FAILED" ? "fail" : "ok";
  } catch {
    return "fail";
  }
}

/**
 * Gửi hàng loạt TUẦN TỰ có throttle cho Bảng xử lý.
 * Trả về map conversationId → outcome qua callback để ô cập nhật trạng thái,
 * đồng thời báo tiến độ realtime qua `state`.
 */
export function useBoardDispatch() {
  const qc = useQueryClient();
  const [state, setState] = useState<DispatchState>(IDLE);
  const cancelRef = useRef(false);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  /**
   * @param items   danh sách tin cần gửi (đã lọc rỗng ở nơi gọi)
   * @param onResult gọi sau mỗi tin để ô tự xoá draft / đánh dấu lỗi
   */
  const run = useCallback(
    async (
      items: DispatchItem[],
      onResult: (conversationId: number, outcome: DispatchOutcome) => void,
    ): Promise<void> => {
      if (items.length === 0) return;
      cancelRef.current = false;
      setState({ running: true, total: items.length, done: 0, ok: 0, fail: 0, current: null });

      for (let i = 0; i < items.length; i++) {
        if (cancelRef.current) break;
        const item = items[i];
        setState((s) => ({ ...s, current: item.conversationId }));

        const outcome = await postMessage(item);

        onResult(item.conversationId, outcome);
        setState((s) => ({
          ...s,
          done: s.done + 1,
          ok: s.ok + (outcome === "ok" ? 1 : 0),
          fail: s.fail + (outcome === "fail" ? 1 : 0),
        }));

        if (i < items.length - 1) await sleep(GAP_MS);
      }

      setState((s) => ({ ...s, running: false, current: null }));
      // Đồng bộ lại danh sách + tin nhắn từng hội thoại sau đợt gửi.
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["messages"] });
    },
    [qc],
  );

  const reset = useCallback(() => setState(IDLE), []);

  return { state, run, cancel, reset };
}
