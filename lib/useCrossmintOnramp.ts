"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CreateOrderResponse, GetOrderResponse, ApiErrorResponse } from "./types";

export type OnrampStatus =
  | "not-created"
  | "creating-order"
  | "requires-kyc"
  | "polling-kyc"
  | "awaiting-payment"
  | "polling-payment"
  | "delivering"
  | "success"
  | "payment-failed"
  | "manual-kyc"
  | "rejected-kyc"
  | "error";

type UseCrossmintOnrampArgs = {
  email: string;
  walletAddress: string;
};

export function useCrossmintOnramp({
  email,
  walletAddress,
}: UseCrossmintOnrampArgs) {
  const [status, setStatus] = useState<OnrampStatus>("not-created");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [personaConfig, setPersonaConfig] = useState<any | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<any | null>(null);
  const [feeUsd, setFeeUsd] = useState<string | null>(null);
  const [totalUsd, setTotalUsd] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  const statusRef = useRef<OnrampStatus>(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const createOrder = useCallback(
    async (amountUsd: string) => {
      setError(null);
      setStatus("creating-order");
      setFeeUsd(null);
      setTotalUsd(null);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountUsd,
          receiptEmail: email,
          walletAddress,
          paymentMethod: "checkoutcom-flow",
        }),
      });
      const data: CreateOrderResponse | ApiErrorResponse = await res.json();
      if (!res.ok) {
        setError((data as ApiErrorResponse).error);
        setStatus("error");
        return;
      }
      
      const orderData = data as CreateOrderResponse;
      setOrderId(orderData.order.orderId);

      const lineItem = orderData.order.lineItems[0];
      const fee = lineItem.quote.charges.unit.amount;
      const total = orderData.order.quote.totalPrice.amount;
      setFeeUsd(fee);
      setTotalUsd(total);

      const paymentStatus = orderData.order.payment.status;
      if (paymentStatus === "requires-kyc") {
        const kyc = orderData.order.payment.preparation.kyc;
        setPersonaConfig(kyc);
        setStatus("requires-kyc");
      } else if (paymentStatus === "awaiting-payment") {
        setStatus("awaiting-payment");
        setPaymentConfig(orderData.order.payment.preparation);
      } else {
        setStatus(paymentStatus as OnrampStatus);
      }
    },
    [email, walletAddress]
  );

  const pollOrder = useCallback(async () => {
    if (!orderId) return;
    const res = await fetch(`/api/orders/${orderId}`);
    const data: GetOrderResponse | ApiErrorResponse = await res.json();
    if (!res.ok) {
      setError((data as ApiErrorResponse).error);
      setStatus("error");
      return;
    }
    
    const orderData = data as GetOrderResponse;
    const paymentStatus = orderData.payment.status;
    const orderPhase = orderData.phase;
    const deliveryStatus = orderData.lineItems[0].delivery.status;
    
    if (paymentStatus === "awaiting-payment") {
      setPaymentConfig(orderData.payment.preparation);
      setStatus("awaiting-payment");
    } else if (paymentStatus === "rejected-kyc") {
      setStatus("rejected-kyc");
    } else if (paymentStatus === "manual-kyc") {
      setStatus("manual-kyc");
    } else if (
      paymentStatus === "succeeded" ||
      paymentStatus === "success" ||
      paymentStatus === "completed" ||
      paymentStatus === "paid"
    ) {
      if (orderPhase === "completed" || deliveryStatus === "completed") {
        setStatus("success");
        const txId = orderData.lineItems[0].delivery.txId;
        if (txId) setTxId(txId);
      } else {
        setStatus("delivering");
      }
    } else if (
      paymentStatus === "failed" ||
      paymentStatus === "declined" ||
      paymentStatus === "payment-failed"
    ) {
      setStatus("payment-failed");
    }
  }, [orderId]);

  useEffect(() => {
    if (status !== "requires-kyc") return;
    if (!personaConfig) return;
    
    (async () => {
      const personaMod: any = await import("persona");
      const PersonaClient = personaMod.Client || personaMod.default.Client;
      const client = new PersonaClient({
        templateId: personaConfig.templateId,
        referenceId: personaConfig.referenceId,
        environmentId: personaConfig.environmentId,
        onReady: () => client.open(),
        onComplete: () => {
          setStatus("polling-kyc");
          const interval = setInterval(async () => {
            await pollOrder();
          }, 5000);
          const stopWhenReady = setInterval(() => {
            if (statusRef.current === "awaiting-payment") {
              clearInterval(interval);
              clearInterval(stopWhenReady);
            }
          }, 1000);
        },
        onCancel: () => {},
        onError: (e: any) => {
          setError(String(e.message || e));
          setStatus("error");
        },
      });
    })();
  }, [personaConfig, status, pollOrder]);

  useEffect(() => {
    if (status !== "awaiting-payment") return;
    if (!paymentConfig) return;
    const { checkoutcomPaymentSession, checkoutcomPublicKey } = paymentConfig;
    
    (async () => {
      const mod: any = await import("@checkout.com/checkout-web-components");
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
        onPaymentCompleted: (_component: unknown, _paymentResponse: { id: string }) => {
          setStatus("polling-payment");
          const interval = setInterval(async () => {
            await pollOrder();
          }, 4000);
          const stopWhenDone = setInterval(() => {
            if (
              statusRef.current === "success" ||
              statusRef.current === "payment-failed"
            ) {
              clearInterval(interval);
              clearInterval(stopWhenDone);
            }
          }, 1000);
        },
        onChange: (_component: { type: string; isValid: () => boolean }) => {},
        onError: (_component: { type: string }, error: Error) => {
          setError(`Payment error: ${error.message}`);
        },
      });
      checkout.create("flow").mount("#payment-container");
    })();
  }, [paymentConfig, status, pollOrder]);

  return {
    order: {
      status,
      error,
      feeUsd,
      totalUsd,
      txId,
    },
    createOrder,
  } as const;
}


