import { readerAuth } from "@/lib/reader-auth/server";

export default readerAuth.middleware({
  loginUrl: "/auth/sign-in",
  publicRoutes: [
    "/",
    "/articles",
    "/admin",
    "/api/admin",
    "/api/admin-auth",
    "/api/articles",
    "/googlecc2a4d53d85ab3d8.html",
    "/robots.txt",
    "/sitemap.xml",
  ],
});

export const config = {
  matcher: ["/settings/:path*"],
};
