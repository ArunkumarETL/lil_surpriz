import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";
import type { Category, Product } from "@/lib/types";

export const metadata = { title: "Edit Product" };

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const db = createClient();
  const [{ data: product }, { data: cats }] = await Promise.all([
    db.from("products").select("*, product_images(*)").eq("id", params.id).maybeSingle(),
    db.from("categories").select("*").order("sort_order"),
  ]);
  if (!product) notFound();
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Edit product</h1>
        {product.status === "active" && <Link href={`/product/${product.slug}`} target="_blank" className="text-sm font-semibold text-blush-600">View in store ↗</Link>}
      </div>
      <ProductForm product={product as Product} categories={(cats ?? []) as Category[]} />
    </div>
  );
}
