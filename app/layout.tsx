import type { Metadata } from "next";
import "../style.css";
import "./app.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
