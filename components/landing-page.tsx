import React from "react";
import Onramp from "@/components/onramp";
import FeatureHighlights from "@/components/feature-highlights";

export function LandingPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-5">
      <FeatureHighlights />

      <Onramp />
    </div>
  );
}
