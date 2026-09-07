import { NextResponse, type NextRequest } from "next/server";
import { requireEmail, errorResponse } from "@/lib/http/api-helpers";
import { resolveOrderRow } from "@/lib/services/sheet-order";

// GET /api/sheets/resolve?store=&receiptId=&transactionId= — tìm dòng khớp trong các sheet.
export async function GET(req: NextRequest) {
  try {
    const gate = await requireEmail();
    if (gate instanceof NextResponse) return gate;
    const sp = req.nextUrl.searchParams;
    const receiptId = Number(sp.get("receiptId"));
    if (!Number.isFinite(receiptId)) {
      return NextResponse.json({ error: "thiếu receiptId" }, { status: 400 });
    }
    const txRaw = sp.get("transactionId");
    const transactionId = txRaw != null && txRaw !== "" ? Number(txRaw) : null;
    const data = await resolveOrderRow({
      storeName: sp.get("store") ?? "",
      receiptId,
      transactionId: transactionId != null && Number.isFinite(transactionId) ? transactionId : null,
    });
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err, "GET /api/sheets/resolve");
  }
}
