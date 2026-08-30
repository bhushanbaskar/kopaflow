import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Silkscreen } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { AuthProvider } from "../lib/auth/authContext";

const geistPixel = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-geist-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KOPAR-MOVE | Kopargaon Mobility Operating System",
  description:
    "Intelligent mobility, logistics, civic feedback, and infrastructure authority platform for Kopargaon, Maharashtra.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${geistPixel.variable}`}
    >
      <body className="antialiased bg-[#f4f6f9] text-gray-950 font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
