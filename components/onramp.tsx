"use client";

import React, { useState } from "react";
import { useCrossmintOnramp } from "@/lib/useCrossmintOnramp";
import OnrampDeposit from "@/components/onramp-deposit";
import OnrampStatus from "@/components/onramp-status";
import CheckoutComEmbedded from "@/components/checkoutcom-embedded";
import PersonaEmbedded from "@/components/persona-embedded";

// This email corresponds to a user that has already passed KYC in Staging.
// You can modify it to test the KYC flow (which this code already supports).
const RETURNING_EMAIL = "demos+onramp-existing-user@crossmint.com";
const RETURNING_WALLET = "x4zyf8T6n6NVN3kBW6fmzBvNVAGuDE8mzmzqkSUUh3U";
const INITIAL_AMOUNT_USD = "5.00";

export default function Onramp() {
  const [amountUsd, setAmountUsd] = useState(INITIAL_AMOUNT_USD);

  const { order, createOrder, checkout, persona } = useCrossmintOnramp({
    email: RETURNING_EMAIL,
    walletAddress: RETURNING_WALLET,
  });

  const handleCreateOrder = () => createOrder(amountUsd);

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4">
        <OnrampDeposit
          amountUsd={amountUsd}
          setAmountUsd={setAmountUsd}
          order={order}
          onContinue={handleCreateOrder}
        />

        {order.status === "awaiting-payment" && checkout.session && checkout.publicKey && (
          <div className="border rounded p-4">
            <div>
              <p className="text-sm mt-2 text-center">Use this card to test the payment process:</p>
              <p className="text-sm font-semibold filter-green text-center">4242 4242 4242 4242.</p>
            </div>
            <CheckoutComEmbedded
              checkoutcomPaymentSession={checkout.session}
              checkoutcomPublicKey={checkout.publicKey}
              onPaymentCompleted={checkout.startPaymentPolling}
            />
          </div>
        )}

        <OnrampStatus order={order} />

        {order.status === "requires-kyc" && persona && (
            <PersonaEmbedded
              config={persona.config}
              onComplete={persona.startKycPolling}
            />
        )}
      </div>
    </div>
  );
}


