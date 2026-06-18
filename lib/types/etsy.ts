import type { ObjectId } from "mongodb";

/**
 * Raw Etsy payload — giữ nguyên dạng tự do để đảm bảo chính xác.
 * Mirror field `etsy bson.M` trong dora-backend (models/conversation.go, models/message.go).
 */
export type EtsyRaw = Record<string, unknown>;

/** Trạng thái gửi message — mirror models/message.go (MessageStatus). */
export type MessageStatus = "NEW" | "SENDING" | "DONE" | "FAILED";

/**
 * Collection `conversations` — key upsert: etsy.conversation_id
 * Mirror dora-backend/models/conversation.go
 */
export interface ConversationDoc {
  _id?: ObjectId;
  etsy: EtsyRaw;
  user_data?: EtsyRaw | null;
  tags: string[];
  note: string;
  /** Ghi chú nhiều người dùng (thread). Mỗi note do 1 nhân viên tạo, tự sửa/xoá. */
  notes?: NoteEntry[];
  /** Gợi ý AI gần nhất (agree/neutral/apologize + tag). Mirror DORA suggested_messages. */
  suggested_messages?: AIResponse | null;
  lastMessageDate: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Kết quả gợi ý AI cho 1 hội thoại — mirror utils.AIResponse của DORA (chatgpt.go).
 * 3 đáp án khác tông + tag phân loại.
 */
export interface AIResponse {
  solutions: string[];
  message: string;
  agree: string;
  neutral: string;
  apologize: string;
  suggested_tag?: string;
  tag_reason?: string;
}

/** 1 ghi chú lưu trong conversation doc (top-level field `notes`). */
export interface NoteEntry {
  id: string;
  authorEmail: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Collection `messages` — dedup theo etsy.conversation_message_id
 * Mirror dora-backend/models/message.go
 */
export interface MessageDoc {
  _id?: ObjectId;
  etsy: EtsyRaw;
  conversation_id: number;
  message: string;
  attachments: string[];
  sender_email: string;
  status: MessageStatus | "";
  created_at: Date;
  updated_at: Date;
}

/**
 * Collection `auto_reply_messages` — quy tắc tự trả lời.
 * Mirror dora-backend/models/auto_reply_message.go.
 * Khớp khi normalized incoming === 1 trong normalized_triggers (so khớp token tuyệt đối).
 */
export interface AutoReplyDoc {
  _id?: ObjectId;
  email: string;
  trigger: string;
  normalized_triggers: string[];
  reply: string;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

/** Body của POST /v1/extension/conversations/sync (Etsy message-list-data). */
export interface ConversationSyncBody {
  conversations?: EtsyRaw[];
  user_data?: EtsyRaw | null;
  [key: string]: unknown;
}

/** Body của POST /v1/extension/messages/sync. */
export interface MessageSyncBody {
  messages?: EtsyRaw[];
}

// ---- DTO gọn cho frontend (KHÔNG trả nguyên blob etsy) ----

/** 1 dòng hội thoại trong sidebar. */
export interface ConversationListItem {
  conversationId: number;
  name: string;
  avatar: string;
  excerpt: string;
  lastMessageDate: number;
  messageCount: number;
  hasReplied: boolean;
  shopUserId: number;
}

/** 1 tin nhắn trong khung chat. */
export interface MessageItem {
  id: string;
  message: string;
  senderId: number;
  fromMe: boolean;
  createDate: number;
  messageOrder: number;
  isSystem: boolean;
  images: string[];
  /** Email nhân viên đã gửi (tin đi); rỗng với tin từ Etsy. */
  senderEmail: string;
  /** Tên/avatar nhân viên gửi (join từ users). */
  senderName: string;
  senderAvatar: string;
}

/** Shop kèm trạng thái online (filter theo shop). */
export interface ShopItem {
  userId: number;
  shopName: string;
  avatar: string;
  online: boolean;
}

/** Bộ lọc danh sách hội thoại. */
export interface ConversationFilters {
  search: string;
  notReplied: boolean;
  hasOrder: boolean;
  orderHelp: boolean;
  hasNote: boolean;
  shopIds: number[];
}

/** 1 ghi chú trả về client (đã join tên/avatar tác giả). */
export interface NoteItem {
  id: string;
  body: string;
  authorEmail: string;
  authorName: string;
  authorAvatar: string;
  /** unix seconds (để tái dùng timeAgo). */
  createdAt: number;
  updatedAt: number;
  /** true nếu note thuộc về user đang đăng nhập (được phép sửa/xoá). */
  mine: boolean;
}

/** Phản hồi danh sách ghi chú của 1 hội thoại. */
export interface NotesResponse {
  conversationId: number;
  items: NoteItem[];
}

/** Phản hồi list có cursor để load tiếp. */
export interface ConversationListResponse {
  items: ConversationListItem[];
  nextCursor: string | null;
}

/** 1 dòng sản phẩm trong đơn (receipt_history[].transactions). */
export interface ReceiptTransaction {
  transactionId: number;
  title: string;
  image: string;
  quantity: number;
  value: string;
}

/** 1 đơn hàng trong lịch sử mua của khách (etsy.buyer_info.receipt_history). */
export interface ReceiptHistoryItem {
  receiptId: number;
  date: string;
  value: string;
  state: string;
  isShipped: boolean;
  isDigitalDelivery: boolean;
  totalQty: number;
  transactions: ReceiptTransaction[];
}

/** Phản hồi chi tiết hội thoại cho sidebar phải (chỉ receipt_history). */
export interface ConversationDetailResponse {
  conversationId: number;
  receiptHistory: ReceiptHistoryItem[];
}

/** Tin nhắn đang gửi (chưa được Etsy xác nhận) — hiển thị tách khỏi list đã fetch. */
export interface PendingMessage {
  localId: string;
  serverId: string | null;
  text: string;
  status: "sending" | "failed";
}

/** Phản hồi messages có cursor (load tin cũ hơn). */
export interface MessageListResponse {
  conversationId: number;
  shopUserId: number;
  name: string;
  avatar: string;
  items: MessageItem[];
  nextCursor: string | null;
}
