import clsx, { type ClassValue } from "clsx";
import type { Product, ProductImage } from "./types";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const formatINR = (n: number | string | null | undefined) => inr.format(Number(n ?? 0));

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function effectivePrice(p: Pick<Product, "regular_price" | "discount_price">) {
  const reg = Number(p.regular_price);
  const disc = p.discount_price == null ? null : Number(p.discount_price);
  return disc != null && disc < reg ? disc : reg;
}

export function discountPercent(p: Pick<Product, "regular_price" | "discount_price">) {
  const eff = effectivePrice(p);
  const reg = Number(p.regular_price);
  return reg > 0 && eff < reg ? Math.round(((reg - eff) / reg) * 100) : 0;
}

export function sortedImages(images: ProductImage[] | undefined) {
  return [...(images ?? [])].sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order);
}

export function mainImage(p: Pick<Product, "product_images">) {
  return sortedImages(p.product_images)[0]?.url ?? null;
}

export function isPurchasable(p: Pick<Product, "status" | "availability" | "stock">) {
  return p.status === "active" && p.availability !== "out_of_stock" && p.stock > 0;
}

export function whatsappLink(number: string | null | undefined, text: string) {
  const digits = (number ?? "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  processing: "bg-sky-100 text-sky-700",
  packed: "bg-indigo-100 text-indigo-700",
  shipped: "bg-lavender-100 text-lavender-600",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-200 text-gray-600",
  failed: "bg-red-100 text-red-600",
  refunded: "bg-gray-200 text-gray-600",
  new: "bg-blush-100 text-blush-700",
  contacted: "bg-sky-100 text-sky-700",
  converted: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-200 text-gray-600",
  active: "bg-emerald-100 text-emerald-700",
  draft: "bg-amber-100 text-amber-700",
  inactive: "bg-gray-200 text-gray-600",
  archived: "bg-gray-200 text-gray-500",
};

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];
