import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { buildQuote, cartLineSchema, customBoxSchema } from "@/lib/pricing";
import { addressSchema, customerSchema, firstError } from "@/lib/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cashfreeMode, createCashfreeOrder, isCashfreeConfigured } from "@/lib/cashfree";
import { siteUrl } from "@/lib/utils";

const schema = z.object({
  items: z.array(cartLineSchema).max(50).default([]),
  custom: customBoxSchema.nullish(),
  couponCode: z.string().max(30).nullish(),
  customer: customerSchema,
  address: addressSchema,
  notes: z.string().trim().max(500).optional().default(""),
});

function orderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `LS${ymd}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const input = parsed.data;
  if (!input.items.length && !input.custom) return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
  if (!isCashfreeConfigured())
    return NextResponse.json({ error: "Online payments are not configured yet. Please order via WhatsApp." }, { status: 503 });

  const quote = await buildQuote(input);
  if (quote.errors.length) return NextResponse.json({ error: quote.errors.join(". ") }, { status: 409 });
  if (input.couponCode && quote.couponError) return NextResponse.json({ error: quote.couponError }, { status: 400 });
  if (quote.total < 1) return NextResponse.json({ error: "Order total must be at least ₹1" }, { status: 400 });

  const db = createAdminClient();
  const { data: { user } } = await createClient().auth.getUser();

  // find or create customer record
  let customerId: string | null = null;
  if (user) {
    const { data } = await db.from("customers").select("id").eq("user_id", user.id).maybeSingle();
    customerId = data?.id ?? null;
  }
  if (!customerId) {
    const { data } = await db.from("customers").select("id").ilike("email", input.customer.email).is("user_id", null).limit(1).maybeSingle();
    customerId = data?.id ?? null;
  }
  const profile = {
    full_name: input.customer.name,
    phone: input.customer.phone,
    address_line1: input.address.line1,
    address_line2: input.address.line2,
    city: input.address.city,
    state: input.address.state,
    pincode: input.address.pincode,
  };
  if (customerId) {
    await db.from("customers").update(profile).eq("id", customerId);
  } else {
    const { data, error } = await db.from("customers").insert({ ...profile, email: input.customer.email, user_id: user?.id ?? null }).select("id").single();
    if (error) return NextResponse.json({ error: "Could not save your details" }, { status: 500 });
    customerId = data.id;
  }

  let enquiryId: string | null = null;
  if (input.custom) {
    const box = quote.lines.find((l) => l.customisation?.type === "custom_box");
    const { data } = await db
      .from("custom_enquiries")
      .insert({
        user_id: user?.id ?? null,
        customer_name: input.customer.name,
        phone: input.customer.phone,
        email: input.customer.email,
        recipient_name: input.custom.recipient_name,
        occasion: input.custom.occasion,
        box_colour: input.custom.box_colour,
        personal_message: input.custom.personal_message,
        special_instructions: input.custom.special_instructions,
        items: box?.customisation?.items ?? [],
        estimated_total: quote.lines.filter((l) => l.customisation).reduce((s, l) => s + l.line_total, 0),
        channel: "online",
      })
      .select("id")
      .single();
    enquiryId = data?.id ?? null;
  }

  const number = orderNumber();
  const { data: order, error: orderErr } = await db
    .from("orders")
    .insert({
      order_number: number,
      cashfree_order_id: number,
      customer_id: customerId,
      user_id: user?.id ?? null,
      customer_name: input.customer.name,
      email: input.customer.email,
      phone: input.customer.phone,
      shipping_address: input.address,
      subtotal: quote.subtotal,
      discount: quote.discount,
      shipping_fee: quote.shipping_fee,
      total: quote.total,
      coupon_code: quote.coupon?.code ?? null,
      notes: input.notes || null,
      custom_enquiry_id: enquiryId,
    })
    .select("*")
    .single();
  if (orderErr || !order) {
    console.error(orderErr);
    return NextResponse.json({ error: "Could not create your order" }, { status: 500 });
  }

  const { error: itemsErr } = await db.from("order_items").insert(
    quote.lines.map((l) => ({
      order_id: order.id,
      product_id: l.product_id,
      product_name: l.name,
      sku: l.sku,
      image_url: l.image_url,
      unit_price: l.unit_price,
      quantity: l.quantity,
      line_total: l.line_total,
      customisation: l.customisation ?? null,
    }))
  );
  if (itemsErr) {
    await db.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: "Could not create your order" }, { status: 500 });
  }

  try {
    const base = siteUrl();
    const cfOrder = await createCashfreeOrder({
      orderId: number,
      amount: quote.total,
      customer: { id: customerId!, name: input.customer.name, email: input.customer.email, phone: input.customer.phone },
      returnUrl: `${base}/order/${order.id}?cf_order_id={order_id}`,
      notifyUrl: base.startsWith("https://") ? `${base}/api/webhooks/cashfree` : undefined,
      note: `LILSURPRIZ order ${number}`,
    });
    await db.from("orders").update({ payment_session_id: cfOrder.payment_session_id, cf_order_id: String(cfOrder.cf_order_id) }).eq("id", order.id);
    return NextResponse.json({ orderId: order.id, orderNumber: number, paymentSessionId: cfOrder.payment_session_id, mode: cashfreeMode() });
  } catch (e) {
    await db.from("orders").update({ status: "cancelled", cancel_reason: "Payment gateway error" }).eq("id", order.id);
    return NextResponse.json({ error: (e as Error).message || "Payment gateway error" }, { status: 502 });
  }
}
