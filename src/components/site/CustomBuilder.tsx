"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Gift, Loader2, Minus, Plus, ShoppingBag, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "./CartProvider";
import { cn, formatINR } from "@/lib/utils";

type Item = { id: string; name: string; price: number; image: string | null; stock: number; category: string };

const COLOUR_SWATCH: Record<string, string> = {
  "blush pink": "#ffc1d6", lavender: "#d9c9ff", cream: "#fdefd6", "pure white": "#ffffff", white: "#ffffff", mint: "#c8f2df",
  red: "#f87171", black: "#2d2d2d", gold: "#f2cc6b", blue: "#a7c8ff", yellow: "#fff2a8", peach: "#ffd3b5",
};

export function CustomBuilder({ items, basePrice, boxColours, occasions, whatsappEnabled }: {
  items: Item[]; basePrice: number; boxColours: string[]; occasions: string[]; whatsappEnabled: boolean;
}) {
  const router = useRouter();
  const cart = useCart();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [d, setD] = useState({ box_colour: boxColours[0] ?? "", occasion: "", recipient_name: "", personal_message: "", special_instructions: "" });
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [sending, setSending] = useState(false);

  // restore an existing custom box from the cart for editing
  useEffect(() => {
    if (!cart.ready || !cart.custom) return;
    setQty(Object.fromEntries(cart.custom.items.map((i) => [i.product_id, i.quantity])));
    setD({ box_colour: cart.custom.box_colour, occasion: cart.custom.occasion, recipient_name: cart.custom.recipient_name, personal_message: cart.custom.personal_message, special_instructions: cart.custom.special_instructions });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.ready]);

  const selected = useMemo(() => items.filter((i) => (qty[i.id] ?? 0) > 0).map((i) => ({ ...i, quantity: qty[i.id] })), [items, qty]);
  const itemsTotal = selected.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = selected.length ? basePrice + itemsTotal : 0;

  const change = (item: Item, delta: number) =>
    setQty((q) => {
      const next = Math.max(0, Math.min(item.stock, (q[item.id] ?? 0) + delta));
      if (delta > 0 && next === (q[item.id] ?? 0)) toast.error(`Only ${item.stock} available`);
      return { ...q, [item.id]: next };
    });

  const payOnline = () => {
    if (!selected.length) return toast.error("Pick at least one item for your box");
    cart.setCustom({ ...d, base_price: basePrice, items: selected.map((i) => ({ product_id: i.id, name: i.name, price: i.price, quantity: i.quantity })) });
    toast.success("Custom box added to cart");
    router.push("/checkout");
  };

  const sendWhatsApp = async () => {
    if (!selected.length) return toast.error("Pick at least one item for your box");
    if (contact.name.trim().length < 2) return toast.error("Enter your name");
    if (!/^(\+?91)?[6-9]\d{9}$/.test(contact.phone.replace(/[\s-]/g, ""))) return toast.error("Enter a valid 10-digit mobile number");
    setSending(true);
    // open the window synchronously so mobile browsers don't block it as a popup
    const win = window.open("", "_blank");
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom: { ...d, items: selected.map((i) => ({ product_id: i.id, quantity: i.quantity })) }, customer: contact }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not send enquiry");
      if (!j.whatsappUrl) throw new Error("WhatsApp number is not configured yet");
      if (win) win.location.href = j.whatsappUrl; else window.location.href = j.whatsappUrl;
      toast.success("Enquiry saved! Continue in WhatsApp to send your message.");
    } catch (e) {
      win?.close();
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const groups = items.reduce<Record<string, Item[]>>((acc, i) => ((acc[i.category] ??= []).push(i), acc), {});

  return (
    <div className="pb-32 lg:pb-10">
      <section className="bg-gradient-to-br from-lavender-100 via-cream-50 to-blush-100">
        <div className="container-x py-10 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Customise your surprise ✨</h1>
          <p className="mx-auto mt-2 max-w-lg text-ink-soft">Pick the goodies, choose a box, add a sweet note. Box & wrapping from {formatINR(basePrice)}.</p>
        </div>
      </section>

      <div className="container-x mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold">1. Pick your goodies</h2>
            {!items.length && <p className="card mt-4 p-6 text-ink-soft">Custom box items are being restocked — please check back soon or contact us on WhatsApp.</p>}
            {Object.entries(groups).map(([cat, list]) => (
              <div key={cat} className="mt-4">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-faint">{cat}</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {list.map((i) => {
                    const q = qty[i.id] ?? 0;
                    return (
                      <div key={i.id} className={cn("overflow-hidden rounded-3xl border-2 bg-white transition", q ? "border-blush-400 shadow-soft" : "border-transparent shadow-card")}>
                        <div className="relative aspect-square bg-blush-50">
                          {i.image ? <Image src={i.image} alt={i.name} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover" /> : <Gift className="m-auto h-full w-10 text-blush-300" />}
                          {i.stock <= 0 && <span className="absolute inset-x-0 bottom-0 bg-ink/60 py-1 text-center text-xs font-bold text-white">Sold out</span>}
                        </div>
                        <div className="p-3">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug">{i.name}</p>
                          <p className="text-sm font-bold text-blush-600">{formatINR(i.price)}</p>
                          <div className="mt-2 flex items-center justify-between rounded-full bg-blush-50">
                            <button type="button" className="flex h-9 w-9 items-center justify-center disabled:opacity-30" onClick={() => change(i, -1)} disabled={!q} aria-label={`Remove one ${i.name}`}><Minus className="h-4 w-4" /></button>
                            <span className="text-sm font-bold">{q}</span>
                            <button type="button" className="flex h-9 w-9 items-center justify-center disabled:opacity-30" onClick={() => change(i, 1)} disabled={i.stock <= 0} aria-label={`Add one ${i.name}`}><Plus className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          {boxColours.length > 0 && (
            <section>
              <h2 className="text-xl font-bold">2. Choose a box colour</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {boxColours.map((c) => (
                  <button key={c} type="button" onClick={() => setD({ ...d, box_colour: c })}
                    className={cn("flex items-center gap-2 rounded-full border-2 bg-white px-4 py-2 text-sm font-semibold transition", d.box_colour === c ? "border-blush-500" : "border-blush-100")}>
                    <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: COLOUR_SWATCH[c.toLowerCase()] ?? "#f5e6ee" }} />{c}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="card p-5 sm:p-6">
            <h2 className="text-xl font-bold">3. Make it personal</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="occasion">Occasion</label>
                <select id="occasion" className="input" value={d.occasion} onChange={(e) => setD({ ...d, occasion: e.target.value })}>
                  <option value="">Select occasion</option>{occasions.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div><label className="label" htmlFor="recipient">Recipient name</label><input id="recipient" className="input" maxLength={80} value={d.recipient_name} onChange={(e) => setD({ ...d, recipient_name: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="msg">Personal message <span className="font-normal text-ink-faint">({d.personal_message.length}/500)</span></label>
                <textarea id="msg" className="input min-h-[90px]" maxLength={500} value={d.personal_message} onChange={(e) => setD({ ...d, personal_message: e.target.value })} placeholder="Happy birthday bestie! 💖" /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="instr">Special instructions</label>
                <textarea id="instr" className="input min-h-[70px]" maxLength={1000} value={d.special_instructions} onChange={(e) => setD({ ...d, special_instructions: e.target.value })} placeholder="Delivery date, theme, allergies…" /></div>
            </div>
          </section>

          {whatsappEnabled && (
            <section className="card p-5 sm:p-6">
              <h2 className="text-xl font-bold">Prefer WhatsApp?</h2>
              <p className="mt-1 text-sm text-ink-soft">Share your details and we&apos;ll confirm availability & delivery on WhatsApp before you pay.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div><label className="label" htmlFor="cname">Your name</label><input id="cname" className="input" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} autoComplete="name" /></div>
                <div><label className="label" htmlFor="cphone">Mobile</label><input id="cphone" type="tel" inputMode="numeric" className="input" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} autoComplete="tel" /></div>
                <div><label className="label" htmlFor="cemail">Email (optional)</label><input id="cemail" type="email" className="input" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} autoComplete="email" /></div>
              </div>
            </section>
          )}
        </div>

        {/* live summary */}
        <aside className="fixed inset-x-0 bottom-0 z-30 border-t border-blush-100 bg-white/95 p-4 shadow-2xl backdrop-blur lg:sticky lg:top-24 lg:z-0 lg:self-start lg:rounded-3xl lg:border-0 lg:p-6 lg:shadow-card">
          <h2 className="hidden text-lg font-bold lg:block">Your box</h2>
          <ul className="hidden max-h-64 space-y-1 overflow-y-auto text-sm lg:mt-3 lg:block">
            {selected.map((i) => <li key={i.id} className="flex justify-between gap-2"><span className="text-ink-soft">{i.name} × {i.quantity}</span><span>{formatINR(i.price * i.quantity)}</span></li>)}
            {selected.length > 0 && <li className="flex justify-between gap-2"><span className="text-ink-soft">Gift box {d.box_colour && `(${d.box_colour})`}</span><span>{formatINR(basePrice)}</span></li>}
            {!selected.length && <li className="text-ink-faint">No items yet</li>}
          </ul>
          <div className="flex items-center justify-between lg:mt-4 lg:border-t lg:border-blush-100 lg:pt-4">
            <span className="text-sm text-ink-soft">{selected.reduce((s, i) => s + i.quantity, 0)} items · Estimated</span>
            <span className="text-xl font-bold" aria-live="polite">{formatINR(total)}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
            <button type="button" className="btn-primary" onClick={payOnline} disabled={!selected.length}><ShoppingBag className="h-4 w-4" /> Pay online</button>
            {whatsappEnabled && (
              <button type="button" className="btn-whatsapp" onClick={sendWhatsApp} disabled={!selected.length || sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />} WhatsApp
              </button>
            )}
          </div>
          <p className="mt-2 hidden text-xs text-ink-faint lg:block">Delivery charges calculated at checkout.</p>
        </aside>
      </div>
    </div>
  );
}
