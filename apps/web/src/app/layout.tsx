import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";
import SecurityWrapper from "@/components/ui/SecurityWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interakt",
  description: "Interakt by project x² - Campus Social Media Application.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  themeColor: "#8b5cf6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SecurityWrapper>
          <ClientLayout>{children}</ClientLayout>
        </SecurityWrapper>
      </body>
    </html>
  );
}
