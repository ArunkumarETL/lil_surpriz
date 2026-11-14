"use client";

import Image from "next/image";
import Link from "next/link";
import { Gift, Minus, Plus, Trash2, ShoppingBag, Sparkles } from "lucide-react";
import { useCart } from "./CartProvider";
import { useQuote } from "./useQuote";
import { OrderSummary } from "./OrderSummary";
import { formatINR } from "@/lib/utils";

export function CartView() {
  const cart = useCart();
  const { quote, loading } = useQuote();

  if (!cart.ready) return <div className="container-x py-20 text-center text-ink-soft">Loading your cart…</div>;

  if (!cart.items.length && !cart.custom)
    return (
      <div className="container-x flex flex-col items-center py-20 text-center">
        <ShoppingBag className="h-14 w-14 text-blush-300" />
        <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-1 text-ink-soft">Let&apos;s find a little surprise for someone special.</p>
        <Link href="/shop" className="btn-primary mt-6 px-8">Start shopping</Link>
      </div>
    );

  const customTotal = cart.custom ? cart.custom.base_price + cart.custom.items.reduce((s, i) => s + i.price * i.quantity, 0) : 0;

  return (
    <div className="container-x py-8 sm:py-12">
      <h1 className="section-title">Your cart</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {cart.items.map((i) => (
            <div key={i.product_id} className="card flex gap-3 p-3 sm:gap-4 sm:p-4">
              <Link href={`/product/${i.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-blush-50 sm:h-28 sm:w-28">
                {i.image ? <Image src={i.image} alt={i.name} fill sizes="112px" className="object-cover" /> : <Gift className="m-auto h-full w-8 text-blush-300" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/product/${i.slug}`} className="line-clamp-2 font-bold leading-snug hover:text-blush-600">{i.name}</Link>
                  <button onClick={() => cart.remove(i.product_id)} className="-mr-1 -mt-1 p-2 text-ink-faint hover:text-red-500" aria-label={`Remove ${i.name}`}><Trash2 className="h-4 w-4" /></button>
                </div>
                <p className="text-sm text-ink-soft">{formatINR(i.price)}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border border-blush-200 bg-white">
                    <button className="flex h-9 w-9 items-center justify-center" onClick={() => cart.setQty(i.product_id, i.quantity - 1)} disabled={i.quantity <= 1} aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-7 text-center text-sm font-bold">{i.quantity}</span>
                    <button className="flex h-9 w-9 items-center justify-center" onClick={() => cart.setQty(i.product_id, i.quantity + 1)} disabled={i.quantity >= i.stock} aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <span className="font-bold">{formatINR(i.price * i.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
          {cart.custom && (
            <div className="card border-2 border-lavender-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-bold"><Sparkles className="h-5 w-5 text-lavender-500" /> Custom Surprise Box {cart.custom.box_colour && `(${cart.custom.box_colour})`}</div>
                <button onClick={() => cart.setCustom(null)} className="-mr-1 -mt-1 p-2 text-ink-faint hover:text-red-500" aria-label="Remove custom box"><Trash2 className="h-4 w-4" /></button>
              </div>
              <ul className="mt-2 space-y-0.5 text-sm text-ink-soft">
                {cart.custom.items.map((i) => <li key={i.product_id}>• {i.name} × {i.quantity}</li>)}
                {cart.custom.occasion && <li>Occasion: {cart.custom.occasion}</li>}
                {cart.custom.recipient_name && <li>For: {cart.custom.recipient_name}</li>}
                {cart.custom.personal_message && <li className="italic">“{cart.custom.personal_message}”</li>}
              </ul>
              <div className="mt-2 flex items-center justify-between">
                <Link href="/customise" className="text-sm font-semibold text-lavender-600 hover:underline">Edit box</Link>
                <span className="font-bold">{formatINR(customTotal)}</span>
              </div>
            </div>
          )}
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary quote={quote} loading={loading}>
            <Link href="/checkout" aria-disabled={!quote || quote.errors.length > 0}
              className={`btn-primary mt-5 w-full ${!quote || quote.errors.length > 0 ? "pointer-events-none opacity-50" : ""}`}>
              Continue to checkout
            </Link>
            <Link href="/shop" className="mt-3 block text-center text-sm font-semibold text-blush-600 hover:underline">Continue shopping</Link>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
