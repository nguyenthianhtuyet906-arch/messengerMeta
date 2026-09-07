import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getShopAnalytics } from "@/lib/services/analytics";
import { parseAnalyticsParams } from "@/lib/services/analytics-params";

// GET /api/analytics/shops?from=&to=&shopIds= — số hội thoại + số đơn mỗi shop.
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const data = await getShopAnalytics(parseAnalyticsParams(req));
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/analytics/shops]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
