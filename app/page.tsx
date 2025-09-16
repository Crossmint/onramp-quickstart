"use client";

import { LandingPage } from "@/components/landing-page";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <LandingPage />
      </main>
    </div>
  );
}
