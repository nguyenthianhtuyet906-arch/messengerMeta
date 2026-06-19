import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import Google from "next-auth/providers/google";
import clientPromise from "./lib/mongodb-client";
import { authConfig } from "./auth.config";

// Scope đọc/ghi Google Sheets — cấp ngay khi đăng nhập để dùng access_token cho tính năng Sheet.
export const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // access_type=offline + prompt=consent → Google trả refresh_token (cần để gọi Sheets nền).
      authorization: {
        params: {
          scope: `openid email profile ${GOOGLE_SHEETS_SCOPE}`,
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
        },
      },
    }),
  ],
  // Lưu users/accounts cùng DB với dữ liệu app (meta_local) để join sender_email.
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB || "meta_local",
  }),
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    // Khi đăng nhập (có `account`), ghi đè token Google mới nhất vào collection `accounts`.
    // Cần thiết cho user CŨ tái cấp quyền (mở rộng scope Sheets): adapter chỉ linkAccount lần đầu,
    // nên ta tự cập nhật access_token/refresh_token/scope khi user consent lại.
    async jwt({ token, account }) {
      if (account && account.provider === "google") {
        try {
          const client = await clientPromise;
          const db = client.db(process.env.MONGODB_DB || "meta_local");
          await db.collection("accounts").updateOne(
            { provider: "google", providerAccountId: account.providerAccountId },
            {
              $set: {
                access_token: account.access_token ?? null,
                expires_at: account.expires_at ?? null,
                scope: account.scope ?? null,
                token_type: account.token_type ?? null,
                // refresh_token chỉ có khi consent → tránh ghi đè rỗng lên token cũ.
                ...(account.refresh_token
                  ? { refresh_token: account.refresh_token }
                  : {}),
              },
            },
          );
        } catch (err) {
          console.error("[auth.jwt] persist google tokens failed", err);
        }
      }
      return token;
    },
  },
});
