import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ClientProviders } from "@/components/ClientProviders";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TIERLIST - The Party Game",
  description: "Real-time party game of ranking and intuition. Guess the numbers, outsmart your friends!",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen gradient-bg branded-bg`}>
        <ClientProviders>
          {children}
        </ClientProviders>
        <Toaster />
      </body>
    </html>
  );
}

