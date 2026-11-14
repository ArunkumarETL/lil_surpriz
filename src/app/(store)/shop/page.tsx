import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getProducts, categoryTreeIds } from "@/lib/data";
import { ProductGrid } from "@/components/site/ProductCard";
import { ShopFilters } from "@/components/site/ShopFilters";

export const metadata: Metadata = {
  title: "Shop All Gift Hampers",
  description: "Browse all LILSURPRIZ gift hampers — cute, premium boxes for girls, boys, besties and more, delivered across India.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: { category?: string; sort?: string; q?: string } }) {
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === searchParams.category);
  const products = await getProducts({
    categoryIds: cat ? await categoryTreeIds(cat.id) : undefined,
    sort: searchParams.sort,
    search: searchParams.q?.slice(0, 60),
  });
  return (
    <div className="container-x py-8 sm:py-12">
      <h1 className="section-title">Shop all</h1>
      <p className="mt-1 text-ink-soft">{products.length} {products.length === 1 ? "hamper" : "hampers"} to fall in love with</p>
      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href="/shop" className={`chip shrink-0 px-4 py-2 text-sm ${!cat ? "bg-blush-500 text-white" : "bg-white text-ink shadow-card"}`}>All</Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/shop?category=${c.slug}`} className={`chip shrink-0 px-4 py-2 text-sm ${cat?.id === c.id ? "bg-blush-500 text-white" : "bg-white text-ink shadow-card"}`}>{c.name}</Link>
        ))}
      </div>
      <ShopFilters />
      <div className="mt-6"><ProductGrid products={products} emptyText={searchParams.q ? "No hampers match your search." : undefined} /></div>
    </div>
  );
}
