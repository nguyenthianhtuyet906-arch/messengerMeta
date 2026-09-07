import { NextResponse } from "next/server";
import * as Ably from "ably";

// GET /api/ably/token — trả tokenRequest ký bằng ABLY_KEY (không lộ key ra browser).
// Frontend dùng làm authUrl cho Ably Realtime.
export async function GET() {
  const key = process.env.ABLY_KEY;
  if (!key) {
    return NextResponse.json({ error: "ABLY_KEY not configured" }, { status: 500 });
  }
  try {
    const rest = new Ably.Rest({ key });
    const tokenRequest = await rest.auth.createTokenRequest({ clientId: "messenger-web" });
    return NextResponse.json(tokenRequest);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/ably/token]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
