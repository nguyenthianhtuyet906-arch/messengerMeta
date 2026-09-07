import { ObjectId, type WithId } from "mongodb";
import { getAutoRepliesCollection } from "@/lib/db/collections";
import type { AutoReplyDoc } from "@/lib/types/etsy";

/**
 * Port của dora-backend auto_reply_service.go.
 * Khớp trigger chuẩn hoá: lowercase, bỏ dấu câu, gộp khoảng trắng — so khớp TOKEN TUYỆT ĐỐI.
 */

// Bỏ ký tự không phải chữ/số/khoảng trắng (Unicode). Cờ "u" để \p{L}\p{N} hoạt động.
const PUNCT_RE = /[^\p{L}\p{N}\s]+/gu;
const WS_RE = /\s+/g;

/** Mirror normalizeText: lower, trim, bỏ dấu câu, gộp khoảng trắng. */
export function normalizeText(s: string): string {
  let t = (s ?? "").toLowerCase().trim();
  t = t.replace(PUNCT_RE, "");
  t = t.replace(WS_RE, " ");
  return t.trim();
}

/** Tách trigger theo ; (giữ | làm dấu tách phụ). Dấu , KHÔNG còn là dấu tách
 * để câu có dấu phẩy (vd "Overall, how satisfied...") giữ nguyên 1 cụm. */
function splitTriggers(s: string): string[] {
  return (s ?? "").replace(/\|/g, ";").split(";");
}

/** Mirror normalizeTriggersList: token chuẩn hoá, bỏ rỗng. */
export function normalizeTriggersList(input: string): string[] {
  const out: string[] = [];
  for (const part of splitTriggers(input)) {
    const p = part.trim();
    if (!p) continue;
    const n = normalizeText(p);
    if (n) out.push(n);
  }
  return out;
}

/**
 * Mirror GetRepliesForIncoming: lọc enabled=true, so khớp token tuyệt đối với incoming
 * đã chuẩn hoá; dedupe theo normalized token để 2 rule cùng trigger không trả 2 lần.
 */
export async function getRepliesForIncoming(incomingText: string): Promise<AutoReplyDoc[]> {
  const coll = await getAutoRepliesCollection();
  const lowerIncoming = normalizeText(incomingText);
  if (!lowerIncoming) return [];

  const cursor = coll.find({ enabled: true });
  const results: AutoReplyDoc[] = [];
  const seen = new Set<string>();

  for await (const m of cursor) {
    const triggers =
      m.normalized_triggers && m.normalized_triggers.length > 0
        ? m.normalized_triggers
        : normalizeTriggersList(m.trigger);

    let matched = false;
    for (const t of triggers) {
      if (!t) continue;
      if (lowerIncoming === t) {
        if (seen.has(t)) {
          matched = false;
          break;
        }
        matched = true;
        seen.add(t);
        break;
      }
    }
    if (matched) results.push(m);
  }
  return results;
}

/**
 * Mirror HasConflictingTrigger: có rule khác chứa 1 normalized token trùng không.
 * excludeId: bỏ qua khi cập nhật chính rule đó.
 */
export async function hasConflictingTrigger(
  trigger: string,
  excludeId?: string,
): Promise<boolean> {
  const tokens = normalizeTriggersList(trigger);
  if (tokens.length === 0) return false;
  const coll = await getAutoRepliesCollection();
  const filter: Record<string, unknown> = { normalized_triggers: { $in: tokens } };
  if (excludeId && ObjectId.isValid(excludeId)) {
    filter._id = { $ne: new ObjectId(excludeId) };
  }
  return (await coll.countDocuments(filter)) > 0;
}

// ---- CRUD ----

export interface AutoReplyInput {
  trigger?: string;
  reply?: string;
  enabled?: boolean;
  email?: string;
}

export async function listAutoReplies(): Promise<WithId<AutoReplyDoc>[]> {
  const coll = await getAutoRepliesCollection();
  return coll.find({}).sort({ created_at: -1 }).toArray();
}

export async function getAutoReply(id: string): Promise<WithId<AutoReplyDoc> | null> {
  if (!ObjectId.isValid(id)) return null;
  const coll = await getAutoRepliesCollection();
  return coll.findOne({ _id: new ObjectId(id) });
}

export async function createAutoReply(input: AutoReplyInput): Promise<WithId<AutoReplyDoc>> {
  const coll = await getAutoRepliesCollection();
  const now = new Date();
  const doc: AutoReplyDoc = {
    email: input.email && input.email.trim() ? input.email.trim() : "*",
    trigger: input.trigger ?? "",
    normalized_triggers: normalizeTriggersList(input.trigger ?? ""),
    reply: input.reply ?? "",
    enabled: input.enabled ?? true,
    created_at: now,
    updated_at: now,
  };
  const res = await coll.insertOne(doc);
  return { ...doc, _id: res.insertedId };
}

export async function updateAutoReply(
  id: string,
  input: AutoReplyInput,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const coll = await getAutoRepliesCollection();
  const set: Partial<AutoReplyDoc> = { updated_at: new Date() };
  if (input.trigger !== undefined) {
    set.trigger = input.trigger;
    set.normalized_triggers = normalizeTriggersList(input.trigger);
  }
  if (input.reply !== undefined) set.reply = input.reply;
  if (input.enabled !== undefined) set.enabled = input.enabled;
  if (input.email !== undefined) set.email = input.email.trim() || "*";
  const res = await coll.updateOne({ _id: new ObjectId(id) }, { $set: set });
  return res.matchedCount > 0;
}

export async function deleteAutoReply(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const coll = await getAutoRepliesCollection();
  const res = await coll.deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount > 0;
}
