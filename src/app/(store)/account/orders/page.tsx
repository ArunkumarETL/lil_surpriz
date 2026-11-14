import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";
import { STATUS_STYLES, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "My Orders", robots: { index: false } };

export default async function MyOrdersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login?next=/account/orders");
  const { data } = await supabase.from("orders").select("*, order_items(id)").eq("user_id", user.id).order("created_at", { ascending: false });
  const orders = (data ?? []) as Order[];
  return (
    <div className="container-x max-w-3xl py-10">
      <Link href="/account" className="text-sm font-semibold text-blush-600">← My account</Link>
      <h1 className="section-title mt-1">My orders</h1>
      {orders.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center p-10 text-center">
          <Package className="h-10 w-10 text-blush-300" />
          <p className="mt-3 text-ink-soft">No orders yet.</p>
          <Link href="/shop" className="btn-primary mt-4">Shop hampers</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.id}`} className="card flex items-center justify-between gap-3 p-4 hover:shadow-soft">
                <div>
                  <p className="font-bold">{o.order_number}</p>
                  <p className="text-xs text-ink-faint">{new Date(o.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })} · {o.order_items?.length ?? 0} items</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatINR(o.total)}</p>
                  <span className={`chip capitalize ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
