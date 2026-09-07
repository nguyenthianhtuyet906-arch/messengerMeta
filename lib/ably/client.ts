"use client";

import * as Ably from "ably";

let client: Ably.Realtime | null = null;

// Singleton Realtime client, auth qua /api/ably/token (không lộ key).
export function getAblyClient(): Ably.Realtime {
  if (!client) {
    client = new Ably.Realtime({ authUrl: "/api/ably/token" });
  }
  return client;
}

export const ABLY_CHANNEL = "all";
export const NEW_MESSAGE_EVENT = "new-message-event";
