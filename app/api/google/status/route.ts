import { NextResponse } from "next/server";
import { getGoogleStatusForCurrentUser } from "@/lib/google/auth";
import { errorResponse } from "@/lib/http/api-helpers";

// GET /api/google/status — trạng thái kết nối Google Sheets của user hiện tại.
export async function GET() {
  try {
    const status = await getGoogleStatusForCurrentUser();
    return NextResponse.json(status);
  } catch (err) {
    return errorResponse(err, "GET /api/google/status");
  }
}
