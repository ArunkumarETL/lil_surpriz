"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export type CartItem = {
  product_id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
  quantity: number;
};

export type CustomBox = {
  items: { product_id: string; name: string; price: number; quantity: number }[];
  box_colour: string;
  occasion: string;
  recipient_name: string;
  personal_message: string;
  special_instructions: string;
  base_price: number;
};

type CartState = { items: CartItem[]; custom: CustomBox | null; couponCode: string | null };

type CartCtx = CartState & {
  ready: boolean;
  count: number;
  estimatedSubtotal: number;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  setCustom: (box: CustomBox | null) => void;
  setCoupon: (code: string | null) => void;
  clear: () => void;
};

const KEY = "lilsurpriz-cart-v1";
const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({ items: [], custom: null, couponCode: null });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ items: [], custom: null, couponCode: null, ...JSON.parse(raw) });
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const add = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    setState((s) => {
      const existing = s.items.find((i) => i.product_id === item.product_id);
      const current = existing?.quantity ?? 0;
      const next = Math.min(current + qty, item.stock);
      if (next <= current) {
        toast.error(`Only ${item.stock} available`);
        return s;
      }
      toast.success(`${item.name} added to cart`);
      const items = existing
        ? s.items.map((i) => (i.product_id === item.product_id ? { ...i, ...item, quantity: next } : i))
        : [...s.items, { ...item, quantity: next }];
      return { ...s, items };
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setState((s) => ({
      ...s,
      items: s.items
        .map((i) => (i.product_id === productId ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock || qty)) } : i)),
    }));
  }, []);

  const remove = useCallback((productId: string) => setState((s) => ({ ...s, items: s.items.filter((i) => i.product_id !== productId) })), []);
  const setCustom = useCallback((custom: CustomBox | null) => setState((s) => ({ ...s, custom })), []);
  const setCoupon = useCallback((couponCode: string | null) => setState((s) => ({ ...s, couponCode })), []);
  const clear = useCallback(() => setState({ items: [], custom: null, couponCode: null }), []);

  const value = useMemo<CartCtx>(() => {
    const customTotal = state.custom ? state.custom.base_price + state.custom.items.reduce((s, i) => s + i.price * i.quantity, 0) : 0;
    return {
      ...state,
      ready,
      count: state.items.reduce((s, i) => s + i.quantity, 0) + (state.custom ? 1 : 0),
      estimatedSubtotal: state.items.reduce((s, i) => s + i.price * i.quantity, 0) + customTotal,
      add, setQty, remove, setCustom, setCoupon, clear,
    };
  }, [state, ready, add, setQty, remove, setCustom, setCoupon, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}

/** Shape sent to the server for quoting/checkout. Prices are always recomputed server-side. */
export function cartPayload(s: Pick<CartState, "items" | "custom" | "couponCode">) {
  return {
    items: s.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    custom: s.custom
      ? {
          items: s.custom.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          box_colour: s.custom.box_colour,
          occasion: s.custom.occasion,
          recipient_name: s.custom.recipient_name,
          personal_message: s.custom.personal_message,
          special_instructions: s.custom.special_instructions,
        }
      : null,
    couponCode: s.couponCode,
  };
}
