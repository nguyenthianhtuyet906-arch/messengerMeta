import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";

export async function GET() {
  try {
    const conn = await connectMongoose();
    const dbName = conn.connection.db?.databaseName ?? null;
    return NextResponse.json({ ok: true, dbName });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
