import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { cashfreeMode, getCashfreeOrder } from "@/lib/cashfree";

export async function POST(req: Request) {
  const parsed = z.object({ orderId: z.string().uuid() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  const db = createAdminClient();
  const { data: order } = await db.from("orders").select("*").eq("id", parsed.data.orderId).maybeSingle();
  if (!order || !order.cashfree_order_id) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.payment_status === "paid") return NextResponse.json({ error: "This order is already paid" }, { status: 409 });
  if (order.status === "cancelled") return NextResponse.json({ error: "This order was cancelled" }, { status: 409 });
  try {
    const cfOrder = await getCashfreeOrder(order.cashfree_order_id);
    if (cfOrder.order_status !== "ACTIVE")
      return NextResponse.json({ error: "This payment link has expired. Please place the order again." }, { status: 409 });
    return NextResponse.json({ paymentSessionId: cfOrder.payment_session_id, mode: cashfreeMode() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
