import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { siteUrl } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticPaths = ["", "/shop", "/customise", "/about", "/contact", "/privacy-policy", "/terms", "/refund-policy", "/shipping-policy"];
  let products: { slug: string; updated_at: string }[] = [];
  let categories: { slug: string; updated_at: string }[] = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const [p, c] = await Promise.all([
      supabase.from("products").select("slug, updated_at").eq("status", "active"),
      supabase.from("categories").select("slug, updated_at").eq("is_active", true),
    ]);
    products = p.data ?? [];
    categories = c.data ?? [];
  }
  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })),
    ...categories.map((c) => ({ url: `${base}/collections/${c.slug}`, lastModified: c.updated_at, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updated_at, changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}
