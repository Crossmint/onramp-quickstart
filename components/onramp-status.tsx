"use client";

import React from "react";
import { Order } from "@/lib/types";

type Props = {
  order: Order;
};

export default function OnrampStatus({ order }: Props) {
  const { status, error, txId } = order;
  
  if (error) {
    return <div className="text-red-600 text-sm">{error}</div>;
  }

  if (status === "polling-kyc") {
    return (
      <div className="border rounded p-4 text-sm text-gray-700">
        Waiting for Persona verification... This can take a few moments.
      </div>
    );
  }

  if (status === "requires-kyc") {
    return (
      <div className="border rounded p-4">
        <div id="persona-container" />
        <p className="text-sm text-gray-600 mt-2">Complete KYC to continue.</p>
      </div>
    );
  }

  if (status === "polling-payment" || status === "delivering") {
    return (
      <div className="border rounded p-6 text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
        <div className="text-gray-900 font-medium">Order in progress...</div>
        <div className="text-gray-500 text-sm">Less than 1 minute remaining</div>
      </div>
    );
  }

  if (status === "success") {
    const handleNewDeposit = () => {
      if (typeof window !== "undefined") window.location.reload();
    };
    return (
      <div className="border rounded p-6 text-center">
        <div className="mx-auto w-12 h-12 mb-4 rounded-full flex items-center justify-center border-2 border-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-green-600">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div className="text-gray-900 font-semibold">Deposit completed</div>
        <div className="text-gray-500 text-sm mb-4">Funds added to your balance</div>
        <div className="flex flex-col gap-3 items-center">
          {txId && (
            <a
              href={`https://explorer.solana.com/tx/${txId}${process.env.CROSSMINT_ENV !== 'production' ? '?cluster=devnet' : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black text-white rounded-full px-5 py-2 text-sm w-full max-w-[220px]"
            >
              View transaction
            </a>
          )}
          <button
            onClick={handleNewDeposit}
            className="bg-gray-100 text-gray-900 rounded-full px-5 py-2 text-sm w-full max-w-[220px]"
          >
            New deposit
          </button>
        </div>
      </div>
    );
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
