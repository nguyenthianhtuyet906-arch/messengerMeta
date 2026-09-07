import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getTagsOverview } from "@/lib/services/analytics";
import { parseAnalyticsParams } from "@/lib/services/analytics-params";

// GET /api/analytics/tags-overview?from=&to=&shopIds= — tổng quan theo tag (gồm "No Tag").
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const data = await getTagsOverview(parseAnalyticsParams(req));
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/analytics/tags-overview]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
