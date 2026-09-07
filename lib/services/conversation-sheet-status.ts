import "server-only";

import type { AnyBulkWriteOperation } from "mongodb";
import { getConversationsCollection, getSheetRowsCollection } from "@/lib/db/collections";
import type { ConversationDoc } from "@/lib/types/etsy";
import { asNumber, getPath, isObject } from "@/lib/services/etsy-utils";

/** Lấy status duy nhất từ sheet_rows cho danh sách receiptIds. */
async function fetchStatusesForReceipts(receiptIds: number[]): Promise<string[]> {
  const rowsColl = await getSheetRowsCollection();
  const rows = await rowsColl
    .find({ receiptKey: { $in: receiptIds.map(String) } }, { projection: { "values.Status": 1 } })
    .toArray();
  const seen = new Set<string>();
  for (const row of rows) {
    const s = row.values?.["Status"];
    if (typeof s === "string" && s.trim()) seen.add(s.trim());
  }
  return [...seen];
}

/** Trích xuất mảng receipt_id từ etsy.buyer_info.receipt_history. */
function extractReceiptIds(etsy: Record<string, unknown>): number[] {
  const rawList = getPath(etsy, "buyer_info.receipt_history");
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((r) => (isObject(r) ? asNumber(r["receipt_id"]) ?? 0 : 0))
    .filter(Boolean);
}

/**
 * Tính lại sheetStatuses cho hội thoại sở hữu receiptId sau khi ghi Status.
 * Gọi từ writeOrderRow khi field "Status" thay đổi.
 */
export async function refreshConversationSheetStatuses(receiptId: number): Promise<void> {
  const convColl = await getConversationsCollection();
  const conv = await convColl.findOne(
    { "etsy.buyer_info.receipt_history.receipt_id": receiptId },
    { projection: { "etsy.conversation_id": 1, "etsy.buyer_info.receipt_history": 1 } },
  );
  if (!conv) return;

  const convId = asNumber(conv.etsy["conversation_id"]);
  if (!convId) return;

  const receiptIds = extractReceiptIds(conv.etsy as Record<string, unknown>);
  if (receiptIds.length === 0) return;

  const statuses = await fetchStatusesForReceipts(receiptIds);
  await convColl.updateOne(
    { "etsy.conversation_id": convId },
    { $set: { sheetStatuses: statuses } },
  );
}

/**
 * Bulk refresh sheetStatuses cho tất cả hội thoại bị ảnh hưởng sau syncSheetNow.
 * 2 query + 1 bulkWrite — không loop theo từng conversation.
 * @param syncedReceiptIds - receiptIds (số nguyên) vừa được sync
 */
export async function bulkRefreshSheetStatuses(syncedReceiptIds: number[]): Promise<void> {
  if (syncedReceiptIds.length === 0) return;

  const convColl = await getConversationsCollection();
  const rowsColl = await getSheetRowsCollection();

  // Tìm tất cả conversations có bất kỳ receiptId nào vừa sync.
  const convs = await convColl
    .find(
      { "etsy.buyer_info.receipt_history.receipt_id": { $in: syncedReceiptIds } },
      { projection: { "etsy.conversation_id": 1, "etsy.buyer_info.receipt_history": 1 } },
    )
    .toArray();
  if (convs.length === 0) return;

  // Gom TẤT CẢ receiptIds của các conversations bị ảnh hưởng.
  const allReceiptIds = new Set<number>();
  const convReceiptMap = new Map<number, number[]>();
  for (const conv of convs) {
    const convId = asNumber(conv.etsy["conversation_id"]);
    if (!convId) continue;
    const ids = extractReceiptIds(conv.etsy as Record<string, unknown>);
    convReceiptMap.set(convId, ids);
    for (const id of ids) allReceiptIds.add(id);
  }
  if (allReceiptIds.size === 0) return;

  // 1 query lấy toàn bộ status của tất cả receipts liên quan.
  const rows = await rowsColl
    .find(
      { receiptKey: { $in: [...allReceiptIds].map(String) } },
      { projection: { receiptKey: 1, "values.Status": 1 } },
    )
    .toArray();

  const receiptToStatuses = new Map<number, Set<string>>();
  for (const row of rows) {
    const rid = Number(row.receiptKey);
    const s = row.values?.["Status"];
    if (typeof s !== "string" || !s.trim()) continue;
    if (!receiptToStatuses.has(rid)) receiptToStatuses.set(rid, new Set());
    receiptToStatuses.get(rid)!.add(s.trim());
  }

  // Bulk update — 1 op/conversation.
  const ops: AnyBulkWriteOperation<ConversationDoc>[] = [];
  for (const [convId, receiptIds] of convReceiptMap) {
    const statuses = new Set<string>();
    for (const rid of receiptIds) {
      const s = receiptToStatuses.get(rid);
      if (s) for (const st of s) statuses.add(st);
    }
    ops.push({
      updateOne: {
        filter: { "etsy.conversation_id": convId },
        update: { $set: { sheetStatuses: [...statuses] } },
      },
    });
  }
  if (ops.length > 0) await convColl.bulkWrite(ops, { ordered: false });
}
