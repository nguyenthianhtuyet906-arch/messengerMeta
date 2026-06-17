import { NextResponse, type NextRequest } from "next/server";
import { getConversations } from "@/lib/services/conversation-read";

// GET /api/conversations?cursor=&limit=&search=
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const data = await getConversations({
      cursor: sp.get("cursor"),
      limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
      search: sp.get("search") ?? undefined,
    });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/conversations]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
