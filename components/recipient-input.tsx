"use client";

import React from "react";

type Props = {
  email: string;
  setEmail: (email: string) => void;
  walletAddress: string;
  setWalletAddress: (walletAddress: string) => void;
  title?: string;
  showTitle?: boolean;
};

export default function RecipientInput({
  email,
  setEmail,
  walletAddress,
  setWalletAddress,
  title = "Create account",
  showTitle = true,
}: Props) {
  return (
    <div className="border rounded p-6">
      {showTitle && <h2 className="text-lg font-semibold text-center">{title}</h2>}
      <div className="grid grid-cols-1 gap-3 mt-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Receipt email</span>
          <input
            className="border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Recipient wallet address</span>
          <input
            className="border rounded px-3 py-2"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Solana wallet address"
          />
        </label>
      </div>
    </div>
  );
}
