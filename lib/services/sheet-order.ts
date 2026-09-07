import "server-only";

import { ObjectId, type WithId } from "mongodb";
import { getSheetConfigsCollection, getSheetRowsCollection } from "@/lib/db/collections";
import { refreshConversationSheetStatuses } from "@/lib/services/conversation-sheet-status";
import {
  getAuthorizedSheetsClient,
  GoogleNotConnectedError,
  isInvalidGrantError,
} from "@/lib/google/auth";
import { colToA1, findHeaderIndex, normalizeStore, receiptTxKey } from "@/lib/google/sheet-utils";
import { syncSheetIfStale } from "@/lib/services/sheet-sync";
import type {
  OrderRowMatch,
  ResolveOrderResponse,
  SheetConfigDoc,
  SheetRowDoc,
} from "@/lib/types/sheets";

export class SheetOrderError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function rowToMatch(row: WithId<SheetRowDoc>, cfg: WithId<SheetConfigDoc>): OrderRowMatch {
  return {
    configId: cfg._id.toHexString(),
    spreadsheetId: cfg.spreadsheetId,
    spreadsheetTitle: cfg.title,
    spreadsheetUrl: cfg.spreadsheetUrl,
    dataTabName: cfg.dataTabName,
    rowNumber: row.rowNumber,
    itemId: row.itemId,
    store: row.store,
    headers: Object.keys(row.values),
    values: row.values,
  };
}

/**
 * Tra cứu (các) dòng khớp 1 item theo receipt+transaction qua mọi sheet đã kết nối (fallback tự nhiên).
 * Khớp bằng receiptTxKey (prefix-independent) nên không phụ thuộc store-name khớp đúng.
 */
export async function resolveOrderRow(opts: {
  storeName: string;
  receiptId: number;
  /** Có → khớp đúng 1 item; bỏ trống → trả TẤT CẢ dòng của đơn (receipt). */
  transactionId?: number | null;
}): Promise<ResolveOrderResponse> {
  const configs = await getSheetConfigsCollection();
  const enabled = await configs.find({ enabled: true }).sort({ order: 1 }).toArray();
  if (enabled.length === 0) return { matches: [], reason: "no_configs" };

  // Đồng bộ lười: cold (chưa từng sync) → await; warm-nhưng-cũ → refresh nền cho lần sau.
  const store = normalizeStore(opts.storeName);
  const prioritized = [...enabled].sort((a, b) => {
    const am = a.shopNames?.some((s) => normalizeStore(s) === store) ? 0 : 1;
    const bm = b.shopNames?.some((s) => normalizeStore(s) === store) ? 0 : 1;
    return am - bm || a.order - b.order;
  });
  await Promise.all(
    prioritized.map(async (cfg) => {
      if (cfg.lastSyncedAt) {
        // warm → refresh nền cho lần sau, nuốt lỗi để không chặn tra cứu.
        void syncSheetIfStale(cfg).catch(() => {});
        return;
      }
      // cold (chưa từng sync) → chờ; chỉ ném lỗi "chưa kết nối" để panel mời kết nối lại.
      try {
        await syncSheetIfStale(cfg);
      } catch (e) {
        if (e instanceof GoogleNotConnectedError) throw e;
      }
    }),
  );

  const enabledIds = enabled.map((c) => c._id);
  const rows = await getSheetRowsCollection();
  const filter =
    opts.transactionId != null
      ? { receiptTxKey: receiptTxKey(opts.receiptId, opts.transactionId) }
      : { receiptKey: String(opts.receiptId) };
  const found = await rows.find({ ...filter, configId: { $in: enabledIds } }).toArray();

  const cfgById = new Map(enabled.map((c) => [c._id.toHexString(), c]));
  const matches = found
    .map((r) => {
      const cfg = cfgById.get(r.configId.toHexString());
      return cfg ? rowToMatch(r, cfg) : null;
    })
    .filter((m): m is OrderRowMatch => m !== null)
    .sort((a, b) => {
      const ca = cfgById.get(a.configId);
      const cb = cfgById.get(b.configId);
      // Cùng sheet: sắp theo số dòng để thứ tự ổn định; khác sheet: theo order config.
      return (ca?.order ?? 0) - (cb?.order ?? 0) || a.rowNumber - b.rowNumber;
    });

  return { matches, reason: matches.length > 0 ? null : "row_not_found" };
}

/** Đọc cả cột Item ID để định vị lại số dòng theo itemId (tránh lệch dòng do chèn/xoá/sort). */
async function locateRowByItemId(
  sheets: Awaited<ReturnType<typeof getAuthorizedSheetsClient>>,
  spreadsheetId: string,
  dataTabName: string,
  headers: string[],
  itemId: string,
): Promise<number | null> {
  const idx = findHeaderIndex(headers, "Item ID");
  if (idx < 0) return null;
  const col = colToA1(idx);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${dataTabName}!${col}:${col}`,
  });
  const vals = res.data.values ?? [];
  for (let r = 1; r < vals.length; r++) {
    const cell = typeof vals[r]?.[0] === "string" ? vals[r][0].trim() : "";
    if (cell === itemId) return r + 1; // 1-based
  }
  return null;
}

/** Ghi các field đã sửa về Google Sheet (write-through) + cập nhật chỉ mục Mongo. */
export async function writeOrderRow(opts: {
  configId: string;
  itemId: string;
  rowNumber: number;
  updates: Record<string, string>;
  /** Snapshot kỳ vọng (header→value) để phát hiện chỉnh sửa đồng thời. */
  expected?: Record<string, string>;
}): Promise<OrderRowMatch> {
  if (!ObjectId.isValid(opts.configId)) throw new SheetOrderError(400, "configId không hợp lệ");
  const updateHeaders = Object.keys(opts.updates);
  if (updateHeaders.length === 0) throw new SheetOrderError(400, "Không có thay đổi nào");

  const configs = await getSheetConfigsCollection();
  const cfg = await configs.findOne({ _id: new ObjectId(opts.configId) });
  if (!cfg) throw new SheetOrderError(404, "Không tìm thấy cấu hình sheet");

  try {
    const sheets = await getAuthorizedSheetsClient();
    const tab = cfg.dataTabName;

    // Header hiện tại (live).
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: cfg.spreadsheetId,
      range: `${tab}!1:1`,
    });
    const headers = (headerRes.data.values?.[0] ?? []).map((h) =>
      typeof h === "string" ? h : String(h ?? ""),
    );
    const itemIdIdx = findHeaderIndex(headers, "Item ID");
    if (itemIdIdx < 0) throw new SheetOrderError(409, "Sheet không có cột Item ID");

    // Định vị lại dòng: đọc đúng dòng rowNumber, kiểm tra Item ID; lệch thì quét cả cột.
    const candRes = await sheets.spreadsheets.values.get({
      spreadsheetId: cfg.spreadsheetId,
      range: `${tab}!${opts.rowNumber}:${opts.rowNumber}`,
    });
    const candRow = (candRes.data.values?.[0] ?? []).map((c) =>
      typeof c === "string" ? c : c == null ? "" : String(c),
    );
    let rowNumber = opts.rowNumber;
    if ((candRow[itemIdIdx] ?? "").trim() !== opts.itemId) {
      const located = await locateRowByItemId(
        sheets,
        cfg.spreadsheetId,
        tab,
        headers,
        opts.itemId,
      );
      if (!located) throw new SheetOrderError(409, "Dòng đã thay đổi/không còn trong sheet");
      rowNumber = located;
    }

    // Đọc lại đúng dòng đích để có giá trị hiện tại (nếu đã quét lại).
    const targetRow =
      rowNumber === opts.rowNumber
        ? candRow
        : (
            await sheets.spreadsheets.values.get({
              spreadsheetId: cfg.spreadsheetId,
              range: `${tab}!${rowNumber}:${rowNumber}`,
            })
          ).data.values?.[0]?.map((c) => (typeof c === "string" ? c : c == null ? "" : String(c))) ??
          [];

    // Phát hiện chỉnh sửa đồng thời (nếu client gửi expected).
    if (opts.expected) {
      for (const h of updateHeaders) {
        const idx = findHeaderIndex(headers, h);
        if (idx < 0) continue;
        const current = (targetRow[idx] ?? "").trim();
        const exp = (opts.expected[h] ?? "").trim();
        if (h in opts.expected && current !== exp) {
          throw new SheetOrderError(409, "Dòng đã bị sửa bởi người khác. Hãy làm mới rồi thử lại.");
        }
      }
    }

    // Ghi từng ô đã sửa (RAW để tránh injection công thức).
    const data = updateHeaders
      .map((h) => {
        const idx = findHeaderIndex(headers, h);
        if (idx < 0) return null;
        return {
          range: `${tab}!${colToA1(idx)}${rowNumber}`,
          values: [[opts.updates[h]]],
        };
      })
      .filter((d): d is { range: string; values: string[][] } => d !== null);

    if (data.length === 0) throw new SheetOrderError(400, "Các cột cần sửa không tồn tại trong sheet");

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: cfg.spreadsheetId,
      requestBody: { valueInputOption: "RAW", data },
    });

    // Cập nhật chỉ mục Mongo.
    const rows = await getSheetRowsCollection();
    const rowSet: Record<string, unknown> = { rowNumber, syncedAt: new Date() };
    for (const h of updateHeaders) rowSet[`values.${h}`] = opts.updates[h];
    await rows.updateOne(
      { spreadsheetId: cfg.spreadsheetId, itemId: opts.itemId },
      { $set: rowSet },
    );

    const updated = await rows.findOne({ spreadsheetId: cfg.spreadsheetId, itemId: opts.itemId });

    // Nếu Status thay đổi → cập nhật sheetStatuses trên conversation (fire-and-forget).
    if ("Status" in opts.updates) {
      const receiptKey = updated?.receiptKey ?? opts.itemId.split("-").at(-2) ?? "";
      const receiptId = Number(receiptKey);
      if (Number.isFinite(receiptId) && receiptId > 0) {
        void refreshConversationSheetStatuses(receiptId).catch(() => {});
      }
    }

    if (updated) return rowToMatch(updated, cfg);

    // Hiếm: dòng chưa có trong chỉ mục → dựng match từ dữ liệu vừa đọc.
    const values: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const h = headers[c];
      if (!h || !h.trim()) continue;
      values[h] = targetRow[c] ?? "";
    }
    for (const h of updateHeaders) values[h] = opts.updates[h];
    return {
      configId: cfg._id.toHexString(),
      spreadsheetId: cfg.spreadsheetId,
      spreadsheetTitle: cfg.title,
      spreadsheetUrl: cfg.spreadsheetUrl,
      dataTabName: tab,
      rowNumber,
      itemId: opts.itemId,
      store: cfg.shopNames?.[0] ?? "",
      headers: Object.keys(values),
      values,
    };
  } catch (err) {
    if (err instanceof SheetOrderError) throw err;
    if (err instanceof GoogleNotConnectedError || isInvalidGrantError(err)) {
      throw new GoogleNotConnectedError();
    }
    throw err;
  }
}
