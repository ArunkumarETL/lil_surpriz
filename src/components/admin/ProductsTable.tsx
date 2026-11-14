"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Archive, Eye, EyeOff, Gift, Pencil, Search, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Category, Product } from "@/lib/types";
import { cn, formatINR, mainImage } from "@/lib/utils";

const STATUS_CLS: Record<string, string> = { active: "bg-emerald-50 text-emerald-700", draft: "bg-gray-100 text-gray-600", inactive: "bg-amber-50 text-amber-700", archived: "bg-red-50 text-red-600" };

function QuickEdit({ p, field, onSaved }: { p: Product; field: "regular_price" | "discount_price" | "stock"; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(p[field] == null ? "" : String(p[field]));
  const [busy, setBusy] = useState(false);
  const display = field === "stock" ? String(p.stock) : p[field] == null ? "—" : formatINR(Number(p[field]));
  const save = async () => {
    const n = val === "" ? null : Number(val);
    if (field !== "discount_price" && n == null) return toast.error("Value required");
    if (n != null && (Number.isNaN(n) || n < 0 || (field === "stock" && !Number.isInteger(n)))) return toast.error("Enter a valid number");
    if (field === "discount_price" && n != null && n > p.regular_price) return toast.error("Discount can't exceed regular price");
    if (field === "regular_price" && p.discount_price != null && n! < p.discount_price) return toast.error("Regular price can't be below discount price");
    setBusy(true);
    const { error } = await createClient().from("products").update({ [field]: n }).eq("id", p.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setEditing(false);
    onSaved();
  };
  if (!editing) return <button className="rounded-lg px-1.5 py-0.5 text-left font-semibold hover:bg-blush-50" onClick={() => setEditing(true)} title="Click to edit" aria-label={`Edit ${field.replace("_", " ")}`}>{display}</button>;
  return (
    <span className="inline-flex items-center gap-1">
      <input autoFocus type="number" min="0" step={field === "stock" ? "1" : "0.01"} className="w-20 rounded-lg border border-blush-200 px-2 py-1 text-sm" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} aria-label={field} />
      <button onClick={save} disabled={busy} className="text-emerald-600" aria-label="Save"><Check className="h-4 w-4" /></button>
      <button onClick={() => setEditing(false)} className="text-ink-faint" aria-label="Cancel"><X className="h-4 w-4" /></button>
    </span>
  );
}

export function ProductsTable({ products, categories, initialFilter }: { products: Product[]; categories: Category[]; initialFilter?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(initialFilter === "low" ? "low" : "all");
  const [cat, setCat] = useState("");
  const refresh = () => router.refresh();

  const list = useMemo(() => products.filter((p) => {
    if (q && !`${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat && p.category_id !== cat) return false;
    if (status === "low") return p.status !== "archived" && p.stock <= 5;
    if (status === "all") return p.status !== "archived";
    return p.status === status;
  }), [products, q, status, cat]);

  const setProductStatus = async (p: Product, s: Product["status"]) => {
    if (s === "active" && !p.product_images?.length) return toast.error("Add a photo before activating");
    const { error } = await createClient().from("products").update({ status: s }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(s === "archived" ? "Product archived" : s === "active" ? "Product is live" : "Product hidden");
    refresh();
  };

  const remove = async (p: Product) => {
    if (!confirm(`Permanently delete "${p.name}"? Past orders keep their details. This cannot be undone.`)) return;
    const supabase = createClient();
    const paths = (p.product_images ?? []).map((i) => i.storage_path).filter(Boolean) as string[];
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    if (paths.length) await supabase.storage.from("product-images").remove(paths);
    toast.success("Product deleted");
    refresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">+ Add product</Link>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" /><input className="input pl-9" placeholder="Search name or SKU" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" /></label>
        <select className="input sm:w-44" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
          <option value="all">All (not archived)</option><option value="active">Active</option><option value="draft">Draft</option><option value="inactive">Inactive</option><option value="archived">Archived</option><option value="low">Low stock</option>
        </select>
        <select className="input sm:w-48" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category filter">
          <option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {list.length === 0 ? (
        <div className="card p-10 text-center text-ink-soft">{products.length ? "No products match these filters." : <>No products yet. <Link href="/admin/products/new" className="font-semibold text-blush-600">Add your first product</Link></>}</div>
      ) : (
        <div className="space-y-3">
          {list.map((p) => {
            const img = mainImage(p);
            return (
              <div key={p.id} className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4" data-testid="admin-product-row">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-blush-50">{img ? <Image src={img} alt="" fill sizes="64px" className="object-cover" /> : <Gift className="m-auto h-full w-6 text-blush-300" />}</div>
                  <div className="min-w-0">
                    <Link href={`/admin/products/${p.id}`} className="block truncate font-semibold hover:text-blush-600">{p.name}</Link>
                    <p className="text-xs text-ink-faint">{p.sku} · {p.categories?.name ?? "Uncategorised"}</p>
                    <span className={cn("chip mt-1 text-[11px] capitalize", STATUS_CLS[p.status])}>{p.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm sm:w-80">
                  <div><p className="text-[11px] text-ink-faint">Price</p><QuickEdit p={p} field="regular_price" onSaved={refresh} /></div>
                  <div><p className="text-[11px] text-ink-faint">Sale</p><QuickEdit p={p} field="discount_price" onSaved={refresh} /></div>
                  <div><p className="text-[11px] text-ink-faint">Stock</p><span className={p.stock <= 5 ? "text-red-500" : ""}><QuickEdit p={p} field="stock" onSaved={refresh} /></span></div>
                </div>
                <div className="flex items-center justify-end gap-1 border-t border-blush-50 pt-2 sm:border-0 sm:pt-0">
                  <Link href={`/admin/products/${p.id}`} className="btn-ghost px-2.5" title="Edit" aria-label="Edit"><Pencil className="h-4 w-4" /></Link>
                  {p.status === "active"
                    ? <button className="btn-ghost px-2.5" title="Hide (deactivate)" aria-label="Deactivate" onClick={() => setProductStatus(p, "inactive")}><EyeOff className="h-4 w-4" /></button>
                    : <button className="btn-ghost px-2.5" title="Publish" aria-label="Publish" onClick={() => setProductStatus(p, "active")}><Eye className="h-4 w-4" /></button>}
                  {p.status !== "archived" && <button className="btn-ghost px-2.5" title="Archive" aria-label="Archive" onClick={() => setProductStatus(p, "archived")}><Archive className="h-4 w-4" /></button>}
                  <button className="btn-ghost px-2.5 text-red-500" title="Delete" aria-label="Delete" onClick={() => remove(p)}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
