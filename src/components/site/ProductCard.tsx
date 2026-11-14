import Image from "next/image";
import Link from "next/link";
import { Gift } from "lucide-react";
import type { Product } from "@/lib/types";
import { discountPercent, mainImage } from "@/lib/utils";
import { Price } from "./Price";
import { AddToCartButton } from "./AddToCartButton";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const img = mainImage(product);
  const off = discountPercent(product);
  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-card transition hover:-translate-y-1 hover:shadow-soft">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-blush-50">
        {img ? (
          <Image src={img} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" priority={priority}
            className="object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-blush-300"><Gift className="h-12 w-12" /></div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.is_new_arrival && <span className="chip bg-lavender-500 text-white">New</span>}
          {off > 0 && <span className="chip bg-blush-500 text-white">-{off}%</span>}
        </div>
        {(product.stock <= 0 || product.availability === "out_of_stock") && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/60 py-1.5 text-center text-xs font-bold text-white">Sold out</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <Link href={`/product/${product.slug}`} className="line-clamp-2 text-sm font-bold leading-snug hover:text-blush-600 sm:text-base">
          {product.name}
        </Link>
        <Price regular={Number(product.regular_price)} discount={product.discount_price == null ? null : Number(product.discount_price)} size="sm" />
        <div className="mt-auto pt-1"><AddToCartButton product={product} className="[&_button]:min-h-[40px] [&_button]:px-3 [&_button]:text-xs sm:[&_button]:text-sm" /></div>
      </div>
    </div>
  );
}

export function ProductGrid({ products, emptyText = "No products here yet — check back soon!" }: { products: Product[]; emptyText?: string }) {
  if (!products.length)
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <Gift className="h-10 w-10 text-blush-300" />
        <p className="text-ink-soft">{emptyText}</p>
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
    </div>
  );
}
