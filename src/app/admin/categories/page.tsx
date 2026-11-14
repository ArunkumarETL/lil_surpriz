import { createClient } from "@/lib/supabase/server";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import type { Category } from "@/lib/types";

export const metadata = { title: "Categories" };

export default async function AdminCategories() {
  const db = createClient();
  const [{ data: cats }, { data: counts }] = await Promise.all([
    db.from("categories").select("*").order("sort_order"),
    db.from("products").select("category_id").neq("status", "archived"),
  ]);
  const productCounts: Record<string, number> = {};
  (counts ?? []).forEach((r) => { if (r.category_id) productCounts[r.category_id] = (productCounts[r.category_id] ?? 0) + 1; });
  return <CategoriesManager categories={(cats ?? []) as Category[]} productCounts={productCounts} />;
}
