"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import type { StoreSettings } from "@/lib/types";

const URL_FIELDS = ["instagram_url", "facebook_url", "youtube_url", "twitter_url", "pinterest_url"] as const;

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const [s, setS] = useState({
    ...settings,
    shipping_charge: String(settings.shipping_charge),
    free_shipping_threshold: String(settings.free_shipping_threshold),
    custom_box_base_price: String(settings.custom_box_base_price),
    box_colours: settings.box_colours.join(", "),
    occasions: settings.occasions.join(", "),
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const txt = (k: keyof typeof s) => ({ value: (s[k] as string | null) ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setS({ ...s, [k]: e.target.value }) });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!s.brand_name.trim()) return toast.error("Brand name is required");
    const wa = (s.whatsapp_number ?? "").replace(/\D/g, "");
    if (wa && !/^(91)?[6-9]\d{9}$/.test(wa)) return toast.error("WhatsApp number must be a valid Indian mobile number");
    if (s.contact_email && !/^\S+@\S+\.\S+$/.test(s.contact_email)) return toast.error("Enter a valid email");
    for (const k of URL_FIELDS) if (s[k] && !/^https?:\/\//.test(s[k]!)) return toast.error(`${k.replace("_url", "")} link must start with https://`);
    const nums = { shipping_charge: Number(s.shipping_charge), free_shipping_threshold: Number(s.free_shipping_threshold), custom_box_base_price: Number(s.custom_box_base_price) };
    if (Object.values(nums).some((n) => Number.isNaN(n) || n < 0)) return toast.error("Charges must be 0 or more");
    setBusy(true);
    const supabase = createClient();
    try {
      let logo_url = s.logo_url;
      if (logo) {
        const path = `logo/${crypto.randomUUID()}.${logo.name.split(".").pop()}`;
        const { error } = await supabase.storage.from("branding").upload(path, logo, { cacheControl: "31536000" });
        if (error) throw new Error(`Logo upload failed: ${error.message}`);
        logo_url = supabase.storage.from("branding").getPublicUrl(path).data.publicUrl;
      }
      const list = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean);
      const blank = (v: string | null) => (v ?? "").trim() || null;
      const { error } = await supabase.from("store_settings").update({
        brand_name: s.brand_name.trim(), tagline: s.tagline.trim(), logo_url,
        whatsapp_number: wa ? (wa.length === 10 ? `91${wa}` : wa) : null,
        contact_email: blank(s.contact_email), contact_phone: blank(s.contact_phone),
        instagram_url: blank(s.instagram_url), facebook_url: blank(s.facebook_url), youtube_url: blank(s.youtube_url), twitter_url: blank(s.twitter_url), pinterest_url: blank(s.pinterest_url),
        ...nums, announcement: blank(s.announcement), announcement_enabled: s.announcement_enabled,
        box_colours: list(s.box_colours), occasions: list(s.occasions),
      }).eq("id", 1);
      if (error) throw new Error(error.message);
      toast.success("Settings saved — live on the website now");
      setLogo(null);
      router.refresh();
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };

  const F = ({ k, label, type = "text", ph }: { k: keyof typeof s; label: string; type?: string; ph?: string }) => (
    <div><label className="label" htmlFor={String(k)}>{label}</label><input id={String(k)} type={type} className="input" placeholder={ph} {...txt(k)} /></div>
  );

  return (
    <form onSubmit={save} className="space-y-6 pb-24">
      <h1 className="text-2xl font-bold">Website settings</h1>
      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="font-bold sm:col-span-2">Brand</h2>
        {F({ k: "brand_name", label: "Brand name *" })}
        {F({ k: "tagline", label: "Tagline" })}
        <div className="flex items-center gap-3 sm:col-span-2">
          <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-blush-50">
            {logo ? <Image src={URL.createObjectURL(logo)} alt="Logo preview" fill className="object-contain" unoptimized /> : s.logo_url ? <Image src={s.logo_url} alt="Logo" fill className="object-contain" /> : <span className="text-2xl">🎁</span>}
          </div>
          <label className="btn-outline cursor-pointer"><ImagePlus className="h-4 w-4" /> Upload logo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setLogo(await compressImage(f, 600)); }} /></label>
          {(logo || s.logo_url) && <button type="button" className="btn-ghost text-red-500" onClick={() => { setLogo(null); setS({ ...s, logo_url: null }); }}><Trash2 className="h-4 w-4" /> Remove</button>}
        </div>
      </section>
      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="font-bold sm:col-span-2">Contact & social</h2>
        {F({ k: "whatsapp_number", label: "WhatsApp number", type: "tel", ph: "9876543210" })}
        {F({ k: "contact_phone", label: "Phone (display)", type: "tel" })}
        {F({ k: "contact_email", label: "Email", type: "email" })}
        {F({ k: "instagram_url", label: "Instagram link", type: "url", ph: "https://instagram.com/lilsurpriz" })}
        {F({ k: "facebook_url", label: "Facebook link", type: "url" })}
        {F({ k: "youtube_url", label: "YouTube link", type: "url" })}
        {F({ k: "twitter_url", label: "X / Twitter link", type: "url" })}
        {F({ k: "pinterest_url", label: "Pinterest link", type: "url" })}
      </section>
      <section className="card grid gap-4 p-5 sm:grid-cols-3">
        <h2 className="font-bold sm:col-span-3">Shipping & custom box</h2>
        {F({ k: "shipping_charge", label: "Shipping charge ₹", type: "number" })}
        {F({ k: "free_shipping_threshold", label: "Free shipping above ₹", type: "number" })}
        {F({ k: "custom_box_base_price", label: "Custom box base price ₹", type: "number" })}
        <div className="sm:col-span-3">{F({ k: "box_colours", label: "Box colours (comma separated)" })}</div>
        <div className="sm:col-span-3">{F({ k: "occasions", label: "Occasions (comma separated)" })}</div>
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="font-bold">Announcement bar</h2>
        <input className="input" placeholder="Free shipping on orders above ₹999 ✨" {...txt("announcement")} aria-label="Announcement text" />
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-blush-500" checked={s.announcement_enabled} onChange={(e) => setS({ ...s, announcement_enabled: e.target.checked })} /> Show announcement on website</label>
      </section>
      <div className="fixed inset-x-0 bottom-0 z-20 flex justify-end border-t border-blush-100 bg-white/95 p-3 backdrop-blur lg:left-64">
        <button className="btn-primary" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Save settings</button>
      </div>
    </form>
  );
}
