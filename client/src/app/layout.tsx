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

// Updated metadata for your specific project
export const metadata: Metadata = {
  title: "NexusAI | Multi-Agent Intelligence",
  description: "Advanced research and intelligence platform powered by AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Added suppressHydrationWarning to stop the browser extension errors */}
      <body 
        className="min-h-full flex flex-col" 
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}