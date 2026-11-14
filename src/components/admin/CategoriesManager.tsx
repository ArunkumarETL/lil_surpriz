"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImagePlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import type { Category } from "@/lib/types";
import { slugify } from "@/lib/utils";

const EMPTY = { id: "", name: "", slug: "", description: "", parent_id: "", sort_order: "0", is_active: true, image_url: "" };

export function CategoriesManager({ categories, productCounts }: { categories: Category[]; productCounts: Record<string, number> }) {
  const router = useRouter();
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const parents = categories.filter((c) => !c.parent_id && c.id !== f.id);

  const edit = (c: Category) => { setF({ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", parent_id: c.parent_id ?? "", sort_order: String(c.sort_order), is_active: c.is_active, image_url: c.image_url ?? "" }); setFile(null); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 1) return toast.error("Name is required");
    const slug = slugify(f.slug || f.name);
    if (!slug) return toast.error("Enter a valid slug");
    setBusy(true);
    const supabase = createClient();
    try {
      let image_url = f.image_url || null;
      if (file) {
        const path = `categories/${crypto.randomUUID()}.${file.name.split(".").pop()}`;
        const { error } = await supabase.storage.from("branding").upload(path, file, { cacheControl: "31536000" });
        if (error) throw new Error(`Image upload failed: ${error.message}`);
        image_url = supabase.storage.from("branding").getPublicUrl(path).data.publicUrl;
      }
      const payload = { name: f.name.trim(), slug, description: f.description.trim() || null, parent_id: f.parent_id || null, sort_order: Number(f.sort_order) || 0, is_active: f.is_active, image_url };
      const { error } = f.id ? await supabase.from("categories").update(payload).eq("id", f.id) : await supabase.from("categories").insert(payload);
      if (error) throw new Error(error.code === "23505" ? "A category with this slug already exists" : error.message);
      toast.success(f.id ? "Category updated" : "Category created");
      setF(EMPTY); setFile(null);
      router.refresh();
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"? Products in it become uncategorised.`)) return;
    const { error } = await createClient().from("categories").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Category deleted");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categories</h1>
      <form onSubmit={save} className="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="font-bold sm:col-span-2">{f.id ? "Edit category" : "New category"}</h2>
        <div><label className="label" htmlFor="cname">Name *</label><input id="cname" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={80} required /></div>
        <div><label className="label" htmlFor="cslug">Slug</label><input id="cslug" className="input" value={f.slug} placeholder={slugify(f.name)} onChange={(e) => setF({ ...f, slug: e.target.value })} /></div>
        <div><label className="label" htmlFor="cparent">Parent category</label>
          <select id="cparent" className="input" value={f.parent_id} onChange={(e) => setF({ ...f, parent_id: e.target.value })}><option value="">— Top level —</option>{parents.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>
        <div><label className="label" htmlFor="csort">Sort order</label><input id="csort" type="number" className="input" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="cdesc">Description</label><textarea id="cdesc" className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="flex items-center gap-3">
          <label className="btn-outline cursor-pointer"><ImagePlus className="h-4 w-4" /> {file || f.image_url ? "Change image" : "Add image"}<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const fl = e.target.files?.[0]; if (fl) setFile(await compressImage(fl, 1000)); }} /></label>
          {(file || f.image_url) && <div className="relative h-12 w-12 overflow-hidden rounded-xl"><Image src={file ? URL.createObjectURL(file) : f.image_url} alt="" fill className="object-cover" unoptimized={!!file} /></div>}
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-blush-500" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> Visible in store</label>
        <div className="flex gap-2 sm:col-span-2">
          <button className="btn-primary" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{f.id ? "Save changes" : "Create category"}</button>
          {f.id && <button type="button" className="btn-ghost" onClick={() => { setF(EMPTY); setFile(null); }}>Cancel</button>}
        </div>
      </form>
      <div className="card divide-y divide-blush-50">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0"><p className="truncate font-semibold">{c.parent_id && <span className="text-ink-faint">↳ </span>}{c.name} {!c.is_active && <span className="chip bg-gray-100 text-[11px] text-gray-500">hidden</span>}</p><p className="text-xs text-ink-faint">/{c.slug} · {productCounts[c.id] ?? 0} products</p></div>
            <div className="flex shrink-0 gap-1">
              <button className="btn-ghost px-2.5" onClick={() => edit(c)} aria-label={`Edit ${c.name}`}><Pencil className="h-4 w-4" /></button>
              <button className="btn-ghost px-2.5 text-red-500" onClick={() => remove(c)} aria-label={`Delete ${c.name}`}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
