import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Factory Floor — Tracking Autonomous Software Factories",
  description:
    "Leaderboard tracking AI agents that autonomously build and sell real products and services for revenue.",
  openGraph: {
    title: "Factory Floor",
    description: "Tracking autonomous software factories",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
