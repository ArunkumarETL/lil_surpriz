import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Gift, Package, Ruler, Scale, Sparkles, Truck } from "lucide-react";
import { getProductBySlug, getProducts, getSettings } from "@/lib/data";
import { ProductGallery } from "@/components/site/ProductGallery";
import { AddToCartButton } from "@/components/site/AddToCartButton";
import { Price } from "@/components/site/Price";
import { ProductGrid } from "@/components/site/ProductCard";
import { effectivePrice, formatINR, mainImage, siteUrl, sortedImages, whatsappLink } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProductBySlug(params.slug);
  if (!p) return { title: "Product not found" };
  const img = mainImage(p);
  const desc = p.description.slice(0, 155) || `${p.name} gift hamper by LILSURPRIZ.`;
  return {
    title: p.name,
    description: desc,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.name, description: desc, images: img ? [{ url: img, alt: p.name }] : undefined, type: "website" },
    other: { "product:price:amount": String(effectivePrice(p)), "product:price:currency": "INR" },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const [product, settings] = await Promise.all([getProductBySlug(params.slug), getSettings()]);
  if (!product) notFound();
  const images = sortedImages(product.product_images);
  const related = product.category_id
    ? (await getProducts({ categoryIds: [product.category_id], limit: 5 })).filter((p) => p.id !== product.id).slice(0, 4)
    : [];
  const inStock = product.stock > 0 && product.availability !== "out_of_stock";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description,
    image: images.map((i) => i.url),
    brand: { "@type": "Brand", name: settings.brand_name },
    offers: {
      "@type": "Offer",
      url: `${siteUrl()}/product/${product.slug}`,
      priceCurrency: "INR",
      price: effectivePrice(product),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container-x py-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-4 text-xs text-ink-faint" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-blush-600">Home</Link> / <Link href="/shop" className="hover:text-blush-600">Shop</Link>
        {product.categories && <> / <Link href={`/collections/${product.categories.slug}`} className="hover:text-blush-600">{product.categories.name}</Link></>}
      </nav>
      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <ProductGallery images={images} name={product.name} />
        <div>
          <div className="flex flex-wrap gap-2">
            {product.is_new_arrival && <span className="chip bg-lavender-100 text-lavender-600">New arrival</span>}
            {product.is_featured && <span className="chip bg-blush-100 text-blush-600">Bestseller</span>}
            {product.availability === "preorder" && <span className="chip bg-amber-100 text-amber-700">Pre-order</span>}
          </div>
          <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{product.name}</h1>
          <p className="mt-1 text-xs text-ink-faint">SKU: {product.sku}</p>
          <div className="mt-4"><Price regular={Number(product.regular_price)} discount={product.discount_price == null ? null : Number(product.discount_price)} size="lg" /></div>
          <p className="mt-1 text-xs text-ink-soft">Inclusive of all taxes</p>
          <p className={`mt-3 text-sm font-semibold ${inStock ? (product.stock <= 5 ? "text-amber-600" : "text-emerald-600") : "text-red-500"}`}>
            {inStock ? (product.stock <= 5 ? `Hurry, only ${product.stock} left!` : "In stock") : "Out of stock"}
          </p>
          <div className="sticky bottom-0 z-10 -mx-4 mt-5 border-t border-blush-100 bg-cream-50/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
            <AddToCartButton product={product} withQty />
          </div>
          {product.allow_customisation && (
            <Link href="/customise" className="mt-3 flex items-center gap-2 rounded-2xl bg-lavender-50 px-4 py-3 text-sm font-semibold text-lavender-600 hover:bg-lavender-100">
              <Sparkles className="h-4 w-4" /> Want to personalise? Add this to a custom surprise box →
            </Link>
          )}
          {settings.whatsapp_number && (
            <a href={whatsappLink(settings.whatsapp_number, `Hi! I have a question about ${product.name} (${product.sku}) – ${formatINR(effectivePrice(product))}`)}
              target="_blank" rel="noopener noreferrer" className="mt-3 block text-center text-sm font-semibold text-emerald-600 hover:underline">
              Questions? Chat with us on WhatsApp
            </a>
          )}

          {product.description && (
            <div className="mt-8">
              <h2 className="text-lg font-bold">About this hamper</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-soft">{product.description}</p>
            </div>
          )}
          {product.items_included.length > 0 && (
            <div className="mt-6 card p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Gift className="h-5 w-5 text-blush-500" /> What&apos;s inside</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {product.items_included.map((it) => <li key={it} className="flex items-start gap-2 text-sm text-ink-soft"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{it}</li>)}
              </ul>
            </div>
          )}
          {product.features.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-bold">Highlights</h2>
              <ul className="mt-2 space-y-1.5">
                {product.features.map((f) => <li key={f} className="flex items-start gap-2 text-sm text-ink-soft"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-lavender-500" />{f}</li>)}
              </ul>
            </div>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {product.size && <div className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-card"><Ruler className="h-4 w-4 text-blush-500" /><span><b>Size:</b> {product.size}</span></div>}
            {product.weight && <div className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-card"><Scale className="h-4 w-4 text-blush-500" /><span><b>Weight:</b> {product.weight}</span></div>}
            <div className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-card"><Truck className="h-4 w-4 text-blush-500" /><span>Ships across India</span></div>
            <div className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-card"><Package className="h-4 w-4 text-blush-500" /><span>Gift-ready packing</span></div>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="section-title mb-6">You may also love</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
