import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";
import { OrderDetails } from "@/components/site/OrderDetails";
import { RetryPaymentButton } from "@/components/site/RetryPaymentButton";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default async function MyOrderPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", params.id).maybeSingle();
  if (!data) notFound();
  const order = data as Order;
  return (
    <div className="container-x max-w-3xl py-10">
      <Link href="/account/orders" className="text-sm font-semibold text-blush-600">← My orders</Link>
      <div className="mt-3"><OrderDetails order={order} /></div>
      {order.payment_status !== "paid" && order.status !== "cancelled" && (
        <div className="mt-4 flex gap-3"><RetryPaymentButton orderId={order.id} /><Link href={`/order/${order.id}`} className="btn-outline">Check payment status</Link></div>
      )}
    </div>
  );
}
