"use client";

import React, { useState } from "react";
import { useCrossmintOnramp } from "@/lib/useCrossmintOnramp";

declare global {
  interface Window {
    Persona?: any;
  }
}

export default function Onramp() {
  const RETURNING_EMAIL = "quickstarts@crossmint.com";
  const RETURNING_WALLET = "x4zyf8T6n6NVN3kBW6fmzBvNVAGuDE8mzmzqkSUUh3U";

  const [email] = useState(RETURNING_EMAIL);
  const [walletAddress] = useState(RETURNING_WALLET);
  const [amountUsd, setAmountUsd] = useState("0");

  const { status, error, feeUsd, totalUsd, createOrder } = useCrossmintOnramp({
    email,
    walletAddress,
  });

  const handleCreateOrder = () => createOrder(amountUsd);

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4">
        {/* Tabs header (Returning user only) */}
        <div className="flex items-center gap-2 rounded border px-2 py-1 w-fit">
          <button className="bg-gray-100 text-gray-900 rounded px-4 py-2 text-sm font-medium cursor-default">
            Returning user
          </button>
          <button className="rounded px-4 py-2 text-sm text-gray-500 cursor-not-allowed" disabled>
            New user (KYC)
          </button>
        </div>

        {/* Deposit card */}
        <div className="border rounded p-6">
          <h2 className="text-lg font-semibold text-center">Deposit</h2>
          <div className="mt-4 flex flex-col items-center">
            <div className="text-sm text-gray-500">$</div>
            <input
              className="text-5xl font-semibold text-gray-800 text-center outline-none w-full max-w-[240px]"
              type="number"
              min={0}
              step={1}
              value={amountUsd}
              onChange={(e) => setAmountUsd(e.target.value)}
            />
          </div>

          {feeUsd !== null && totalUsd !== null && (
            <div className="mt-6 grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-gray-600">Added to your balance</div>
              <div className="text-right">${(
                parseFloat(totalUsd) - parseFloat(feeUsd)
              ).toFixed(2)}</div>
              <div className="text-gray-600">Fees</div>
              <div className="text-right">${parseFloat(feeUsd).toFixed(2)}</div>
              <div className="text-gray-600">Total amount</div>
              <div className="text-right font-medium">${parseFloat(totalUsd).toFixed(2)}</div>
            </div>
          )}

          {feeUsd == null && totalUsd == null && (
            <div className="mt-6">
            <button
              className="bg-black text-white rounded px-4 py-2 w-full disabled:opacity-50"
              onClick={handleCreateOrder}
              disabled={status === "creating-order"}
            >
              {status === "creating-order"
                ? "Creating order..."
                : "Continue"}
            </button>
          </div>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {(status === "requires-kyc" || status === "polling-kyc") && (
          <div className="border rounded p-4">
            <div id="persona-container" />
            <p className="text-sm text-gray-600 mt-2">Complete KYC to continue.</p>
          </div>
        )}

        {status === "awaiting-payment" && (
          <div className="border rounded p-4">
            <div id="payment-container" />
          </div>
        )}

        {status === "polling-payment" && (
          <div className="border rounded p-4 text-sm text-gray-700">
            Finalizing your payment... This may take a few seconds.
          </div>
        )}

        {status === "delivering" && (
          <div className="border rounded p-4 text-sm text-gray-700">
            Delivering tokens to your wallet... Hang tight.
          </div>
        )}

        {status === "success" && (
          <div className="text-green-600">Tokens delivered.</div>
        )}
        {status === "payment-failed" && (
          <div className="text-red-600">Payment failed. Please try again.</div>
        )}
      </div>
    </div>
  );
}


