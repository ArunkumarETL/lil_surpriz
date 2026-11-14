import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncPaymentStatus } from "@/lib/payments";
import { isCashfreeConfigured } from "@/lib/cashfree";
import type { Order } from "@/lib/types";
import { OrderDetails } from "@/components/site/OrderDetails";
import { RetryPaymentButton } from "@/components/site/RetryPaymentButton";

export const metadata: Metadata = { title: "Order status", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderStatusPage({ params }: { params: { id: string } }) {
  if (!z.string().uuid().safeParse(params.id).success) notFound();
  const db = createAdminClient();
  const { data } = await db.from("orders").select("*, order_items(*)").eq("id", params.id).maybeSingle();
  if (!data) notFound();
  let order = data as Order;

  // Always verify with Cashfree server-side; never trust the redirect itself.
  let verifyError: string | null = null;
  if (order.payment_status !== "paid" && order.cashfree_order_id && isCashfreeConfigured() && order.status !== "cancelled") {
    try {
      const synced = await syncPaymentStatus(order.cashfree_order_id);
      if (synced) order = { ...order, ...synced };
    } catch (e) {
      verifyError = (e as Error).message;
    }
  }

  const paid = order.payment_status === "paid";
  const failed = order.payment_status === "failed";

  return (
    <div className="container-x max-w-3xl py-10">
      <div className="card p-6 text-center sm:p-10">
        {paid ? (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Yay! Your surprise is confirmed 🎉</h1>
            <p className="mt-2 text-ink-soft">Payment verified. We&apos;ve received your order <b>{order.order_number}</b> and will start wrapping it with love.</p>
          </>
        ) : failed ? (
          <>
            <XCircle className="mx-auto h-16 w-16 text-red-400" />
            <h1 className="mt-4 text-2xl font-bold">Payment failed</h1>
            <p className="mt-2 text-ink-soft">Your payment for order <b>{order.order_number}</b> didn&apos;t go through. No money was taken — or if it was, it will be refunded automatically by your bank.</p>
          </>
        ) : order.status === "cancelled" ? (
          <>
            <XCircle className="mx-auto h-16 w-16 text-gray-400" />
            <h1 className="mt-4 text-2xl font-bold">Order cancelled</h1>
            {order.cancel_reason && <p className="mt-2 text-ink-soft">{order.cancel_reason}</p>}
          </>
        ) : (
          <>
            <Clock className="mx-auto h-16 w-16 text-amber-400" />
            <h1 className="mt-4 text-2xl font-bold">Waiting for payment confirmation</h1>
            <p className="mt-2 text-ink-soft">We haven&apos;t received a confirmed payment for order <b>{order.order_number}</b> yet. If you just paid, refresh this page in a few seconds.</p>
            {verifyError && <p className="mt-2 text-sm text-red-500">Could not verify right now: {verifyError}</p>}
          </>
        )}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {!paid && order.status !== "cancelled" && <RetryPaymentButton orderId={order.id} />}
          {!paid && <Link href={`/order/${order.id}`} className="btn-outline">Refresh status</Link>}
          <Link href="/shop" className={paid ? "btn-primary" : "btn-ghost"}>Continue shopping</Link>
        </div>
      </div>
      <div className="mt-6"><OrderDetails order={order} /></div>
    </div>
  );
}
