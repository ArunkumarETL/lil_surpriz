import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUSES } from "@/lib/types";
import { STATUS_STYLES, cn, formatINR } from "@/lib/utils";

export const metadata = { title: "Orders" };

export default async function AdminOrders({ searchParams }: { searchParams: { status?: string; payment?: string; q?: string } }) {
  const db = createClient();
  let query = db.from("orders").select("id, order_number, customer_name, phone, email, total, status, payment_status, created_at, custom_enquiry_id").order("created_at", { ascending: false }).limit(200);
  if (searchParams.status === "open") query = query.in("status", ["pending", "paid", "processing", "packed"]);
  else if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.payment) query = query.eq("payment_status", searchParams.payment);
  if (searchParams.q) {
    const s = searchParams.q.replace(/[%_,()]/g, " ").trim();
    query = query.or(`order_number.ilike.%${s}%,customer_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
  }
  const { data: orders } = await query;
  const tabs = [{ v: "", l: "All" }, { v: "open", l: "Open" }, ...ORDER_STATUSES.map((s) => ({ v: s, l: s }))];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Orders</h1>
      <form className="flex gap-2"><input name="q" defaultValue={searchParams.q} className="input" placeholder="Search order #, name, phone, email" aria-label="Search orders" />{searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}<button className="btn-outline">Search</button></form>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {tabs.map((t) => (
          <Link key={t.v} href={t.v ? `/admin/orders?status=${t.v}` : "/admin/orders"} className={cn("chip shrink-0 capitalize", (searchParams.status ?? "") === t.v ? "bg-blush-500 text-white" : "bg-white text-ink-soft")}>{t.l}</Link>
        ))}
      </div>
      {!orders?.length ? <div className="card p-10 text-center text-ink-soft">No orders found.</div> : (
        <div className="card divide-y divide-blush-50">
          {orders.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex flex-col gap-2 p-4 hover:bg-blush-50/40 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">{o.order_number} {o.custom_enquiry_id && <span className="chip bg-lavender-50 text-[11px] text-lavender-600">custom</span>}</p>
                <p className="truncate text-sm text-ink-soft">{o.customer_name} · {o.phone}</p>
                <p className="text-xs text-ink-faint">{new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("chip capitalize", STATUS_STYLES[o.status])}>{o.status}</span>
                <span className={cn("chip capitalize", o.payment_status === "paid" ? "bg-emerald-50 text-emerald-700" : o.payment_status === "failed" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600")}>{o.payment_status}</span>
                <span className="ml-auto font-bold sm:ml-2">{formatINR(o.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
