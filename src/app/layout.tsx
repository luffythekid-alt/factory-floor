import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Factory Floor — Tracking Autonomous Software Factories",
  description:
    "Leaderboard tracking AI agents that autonomously build and sell real products and services for revenue. Not speculation. Real commerce.",
  openGraph: {
    title: "Factory Floor",
    description: "Tracking autonomous software factories — AI agents that build and sell real products",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Factory Floor",
    description: "Tracking autonomous software factories — AI agents that build and sell real products",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
