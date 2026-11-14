import "server-only";
import crypto from "crypto";

const API_VERSION = "2023-08-01";

export function cashfreeMode(): "sandbox" | "production" {
  return process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
}

function baseUrl() {
  if (process.env.CASHFREE_API_BASE_URL) return process.env.CASHFREE_API_BASE_URL.replace(/\/$/, "");
  return cashfreeMode() === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
}

export function isCashfreeConfigured() {
  return !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
}

async function cf<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!isCashfreeConfigured()) throw new Error("Online payments are not configured yet. Please contact us on WhatsApp.");
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-version": API_VERSION,
      "x-client-id": process.env.CASHFREE_APP_ID!,
      "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Cashfree API error", res.status, body?.code, body?.message);
    throw new Error(body?.message || `Cashfree request failed (${res.status})`);
  }
  return body as T;
}

export type CashfreeOrder = {
  cf_order_id: string | number;
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED";
  payment_session_id: string;
};

export type CashfreePayment = {
  cf_payment_id: string | number;
  order_id: string;
  payment_status: "SUCCESS" | "NOT_ATTEMPTED" | "FAILED" | "USER_DROPPED" | "VOID" | "CANCELLED" | "PENDING";
  payment_amount: number;
  payment_currency: string;
  payment_time?: string;
};

export function createCashfreeOrder(params: {
  orderId: string;
  amount: number;
  customer: { id: string; name: string; email: string; phone: string };
  returnUrl: string;
  notifyUrl?: string;
  note?: string;
}) {
  return cf<CashfreeOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: params.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: params.customer.id,
        customer_name: params.customer.name,
        customer_email: params.customer.email,
        customer_phone: params.customer.phone,
      },
      order_meta: {
        return_url: params.returnUrl,
        ...(params.notifyUrl ? { notify_url: params.notifyUrl } : {}),
      },
      order_note: params.note,
    }),
  });
}

export const getCashfreeOrder = (orderId: string) => cf<CashfreeOrder>(`/orders/${encodeURIComponent(orderId)}`);

export const getCashfreePayments = (orderId: string) =>
  cf<CashfreePayment[]>(`/orders/${encodeURIComponent(orderId)}/payments`);

/** Cashfree webhook signature: base64(HMAC_SHA256(timestamp + rawBody, secretKey)). */
export function verifyWebhookSignature(rawBody: string, timestamp: string | null, signature: string | null) {
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret || !timestamp || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(timestamp + rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
