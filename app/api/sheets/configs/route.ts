import { NextResponse, type NextRequest } from "next/server";
import { requireEmail, errorResponse } from "@/lib/http/api-helpers";
import { createSheetConfig, listSheetConfigs } from "@/lib/services/sheet-config";

// GET /api/sheets/configs — danh sách spreadsheet đã kết nối.
export async function GET() {
  try {
    const gate = await requireEmail();
    if (gate instanceof NextResponse) return gate;
    return NextResponse.json({ configs: await listSheetConfigs() });
  } catch (err) {
    return errorResponse(err, "GET /api/sheets/configs");
  }
}

// POST /api/sheets/configs  body: { url, dataTabName?, prefixTabName? }
export async function POST(req: NextRequest) {
  try {
    const gate = await requireEmail();
    if (gate instanceof NextResponse) return gate;
    const body = (await req.json()) as {
      url?: string;
      dataTabName?: string;
      prefixTabName?: string;
    };
    if (!body.url || !body.url.trim()) {
      return NextResponse.json({ error: "Thiếu URL spreadsheet" }, { status: 400 });
    }
    const created = await createSheetConfig(
      { url: body.url, dataTabName: body.dataTabName, prefixTabName: body.prefixTabName },
      gate.email,
    );
    return NextResponse.json({ config: created }, { status: 201 });
  } catch (err) {
    return errorResponse(err, "POST /api/sheets/configs");
  }
}
