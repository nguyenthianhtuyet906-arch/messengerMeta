import { NextResponse, type NextRequest } from "next/server";
import { requireEmail, errorResponse } from "@/lib/http/api-helpers";
import { deleteOrderStatus, updateOrderStatus } from "@/lib/services/order-status";

// PATCH /api/order-statuses/:id  body: { name?, color?, description?, displayOrder? }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireEmail();
    if (gate instanceof NextResponse) return gate;
    const { id } = await ctx.params;
    const body = (await req.json()) as Record<string, unknown>;
    const updated = await updateOrderStatus(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      color: typeof body.color === "string" ? body.color : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      displayOrder: typeof body.displayOrder === "number" ? body.displayOrder : undefined,
    });
    return NextResponse.json({ status: updated });
  } catch (err) {
    return errorResponse(err, "PATCH /api/order-statuses/:id");
  }
}

// DELETE /api/order-statuses/:id
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireEmail();
    if (gate instanceof NextResponse) return gate;
    const { id } = await ctx.params;
    await deleteOrderStatus(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return errorResponse(err, "DELETE /api/order-statuses/:id");
  }
}
