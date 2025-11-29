import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ClientProviders } from "@/components/ClientProviders";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "TIERLIST - The Party Game",
  description: "A multiplayer party game where you guess the rankings!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} min-h-screen gradient-bg`}>
        <ClientProviders>
          {children}
        </ClientProviders>
        <Toaster />
      </body>
    </html>
  );
}

