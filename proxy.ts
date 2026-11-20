import { readerAuth } from "@/lib/reader-auth/server";

export default readerAuth.middleware({
  loginUrl: "/auth/sign-in",
  publicRoutes: [
    "/admin",
    "/api/admin",
    "/api/admin-auth",
    "/googlecc2a4d53d85ab3d8.html",
  ],
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|style\\.css|script\\.js|googlecc2a4d53d85ab3d8\\.html).*)",
  ],
};
