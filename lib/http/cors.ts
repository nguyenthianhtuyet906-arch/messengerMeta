import { NextResponse } from "next/server";

/**
 * Extension chạy trên origin https://www.etsy.com và fetch sang localhost:3000.
 * Cần CORS header trên mọi response + handler OPTIONS cho preflight.
 */
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/** Trả NextResponse JSON đã gắn CORS header. */
export function corsJson(body: unknown, init?: ResponseInit): NextResponse {
  const res = NextResponse.json(body, init);
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
  return res;
}

/** Handler dùng chung cho preflight OPTIONS. */
export function OPTIONS(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
