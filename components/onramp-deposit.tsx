"use client";

import React from "react";

type Props = {
  amountUsd: string;
  setAmountUsd: (v: string) => void;
  feeUsd: string | null;
  totalUsd: string | null;
  status: string;
  onContinue: () => void;
  children?: React.ReactNode; // optional extra inputs (e.g., email/wallet)
};

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


