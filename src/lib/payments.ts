import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCashfreeOrder, getCashfreePayments } from "./cashfree";
import type { Order } from "./types";

/**
 * Asks Cashfree (server-to-server) for the real payment state and updates our order.
 * This is the only path that can mark an order as paid.
 */
export async function syncPaymentStatus(cashfreeOrderId: string): Promise<Order | null> {
  const db = createAdminClient();
  const { data: order } = await db.from("orders").select("*").eq("cashfree_order_id", cashfreeOrderId).maybeSingle();
  if (!order) return null;
  if (order.payment_status === "paid") return order as Order;

  const [cfOrder, payments] = await Promise.all([getCashfreeOrder(cashfreeOrderId), getCashfreePayments(cashfreeOrderId)]);
  const success = payments.find((p) => p.payment_status === "SUCCESS");

  if (cfOrder.order_status === "PAID" && success) {
    if (Number(success.payment_amount) < Number(order.total) || success.payment_currency !== "INR") {
      console.error("Payment amount mismatch", cashfreeOrderId, success.payment_amount, order.total);
      return order as Order;
    }
    const { data, error } = await db.rpc("mark_order_paid", {
      p_cashfree_order_id: cashfreeOrderId,
      p_cf_payment_id: String(success.cf_payment_id),
      p_amount: Number(success.payment_amount),
    });
    if (error) throw new Error(error.message);
    return data as Order;
  }

  const allFailed = payments.length > 0 && payments.every((p) => ["FAILED", "USER_DROPPED", "CANCELLED", "VOID"].includes(p.payment_status));
  if (allFailed && order.payment_status !== "failed") {
    const { data } = await db.from("orders").update({ payment_status: "failed" }).eq("id", order.id).select("*").single();
    return data as Order;
  }
  return order as Order;
}
