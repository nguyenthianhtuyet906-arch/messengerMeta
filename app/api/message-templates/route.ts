import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getMessageTemplatesCollection } from "@/lib/db/collections";

// GET /api/message-templates?scope=mine|all&q=searchTerm
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") ?? "mine";
    const q = (searchParams.get("q") ?? "").trim();

    const col = await getMessageTemplatesCollection();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (scope === "mine") filter.email = session.user.email;
    if (q) filter.$or = [{ title: { $regex: q, $options: "i" } }, { content: { $regex: q, $options: "i" } }];

    const docs = await col.find(filter).sort({ created_at: -1 }).toArray();
    const items = docs.map((d) => ({ ...d, _id: d._id!.toString() }));
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/message-templates]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/message-templates  body: { title, content }
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const body = (await req.json()) as { title?: string; content?: string };
    const title = (body.title ?? "").trim();
    const content = (body.content ?? "").trim();
    if (!title) return NextResponse.json({ error: "title bắt buộc" }, { status: 400 });
    if (!content) return NextResponse.json({ error: "content bắt buộc" }, { status: 400 });

    const now = new Date();
    const col = await getMessageTemplatesCollection();
    const result = await col.insertOne({
      email: session.user.email,
      title,
      content,
      created_at: now,
      updated_at: now,
    });

    const item = { _id: result.insertedId.toString(), email: session.user.email, title, content, created_at: now.toISOString(), updated_at: now.toISOString() };
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/message-templates]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
