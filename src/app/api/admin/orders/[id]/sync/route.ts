import { NextResponse } from "next/server";
import { getUserAndAdmin } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncPaymentStatus } from "@/lib/payments";
import { isCashfreeConfigured } from "@/lib/cashfree";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { isAdmin } = await getUserAndAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  if (!isCashfreeConfigured()) return NextResponse.json({ error: "Cashfree is not configured" }, { status: 503 });
  const { data: order } = await createAdminClient().from("orders").select("cashfree_order_id").eq("id", params.id).maybeSingle();
  if (!order?.cashfree_order_id) return NextResponse.json({ error: "Order has no Cashfree payment" }, { status: 404 });
  try {
    const result = await syncPaymentStatus(order.cashfree_order_id);
    if (!result) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
