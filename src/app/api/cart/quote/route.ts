import { NextResponse } from "next/server";
import { z } from "zod";
import { buildQuote, cartLineSchema, customBoxSchema } from "@/lib/pricing";
import { firstError } from "@/lib/validation";

const schema = z.object({
  items: z.array(cartLineSchema).max(50).default([]),
  custom: customBoxSchema.nullish(),
  couponCode: z.string().max(30).nullish(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  try {
    const q = await buildQuote(parsed.data);
    return NextResponse.json({
      lines: q.lines,
      subtotal: q.subtotal,
      discount: q.discount,
      shipping_fee: q.shipping_fee,
      total: q.total,
      coupon: q.coupon ? { code: q.coupon.code, description: q.coupon.description } : null,
      couponError: q.couponError,
      errors: q.errors,
      free_shipping_threshold: Number(q.settings.free_shipping_threshold),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not calculate your total. Please try again." }, { status: 500 });
  }
}
