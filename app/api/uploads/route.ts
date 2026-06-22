import { NextResponse, type NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/auth";

// MIME ảnh được phép — tương ứng isImageFile của DORA (message_service.go),
// bổ sung webp cho phù hợp ảnh hiện đại.
const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_BYTES = 15 * 1024 * 1024; // 15MB / ảnh

/**
 * POST /api/uploads  (JSON body từ @vercel/blob/client)
 * Cấp token để client upload ảnh TRỰC TIẾP lên Vercel Blob, bỏ qua giới hạn
 * 4.5MB body của Serverless Function. Trả về public URL để extension fetch
 * rồi upload2Etsy.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request: req,
      // Xác thực + ràng buộc loại/dung lượng ngay khi cấp token.
      onBeforeGenerateToken: async () => {
        const session = await auth();
        if (!session?.user?.email) {
          throw new Error("unauthenticated");
        }
        return {
          allowedContentTypes: ALLOWED,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        };
      },
      // Ảnh đã có public URL ngay sau upload; không cần xử lý thêm.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/uploads]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
