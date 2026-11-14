"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import type { Category, Product } from "@/lib/types";
import { slugify } from "@/lib/utils";

type Img = { key: string; id?: string; url: string; storage_path: string | null; file?: File };

const schema = z.object({
  name: z.string().trim().min(2, "Product name is required").max(150),
  sku: z.string().trim().min(2, "SKU is required").max(40).regex(/^[A-Za-z0-9_-]+$/, "SKU can only contain letters, numbers, - and _"),
  description: z.string().max(5000),
  category_id: z.string().uuid().nullable(),
  regular_price: z.number({ error: "Enter a regular price" }).min(0).max(1000000),
  discount_price: z.number().min(0).nullable(),
  stock: z.number().int("Stock must be a whole number").min(0),
  availability: z.enum(["in_stock", "out_of_stock", "preorder"]),
  status: z.enum(["draft", "active", "inactive", "archived"]),
}).refine((v) => v.discount_price == null || v.discount_price <= v.regular_price, { message: "Discount price can't be higher than regular price", path: ["discount_price"] });

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const BUCKET = "product-images";

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const [replaceKey, setReplaceKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    category_id: product?.category_id ?? "",
    regular_price: product ? String(product.regular_price) : "",
    discount_price: product?.discount_price != null ? String(product.discount_price) : "",
    stock: product ? String(product.stock) : "0",
    features: (product?.features ?? []).join("\n"),
    items_included: (product?.items_included ?? []).join("\n"),
    size: product?.size ?? "",
    weight: product?.weight ?? "",
    availability: product?.availability ?? "in_stock",
    status: product?.status ?? "draft",
    is_featured: product?.is_featured ?? false,
    is_new_arrival: product?.is_new_arrival ?? true,
    allow_customisation: product?.allow_customisation ?? false,
  });
  const initialImages: Img[] = [...(product?.product_images ?? [])]
    .sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order)
    .map((i) => ({ key: i.id, id: i.id, url: i.url, storage_path: i.storage_path }));
  const [images, setImages] = useState<Img[]>(initialImages);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).filter((file) => file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name));
    const tooBig = list.find((file) => file.size > 20 * 1024 * 1024);
    if (tooBig) toast.error(`${tooBig.name} is larger than 20 MB`);
    const ok = await Promise.all(list.filter((file) => file.size <= 20 * 1024 * 1024).map((file) => compressImage(file)));
    setImages((prev) => [...prev, ...ok.map((file) => ({ key: crypto.randomUUID(), url: URL.createObjectURL(file), storage_path: null, file }))]);
  };

  const replaceFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !replaceKey) return;
    const c = await compressImage(file);
    setImages((prev) => prev.map((i) => (i.key === replaceKey ? { key: crypto.randomUUID(), url: URL.createObjectURL(c), storage_path: null, file: c } : i)));
    setReplaceKey(null);
  };

  const save = async (statusOverride?: Product["status"]) => {
    const parsed = schema.safeParse({
      name: f.name,
      sku: f.sku,
      description: f.description,
      category_id: f.category_id || null,
      regular_price: f.regular_price === "" ? undefined : Number(f.regular_price),
      discount_price: f.discount_price === "" ? null : Number(f.discount_price),
      stock: Number(f.stock),
      availability: f.availability,
      status: statusOverride ?? f.status,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (parsed.data.status === "active" && images.length === 0) return toast.error("Add at least one product photo before publishing");

    setSaving(true);
    try {
      const payload = {
        ...parsed.data,
        sku: parsed.data.sku.toUpperCase(),
        slug: slugify(f.slug || f.name) || slugify(f.sku),
        features: lines(f.features),
        items_included: lines(f.items_included),
        size: f.size.trim() || null,
        weight: f.weight.trim() || null,
        is_featured: f.is_featured,
        is_new_arrival: f.is_new_arrival,
        allow_customisation: f.allow_customisation,
      };
      const { data: saved, error } = product
        ? await supabase.from("products").update(payload).eq("id", product.id).select("id").single()
        : await supabase.from("products").insert(payload).select("id").single();
      if (error) {
        if (error.code === "23505") throw new Error(error.message.includes("sku") ? "That SKU is already used by another product" : "That URL slug is already used — change the name or slug");
        throw new Error(error.message);
      }
      const productId = saved.id as string;

      // removed images
      const keptIds = new Set(images.filter((i) => i.id).map((i) => i.id));
      const removed = initialImages.filter((i) => !keptIds.has(i.id));
      if (removed.length) {
        await supabase.from("product_images").delete().in("id", removed.map((i) => i.id!));
        const paths = removed.map((i) => i.storage_path).filter(Boolean) as string[];
        if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
      }

      // clear main flag first to satisfy the one-main-image unique index
      await supabase.from("product_images").update({ is_main: false }).eq("product_id", productId);

      for (let idx = 0; idx < images.length; idx++) {
        const img = images[idx];
        if (img.file) {
          const ext = img.file.name.split(".").pop()?.toLowerCase() || "jpg";
          const path = `${productId}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, img.file, { cacheControl: "31536000", contentType: img.file.type || undefined });
          if (upErr) throw new Error(`Image upload failed: ${upErr.message}`);
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
          const { error: insErr } = await supabase.from("product_images").insert({ product_id: productId, url: pub.publicUrl, storage_path: path, is_main: idx === 0, sort_order: idx });
          if (insErr) throw new Error(insErr.message);
        } else if (img.id) {
          const { error: updErr } = await supabase.from("product_images").update({ is_main: idx === 0, sort_order: idx }).eq("id", img.id);
          if (updErr) throw new Error(updErr.message);
        }
      }

      toast.success(product ? "Product updated" : parsed.data.status === "active" ? "Product published!" : "Product saved as draft");
      router.push("/admin/products");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
      setSaving(false);
    }
  };

  const Toggle = ({ k, label, hint }: { k: "is_featured" | "is_new_arrival" | "allow_customisation"; label: string; hint: string }) => (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl bg-cream-50 p-4">
      <span><span className="block text-sm font-semibold">{label}</span><span className="text-xs text-ink-faint">{hint}</span></span>
      <input type="checkbox" className="peer sr-only" checked={f[k]} onChange={set(k)} />
      <span className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-gray-300 transition after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:bg-blush-500 peer-checked:after:translate-x-5" />
    </label>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="grid gap-6 pb-24 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="card space-y-4 p-5">
          <h2 className="font-bold">Basic details</h2>
          <div><label className="label" htmlFor="name">Product name *</label><input id="name" className="input" value={f.name} onChange={set("name")} required maxLength={150} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="sku">Product ID / SKU *</label><input id="sku" className="input uppercase" value={f.sku} onChange={set("sku")} required maxLength={40} placeholder="LS-PINK-001" /></div>
            <div><label className="label" htmlFor="category">Category</label>
              <select id="category" className="input" value={f.category_id} onChange={set("category_id")}>
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? "↳ " : ""}{c.name}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label" htmlFor="desc">Description</label><textarea id="desc" className="input min-h-[140px]" value={f.description} onChange={set("description")} maxLength={5000} /></div>
          <div><label className="label" htmlFor="slug">URL slug <span className="font-normal text-ink-faint">(optional — auto from name)</span></label><input id="slug" className="input" value={f.slug} onChange={set("slug")} placeholder={slugify(f.name)} /></div>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between"><h2 className="font-bold">Photos</h2><span className="text-xs text-ink-faint">First photo = main image</span></div>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((img, idx) => (
              <div key={img.key} className={`group relative aspect-square overflow-hidden rounded-2xl border-2 ${idx === 0 ? "border-blush-500" : "border-transparent"} bg-blush-50`}>
                <Image src={img.url} alt={`Product photo ${idx + 1}`} fill sizes="200px" className="object-cover" unoptimized={!!img.file} />
                {idx === 0 && <span className="absolute left-1 top-1 chip bg-blush-500 text-[10px] text-white">Main</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                  {idx !== 0 && <button type="button" title="Make main" aria-label="Make main image" className="rounded-full bg-white/90 p-1.5" onClick={() => setImages((p) => [img, ...p.filter((x) => x.key !== img.key)])}><Star className="h-3.5 w-3.5" /></button>}
                  <button type="button" title="Replace" aria-label="Replace image" className="rounded-full bg-white/90 p-1.5" onClick={() => { setReplaceKey(img.key); replaceInput.current?.click(); }}><RefreshCw className="h-3.5 w-3.5" /></button>
                  <button type="button" title="Remove" aria-label="Remove image" className="rounded-full bg-white/90 p-1.5 text-red-500" onClick={() => setImages((p) => p.filter((x) => x.key !== img.key))}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => fileInput.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-blush-200 text-blush-500 hover:bg-blush-50">
              <ImagePlus className="h-7 w-7" /><span className="text-xs font-semibold">Add photos</span>
            </button>
          </div>
          <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} data-testid="product-images-input" />
          <input ref={replaceInput} type="file" accept="image/*" className="hidden" onChange={(e) => { replaceFile(e.target.files); e.target.value = ""; }} />
          <p className="mt-3 text-xs text-ink-faint">Upload from your computer, phone camera or gallery. Photos are compressed automatically for fast mobile loading.</p>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="font-bold">Hamper details</h2>
          <div><label className="label" htmlFor="items">Items included <span className="font-normal text-ink-faint">(one per line)</span></label><textarea id="items" className="input min-h-[110px]" value={f.items_included} onChange={set("items_included")} placeholder={"Scented candle\nMini teddy\nChocolate bar"} /></div>
          <div><label className="label" htmlFor="features">Features <span className="font-normal text-ink-faint">(one per line)</span></label><textarea id="features" className="input min-h-[90px]" value={f.features} onChange={set("features")} placeholder={"Handpacked\nFree message card"} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="size">Size</label><input id="size" className="input" value={f.size} onChange={set("size")} placeholder="25 × 20 × 10 cm" /></div>
            <div><label className="label" htmlFor="weight">Weight</label><input id="weight" className="input" value={f.weight} onChange={set("weight")} placeholder="800 g" /></div>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="card space-y-4 p-5">
          <h2 className="font-bold">Pricing & stock</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="rp">Regular price ₹ *</label><input id="rp" type="number" inputMode="decimal" min="0" step="0.01" className="input" value={f.regular_price} onChange={set("regular_price")} required /></div>
            <div><label className="label" htmlFor="dp">Discount price ₹</label><input id="dp" type="number" inputMode="decimal" min="0" step="0.01" className="input" value={f.discount_price} onChange={set("discount_price")} /></div>
          </div>
          <div><label className="label" htmlFor="stock">Stock quantity</label><input id="stock" type="number" inputMode="numeric" min="0" step="1" className="input" value={f.stock} onChange={set("stock")} /></div>
          <div><label className="label" htmlFor="avail">Availability</label>
            <select id="avail" className="input" value={f.availability} onChange={set("availability")}><option value="in_stock">In stock</option><option value="out_of_stock">Out of stock</option><option value="preorder">Pre-order</option></select>
          </div>
          <div><label className="label" htmlFor="status">Status</label>
            <select id="status" className="input" value={f.status} onChange={set("status")}><option value="draft">Draft (hidden)</option><option value="active">Active (visible in shop)</option><option value="inactive">Inactive (hidden)</option><option value="archived">Archived</option></select>
          </div>
        </section>
        <section className="card space-y-3 p-5">
          <h2 className="font-bold">Visibility</h2>
          <Toggle k="is_featured" label="Featured product" hint="Show on the home page bestsellers" />
          <Toggle k="is_new_arrival" label="New arrival" hint="Show the ‘New’ badge" />
          <Toggle k="allow_customisation" label="Allow customisation" hint="Available as an item in Customise Your Surprise" />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-blush-100 bg-white/95 p-3 backdrop-blur lg:left-64">
        <button type="button" className="btn-ghost" onClick={() => router.back()} disabled={saving}>Cancel</button>
        <div className="ml-auto flex gap-2">
          <button type="submit" className="btn-outline" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
          {f.status !== "active" && <button type="button" className="btn-primary" disabled={saving} onClick={() => save("active")}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Publish</button>}
        </div>
      </div>
    </form>
  );
}
