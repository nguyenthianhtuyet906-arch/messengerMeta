import { NextResponse } from "next/server";
import { requireEmail, errorResponse } from "@/lib/http/api-helpers";
import { getSheetRowsCollection } from "@/lib/db/collections";
import { bulkRefreshSheetStatuses } from "@/lib/services/conversation-sheet-status";

/**
 * POST /api/admin/backfill-sheet-statuses
 * Chạy một lần để populate sheetStatuses cho tất cả conversations từ dữ liệu sheet hiện có.
 * Có thể gọi lại bất kỳ lúc nào để đồng bộ lại toàn bộ.
 */
export async function POST(req: Request) {
  try {
    const gate = await requireEmail();
    if (gate instanceof NextResponse) return gate;

    // Lấy tất cả receiptId duy nhất từ sheet_rows.
    const rowsColl = await getSheetRowsCollection();
    const distinctReceiptKeys = await rowsColl.distinct("receiptKey", {});
    const receiptIds = distinctReceiptKeys
      .map((k) => Number(k))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (receiptIds.length === 0) {
      return NextResponse.json({ updated: 0, message: "Không có dữ liệu sheet" });
    }

    // Xử lý theo batch 500 để không quá tải.
    const BATCH = 500;
    let processed = 0;
    for (let i = 0; i < receiptIds.length; i += BATCH) {
      await bulkRefreshSheetStatuses(receiptIds.slice(i, i + BATCH));
      processed += Math.min(BATCH, receiptIds.length - i);
    }

    return NextResponse.json({
      updated: processed,
      message: `Đã xử lý ${processed} receipt(s) — sheetStatuses đã được cập nhật`,
    });
  } catch (err) {
    return errorResponse(err, "POST /api/admin/backfill-sheet-statuses");
  }
}
