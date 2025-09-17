"use client";

import React, { useEffect } from "react";

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
  useEffect(() => {
    if (!checkoutcomPaymentSession || !checkoutcomPublicKey) return;

    let stop = false;

    (async () => {
      const mod: any = await import("@checkout.com/checkout-web-components");
      if (stop) return;
      const checkout = await mod.loadCheckoutWebComponents({
        publicKey: checkoutcomPublicKey,
        paymentSession: checkoutcomPaymentSession,
        environment: "sandbox",
        locale: "en-US",
        appearance: {
          colorBorder: "#FFFFFF",
          colorAction: "#060735",
          borderRadius: ["8px", "50px"],
        },
        onReady: () => {},
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

  return <div id="payment-container" />;
}


