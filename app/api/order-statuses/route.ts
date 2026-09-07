import { NextResponse, type NextRequest } from "next/server";
import { requireEmail, errorResponse } from "@/lib/http/api-helpers";
import { createOrderStatus, listOrderStatuses } from "@/lib/services/order-status";

// GET /api/order-statuses — danh sách trạng thái đơn (tự seed nếu rỗng).
export async function GET() {
  try {
    const gate = await requireEmail();
    if (gate instanceof NextResponse) return gate;
    return NextResponse.json({ statuses: await listOrderStatuses() });
  } catch (err) {
    return errorResponse(err, "GET /api/order-statuses");
  }
}

// POST /api/order-statuses  body: { name, color?, description?, displayOrder? }
export async function POST(req: NextRequest) {
  try {
    const gate = await requireEmail();
    if (gate instanceof NextResponse) return gate;
    const body = (await req.json()) as Record<string, unknown>;
    const created = await createOrderStatus({
      name: typeof body.name === "string" ? body.name : undefined,
      color: typeof body.color === "string" ? body.color : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      displayOrder: typeof body.displayOrder === "number" ? body.displayOrder : undefined,
    });
    return NextResponse.json({ status: created }, { status: 201 });
  } catch (err) {
    return errorResponse(err, "POST /api/order-statuses");
  }
}
