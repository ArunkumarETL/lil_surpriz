import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Customers" };

export default async function AdminCustomers({ searchParams }: { searchParams: { q?: string } }) {
  const db = createClient();
  let query = db.from("customers").select("*, orders(total, payment_status)").order("created_at", { ascending: false }).limit(300);
  if (searchParams.q) {
    const s = searchParams.q.replace(/[%_,()]/g, " ").trim();
    query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
  }
  const { data: customers } = await query;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Customers <span className="text-base font-normal text-ink-faint">({customers?.length ?? 0})</span></h1>
      <form className="flex gap-2"><input name="q" defaultValue={searchParams.q} className="input" placeholder="Search name, email, phone" aria-label="Search customers" /><button className="btn-outline">Search</button></form>
      {!customers?.length ? <div className="card p-10 text-center text-ink-soft">No customers yet.</div> : (
        <div className="grid gap-3 md:grid-cols-2">
          {customers.map((c) => {
            const paid = (c.orders ?? []).filter((o: { payment_status: string }) => o.payment_status === "paid");
            return (
              <div key={c.id} className="card p-4 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><p className="truncate font-semibold">{c.full_name || "—"}</p><p className="truncate text-ink-soft">{c.email}</p>{c.phone && <a href={`tel:${c.phone}`} className="text-blush-600">{c.phone}</a>}</div>
                  {c.user_id ? <span className="chip bg-lavender-50 text-[11px] text-lavender-600">account</span> : <span className="chip bg-gray-100 text-[11px] text-gray-500">guest</span>}
                </div>
                <div className="mt-3 flex gap-4 border-t border-blush-50 pt-3 text-xs text-ink-soft">
                  <span><b className="text-ink">{c.orders?.length ?? 0}</b> orders</span>
                  <span><b className="text-ink">{formatINR(paid.reduce((s: number, o: { total: number }) => s + Number(o.total), 0))}</b> spent</span>
                  {c.city && <span>{c.city}{c.state && `, ${c.state}`}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
