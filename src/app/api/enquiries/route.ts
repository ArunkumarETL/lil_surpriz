import { NextResponse } from "next/server";
import { z } from "zod";
import { buildQuote, customBoxSchema } from "@/lib/pricing";
import { customerSchema, firstError } from "@/lib/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatINR, whatsappLink } from "@/lib/utils";

const schema = z.object({
  custom: customBoxSchema,
  customer: customerSchema.extend({ email: z.string().trim().toLowerCase().email().or(z.literal("")).optional() }),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const { custom, customer } = parsed.data;

  const quote = await buildQuote({ items: [], custom });
  const box = quote.lines.find((l) => l.customisation?.type === "custom_box");
  if (!box) return NextResponse.json({ error: "Pick at least one item" }, { status: 400 });
  const unavailable = quote.errors.filter((e) => !e.startsWith("Only"));
  if (unavailable.length) return NextResponse.json({ error: unavailable.join(". ") }, { status: 409 });

  const items = (box.customisation!.items as { product_id: string; name: string; quantity: number; unit_price: number }[]);
  const estimated = quote.lines.reduce((s, l) => s + l.line_total, 0);

  const { data: { user } } = await createClient().auth.getUser();
  const db = createAdminClient();
  const { data, error } = await db
    .from("custom_enquiries")
    .insert({
      user_id: user?.id ?? null,
      customer_name: customer.name,
      phone: customer.phone,
      email: customer.email || null,
      recipient_name: custom.recipient_name,
      occasion: custom.occasion,
      box_colour: custom.box_colour,
      personal_message: custom.personal_message,
      special_instructions: custom.special_instructions,
      items,
      estimated_total: estimated,
      channel: "whatsapp",
    })
    .select("id")
    .single();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not save your enquiry" }, { status: 500 });
  }

  const s = quote.settings;
  const lines = [
    `Hi ${s.brand_name}! I'd like to order a Custom Surprise Box 🎁`,
    ``,
    `*Enquiry ID:* ${data.id.slice(0, 8).toUpperCase()}`,
    `*Items:*`,
    ...items.map((i) => `• ${i.name} × ${i.quantity} — ${formatINR(i.unit_price * i.quantity)}`),
    `• Gift box${custom.box_colour ? ` (${custom.box_colour})` : ""} — ${formatINR(s.custom_box_base_price)}`,
    ``,
    !!custom.occasion && `*Occasion:* ${custom.occasion}`,
    !!custom.recipient_name && `*Recipient:* ${custom.recipient_name}`,
    !!custom.personal_message && `*Message:* ${custom.personal_message}`,
    !!custom.special_instructions && `*Instructions:* ${custom.special_instructions}`,
    ``,
    `*Estimated price:* ${formatINR(estimated)} (+ shipping)`,
    ``,
    `*My details:*`,
    `Name: ${customer.name}`,
    `Phone: ${customer.phone}`,
    !!customer.email && `Email: ${customer.email}`,
  ].filter((l): l is string => l !== false);

  const text = lines.join("\n");
  return NextResponse.json({
    id: data.id,
    message: text,
    whatsappUrl: s.whatsapp_number ? whatsappLink(s.whatsapp_number, text) : null,
  });
}
