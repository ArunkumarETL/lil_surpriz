import { createClient } from "@/lib/supabase/server";
import { ProductsTable } from "@/components/admin/ProductsTable";
import type { Category, Product } from "@/lib/types";

export const metadata = { title: "Products" };

export default async function AdminProducts({ searchParams }: { searchParams: { filter?: string } }) {
  const db = createClient();
  const [{ data: products }, { data: cats }] = await Promise.all([
    db.from("products").select("*, product_images(*), categories(id, name, slug)").order("created_at", { ascending: false }),
    db.from("categories").select("*").order("sort_order"),
  ]);
  return <ProductsTable products={(products ?? []) as Product[]} categories={(cats ?? []) as Category[]} initialFilter={searchParams.filter} />;
}
