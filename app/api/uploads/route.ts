import { NextResponse, type NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";

// MIME ảnh được phép — tương ứng isImageFile của DORA (message_service.go),
// bổ sung webp cho phù hợp ảnh hiện đại.
const ALLOWED = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_BYTES = 15 * 1024 * 1024; // 15MB / ảnh

/**
 * POST /api/uploads  (multipart/form-data, field "files")
 * Upload ảnh lên Vercel Blob (public URL) để extension fetch rồi upload2Etsy.
 * Trả { urls: string[] }.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN chưa cấu hình" },
        { status: 500 },
      );
    }

    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: "no files" }, { status: 400 });
    }

    const urls: string[] = [];
    for (const file of files) {
      if (!ALLOWED.has(file.type)) {
        return NextResponse.json(
          { error: `loại file không hợp lệ: ${file.type || "unknown"}` },
          { status: 400 },
        );
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: "ảnh quá lớn (>15MB)" }, { status: 400 });
      }
      const blob = await put(file.name || "image.png", file, {
        access: "public",
        addRandomSuffix: true,
        contentType: file.type,
      });
      urls.push(blob.url);
    }

    return NextResponse.json({ urls });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/uploads]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
