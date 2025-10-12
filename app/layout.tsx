import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Play As You Like",
  description:
    "お気に入りの楽曲をすぐにリズムゲームとして楽しめる Play As You Like のランディングページ。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
