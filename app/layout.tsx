import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
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
      <head>
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','GTM-5N6TFGZT');`
          }}
        />
        <noscript>
          <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5N6TFGZT"
            height="0" width="0" style="display:none;visibility:hidden"></iframe>
        </noscript>
      </head>
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
