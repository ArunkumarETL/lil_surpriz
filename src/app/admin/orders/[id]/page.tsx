import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderAdminPanel } from "@/components/admin/OrderAdminPanel";
import { OrderDetails } from "@/components/site/OrderDetails";
import type { Order } from "@/lib/types";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: { params: { id: string } }) {
  const db = createClient();
  const { data: order } = await db.from("orders").select("*, order_items(*)").eq("id", params.id).maybeSingle();
  if (!order) notFound();
  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="text-sm font-semibold text-blush-600">← All orders</Link>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="card p-5 text-sm">
            <h2 className="mb-2 font-bold">Customer</h2>
            <p>{order.customer_name}</p>
            <p><a className="text-blush-600" href={`tel:${order.phone}`}>{order.phone}</a> · <a className="text-blush-600" href={`mailto:${order.email}`}>{order.email}</a></p>
            <h2 className="mb-1 mt-4 font-bold">Payment</h2>
            <p>Status: <b className="capitalize">{order.payment_status}</b>{order.paid_amount != null && <> · Paid ₹{order.paid_amount}</>}</p>
            {order.cashfree_order_id && <p className="break-all text-xs text-ink-faint">Cashfree order: {order.cashfree_order_id}{order.cf_payment_id && <> · Payment ID: {order.cf_payment_id}</>}</p>}
            {order.paid_at && <p className="text-xs text-ink-faint">Paid at {new Date(order.paid_at).toLocaleString("en-IN")}</p>}
          </div>
          <OrderDetails order={order as Order} />
        </div>
        <OrderAdminPanel order={order as Order} />
      </div>
    </div>
  );
}
