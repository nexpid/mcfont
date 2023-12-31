import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import isProduction from "@/lib/isProduction";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? isProduction()
        ? "https://mcfont.nexpid.xyz"
        : "https://" + process.env.VERCEL_URL
      : `http://localhost:${process.env.PORT || 3000}`
  ),
  title: "Minecraft Font Tool",
  description: "A tool for making custom Minecraft fonts",
  openGraph: {
    images: isProduction() ? "/images/title.png" : "/images/titlestaging.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#37C7E8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <meta name="darkreader-lock" />
      <body className={inter.className}>
        <main className="flex min-h-screen flex-col items-center pt-8 px-24 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
          <div className="w-full max-w-3xl flex flex-col justify-center gap-2">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
