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
  lastMessageDate: number;
  created_at: Date;
  updated_at: Date;
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
