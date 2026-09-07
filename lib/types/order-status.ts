import type { ObjectId } from "mongodb";

/** Trạng thái đơn (collection `order_statuses`) — nguồn cho dropdown Status. */
export interface OrderStatusDoc {
  _id?: ObjectId;
  name: string;
  color: string;
  description: string;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface OrderStatusDTO {
  id: string;
  name: string;
  color: string;
  description: string;
  displayOrder: number;
}
