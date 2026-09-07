import { NextResponse, type NextRequest } from "next/server";
import { requireEmail, errorResponse } from "@/lib/http/api-helpers";
import { resolveOrderRow } from "@/lib/services/sheet-order";
import type { ResolveOrderResponse } from "@/lib/types/sheets";

// POST /api/sheets/resolve-batch — tìm nhiều đơn cùng lúc, giảm số lượng request khi prefetch.
export async function POST(req: NextRequest) {
  try {
    const gate = await requireEmail();
    if (gate instanceof NextResponse) return gate;

    const body = (await req.json()) as { items?: { store: string; receiptId: number }[] };
    const items = body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const capped = items.slice(0, 50);
    const settled = await Promise.allSettled(
      capped.map((item) =>
        resolveOrderRow({ storeName: item.store ?? "", receiptId: Number(item.receiptId) }),
      ),
    );

    const results: (ResolveOrderResponse | null)[] = settled.map((r) =>
      r.status === "fulfilled" ? r.value : null,
    );

    return NextResponse.json({ results });
  } catch (err) {
    return errorResponse(err, "POST /api/sheets/resolve-batch");
  }
}
