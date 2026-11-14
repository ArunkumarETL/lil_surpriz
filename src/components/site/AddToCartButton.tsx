"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "./CartProvider";
import type { Product } from "@/lib/types";
import { effectivePrice, isPurchasable, mainImage, cn } from "@/lib/utils";

export function AddToCartButton({ product, withQty = false, className }: { product: Product; withQty?: boolean; className?: string }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const can = isPurchasable(product);
  const item = {
    product_id: product.id,
    slug: product.slug,
    name: product.name,
    price: effectivePrice(product),
    image: mainImage(product),
    stock: product.stock,
  };

  if (!can) return <button className={cn("btn w-full bg-gray-100 text-ink-faint", className)} disabled>Out of stock</button>;

  return (
    <div className={cn("flex w-full items-center gap-3", className)}>
      {withQty && (
        <div className="flex items-center rounded-full border border-blush-200 bg-white">
          <button type="button" className="flex h-11 w-11 items-center justify-center" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
          <span className="w-8 text-center font-bold" aria-live="polite">{qty}</span>
          <button type="button" className="flex h-11 w-11 items-center justify-center" onClick={() => setQty((q) => Math.min(product.stock, q + 1))} aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
        </div>
      )}
      <button type="button" className="btn-primary flex-1" onClick={(e) => { e.preventDefault(); add(item, withQty ? qty : 1); }}>
        <ShoppingBag className="h-4 w-4" /> Add to cart
      </button>
    </div>
  );
}
