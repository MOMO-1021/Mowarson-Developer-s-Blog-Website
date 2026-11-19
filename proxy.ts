import { readerAuth } from "@/lib/reader-auth/server";

export default readerAuth.middleware({
  loginUrl: "/auth/sign-in",
  publicRoutes: ["/admin", "/api/admin", "/api/admin-auth"],
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/|style\\.css|script\\.js).*)"],
};
