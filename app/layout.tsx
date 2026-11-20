import type { Metadata } from "next";
import "../style.css";
import "./app.css";
import { Providers } from "./providers";
import { createWebsiteSchema } from "@/lib/seo";

const siteUrl = "https://mowarson-developer-s-blog-website.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || siteUrl,
  ),
  title: {
    default: "The Journal — Mowarson Developer",
    template: "%s — Mowarson Developer",
  },
  description:
    "Straightforward lessons on websites, search, and growing a brand online.",
  icons: {
    icon: "/assets/favicon.png",
    apple: "/assets/apple-touch-icon.png",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(createWebsiteSchema()),
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
