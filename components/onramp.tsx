"use client";

import CheckoutComEmbedded from "@/components/checkoutcom-embedded";
import OnrampDeposit from "@/components/onramp-deposit";
import OnrampStatus from "@/components/onramp-status";
import PersonaEmbedded from "@/components/persona-embedded";
import UserTypeSelector from "@/components/user-type-selector";
import { useCrossmintOnramp } from "@/lib/useCrossmintOnramp";
import { useState } from "react";

const USER_WALLET = "x4zyf8T6n6NVN3kBW6fmzBvNVAGuDE8mzmzqkSUUh3U";
const INITIAL_AMOUNT_USD = "5.00";

export default function Onramp() {
  const [amountUsd, setAmountUsd] = useState(INITIAL_AMOUNT_USD);
  const [userType, setUserType] = useState<"returning" | "new">("returning");
  const [activeEmail, setActiveEmail] = useState("demos+onramp-existing-user@crossmint.com");

  const { order, createOrder, resetOrder, checkout, persona } = useCrossmintOnramp({
    email: activeEmail,
    walletAddress: USER_WALLET,
  });

  const handleCreateOrder = () => createOrder(amountUsd);

  const handleUserTypeChange = (newUserType: "returning" | "new", email: string) => {
    setUserType(newUserType);
    setActiveEmail(email);
    resetOrder();
  };

  return (
    <div className="flex items-center justify-center bg-gray-50 px-6 py-12 col-span-1 lg:col-span-3">
      <div className="w-full max-w-md">
        {/* User type selection - outside the main box */}
        <UserTypeSelector
          userType={userType}
          onUserTypeChange={handleUserTypeChange}
        />

        {/* Main content box */}
        <div className="bg-white rounded-3xl border shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col gap-4">
              <OnrampDeposit
                amountUsd={amountUsd}
                setAmountUsd={setAmountUsd}
                order={order}
                onContinue={handleCreateOrder}
              />

              {order.status === "awaiting-payment" && checkout.session && checkout.publicKey && (
                <div>
                  <div>
                    <p className="text-sm mt-2 text-center">Use this card to test the payment process:</p>
                    <p className="text-sm font-semibold filter-green text-center">4242 4242 4242 4242.</p>
                  </div>
                  <hr className="mt-4" />
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
        </div>
      </div>
    </div>
  );
}


