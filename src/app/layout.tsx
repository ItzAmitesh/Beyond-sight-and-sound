import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Beyond Sight & Sound — Inclusive Play for Every Child",
  description:
    "Inclusive, gamified learning and entertainment for deaf and visually impaired children. Two sensory journeys — Visual/Sign and Audio-Tactile — one shared adventure with Kiko the Firefly. Proof-of-concept built from the BCA (UX) major project SRS.",
  keywords: ["accessibility", "inclusive play", "ISL", "audio-tactile", "gamified learning", "children", "proof of concept"],
  authors: [{ name: "Siddhi Soni & Amitesh Gupta — Jagran Lakecity University" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Beyond Sight & Sound",
    description: "Different senses. Same adventures. Inclusive gamified learning for deaf and visually impaired children.",
    siteName: "Beyond Sight & Sound",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
