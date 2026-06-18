import type { NextAuthConfig } from "next-auth";

// Minimal config cho middleware (edge runtime) — chỉ verify JWT, không có provider.
// Providers cần network (Google OIDC discovery) không được import ở đây để tránh
// mỗi request phải fetch accounts.google.com/.well-known/openid-configuration.
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
};
