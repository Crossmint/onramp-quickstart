import React, { useState, useEffect } from "react";
import Onramp from "@/components/onramp";
import Image from "next/image";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Native integrations",
    description:
      "Embedded and headless flows that look and feel fully native to your app.",
    iconPath: "/window.svg",
  },
  {
    title: "Progressive onboarding",
    description:
      "Light kyc for up to $1,000 per year. See the checkout to explore no-KYC flows",
    iconPath: "/log-in.svg",
  },
  {
    title: "Observability",
    description:
      "Dashboards, webhooks, and APIs to monitor activity in real time",
    iconPath: "/globe.svg",
  },
  {
    title: "Full chargeback protection",
    description:
      "Crossmint manages disputes and assumes chargeback risk",
    iconPath: "/shield-check.svg",
  },
];

export function LandingPage() {
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    // Trigger feature animations after the page transition completes
    const timer = setTimeout(() => {
      setShowFeatures(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-5">
      {/* Left side - Information with background */}
      <div
        className="relative hidden lg:flex flex-col rounded-[20px] justify-center px-18 py-8 m-3 col-span-2"
        style={{
          backgroundImage: `url('/grid-bg.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Dark overlay for better text readability */}
        <div
          className={cn(
            "absolute rounded-[20px] inset-0 bg-black/40 transition-opacity duration-600 ease-out",
            showFeatures ? "opacity-100" : "opacity-0"
          )}
        ></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col gap-12 text-white">
          <div className="flex flex-col gap-4">
            <h1 className="text-6xl font-bold">Onramp demo</h1>
            <p className="text-white/60 text-lg">
              Allow users to fund their wallets. Use this card to test the
              flow <span className="underline decoration-white/50 underline-offset-4">4242 4242 4242 4242</span>
            </p>
          </div>

          {/* Features list */}
          <div className="flex flex-col gap-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`flex items-start gap-5 p-4 backdrop-blur-sm rounded-2xl bg-blue-300/3 border border-white/10 transition-all duration-600 ease-out ${
                  showFeatures
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: showFeatures ? `${index * 150}ms` : "0ms",
                }}
              >
                <div className="w-10 h-10 border-white/20 border-2 rounded-full flex items-center justify-center self-center flex-shrink-0">
                  <Image
                    className="filter-green w-6"
                    src={feature.iconPath}
                    alt={feature.title}
                    width={20}
                    height={20}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-white">{feature.title}</h3>
                  <p className="text-sm text-white/60">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer actions */}
          <div className="mt-2 flex items-center gap-8 text-white/80">
            <a
              href="https://www.crossmint.com/contact/sales"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-white/80 hover:text-white focus:text-white visited:text-white/80 active:text-white transition-colors"
            >
              <Image src="/file.svg" alt="Contact sales" width={18} height={18} />
              <span>Contact sales</span>
            </a>
            <a
              href="https://github.com/Crossmint/onramp-quickstart"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-white/80 hover:text-white focus:text-white visited:text-white/80 active:text-white transition-colors"
            >
              <Image src="/code.svg" alt="View code" width={18} height={18} />
              <span>View code</span>
            </a>
          </div>
        </div>
      </div>

      {/* Right side - Onramp Flow */}
      <div className="flex items-center justify-center bg-gray-50 px-6 py-12 col-span-1 lg:col-span-3">
        <div className="w-full max-w-md bg-white rounded-3xl border shadow-lg overflow-hidden">
          <Onramp />
        </div>
      </div>
    </div>
  );
}
