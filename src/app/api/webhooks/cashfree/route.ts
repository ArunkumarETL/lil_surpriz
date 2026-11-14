import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/cashfree";
import { syncPaymentStatus } from "@/lib/payments";

export async function POST(req: Request) {
  const raw = await req.text();
  const ok = verifyWebhookSignature(raw, req.headers.get("x-webhook-timestamp"), req.headers.get("x-webhook-signature"));
  if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let orderId: string | undefined;
  try {
    orderId = JSON.parse(raw)?.data?.order?.order_id;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (!orderId) return NextResponse.json({ received: true });

  try {
    // Re-fetch the authoritative state from Cashfree rather than trusting the payload alone
    await syncPaymentStatus(orderId);
  } catch (e) {
    console.error("webhook sync failed", e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
