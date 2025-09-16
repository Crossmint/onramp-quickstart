import React from "react";
import Onramp from "@/components/onramp";
import FeatureHighlights from "@/components/feature-highlights";

export function LandingPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-5">
      <FeatureHighlights />

      <div className="flex items-center justify-center bg-gray-50 px-6 py-12 col-span-1 lg:col-span-3">
        <div className="w-full max-w-md bg-white rounded-3xl border shadow-lg overflow-hidden">
          <Onramp />
        </div>
      </div>
    </div>
  );
}
