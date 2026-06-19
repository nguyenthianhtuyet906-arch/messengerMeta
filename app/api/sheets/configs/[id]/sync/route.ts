import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { requireEmail, errorResponse } from "@/lib/http/api-helpers";
import { syncSheetNow } from "@/lib/services/sheet-sync";
import { getSheetConfigsCollection } from "@/lib/db/collections";

// POST /api/sheets/configs/:id/sync — đồng bộ ngay 1 sheet (nút "Sync now").
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireEmail();
    if (gate instanceof NextResponse) return gate;
    const { id } = await ctx.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "id không hợp lệ" }, { status: 400 });
    }
    const { rowCount } = await syncSheetNow(new ObjectId(id));
    const coll = await getSheetConfigsCollection();
    const cfg = await coll.findOne({ _id: new ObjectId(id) });
    return NextResponse.json({
      rowCount,
      lastSyncedAt: cfg?.lastSyncedAt
        ? Math.floor(new Date(cfg.lastSyncedAt).getTime() / 1000)
        : null,
    });
  } catch (err) {
    return errorResponse(err, "POST /api/sheets/configs/:id/sync");
  }
}
