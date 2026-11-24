import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../style.css";
import "./app.css";
import { createWebsiteSchema, getSiteUrl } from "@/lib/seo";

// next/font automatically self-hosts Inter — no external network request at runtime.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
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
    <html lang="en" className={inter.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(createWebsiteSchema()),
          }}
        />
        {children}
      </body>
    </html>
  );
}
