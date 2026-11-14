"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Coupon } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";

const EMPTY = { id: "", code: "", description: "", discount_type: "percent", discount_value: "", min_order_amount: "0", max_discount: "", usage_limit: "", starts_at: "", expires_at: "", is_active: true };
const toLocal = (d: string | null) => { if (!d) return ""; const t = new Date(d); return new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

export function CouponsManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = f.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return toast.error("Code must be 3–30 letters/numbers");
    const value = Number(f.discount_value);
    if (!(value > 0)) return toast.error("Enter a discount value");
    if (f.discount_type === "percent" && value > 100) return toast.error("Percent can't exceed 100");
    if (f.starts_at && f.expires_at && f.starts_at >= f.expires_at) return toast.error("Expiry must be after start");
    setBusy(true);
    const payload = {
      code, description: f.description.trim() || null, discount_type: f.discount_type, discount_value: value,
      min_order_amount: Number(f.min_order_amount) || 0, max_discount: f.max_discount ? Number(f.max_discount) : null,
      usage_limit: f.usage_limit ? Number(f.usage_limit) : null,
      starts_at: f.starts_at ? new Date(f.starts_at).toISOString() : null, expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : null,
      is_active: f.is_active,
    };
    const supabase = createClient();
    const { error } = f.id ? await supabase.from("coupons").update(payload).eq("id", f.id) : await supabase.from("coupons").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.code === "23505" ? "That coupon code already exists" : error.message);
    toast.success(f.id ? "Coupon updated" : "Coupon created");
    setF(EMPTY);
    router.refresh();
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    const { error } = await createClient().from("coupons").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Coupon deleted");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Coupons</h1>
      <form onSubmit={save} className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <h2 className="font-bold sm:col-span-2 lg:col-span-3">{f.id ? `Edit ${f.code}` : "New coupon"}</h2>
        <div><label className="label" htmlFor="code">Code *</label><input id="code" className="input uppercase" value={f.code} onChange={set("code")} placeholder="WELCOME10" required /></div>
        <div><label className="label" htmlFor="dtype">Type</label><select id="dtype" className="input" value={f.discount_type} onChange={set("discount_type")}><option value="percent">Percent off</option><option value="flat">Flat ₹ off</option></select></div>
        <div><label className="label" htmlFor="dval">Value *</label><input id="dval" type="number" min="0" step="0.01" className="input" value={f.discount_value} onChange={set("discount_value")} required /></div>
        <div><label className="label" htmlFor="minamt">Min order ₹</label><input id="minamt" type="number" min="0" className="input" value={f.min_order_amount} onChange={set("min_order_amount")} /></div>
        <div><label className="label" htmlFor="maxd">Max discount ₹</label><input id="maxd" type="number" min="0" className="input" value={f.max_discount} onChange={set("max_discount")} placeholder="No cap" /></div>
        <div><label className="label" htmlFor="limit">Usage limit</label><input id="limit" type="number" min="1" className="input" value={f.usage_limit} onChange={set("usage_limit")} placeholder="Unlimited" /></div>
        <div><label className="label" htmlFor="starts">Starts</label><input id="starts" type="datetime-local" className="input" value={f.starts_at} onChange={set("starts_at")} /></div>
        <div><label className="label" htmlFor="expires">Expires</label><input id="expires" type="datetime-local" className="input" value={f.expires_at} onChange={set("expires_at")} /></div>
        <div><label className="label" htmlFor="cdesc">Description</label><input id="cdesc" className="input" value={f.description} onChange={set("description")} /></div>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-blush-500" checked={f.is_active} onChange={set("is_active")} /> Active</label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
          <button className="btn-primary" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{f.id ? "Save" : "Create coupon"}</button>
          {f.id && <button type="button" className="btn-ghost" onClick={() => setF(EMPTY)}>Cancel</button>}
        </div>
      </form>
      <div className="grid gap-3 md:grid-cols-2">
        {coupons.map((c) => (
          <div key={c.id} className="card flex items-center justify-between gap-3 p-4">
            <div className="min-w-0 text-sm">
              <p className="font-mono text-base font-bold">{c.code} <span className={cn("chip ml-1 font-sans text-[11px]", c.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>{c.is_active ? "active" : "off"}</span></p>
              <p className="text-ink-soft">{c.discount_type === "percent" ? `${c.discount_value}% off` : `${formatINR(c.discount_value)} off`}{Number(c.min_order_amount) > 0 && ` · min ${formatINR(c.min_order_amount)}`}</p>
              <p className="text-xs text-ink-faint">Used {c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ""}{c.expires_at && ` · expires ${new Date(c.expires_at).toLocaleDateString("en-IN")}`}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button className="btn-ghost px-2.5" aria-label={`Edit ${c.code}`} onClick={() => setF({ id: c.id, code: c.code, description: c.description ?? "", discount_type: c.discount_type, discount_value: String(c.discount_value), min_order_amount: String(c.min_order_amount), max_discount: c.max_discount != null ? String(c.max_discount) : "", usage_limit: c.usage_limit != null ? String(c.usage_limit) : "", starts_at: toLocal(c.starts_at), expires_at: toLocal(c.expires_at), is_active: c.is_active })}><Pencil className="h-4 w-4" /></button>
              <button className="btn-ghost px-2.5 text-red-500" aria-label={`Delete ${c.code}`} onClick={() => remove(c)}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
