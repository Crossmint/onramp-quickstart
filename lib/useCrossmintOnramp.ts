"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

type CreateOrderResponse = {
  clientSecret?: string;
  order?: any;
};

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

  // Avoid stale closures in async callbacks
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
      const data: CreateOrderResponse = await res.json();
      if (!res.ok) {
        setError((data as any)?.error || "Failed to create order");
        setStatus("error");
        return;
      }
      const createdOrderId = data.order?.orderId;
      setOrderId(createdOrderId ?? null);

      // Extract fees and totals when available
      try {
        const order: any = (data as any)?.order;
        const lineItem = Array.isArray(order?.lineItems) ? order.lineItems[0] : null;
        const fee = lineItem?.quote?.charges?.unit?.amount;
        const total = order?.quote?.totalPrice?.amount ?? lineItem?.quote?.totalPrice?.amount;
        if (fee) setFeeUsd(String(fee));
        if (total) setTotalUsd(String(total));
      } catch {}

      const paymentStatus = data.order?.payment?.status;
      if (paymentStatus === "requires-kyc") {
        const kyc = data.order?.payment?.preparation?.kyc;
        setPersonaConfig(kyc);
        setStatus("requires-kyc");
      } else if (paymentStatus === "awaiting-payment") {
        setStatus("awaiting-payment");
        setPaymentConfig(data.order?.payment?.preparation);
      } else {
        setStatus((paymentStatus as OnrampStatus) || "error");
      }
    },
    [email, walletAddress]
  );

  const reset = useCallback(() => {
    setStatus("not-created");
    setOrderId(null);
    setError(null);
    setPersonaConfig(null);
    setPaymentConfig(null);
    setFeeUsd(null);
    setTotalUsd(null);
  }, []);

  const pollOrder = useCallback(async () => {
    if (!orderId) return;
    const res = await fetch(`/api/orders/${orderId}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Failed to fetch order");
      setStatus("error");
      return;
    }
    const paymentStatus = data?.payment?.status;
    const orderPhase = data?.phase;
    const deliveryStatus = Array.isArray(data?.lineItems)
      ? data.lineItems[0]?.delivery?.status
      : undefined;
    if (paymentStatus === "awaiting-payment") {
      setPaymentConfig(data?.payment?.preparation);
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

  // Persona flow when required
  useEffect(() => {
    if (status !== "requires-kyc") return;
    if (!personaConfig) return;
    try {
      (async () => {
        const personaMod: any = await import("persona");
        const PersonaClient = personaMod?.Client || personaMod?.default?.Client;
        if (!PersonaClient) throw new Error("Persona Client not available");
        const client = new PersonaClient({
          templateId: personaConfig?.templateId,
          referenceId: personaConfig?.referenceId,
          environmentId: personaConfig?.environmentId,
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
            setError(String(e?.message || e));
            setStatus("error");
          },
        });
      })();
    } catch (e: any) {
      setError(String(e?.message || e));
      setStatus("error");
    }
  }, [personaConfig, status, pollOrder]);

  useEffect(() => {
    if (status !== "awaiting-payment") return;
    if (!paymentConfig) return;
    const { checkoutcomPaymentSession, checkoutcomPublicKey } = paymentConfig || {};
    if (!checkoutcomPaymentSession || !checkoutcomPublicKey) return;
    (async () => {
      try {
        const mod: any = await import("@checkout.com/checkout-web-components");
        if (!mod?.loadCheckoutWebComponents) {
          throw new Error("Checkout Web Components not available");
        }
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
        if (checkout?.create) {
          checkout.create("flow").mount("#payment-container");
        }
      } catch (e: any) {
        setError(String(e?.message || e));
        setStatus("error");
      }
    })();
  }, [paymentConfig, status, "#payment-container", pollOrder]);

  return {
    status,
    error,
    feeUsd,
    totalUsd,
    createOrder,
    reset,
  } as const;
}


