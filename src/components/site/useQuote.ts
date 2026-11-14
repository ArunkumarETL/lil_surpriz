"use client";

import { useEffect, useState } from "react";
import { cartPayload, useCart } from "./CartProvider";

export type QuoteResponse = {
  lines: { product_id: string | null; name: string; unit_price: number; quantity: number; line_total: number; image_url: string | null; customisation?: Record<string, unknown> }[];
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  coupon: { code: string; description: string | null } | null;
  couponError: string | null;
  errors: string[];
  free_shipping_threshold: number;
};

/** Live server-side quote of the current cart (prices, stock, coupon, shipping). */
export function useQuote() {
  const cart = useCart();
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(cartPayload(cart));

  useEffect(() => {
    if (!cart.ready) return;
    const payload = JSON.parse(key);
    if (!payload.items.length && !payload.custom) {
      setQuote(null);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: key, signal: ctrl.signal })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Could not load totals");
        setQuote(j);
        setError(null);
      })
      .catch((e) => { if (e.name !== "AbortError") setError(e.message); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [key, cart.ready]);

  return { quote, loading, error };
}
