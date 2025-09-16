"use client";

import React from "react";
import { OnrampStatus as StatusType } from "@/lib/useCrossmintOnramp";

type Props = {
  status: StatusType;
  error: string | null;
};

export default function OnrampStatus({ status, error }: Props) {
  if (error) {
    return <div className="text-red-600 text-sm">{error}</div>;
  }

  if (status === "requires-kyc" || status === "polling-kyc") {
    return (
      <div className="border rounded p-4">
        <div id="persona-container" />
        <p className="text-sm text-gray-600 mt-2">Complete KYC to continue.</p>
      </div>
    );
  }

  if (status === "awaiting-payment") {
    return (
      <div className="border rounded p-4">
        <div id="payment-container" />
      </div>
    );
  }

  if (status === "polling-payment") {
    return (
      <div className="border rounded p-4 text-sm text-gray-700">
        Finalizing your payment... This may take a few seconds.
      </div>
    );
  }

  if (status === "delivering") {
    return (
      <div className="border rounded p-4 text-sm text-gray-700">
        Delivering tokens to your wallet... Hang tight.
      </div>
    );
  }

  if (status === "success") {
    return <div className="text-green-600">Tokens delivered.</div>;
  }

  if (status === "payment-failed") {
    return <div className="text-red-600">Payment failed. Please try again.</div>;
  }

  if (status === "rejected-kyc") {
    return <div className="text-red-600">KYC was rejected. Please try again.</div>;
  }

  if (status === "manual-kyc") {
    return <div className="text-yellow-600">KYC requires manual review. We'll contact you soon.</div>;
  }

  return null;
}
