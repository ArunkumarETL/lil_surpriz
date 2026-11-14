import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product, StoreSettings } from "./types";

export const PRODUCT_SELECT = "*, product_images(*), categories(id, name, slug)";

const DEFAULT_SETTINGS: StoreSettings = {
  id: 1, brand_name: "LILSURPRIZ", tagline: "Little gifts, big surprises.", logo_url: null, whatsapp_number: null,
  contact_email: null, contact_phone: null, instagram_url: null, facebook_url: null, youtube_url: null, twitter_url: null,
  pinterest_url: null, shipping_charge: 79, free_shipping_threshold: 999, announcement: null, announcement_enabled: false,
  custom_box_base_price: 199, box_colours: [], occasions: [],
};

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const supabase = createClient();
  const { data } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  return (data as StoreSettings) ?? DEFAULT_SETTINGS;
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = createClient();
  const { data } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order");
  return (data as Category[]) ?? [];
});

export const getCategoryBySlug = cache(async (slug: string) => {
  const cats = await getCategories();
  return cats.find((c) => c.slug === slug) ?? null;
});

type ProductQuery = {
  categoryIds?: string[];
  featured?: boolean;
  newArrival?: boolean;
  customisable?: boolean;
  search?: string;
  sort?: string;
  limit?: number;
};

export async function getProducts(q: ProductQuery = {}): Promise<Product[]> {
  const supabase = createClient();
  let query = supabase.from("products").select(PRODUCT_SELECT).eq("status", "active");
  if (q.categoryIds?.length) query = query.in("category_id", q.categoryIds);
  if (q.featured) query = query.eq("is_featured", true);
  if (q.newArrival) query = query.eq("is_new_arrival", true);
  if (q.customisable) query = query.eq("allow_customisation", true);
  if (q.search) query = query.ilike("name", `%${q.search.replace(/[%_,()]/g, " ")}%`);
  switch (q.sort) {
    case "price-asc":
      query = query.order("regular_price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("regular_price", { ascending: false });
      break;
    case "new":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  }
  if (q.limit) query = query.limit(q.limit);
  const { data, error } = await query;
  if (error) console.error("getProducts", error.message);
  return (data as Product[]) ?? [];
}

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const supabase = createClient();
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("status", "active").maybeSingle();
  return (data as Product) ?? null;
});

/** Category ids including all child categories (e.g. Girls -> Pink Princess Box, ...). */
export async function categoryTreeIds(categoryId: string) {
  const cats = await getCategories();
  const ids = new Set([categoryId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of cats) if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) { ids.add(c.id); grew = true; }
  }
  return [...ids];
}

export async function getUserAndAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };
  const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  return { user, isAdmin: !!data };
}
