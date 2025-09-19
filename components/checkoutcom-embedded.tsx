"use client";

import { loadCheckoutWebComponents } from "@checkout.com/checkout-web-components";
import React, { useEffect, useState } from "react";

type Props = {
  checkoutcomPaymentSession: any;
  checkoutcomPublicKey: string;
  onPaymentCompleted: () => void;
};

export default function CheckoutComEmbedded({
  checkoutcomPaymentSession,
  checkoutcomPublicKey,
  onPaymentCompleted,
}: Props) {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    if (!checkoutcomPaymentSession || !checkoutcomPublicKey) return;

    let stop = false;

    (async () => {
      if (stop) return;
      const checkout = await loadCheckoutWebComponents({
        publicKey: checkoutcomPublicKey,
        paymentSession: checkoutcomPaymentSession,
        environment: "sandbox",
        locale: "en-US",
        appearance: {
          colorBorder: "#FFFFFF",
          colorAction: "#060735",
          borderRadius: ["8px", "50px"],
        },
        onReady: () => setIsReady(true),
        onPaymentCompleted: () => {
          onPaymentCompleted();
        },
        onChange: (_component: { type: string; isValid: () => boolean }) => {},
        onError: (_component: { type: string }, _error: Error) => {},
      });
      checkout.create("flow").mount("#payment-container");
    })();

    return () => {
      stop = true;
    };
  }, [checkoutcomPaymentSession, checkoutcomPublicKey, onPaymentCompleted]);

  return (
    <>
      <div id="payment-container"/>
      {!isReady && <div>Loading...</div>}
    </>
  );
}


