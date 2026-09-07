import "server-only";

import { ObjectId, type WithId } from "mongodb";
import { getOrderStatusesCollection } from "@/lib/db/collections";
import type { OrderStatusDoc, OrderStatusDTO } from "@/lib/types/order-status";

export class OrderStatusError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Dữ liệu seed (export từ order_statuses của bạn) — chỉ nạp khi collection rỗng.
const SEED: { _id: string; name: string; color: string; description: string; display_order: number }[] =
  [
    { _id: "678e10b8234b3310739de25a", name: "NEW", color: "#3498db", description: "A new order has been placed", display_order: 1 },
    { _id: "678e10b8234b3310739de25b", name: "PROCESSING", color: "#f1c40f", description: "The order is being processed", display_order: 2 },
    { _id: "678e10b8234b3310739de25c", name: "SHIPPING", color: "#e67e22", description: "The order is being shipped", display_order: 3 },
    { _id: "678e10b8234b3310739de25d", name: "DELIVERED", color: "#2ecc71", description: "The order has been delivered", display_order: 4 },
    { _id: "69437d2a33aefe95ecc0171c", name: "NEW", color: "Green", description: "Trạng thái đơn mới", display_order: 6 },
    { _id: "69437da833aefe95ecc01723", name: "ON HOLD", color: "#f5a623", description: "Đơn mail khách k tl", display_order: 7 },
    { _id: "69437dce33aefe95ecc01725", name: "DESIGNING", color: "green", description: "Đang làm hình", display_order: 8 },
    { _id: "69437dde33aefe95ecc0172b", name: "NEED REPAIR", color: "red", description: "Sửa hình", display_order: 9 },
    { _id: "69437df233aefe95ecc0173d", name: "REPAIRED", color: "green", description: "Sửa hình xong", display_order: 10 },
    { _id: "69437dfe33aefe95ecc01752", name: "CONFIRMED", color: "green", description: "Đã confirm với khách", display_order: 11 },
    { _id: "69437e1f33aefe95ecc01771", name: "PROCESSING", color: "green", description: "Đang nhận đặt hàng từ các bên ( shopee, nhà mày, amz)", display_order: 12 },
    { _id: "69437e2f33aefe95ecc01775", name: "WAITING CUSTOMER", color: "yellow", description: "Cần check với khách trước khi đẩy", display_order: 13 },
    { _id: "69437e3a33aefe95ecc01788", name: "SHIPPING", color: "yellow", description: "Đã gửi shipping sang các bên", display_order: 14 },
    { _id: "69437e4833aefe95ecc01789", name: "EXPORTING", color: "yellow", description: "đang xuất file", display_order: 15 },
    { _id: "69437e5233aefe95ecc0178a", name: "WAIT IMAGE", color: "yellow", description: "Chờ khách gửi ảnh", display_order: 16 },
    { _id: "69437e5e33aefe95ecc0178b", name: "EMAILED", color: "yellow", description: "đã mail", display_order: 17 },
    { _id: "69437e6d33aefe95ecc0178d", name: "TRACKING", color: "yellow", description: "đơn đã add tracking lên shop", display_order: 18 },
    { _id: "69437e7633aefe95ecc01793", name: "DELIVERED", color: "yellow", description: "Đã hoàn thành đơn", display_order: 19 },
    { _id: "69437e8033aefe95ecc01794", name: "CANCELLED", color: "yellow", description: "Đơn đã bị huỷ", display_order: 20 },
    { _id: "69437ec233aefe95ecc017a0", name: "WEB CHECKED", color: "yellow", description: "Đã check hình đúng cần resize", display_order: 21 },
    { _id: "69437ecd33aefe95ecc017a8", name: "WEB DONE", color: "yellow", description: "đã resize k cần check", display_order: 22 },
    { _id: "69437ed833aefe95ecc017ab", name: "DONE CHECK", color: "yellow", description: "đã check có đơn đôi", display_order: 23 },
    { _id: "69437f4033aefe95ecc017bd", name: "NO TEMPLATE", color: "yellow", description: "khong template", display_order: 24 },
    { _id: "69437f5633aefe95ecc017c4", name: "SEND MOCKUP", color: "#91917f", description: "Cần gửi mk", display_order: 25 },
    { _id: "69437f6333aefe95ecc017c6", name: "MOCKUP SENT", color: "yellow", description: "gửi thành công", display_order: 26 },
    { _id: "69437f6d33aefe95ecc017c9", name: "MOCKUP FAIL", color: "yellow", description: "Gửi mockup thất bại", display_order: 27 },
    { _id: "69437f7733aefe95ecc017cf", name: "SEND IMAGE", color: "yellow", description: "Cần gửi tin ngắn xin ảnh", display_order: 28 },
    { _id: "69437f8233aefe95ecc017d4", name: "DONE IMAGE", color: "yellow", description: "đã xin ảnh thành công trên dora", display_order: 29 },
    { _id: "69437f9033aefe95ecc017d6", name: "FAIL IMAGE", color: "yellow", description: "không có tin nhắn trên dora", display_order: 30 },
  ];

function toDTO(doc: WithId<OrderStatusDoc>): OrderStatusDTO {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    color: doc.color ?? "",
    description: doc.description ?? "",
    displayOrder: doc.display_order ?? 0,
  };
}

/** Nạp seed nếu collection rỗng (chạy 1 lần, an toàn chạy đua). */
async function seedIfEmpty(): Promise<void> {
  const coll = await getOrderStatusesCollection();
  const count = await coll.estimatedDocumentCount();
  if (count > 0) return;
  const now = new Date();
  const docs: OrderStatusDoc[] = SEED.map((s) => ({
    _id: new ObjectId(s._id),
    name: s.name,
    color: s.color,
    description: s.description,
    display_order: s.display_order,
    created_at: now,
    updated_at: now,
  }));
  try {
    await coll.insertMany(docs, { ordered: false });
  } catch {
    // Chạy đua / đã tồn tại _id → bỏ qua.
  }
}

export async function listOrderStatuses(): Promise<OrderStatusDTO[]> {
  await seedIfEmpty();
  const coll = await getOrderStatusesCollection();
  const docs = await coll.find({}).sort({ display_order: 1, name: 1 }).toArray();
  return docs.map(toDTO);
}

export interface UpsertOrderStatusInput {
  name?: string;
  color?: string;
  description?: string;
  displayOrder?: number;
}

export async function createOrderStatus(input: UpsertOrderStatusInput): Promise<OrderStatusDTO> {
  const name = (input.name ?? "").trim();
  if (!name) throw new OrderStatusError(400, "Cần nhập tên trạng thái");
  const coll = await getOrderStatusesCollection();
  const last = await coll.find({}).sort({ display_order: -1 }).limit(1).toArray();
  const now = new Date();
  const doc: OrderStatusDoc = {
    name,
    color: (input.color ?? "").trim(),
    description: (input.description ?? "").trim(),
    display_order:
      typeof input.displayOrder === "number" ? input.displayOrder : (last[0]?.display_order ?? 0) + 1,
    created_at: now,
    updated_at: now,
  };
  const res = await coll.insertOne(doc);
  return toDTO({ ...doc, _id: res.insertedId });
}

export async function updateOrderStatus(
  id: string,
  patch: UpsertOrderStatusInput,
): Promise<OrderStatusDTO> {
  if (!ObjectId.isValid(id)) throw new OrderStatusError(400, "id không hợp lệ");
  const set: Record<string, unknown> = { updated_at: new Date() };
  if (typeof patch.name === "string") {
    const n = patch.name.trim();
    if (!n) throw new OrderStatusError(400, "Tên trạng thái không được rỗng");
    set.name = n;
  }
  if (typeof patch.color === "string") set.color = patch.color.trim();
  if (typeof patch.description === "string") set.description = patch.description.trim();
  if (typeof patch.displayOrder === "number") set.display_order = patch.displayOrder;

  const coll = await getOrderStatusesCollection();
  const res = await coll.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: set },
    { returnDocument: "after" },
  );
  if (!res) throw new OrderStatusError(404, "Không tìm thấy trạng thái");
  return toDTO(res);
}

export async function deleteOrderStatus(id: string): Promise<void> {
  if (!ObjectId.isValid(id)) throw new OrderStatusError(400, "id không hợp lệ");
  const coll = await getOrderStatusesCollection();
  const res = await coll.deleteOne({ _id: new ObjectId(id) });
  if (res.deletedCount === 0) throw new OrderStatusError(404, "Không tìm thấy trạng thái");
}
