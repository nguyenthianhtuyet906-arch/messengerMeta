import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getAgentPerformance } from "@/lib/services/analytics";
import { parseAnalyticsParams } from "@/lib/services/analytics-params";

// GET /api/analytics/agent-performance?from=&to= — đếm tin nhắn nhân viên gửi.
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const data = await getAgentPerformance(parseAnalyticsParams(req));
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/analytics/agent-performance]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
