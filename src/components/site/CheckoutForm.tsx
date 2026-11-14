"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cartPayload, useCart } from "./CartProvider";
import { useQuote } from "./useQuote";
import { OrderSummary } from "./OrderSummary";
import { startCashfreeCheckout } from "./cashfreeCheckout";
import type { Customer } from "@/lib/types";
import { INDIAN_STATES, formatINR } from "@/lib/utils";

export function CheckoutForm({ customer, email }: { customer: Customer | null; email: string | null }) {
  const cart = useCart();
  const { quote, loading } = useQuote();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: customer?.full_name ?? "",
    email: customer?.email ?? email ?? "",
    phone: customer?.phone ?? "",
    line1: customer?.address_line1 ?? "",
    line2: customer?.address_line2 ?? "",
    city: customer?.city ?? "",
    state: customer?.state ?? "",
    pincode: customer?.pincode ?? "",
    notes: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (cart.ready && !cart.items.length && !cart.custom)
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/shop" className="btn-primary mt-6">Shop hampers</Link>
      </div>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote || quote.errors.length) return toast.error(quote?.errors[0] ?? "Please review your cart");
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cartPayload(cart),
          customer: { name: form.name, email: form.email, phone: form.phone },
          address: { line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode },
          notes: form.notes,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Checkout failed");
      sessionStorage.setItem("lilsurpriz-pending-order", j.orderId);
      cart.clear();
      await startCashfreeCheckout(j.paymentSessionId, j.mode);
    } catch (err) {
      toast.error((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="container-x py-8 sm:py-12">
      <h1 className="section-title">Checkout</h1>
      <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold">Contact details</h2>
            {!email && <p className="mt-1 text-sm text-ink-soft">Have an account? <Link href="/account/login?next=/checkout" className="font-semibold text-blush-600">Log in</Link> to track orders easily.</p>}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="label" htmlFor="name">Full name</label><input id="name" className="input" required minLength={2} maxLength={80} value={form.name} onChange={set("name")} autoComplete="name" /></div>
              <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" className="input" required value={form.email} onChange={set("email")} autoComplete="email" /></div>
              <div><label className="label" htmlFor="phone">Mobile number</label><input id="phone" type="tel" inputMode="numeric" className="input" required pattern="(\+91|91)?[6-9][0-9]{9}" title="10-digit Indian mobile number" value={form.phone} onChange={set("phone")} autoComplete="tel" /></div>
            </div>
          </section>
          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold">Delivery address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="label" htmlFor="line1">House / flat, street</label><input id="line1" className="input" required minLength={3} value={form.line1} onChange={set("line1")} autoComplete="address-line1" /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="line2">Landmark / area (optional)</label><input id="line2" className="input" value={form.line2} onChange={set("line2")} autoComplete="address-line2" /></div>
              <div><label className="label" htmlFor="city">City</label><input id="city" className="input" required value={form.city} onChange={set("city")} autoComplete="address-level2" /></div>
              <div><label className="label" htmlFor="pincode">Pincode</label><input id="pincode" className="input" required inputMode="numeric" pattern="[1-9][0-9]{5}" title="6-digit pincode" value={form.pincode} onChange={set("pincode")} autoComplete="postal-code" /></div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="state">State</label>
                <select id="state" className="input" required value={form.state} onChange={set("state")} autoComplete="address-level1">
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2"><label className="label" htmlFor="notes">Order notes (optional)</label><textarea id="notes" className="input min-h-[80px]" maxLength={500} value={form.notes} onChange={set("notes")} placeholder="Delivery instructions, gift note, etc." /></div>
            </div>
          </section>
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary quote={quote} loading={loading}>
            <ul className="mt-4 max-h-56 space-y-1 overflow-y-auto border-t border-blush-100 pt-3 text-sm">
              {quote?.lines.filter((l) => l.customisation?.part_of !== "custom_box").map((l, idx) => (
                <li key={idx} className="flex justify-between gap-2"><span className="text-ink-soft">{l.name} × {l.quantity}</span><span>{formatINR(l.line_total)}</span></li>
              ))}
            </ul>
            <button type="submit" disabled={submitting || loading || !quote || quote.errors.length > 0} className="btn-primary mt-5 w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {submitting ? "Redirecting to payment…" : `Pay ${quote ? formatINR(quote.total) : ""} securely`}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-faint"><ShieldCheck className="h-4 w-4" /> Payments secured by Cashfree</p>
          </OrderSummary>
        </div>
      </form>
    </div>
  );
}
