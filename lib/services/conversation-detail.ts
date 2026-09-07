import type { WithId } from "mongodb";
import { getConversationsCollection, getPersonalizationFilesCollection } from "@/lib/db/collections";
import type {
  ConversationDoc,
  ConversationDetailResponse,
  PersonalizationFile,
  ReceiptHistoryItem,
  ReceiptTransaction,
} from "@/lib/types/etsy";
import {
  asNumber,
  asString,
  decodeHtmlEntities,
  getPath,
  isObject,
} from "@/lib/services/etsy-utils";

// Lấy receipt_history (field nặng, bị loại khỏi list projection) + tên store để map sheet.
const DETAIL_PROJECTION = {
  "etsy.buyer_info.receipt_history": 1,
  "user_data.shop_name": 1,
} as const;

function mapPersonalizationFile(raw: unknown): PersonalizationFile {
  const f = isObject(raw) ? raw : {};
  return {
    url: asString(f["url"]),
    thumbnailUrl: asString(f["thumbnailUrl"]) || asString(f["thumbnail_url"]),
    filename: asString(f["filename"]),
  };
}

function mapTransaction(raw: unknown): ReceiptTransaction {
  const t = isObject(raw) ? raw : {};
  return {
    transactionId: asNumber(t["transaction_id"]) ?? 0,
    title: decodeHtmlEntities(asString(t["title"])),
    image: asString(t["image"]),
    quantity: asNumber(t["quantity"]) ?? 0,
    value: asString(t["value"]),
    // Ảnh khách upload lưu ở collection riêng `personalization_files`, gắn sau bằng attachPersonalizationFiles.
    personalizationFiles: [],
  };
}

/**
 * Gắn ảnh khách upload ("Your Photo") vào từng transaction theo transaction_id.
 * Đọc từ collection `personalization_files` (key receipt_id) — không phụ thuộc receipt_history.
 */
async function attachPersonalizationFiles(receipts: ReceiptHistoryItem[]): Promise<void> {
  const receiptIds = receipts.map((r) => r.receiptId).filter((id) => id > 0);
  if (receiptIds.length === 0) return;

  const coll = await getPersonalizationFilesCollection();
  const docs = await coll.find({ receipt_id: { $in: receiptIds } }).toArray();

  const byTx = new Map<number, PersonalizationFile[]>();
  for (const d of docs) {
    for (const tx of d.transactions ?? []) {
      const files = (tx.files ?? []).map(mapPersonalizationFile).filter((f) => f.url || f.thumbnailUrl);
      if (files.length > 0) byTx.set(tx.transaction_id, files);
    }
  }

  for (const r of receipts) {
    for (const tx of r.transactions) {
      tx.personalizationFiles = byTx.get(tx.transactionId) ?? [];
    }
  }
}

function mapReceipt(raw: unknown): ReceiptHistoryItem {
  const r = isObject(raw) ? raw : {};
  const rawTx = r["transactions"];
  const transactions = Array.isArray(rawTx) ? rawTx.map(mapTransaction) : [];
  return {
    receiptId: asNumber(r["receipt_id"]) ?? 0,
    date: asString(r["date"]),
    value: asString(r["value"]),
    state: asString(r["state"]),
    isShipped: r["is_shipped"] === true,
    isDigitalDelivery: r["is_digital_delivery"] === true,
    totalQty: asNumber(r["total_qty"]) ?? 0,
    transactions,
  };
}

/** Lấy lịch sử đơn hàng (receipt_history) của 1 hội thoại cho sidebar phải. */
export async function getConversationReceiptHistory(
  conversationId: number,
): Promise<ConversationDetailResponse> {
  const coll = await getConversationsCollection();
  const doc = (await coll.findOne(
    { "etsy.conversation_id": conversationId },
    { projection: DETAIL_PROJECTION },
  )) as WithId<ConversationDoc> | null;

  const rawList = doc ? getPath(doc.etsy, "buyer_info.receipt_history") : undefined;
  const receiptHistory = Array.isArray(rawList) ? rawList.map(mapReceipt) : [];
  const storeName = asString(getPath(doc?.user_data ?? {}, "shop_name"));

  await attachPersonalizationFiles(receiptHistory);

  return { conversationId, storeName, receiptHistory };
}
