import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, IndianRupee, Package, ShoppingCart, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STATUS_STYLES, formatINR } from "@/lib/utils";

export const metadata = { title: "Dashboard" };
const LOW_STOCK = 5;

export default async function AdminDashboard() {
  const db = createClient();
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);
  const [totalProducts, totalOrders, pendingOrders, completedOrders, enquiries, paidRes, lowStockRes, recentRes] = await Promise.all([
    count(db.from("products").select("id", { count: "exact", head: true }).neq("status", "archived")),
    count(db.from("orders").select("id", { count: "exact", head: true })),
    count(db.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "paid", "processing", "packed"])),
    count(db.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered")),
    count(db.from("custom_enquiries").select("id", { count: "exact", head: true }).eq("status", "new")),
    db.from("orders").select("total").eq("payment_status", "paid").neq("status", "cancelled"),
    db.from("products").select("id, name, stock, sku").neq("status", "archived").lte("stock", LOW_STOCK).order("stock").limit(10),
    db.from("orders").select("id, order_number, customer_name, total, status, payment_status, created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  const totalSales = (paidRes.data ?? []).reduce((s, o) => s + Number(o.total), 0);
  const lowStock = lowStockRes.data ?? [];

  const cards = [
    { label: "Total sales", value: formatINR(totalSales), icon: IndianRupee, cls: "bg-emerald-50 text-emerald-600", href: "/admin/orders?payment=paid" },
    { label: "Total orders", value: totalOrders, icon: ShoppingCart, cls: "bg-sky-50 text-sky-600", href: "/admin/orders" },
    { label: "Pending orders", value: pendingOrders, icon: Clock, cls: "bg-amber-50 text-amber-600", href: "/admin/orders?status=open" },
    { label: "Completed orders", value: completedOrders, icon: CheckCircle2, cls: "bg-green-50 text-green-600", href: "/admin/orders?status=delivered" },
    { label: "Total products", value: totalProducts, icon: Package, cls: "bg-blush-50 text-blush-600", href: "/admin/products" },
    { label: "New custom enquiries", value: enquiries, icon: Sparkles, cls: "bg-lavender-50 text-lavender-600", href: "/admin/enquiries" },
    { label: "Low-stock products", value: lowStock.length, icon: AlertTriangle, cls: "bg-red-50 text-red-500", href: "/admin/products?filter=low" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/admin/products/new" className="btn-primary">+ Add product</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, cls, href }) => (
          <Link key={label} href={href} className="card flex flex-col gap-3 p-4 transition hover:shadow-soft sm:p-5">
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${cls}`}><Icon className="h-5 w-5" /></span>
            <div><p className="text-xl font-bold sm:text-2xl">{value}</p><p className="text-xs text-ink-soft sm:text-sm">{label}</p></div>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Recent orders</h2><Link href="/admin/orders" className="text-sm font-semibold text-blush-600">View all</Link></div>
          {(recentRes.data ?? []).length === 0 ? <p className="text-sm text-ink-faint">No orders yet.</p> : (
            <ul className="divide-y divide-blush-50">
              {recentRes.data!.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-blush-50/50">
                    <div className="min-w-0"><p className="truncate text-sm font-semibold">{o.order_number} · {o.customer_name}</p><p className="text-xs text-ink-faint">{new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p></div>
                    <div className="flex shrink-0 items-center gap-2"><span className={`chip capitalize ${STATUS_STYLES[o.status]}`}>{o.status}</span><span className="text-sm font-bold">{formatINR(o.total)}</span></div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-bold">Low stock (≤ {LOW_STOCK})</h2>
          {lowStock.length === 0 ? <p className="text-sm text-ink-faint">All good! 🎉</p> : (
            <ul className="space-y-2">
              {lowStock.map((p) => (
                <li key={p.id}><Link href={`/admin/products/${p.id}`} className="flex justify-between gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-blush-50"><span className="truncate">{p.name}</span><span className={`font-bold ${p.stock === 0 ? "text-red-500" : "text-amber-600"}`}>{p.stock}</span></Link></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
