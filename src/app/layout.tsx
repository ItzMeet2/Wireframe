import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WireGen — Stack-Agnostic Low-Fidelity Wireframe Studio",
  description: "Scan any workspace and automatically generate editable, low-fidelity wireframes with AI and deterministic extractors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="h-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
