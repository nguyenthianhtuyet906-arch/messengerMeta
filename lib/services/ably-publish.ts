import * as Ably from "ably";

// Channel/event khớp dora-backend: PushMessage("all", "new-message-event", ...)
export const ABLY_CHANNEL = "all";
export const NEW_MESSAGE_EVENT = "new-message-event";

declare global {
  // eslint-disable-next-line no-var
  var _ablyRest: Ably.Rest | undefined;
}

function getRest(): Ably.Rest | null {
  const key = process.env.ABLY_KEY;
  if (!key) return null;
  if (!global._ablyRest) global._ablyRest = new Ably.Rest({ key });
  return global._ablyRest;
}

/**
 * Publish 1 event mỗi conversation có message mới (best-effort, không throw).
 * Frontend nghe event này để refetch realtime.
 */
export async function publishNewMessages(conversationIds: number[]): Promise<void> {
  const rest = getRest();
  if (!rest || conversationIds.length === 0) return;
  const channel = rest.channels.get(ABLY_CHANNEL);
  await Promise.all(
    conversationIds.map((id) =>
      channel
        .publish(NEW_MESSAGE_EVENT, { conversation_id: id })
        .catch((e) => console.warn("[ably] publish failed:", e?.message ?? e)),
    ),
  );
}
