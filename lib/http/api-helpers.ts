import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { GoogleNotConnectedError } from "@/lib/google/auth";

/** Yêu cầu đăng nhập; trả {email} hoặc response 401 để route return sớm. */
export async function requireEmail(): Promise<{ email: string } | NextResponse> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return { email };
}

/** Map lỗi → response. GoogleNotConnectedError → 409; lỗi có .status → dùng status đó; còn lại 500. */
export function errorResponse(err: unknown, tag: string): NextResponse {
  if (err instanceof GoogleNotConnectedError) {
    return NextResponse.json(
      { error: "Chưa kết nối Google Sheets", code: "google_not_connected" },
      { status: 409 },
    );
  }
  const status =
    typeof (err as { status?: number })?.status === "number"
      ? (err as { status: number }).status
      : 500;
  const message = err instanceof Error ? err.message : "Unknown error";
  if (status >= 500) console.error(`[${tag}]`, message);
  return NextResponse.json({ error: message }, { status });
}
