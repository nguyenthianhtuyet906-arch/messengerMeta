import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getAiEffectiveness } from "@/lib/services/analytics";
import { parseAnalyticsParams } from "@/lib/services/analytics-params";

// GET /api/analytics/ai-effectiveness?from=&to=&shopIds= — tỉ lệ dùng gợi ý AI theo nhân viên.
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const data = await getAiEffectiveness(parseAnalyticsParams(req));
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/analytics/ai-effectiveness]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
