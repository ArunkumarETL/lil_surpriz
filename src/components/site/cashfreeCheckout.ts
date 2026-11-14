"use client";

import { load } from "@cashfreepayments/cashfree-js";

/** Redirects to Cashfree's official hosted checkout page. */
export async function startCashfreeCheckout(paymentSessionId: string, mode: "sandbox" | "production") {
  const cashfree = await load({ mode });
  if (!cashfree) throw new Error("Could not load the payment gateway. Please try again.");
  const result = await cashfree.checkout({ paymentSessionId, redirectTarget: "_self" });
  if (result?.error) throw new Error(result.error.message || "Payment could not be started");
}
