import { NextResponse } from "next/server";
import { requireEmail, errorResponse } from "@/lib/http/api-helpers";
import { getGoogleStatusForCurrentUser } from "@/lib/google/auth";
import { syncAllStaleSheets } from "@/lib/services/sheet-sync";

// POST /api/sheets/sync-stale — auto-sync định kỳ (client gọi mỗi 2 phút).
//
// Nhiều user mở app cùng lúc đều gọi endpoint này, nhưng KHÔNG bị đồng bộ trùng:
//  1. Chỉ user đã kết nối Google (có scope) mới thực sự chạy sync — user khác bỏ qua sớm.
//  2. Mỗi sheet chỉ sync khi chỉ mục cũ quá TTL (~2 phút) — isStale lọc trong syncAllStaleSheets.
//  3. Cờ atomic `syncing` trong syncSheetNow đảm bảo 2 request đua nhau thì chỉ 1 cái chạy.
export async function POST() {
  try {
    const gate = await requireEmail();
    if (gate instanceof NextResponse) return gate;

    // User chưa kết nối/cấp quyền Google thì không gọi Sheets (tránh đẩy lastSyncError rác).
    const status = await getGoogleStatusForCurrentUser();
    if (!status.connected || !status.scopeOk) {
      return NextResponse.json({ synced: 0, skipped: 0, reason: "not_connected" });
    }

    const result = await syncAllStaleSheets();
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err, "POST /api/sheets/sync-stale");
  }
}
