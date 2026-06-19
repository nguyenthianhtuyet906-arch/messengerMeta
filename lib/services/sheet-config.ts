import "server-only";

import { ObjectId, type WithId } from "mongodb";
import { getSheetConfigsCollection, getSheetRowsCollection } from "@/lib/db/collections";
import {
  getAuthorizedSheetsClient,
  GoogleNotConnectedError,
  isInvalidGrantError,
} from "@/lib/google/auth";
import { extractSpreadsheetId } from "@/lib/google/sheet-utils";
import type { SheetConfigDoc, SheetConfigDTO } from "@/lib/types/sheets";

/** Lỗi nghiệp vụ cấu hình sheet (mang HTTP status). */
export class SheetConfigError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toDTO(doc: WithId<SheetConfigDoc>): SheetConfigDTO {
  return {
    id: doc._id.toHexString(),
    spreadsheetId: doc.spreadsheetId,
    title: doc.title,
    spreadsheetUrl: doc.spreadsheetUrl,
    dataTabName: doc.dataTabName,
    prefixTabName: doc.prefixTabName,
    shopNames: doc.shopNames ?? [],
    statusOptions: doc.statusOptions ?? [],
    enabled: doc.enabled,
    order: doc.order,
    lastSyncedAt: doc.lastSyncedAt ? Math.floor(new Date(doc.lastSyncedAt).getTime() / 1000) : null,
    lastSyncError: doc.lastSyncError ?? null,
    rowCount: doc.rowCount ?? 0,
    syncing: doc.syncing ?? false,
  };
}

export async function listSheetConfigs(): Promise<SheetConfigDTO[]> {
  const coll = await getSheetConfigsCollection();
  const docs = await coll.find({}).sort({ order: 1, createdAt: 1 }).toArray();
  return docs.map(toDTO);
}

export interface CreateSheetConfigInput {
  url: string;
  dataTabName?: string;
  prefixTabName?: string;
}

/** Thêm 1 spreadsheet: parse ID, validate quyền truy cập + tab, lấy title từ Google. */
export async function createSheetConfig(
  input: CreateSheetConfigInput,
  ownerEmail: string,
): Promise<SheetConfigDTO> {
  const spreadsheetId = extractSpreadsheetId(input.url);
  if (!spreadsheetId) throw new SheetConfigError(400, "URL hoặc ID spreadsheet không hợp lệ");

  const coll = await getSheetConfigsCollection();
  const existing = await coll.findOne({ spreadsheetId });
  if (existing) throw new SheetConfigError(409, "Spreadsheet này đã được kết nối");

  const prefixTabName = (input.prefixTabName || "Prefix").trim();

  // Lấy metadata: title + danh sách tab. Lỗi truy cập → báo rõ.
  let title = "";
  let tabTitles: string[] = [];
  try {
    const sheets = await getAuthorizedSheetsClient();
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "properties.title,sheets.properties.title",
    });
    title = meta.data.properties?.title ?? "";
    tabTitles = (meta.data.sheets ?? [])
      .map((s) => s.properties?.title ?? "")
      .filter((t) => t !== "");
  } catch (err) {
    if (err instanceof GoogleNotConnectedError || isInvalidGrantError(err)) {
      throw new GoogleNotConnectedError();
    }
    throw new SheetConfigError(403, "Không truy cập được spreadsheet (kiểm tra quyền chia sẻ)");
  }

  // Chọn tab dữ liệu: nếu nhập tay thì khớp CHÍNH XÁC tên tab; nếu không, mặc định tab tên
  // đúng "Order" (phân biệt hoa/thường). KHÔNG đoán tab khác để tránh tra nhầm sheet.
  let dataTabName = (input.dataTabName || "").trim();
  if (dataTabName) {
    if (!tabTitles.includes(dataTabName)) {
      throw new SheetConfigError(
        400,
        `Không tìm thấy tab "${dataTabName}" (khớp chính xác hoa/thường). Các tab hiện có: ${tabTitles.join(", ")}`,
      );
    }
  } else if (tabTitles.includes("Order")) {
    dataTabName = "Order";
  } else {
    throw new SheetConfigError(
      400,
      `Không tìm thấy tab "Order". Hãy nhập đúng tên tab dữ liệu. Các tab hiện có: ${tabTitles.join(", ")}`,
    );
  }

  const maxOrder = await coll.find({}).sort({ order: -1 }).limit(1).toArray();
  const order = (maxOrder[0]?.order ?? -1) + 1;

  const now = new Date();
  const doc: SheetConfigDoc = {
    spreadsheetId,
    title,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    dataTabName,
    prefixTabName,
    shopNames: [],
    enabled: true,
    order,
    lastSyncedAt: null,
    lastSyncError: null,
    rowCount: 0,
    syncing: false,
    ownerEmail,
    createdAt: now,
    updatedAt: now,
  };
  const res = await coll.insertOne(doc);
  return toDTO({ ...doc, _id: res.insertedId });
}

export interface UpdateSheetConfigInput {
  dataTabName?: string;
  prefixTabName?: string;
  enabled?: boolean;
  order?: number;
  statusOptions?: string[];
}

export async function updateSheetConfig(
  id: string,
  patch: UpdateSheetConfigInput,
): Promise<SheetConfigDTO> {
  if (!ObjectId.isValid(id)) throw new SheetConfigError(400, "id không hợp lệ");
  const coll = await getSheetConfigsCollection();
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof patch.dataTabName === "string") set.dataTabName = patch.dataTabName.trim();
  if (typeof patch.prefixTabName === "string") set.prefixTabName = patch.prefixTabName.trim();
  if (typeof patch.enabled === "boolean") set.enabled = patch.enabled;
  if (typeof patch.order === "number") set.order = patch.order;
  if (Array.isArray(patch.statusOptions)) {
    set.statusOptions = patch.statusOptions.map((s) => String(s).trim()).filter(Boolean);
  }
  const res = await coll.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: set },
    { returnDocument: "after" },
  );
  if (!res) throw new SheetConfigError(404, "Không tìm thấy cấu hình");
  return toDTO(res);
}

export async function deleteSheetConfig(id: string): Promise<void> {
  if (!ObjectId.isValid(id)) throw new SheetConfigError(400, "id không hợp lệ");
  const _id = new ObjectId(id);
  const coll = await getSheetConfigsCollection();
  const res = await coll.deleteOne({ _id });
  if (res.deletedCount === 0) throw new SheetConfigError(404, "Không tìm thấy cấu hình");
  // Dọn chỉ mục dòng của sheet này.
  const rows = await getSheetRowsCollection();
  await rows.deleteMany({ configId: _id });
}
