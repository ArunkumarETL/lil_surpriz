import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug, getProducts, categoryTreeIds } from "@/lib/data";
import { ProductGrid } from "@/components/site/ProductCard";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await getCategoryBySlug(params.slug);
  if (!c) return { title: "Collection not found" };
  return {
    title: c.name,
    description: c.description ?? `Shop the ${c.name} at LILSURPRIZ — gift hampers delivered across India.`,
    alternates: { canonical: `/collections/${c.slug}` },
    openGraph: { title: `${c.name} | LILSURPRIZ`, description: c.description ?? undefined, images: c.image_url ? [c.image_url] : undefined },
  };
}

export default async function CollectionPage({ params, searchParams }: { params: { slug: string }; searchParams: { sort?: string } }) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();
  const [all, products] = await Promise.all([
    getCategories(),
    categoryTreeIds(category.id).then((ids) => getProducts({ categoryIds: ids, sort: searchParams.sort })),
  ]);
  const children = all.filter((c) => c.parent_id === category.id);
  const parent = all.find((c) => c.id === category.parent_id);

  return (
    <div>
      <section className="bg-gradient-to-br from-blush-100 to-lavender-100">
        <div className="container-x py-10 text-center sm:py-14">
          {parent && <Link href={`/collections/${parent.slug}`} className="text-sm font-semibold text-blush-600">← {parent.name}</Link>}
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{category.name}</h1>
          {category.description && <p className="mx-auto mt-2 max-w-xl text-ink-soft">{category.description}</p>}
          {children.length > 0 && (
            <div className="no-scrollbar -mx-4 mt-6 flex justify-start gap-2 overflow-x-auto px-4 sm:justify-center">
              {children.map((c) => (
                <Link key={c.id} href={`/collections/${c.slug}`} className="chip shrink-0 bg-white px-4 py-2 text-sm text-ink shadow-card hover:bg-blush-50">{c.name}</Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <div className="container-x py-8">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
