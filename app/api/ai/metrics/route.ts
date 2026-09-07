import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getSuggestionMetrics } from "@/lib/services/ai/metrics";

// GET /api/ai/metrics?days=30&shopId= — acceptance rate của gợi ý AI (GĐ3).
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const sp = req.nextUrl.searchParams;
    const daysRaw = sp.get("days");
    const shopIdRaw = sp.get("shopId");
    const days = daysRaw ? Number(daysRaw) : undefined;
    const shopId = shopIdRaw ? Number(shopIdRaw) : undefined;
    const data = await getSuggestionMetrics({
      days: days && Number.isFinite(days) ? days : undefined,
      shopId: shopId && Number.isFinite(shopId) ? shopId : undefined,
    });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/ai/metrics]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
