import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "KOPAR-MOVE | Kopargaon Mobility Operating System",
  description:
    "Intelligent mobility, transit dispatch, and agricultural logistics optimization platform for Kopargaon, Maharashtra.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
