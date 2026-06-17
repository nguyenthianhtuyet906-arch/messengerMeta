import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./lib/mongodb-client";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Lưu users/accounts cùng DB với dữ liệu app (meta_local) để join sender_email.
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB || "meta_local",
  }),
  session: { strategy: "jwt" },
});
