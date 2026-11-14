"use client";

import { useState } from "react";
import { Loader2, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "./CartProvider";
import type { QuoteResponse } from "./useQuote";
import { formatINR } from "@/lib/utils";

export function OrderSummary({ quote, loading, children }: { quote: QuoteResponse | null; loading: boolean; children?: React.ReactNode }) {
  const { couponCode, setCoupon } = useCart();
  const [code, setCode] = useState("");

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    setCoupon(c);
    setCode("");
  };

  const couponApplied = quote?.coupon && couponCode;
  const remainingForFree = quote && quote.free_shipping_threshold > 0 ? quote.free_shipping_threshold - (quote.subtotal - quote.discount) : 0;

  return (
    <div className="card p-5 sm:p-6">
      <h2 className="text-lg font-bold">Order summary</h2>
      {couponApplied ? (
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 font-semibold text-emerald-700"><Tag className="h-4 w-4" /> {quote!.coupon!.code} applied</span>
          <button onClick={() => setCoupon(null)} aria-label="Remove coupon" className="p-1 text-emerald-700"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <form onSubmit={apply} className="mt-4 flex gap-2">
          <input className="input uppercase" placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Coupon code" maxLength={30} />
          <button className="btn-secondary shrink-0" type="submit">Apply</button>
        </form>
      )}
      {couponCode && quote?.couponError && (
        <p className="mt-2 flex items-center justify-between text-sm text-red-500">
          {quote.couponError}
          <button className="text-xs underline" onClick={() => { setCoupon(null); toast("Coupon removed"); }}>Remove</button>
        </p>
      )}
      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="font-semibold">{quote ? formatINR(quote.subtotal) : "—"}</dd></div>
        {quote && quote.discount > 0 && (
          <div className="flex justify-between text-emerald-600"><dt>Discount</dt><dd className="font-semibold">−{formatINR(quote.discount)}</dd></div>
        )}
        <div className="flex justify-between"><dt className="text-ink-soft">Delivery</dt><dd className="font-semibold">{quote ? (quote.shipping_fee === 0 ? "FREE" : formatINR(quote.shipping_fee)) : "—"}</dd></div>
        {quote && quote.shipping_fee > 0 && remainingForFree > 0 && (
          <p className="rounded-xl bg-blush-50 px-3 py-2 text-xs text-blush-700">Add {formatINR(remainingForFree)} more for FREE delivery 🎉</p>
        )}
        <div className="flex justify-between border-t border-blush-100 pt-3 text-base">
          <dt className="font-bold">Total</dt>
          <dd className="flex items-center gap-2 font-bold">{loading && <Loader2 className="h-4 w-4 animate-spin text-ink-faint" />}{quote ? formatINR(quote.total) : "—"}</dd>
        </div>
      </dl>
      {quote && quote.errors.length > 0 && (
        <ul className="mt-4 space-y-1 rounded-2xl bg-red-50 p-3 text-sm text-red-600">{quote.errors.map((e) => <li key={e}>• {e}</li>)}</ul>
      )}
      {children}
    </div>
  );
}
