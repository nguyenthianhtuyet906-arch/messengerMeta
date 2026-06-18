import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import Google from "next-auth/providers/google";
import clientPromise from "./lib/mongodb-client";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  // Lưu users/accounts cùng DB với dữ liệu app (meta_local) để join sender_email.
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB || "meta_local",
  }),
  session: { strategy: "jwt" },
});
