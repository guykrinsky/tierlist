"use client";

import { BackgroundMusic } from "@/components/BackgroundMusic";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BackgroundMusic />
    </>
  );
}

