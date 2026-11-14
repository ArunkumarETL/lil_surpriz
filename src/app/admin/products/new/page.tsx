import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";
import type { Category } from "@/lib/types";

export const metadata = { title: "Add Product" };

export default async function NewProductPage() {
  const { data } = await createClient().from("categories").select("*").order("sort_order");
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Add new product</h1>
      <ProductForm categories={(data ?? []) as Category[]} />
    </div>
  );
}
