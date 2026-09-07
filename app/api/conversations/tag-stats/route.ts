import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getTagStats } from "@/lib/services/tag";

// GET /api/conversations/tag-stats?shopIds=1,2 — số hội thoại theo từng tag.
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const shopIdsRaw = req.nextUrl.searchParams.get("shopIds");
    const shopIds = shopIdsRaw
      ? shopIdsRaw.split(",").map(Number).filter(Number.isFinite)
      : undefined;

    const stats = await getTagStats(shopIds);
    return NextResponse.json({ stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/conversations/tag-stats]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
