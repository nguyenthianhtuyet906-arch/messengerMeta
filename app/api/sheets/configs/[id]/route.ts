import { NextResponse, type NextRequest } from "next/server";
import { requireEmail, errorResponse } from "@/lib/http/api-helpers";
import { deleteSheetConfig, updateSheetConfig } from "@/lib/services/sheet-config";

// PATCH /api/sheets/configs/:id  body: { dataTabName?, prefixTabName?, enabled?, order?, statusOptions? }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireEmail();
    if (gate instanceof NextResponse) return gate;
    const { id } = await ctx.params;
    const body = (await req.json()) as Record<string, unknown>;
    const updated = await updateSheetConfig(id, {
      dataTabName: typeof body.dataTabName === "string" ? body.dataTabName : undefined,
      prefixTabName: typeof body.prefixTabName === "string" ? body.prefixTabName : undefined,
      enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
      order: typeof body.order === "number" ? body.order : undefined,
      statusOptions: Array.isArray(body.statusOptions)
        ? (body.statusOptions as string[])
        : undefined,
    });
    return NextResponse.json({ config: updated });
  } catch (err) {
    return errorResponse(err, "PATCH /api/sheets/configs/:id");
  }
}

// DELETE /api/sheets/configs/:id
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireEmail();
    if (gate instanceof NextResponse) return gate;
    const { id } = await ctx.params;
    await deleteSheetConfig(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return errorResponse(err, "DELETE /api/sheets/configs/:id");
  }
}
