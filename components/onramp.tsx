"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
    Checkout?: any;
  }
}

function useScript(src: string) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!src) return;
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.getAttribute("data-loaded") === "true") setLoaded(true);
      else existing.addEventListener("load", () => setLoaded(true));
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      setLoaded(true);
    };
    script.onerror = () => setLoaded(false);
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [src]);
  return loaded;
}

export default function Onramp() {
  const [email, setEmail] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [amountUsd, setAmountUsd] = useState("2");
  const [status, setStatus] = useState<string>("idle");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [personaConfig, setPersonaConfig] = useState<any | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<any | null>(null);

  const personaLoaded = useScript("https://cdn.withpersona.com/dist/persona-v5.2.0.js");
  const checkoutLoaded = useScript("https://cdn.checkout.com/js/flow/latest/checkout.js");

  const handleCreateOrder = useCallback(async () => {
    setError(null);
    setStatus("creating-order");
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
    if (paymentStatus === "awaiting-payment") {
      setPaymentConfig(data?.payment?.preparation);
      setStatus("awaiting-payment");
    } else if (paymentStatus === "rejected-kyc") {
      setStatus("rejected-kyc");
    } else if (paymentStatus === "manual-kyc") {
      setStatus("manual-kyc");
    }
  }, [orderId]);

  useEffect(() => {
    if (status !== "requires-kyc") return;
    if (!personaLoaded || !personaConfig) return;
    try {
      const Persona = (window as any).Persona;
      if (!Persona?.Client) return;
      const client = new Persona.Client({
        templateId: personaConfig?.templateId,
        referenceId: personaConfig?.referenceId,
        environmentId: personaConfig?.environmentId,
        onReady: () => client.open(),
        onComplete: () => {
          // Poll until KYC completes to awaiting-payment
          setStatus("polling-kyc");
          const interval = setInterval(async () => {
            await pollOrder();
          }, 5000);
          // Stop polling once payment is available
          const stopWhenReady = setInterval(() => {
            if (status === "awaiting-payment") {
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
    } catch (e: any) {
      setError(String(e?.message || e));
      setStatus("error");
    }
  }, [personaLoaded, personaConfig, status, pollOrder]);

  useEffect(() => {
    if (status !== "awaiting-payment") return;
    if (!checkoutLoaded || !paymentConfig) return;
    const { checkoutcomPaymentSession, checkoutcomPublicKey } = paymentConfig || {};
    if (!checkoutcomPaymentSession || !checkoutcomPublicKey) return;
    try {
      const Checkout = (window as any).Checkout;
      if (!Checkout?.Flow) return;
      const checkout = new Checkout.Flow({
        publicKey: checkoutcomPublicKey,
        paymentSession: checkoutcomPaymentSession,
        onSuccess: () => setStatus("success"),
        onFailure: () => setStatus("payment-failed"),
      });
      checkout.mount("#payment-container");
    } catch (e: any) {
      setError(String(e?.message || e));
      setStatus("error");
    }
  }, [checkoutLoaded, paymentConfig, status]);

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4">
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
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Amount (USD)</span>
          <input
            className="border rounded px-3 py-2"
            type="number"
            min={1}
            step={1}
            value={amountUsd}
            onChange={(e) => setAmountUsd(e.target.value)}
          />
        </label>
        <button
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
          onClick={handleCreateOrder}
          disabled={status === "creating-order"}
        >
          {status === "creating-order" ? "Creating order..." : "Start onramp"}
        </button>

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


