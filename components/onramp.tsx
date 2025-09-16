"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type CreateOrderResponse = {
  clientSecret?: string;
  order?: {
    orderId: string;
    payment?: {
      status?: string;
      preparation?: any;
    };
  };
};

declare global {
  interface Window {
    Persona?: any;
  }
}

export default function Onramp() {
  // Returning user presets
  const RETURNING_EMAIL = "quickstarts@crossmint.com";
  const RETURNING_WALLET = "x4zyf8T6n6NVN3kBW6fmzBvNVAGuDE8mzmzqkSUUh3U";

  const [email] = useState(RETURNING_EMAIL);
  const [walletAddress] = useState(RETURNING_WALLET);
  const [amountUsd, setAmountUsd] = useState("0");
  const [status, setStatus] = useState<string>("idle");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [personaConfig, setPersonaConfig] = useState<any | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<any | null>(null);
  const [feeUsd, setFeeUsd] = useState<string | null>(null);
  const [totalUsd, setTotalUsd] = useState<string | null>(null);

  // Track latest status to avoid TypeScript narrowings inside async callbacks
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const handleCreateOrder = useCallback(async () => {
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
      setStatus(paymentStatus || "unknown");
    }
  }, [amountUsd, email, walletAddress]);

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
      // Payment is done. If delivery is already completed, mark success. Otherwise, keep delivering.
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
          onPaymentCompleted: (_component: unknown, paymentResponse: { id: string }) => {
            // Start polling the order until backend confirms final status
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
  }, [paymentConfig, status]);

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4">
        {/* Tabs header (Returning user only) */}
        <div className="flex items-center gap-2 rounded border px-2 py-1 w-fit">
          <button className="bg-gray-100 text-gray-900 rounded px-4 py-2 text-sm font-medium cursor-default">
            Returning user
          </button>
          <button className="rounded px-4 py-2 text-sm text-gray-500 cursor-not-allowed" disabled>
            New user (KYC)
          </button>
        </div>

        {/* Deposit card */}
        <div className="border rounded p-6">
          <h2 className="text-lg font-semibold text-center">Deposit</h2>
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
              onClick={handleCreateOrder}
              disabled={status === "creating-order"}
            >
              {status === "creating-order"
                ? "Creating order..."
                : "Continue"}
            </button>
          </div>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {(status === "requires-kyc" || status === "polling-kyc") && (
          <div className="border rounded p-4">
            <div id="persona-container" />
            <p className="text-sm text-gray-600 mt-2">Complete KYC to continue.</p>
          </div>
        )}

        {status === "awaiting-payment" && (
          <div className="border rounded p-4">
            <div id="payment-container" />
          </div>
        )}

        {status === "polling-payment" && (
          <div className="border rounded p-4 text-sm text-gray-700">
            Finalizing your payment... This may take a few seconds.
          </div>
        )}

        {status === "delivering" && (
          <div className="border rounded p-4 text-sm text-gray-700">
            Delivering tokens to your wallet... Hang tight.
          </div>
        )}

        {status === "success" && (
          <div className="text-green-600">Payment successful. Tokens will arrive shortly.</div>
        )}
        {status === "payment-failed" && (
          <div className="text-red-600">Payment failed. Please try again.</div>
        )}
      </div>
    </div>
  );
}


