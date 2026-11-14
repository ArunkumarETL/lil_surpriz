import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Coupon, Product, StoreSettings } from "./types";
import { effectivePrice, mainImage, round2 } from "./utils";

export const cartLineSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
});

export const customBoxSchema = z.object({
  items: z.array(cartLineSchema).min(1, "Pick at least one item").max(30),
  box_colour: z.string().max(40).optional().default(""),
  occasion: z.string().max(60).optional().default(""),
  recipient_name: z.string().max(80).optional().default(""),
  personal_message: z.string().max(500).optional().default(""),
  special_instructions: z.string().max(1000).optional().default(""),
});

export type CartLineInput = z.infer<typeof cartLineSchema>;
export type CustomBoxInput = z.infer<typeof customBoxSchema>;

export type QuoteLine = {
  product_id: string | null;
  name: string;
  sku: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  customisation?: Record<string, unknown>;
};

export type Quote = {
  lines: QuoteLine[];
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  coupon: Coupon | null;
  couponError: string | null;
  errors: string[];
  settings: StoreSettings;
};

export function couponDiscount(c: Coupon, subtotal: number): { amount: number; error: string | null } {
  const now = Date.now();
  if (!c.is_active) return { amount: 0, error: "This coupon is not active" };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { amount: 0, error: "This coupon is not active yet" };
  if (c.expires_at && new Date(c.expires_at).getTime() < now) return { amount: 0, error: "This coupon has expired" };
  if (c.usage_limit != null && c.used_count >= c.usage_limit) return { amount: 0, error: "This coupon has reached its usage limit" };
  if (subtotal < Number(c.min_order_amount))
    return { amount: 0, error: `Add items worth ₹${Number(c.min_order_amount) - subtotal} more to use this coupon` };
  let amount = c.discount_type === "percent" ? (subtotal * Number(c.discount_value)) / 100 : Number(c.discount_value);
  if (c.max_discount != null) amount = Math.min(amount, Number(c.max_discount));
  return { amount: round2(Math.min(amount, subtotal)), error: null };
}

/** Server-side source of truth for prices, stock, coupon and shipping. Never trust client prices. */
export async function buildQuote(input: {
  items: CartLineInput[];
  custom?: CustomBoxInput | null;
  couponCode?: string | null;
}): Promise<Quote> {
  const db = createAdminClient();
  const errors: string[] = [];

  const { data: settingsRow } = await db.from("store_settings").select("*").eq("id", 1).single();
  const settings = settingsRow as StoreSettings;

  const allIds = [...new Set([...input.items.map((i) => i.product_id), ...(input.custom?.items ?? []).map((i) => i.product_id)])];
  const { data: rows } = allIds.length
    ? await db.from("products").select("*, product_images(*)").in("id", allIds)
    : { data: [] as Product[] };
  const products = new Map((rows as Product[]).map((p) => [p.id, p]));

  // aggregate requested quantity per product to check stock across cart + custom box
  const demand = new Map<string, number>();
  for (const l of [...input.items, ...(input.custom?.items ?? [])]) demand.set(l.product_id, (demand.get(l.product_id) ?? 0) + l.quantity);
  for (const [id, qty] of demand) {
    const p = products.get(id);
    if (!p || p.status !== "active") errors.push("An item in your cart is no longer available");
    else if (p.availability === "out_of_stock" || p.stock <= 0) errors.push(`${p.name} is out of stock`);
    else if (qty > p.stock) errors.push(`Only ${p.stock} left of ${p.name}`);
  }

  const lines: QuoteLine[] = [];
  for (const l of input.items) {
    const p = products.get(l.product_id);
    if (!p) continue;
    const unit = effectivePrice(p);
    lines.push({ product_id: p.id, name: p.name, sku: p.sku, image_url: mainImage(p), unit_price: unit, quantity: l.quantity, line_total: round2(unit * l.quantity) });
  }

  if (input.custom) {
    const c = input.custom;
    const components = c.items
      .map((i) => ({ i, p: products.get(i.product_id) }))
      .filter((x): x is { i: CartLineInput; p: Product } => !!x.p);
    for (const { p } of components) if (!p.allow_customisation) errors.push(`${p.name} can't be added to a custom box`);
    const details = {
      type: "custom_box",
      box_colour: c.box_colour,
      occasion: c.occasion,
      recipient_name: c.recipient_name,
      personal_message: c.personal_message,
      special_instructions: c.special_instructions,
      items: components.map(({ i, p }) => ({ product_id: p.id, name: p.name, quantity: i.quantity, unit_price: effectivePrice(p) })),
    };
    const base = Number(settings.custom_box_base_price);
    lines.push({ product_id: null, name: `Custom Surprise Box${c.box_colour ? ` (${c.box_colour})` : ""}`, sku: "CUSTOM-BOX", image_url: null, unit_price: base, quantity: 1, line_total: base, customisation: details });
    for (const { i, p } of components) {
      const unit = effectivePrice(p);
      lines.push({ product_id: p.id, name: p.name, sku: p.sku, image_url: mainImage(p), unit_price: unit, quantity: i.quantity, line_total: round2(unit * i.quantity), customisation: { part_of: "custom_box" } });
    }
  }

  const subtotal = round2(lines.reduce((s, l) => s + l.line_total, 0));

  let coupon: Coupon | null = null;
  let couponError: string | null = null;
  let discount = 0;
  const code = input.couponCode?.trim().toUpperCase();
  if (code) {
    const { data } = await db.from("coupons").select("*").eq("code", code).maybeSingle();
    if (!data) couponError = "Invalid coupon code";
    else {
      const r = couponDiscount(data as Coupon, subtotal);
      if (r.error) couponError = r.error;
      else { coupon = data as Coupon; discount = r.amount; }
    }
  }

  const afterDiscount = round2(subtotal - discount);
  const threshold = Number(settings.free_shipping_threshold);
  const shipping_fee = subtotal === 0 || (threshold > 0 && afterDiscount >= threshold) ? 0 : Number(settings.shipping_charge);
  const total = round2(afterDiscount + shipping_fee);

  return { lines, subtotal, discount, shipping_fee, total, coupon, couponError, errors: [...new Set(errors)], settings };
}
