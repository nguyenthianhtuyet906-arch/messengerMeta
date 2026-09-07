import "server-only";

import { ObjectId, type WithId, type Document } from "mongodb";
// Dùng OAuth2 từ chính @googleapis/sheets để khớp type với client Sheets (tránh lệch google-auth-library).
import { sheets as makeSheets, auth as googleAuth, type sheets_v4 } from "@googleapis/sheets";
import { auth, GOOGLE_SHEETS_SCOPE } from "@/auth";
import { getDb } from "@/lib/db/collections";

/** Người dùng chưa kết nối Google (thiếu refresh_token hoặc thiếu scope Sheets) → route trả 409. */
export class GoogleNotConnectedError extends Error {
  code = "google_not_connected" as const;
  constructor(message = "google not connected") {
    super(message);
  }
}

interface GoogleAccount {
  email: string;
  refreshToken: string | null;
  accessToken: string | null;
  expiresAt: number | null; // unix seconds
  scope: string;
  providerAccountId: string;
}

/** Lấy account Google của user đang đăng nhập từ collection `accounts` (do next-auth adapter ghi). */
async function findGoogleAccount(): Promise<{ email: string; account: WithId<Document> | null }> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new GoogleNotConnectedError("unauthenticated");

  const db = await getDb();
  const user = await db.collection("users").findOne({ email }, { projection: { _id: 1 } });
  if (!user) return { email, account: null };

  const account = await db.collection("accounts").findOne({
    userId: user._id,
    provider: "google",
  });
  return { email, account };
}

function hasSheetsScope(scope: string): boolean {
  return scope.split(/\s+/).includes(GOOGLE_SHEETS_SCOPE);
}

/** Trạng thái kết nối Google của user hiện tại (cho /api/google/status). */
export async function getGoogleStatusForCurrentUser(): Promise<{
  connected: boolean;
  scopeOk: boolean;
  email: string | null;
}> {
  try {
    const { email, account } = await findGoogleAccount();
    if (!account) return { connected: false, scopeOk: false, email };
    const refreshToken = typeof account.refresh_token === "string" ? account.refresh_token : "";
    const scope = typeof account.scope === "string" ? account.scope : "";
    return {
      connected: Boolean(refreshToken),
      scopeOk: hasSheetsScope(scope),
      email,
    };
  } catch (err) {
    if (err instanceof GoogleNotConnectedError && err.message === "unauthenticated") {
      return { connected: false, scopeOk: false, email: null };
    }
    throw err;
  }
}

async function getRequiredGoogleAccount(): Promise<GoogleAccount> {
  const { email, account } = await findGoogleAccount();
  if (!account) throw new GoogleNotConnectedError();
  const refreshToken = typeof account.refresh_token === "string" ? account.refresh_token : null;
  const scope = typeof account.scope === "string" ? account.scope : "";
  if (!refreshToken || !hasSheetsScope(scope)) throw new GoogleNotConnectedError();
  return {
    email,
    refreshToken,
    accessToken: typeof account.access_token === "string" ? account.access_token : null,
    expiresAt: typeof account.expires_at === "number" ? account.expires_at : null,
    scope,
    providerAccountId: String(account.providerAccountId ?? ""),
  };
}

/** Ghi token mới (sau refresh) về account doc để tái dùng, tránh refresh lại mỗi request. */
async function persistRefreshedTokens(
  providerAccountId: string,
  accessToken: string | null | undefined,
  expiryDateMs: number | null | undefined,
): Promise<void> {
  if (!accessToken) return;
  try {
    const db = await getDb();
    await db.collection("accounts").updateOne(
      { provider: "google", providerAccountId },
      {
        $set: {
          access_token: accessToken,
          expires_at: expiryDateMs ? Math.floor(expiryDateMs / 1000) : null,
        },
      },
    );
  } catch (err) {
    console.error("[google.auth] persist refreshed token failed", err);
  }
}

/**
 * Tạo Sheets client (v4) đã uỷ quyền bằng OAuth của user đang đăng nhập.
 * OAuth2Client tự refresh access_token khi hết hạn (nhờ refresh_token) và bắn event `tokens`.
 */
export async function getAuthorizedSheetsClient(): Promise<sheets_v4.Sheets> {
  const acc = await getRequiredGoogleAccount();

  const oauth = new googleAuth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET,
  );
  oauth.setCredentials({
    refresh_token: acc.refreshToken ?? undefined,
    access_token: acc.accessToken ?? undefined,
    expiry_date: acc.expiresAt ? acc.expiresAt * 1000 : undefined,
  });
  oauth.on("tokens", (tokens) => {
    void persistRefreshedTokens(acc.providerAccountId, tokens.access_token, tokens.expiry_date);
  });

  return makeSheets({ version: "v4", auth: oauth });
}

/** Bắt lỗi token thu hồi/hết hạn từ google-auth-library → coi như chưa kết nối (409). */
export function isInvalidGrantError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /invalid_grant|invalid_token|no refresh token|unauthorized_client/i.test(msg);
}

export { ObjectId };
