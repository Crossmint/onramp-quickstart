"use client";

import React from "react";

type Props = {
  amountUsd: string;
  setAmountUsd: (v: string) => void;
  feeUsd: string | null;
  totalUsd: string | null;
  status: string;
  onContinue: () => void;
  children?: React.ReactNode;
};

function PricingInfo({ feeUsd, totalUsd }: { feeUsd: string | null; totalUsd: string | null }) {
  if (feeUsd === null || totalUsd === null) return null;

  return (
    <div className="mt-6 bg-gray-50 rounded-lg p-4">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Added to your balance</span>
          <span className="text-gray-900 font-medium">${(parseFloat(totalUsd) - parseFloat(feeUsd)).toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Fees</span>
          <span className="text-gray-900 font-medium">${parseFloat(feeUsd).toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-gray-900 font-medium">Total amount</span>
          <span className="text-gray-900 font-semibold text-lg">${parseFloat(totalUsd).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default function OnrampDeposit({
  amountUsd,
  setAmountUsd,
  feeUsd,
  totalUsd,
  status,
  onContinue,
  children,
}: Props) {
  return (
    <div className="border rounded p-6">
      <h2 className="text-lg font-semibold text-center">Deposit</h2>

      {children}

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

      <PricingInfo feeUsd={feeUsd} totalUsd={totalUsd} />

      {feeUsd == null && totalUsd == null && (
        <div className="mt-6">
          <button
            className="bg-black text-white rounded px-4 py-2 w-full disabled:opacity-50"
            onClick={onContinue}
            disabled={status === "creating-order"}
          >
            {status === "creating-order" ? "Creating order..." : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}


