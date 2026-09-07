import { NextResponse, type NextRequest } from "next/server";
import { requireEmail, errorResponse } from "@/lib/http/api-helpers";
import { writeOrderRow } from "@/lib/services/sheet-order";

// POST /api/sheets/update  body: { configId, itemId, rowNumber, updates, expected? }
export async function POST(req: NextRequest) {
  try {
    const gate = await requireEmail();
    if (gate instanceof NextResponse) return gate;
    const body = (await req.json()) as {
      configId?: string;
      itemId?: string;
      rowNumber?: number;
      updates?: Record<string, string>;
      expected?: Record<string, string>;
    };
    if (!body.configId || !body.itemId || typeof body.rowNumber !== "number" || !body.updates) {
      return NextResponse.json({ error: "thiếu tham số" }, { status: 400 });
    }
    const match = await writeOrderRow({
      configId: body.configId,
      itemId: body.itemId,
      rowNumber: body.rowNumber,
      updates: body.updates,
      expected: body.expected,
    });
    return NextResponse.json({ match });
  } catch (err) {
    return errorResponse(err, "POST /api/sheets/update");
  }
}
