import { OnrampStatus } from "./useCrossmintOnramp";

export type Order = {
  status: OnrampStatus;
  error: string | null;
  feeUsd: string | null;
  totalUsd: string | null;
  txId: string | null;
};

// API Response Types
export type CreateOrderRequest = {
  amount: string;
  receiptEmail: string;
  walletAddress: string;
  paymentMethod: string;
};

export type CreateOrderResponse = {
  order: {
  orderId: string;
  payment: {
    status: string;
    preparation: {
      kyc?: {
        templateId: string;
        referenceId: string;
        environmentId: string;
      };
      checkoutcomPaymentSession?: string;
      checkoutcomPublicKey?: string;
    };
  };
  lineItems: Array<{
    quote: {
      charges: {
        unit: {
          amount: string;
        };
      };
      totalPrice: {
        amount: string;
      };
    };
  }>;
  quote: {
    totalPrice: {
        amount: string;
      };
    };
  };
};

export type GetOrderResponse = {
  orderId: string;
  phase: string;
  payment: {
    status: string;
    preparation: {
      checkoutcomPaymentSession?: string;
      checkoutcomPublicKey?: string;
    };
  };
  lineItems: Array<{
    delivery: {
      status: string;
      txId: string;
    };
  }>;
};

export type ApiErrorResponse = {
  error: string;
  details?: any;
};
