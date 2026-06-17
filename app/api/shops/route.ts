import { NextResponse } from "next/server";
import { getShops } from "@/lib/services/shop-read";

// GET /api/shops — danh sách shop + trạng thái online (Ably presence all-shops).
export async function GET() {
  try {
    const shops = await getShops();
    return NextResponse.json({ shops });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/shops]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
