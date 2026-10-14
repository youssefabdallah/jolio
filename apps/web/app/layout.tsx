/* eslint-disable @next/next/no-page-custom-font -- root layout wraps every page, so this font <link> loads globally, not per-page */
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jolio",
  description: "AI-powered job folio: tailored applications grounded in your real profile.",
};

export const viewport: Viewport = {
  themeColor: "#f7f4ec",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        {/* Font files only — every font-family token and class lives in globals.css.
            A plain <link> is required because the CSS pipeline strips external @import URLs. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=JetBrains+Mono:wght@400&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
