"use client";

import React, { useState } from "react";
import { useCrossmintOnramp } from "@/lib/useCrossmintOnramp";
import OnrampDeposit from "@/components/onramp-deposit";
import RecipientInput from "@/components/recipient-input";
import OnrampStatus from "@/components/onramp-status";

const RETURNING_EMAIL = "quickstarts@crossmint.com";
const RETURNING_WALLET = "x4zyf8T6n6NVN3kBW6fmzBvNVAGuDE8mzmzqkSUUh3U";
const INITIAL_AMOUNT_USD = "5.00";

export default function Onramp() {

  const [activeTab, setActiveTab] = useState<"returning" | "new">("returning");
  const [email, setEmail] = useState(RETURNING_EMAIL);
  const [walletAddress, setWalletAddress] = useState(RETURNING_WALLET);
  const [amountUsd, setAmountUsd] = useState(INITIAL_AMOUNT_USD);
  const [newUserStep, setNewUserStep] = useState<"collect" | "deposit">("deposit");

  const { order, createOrder, reset } = useCrossmintOnramp({
    email,
    walletAddress,
  });

  const handleCreateOrder = () => createOrder(amountUsd);

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 rounded border px-2 py-1 w-fit">
          <button
            className={`rounded px-4 py-2 text-sm font-medium ${
              activeTab === "returning" ? "bg-gray-100 text-gray-900" : "text-gray-600"
            }`}
            onClick={() => {
              setActiveTab("returning");
              setEmail(RETURNING_EMAIL);
              setWalletAddress(RETURNING_WALLET);
              setAmountUsd(INITIAL_AMOUNT_USD);
              setNewUserStep("deposit");
              reset();
            }}
          >
            Returning user
          </button>
          <button
            className={`rounded px-4 py-2 text-sm font-medium ${
              activeTab === "new" ? "bg-gray-100 text-gray-900" : "text-gray-600"
            }`}
            onClick={() => {
              setActiveTab("new");
              setEmail("");
              setWalletAddress("");
              setAmountUsd(INITIAL_AMOUNT_USD);
              setNewUserStep("collect");
              reset();
            }}
          >
            New user (KYC)
          </button>
        </div>

        {activeTab === "new" && newUserStep === "collect" ? (
          <>
            <RecipientInput
              email={email}
              setEmail={setEmail}
              walletAddress={walletAddress}
              setWalletAddress={setWalletAddress}
            />
            <div className="mt-6">
              <button
                className="bg-black text-white rounded px-4 py-2 w-full disabled:opacity-50"
                onClick={() => setNewUserStep("deposit")}
                disabled={!email || !walletAddress}
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <OnrampDeposit
            amountUsd={amountUsd}
            setAmountUsd={setAmountUsd}
            order={order}
            onContinue={handleCreateOrder}
          />
        )}

        <OnrampStatus order={order} />
      </div>
    </div>
  );
}


