"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, User, X, Sparkles } from "lucide-react";
import { Logo } from "./Logo";
import { useCart } from "./CartProvider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/shop", label: "Shop All" },
  { href: "/collections/girls", label: "Girls" },
  { href: "/collections/boys", label: "Boys" },
  { href: "/collections/pink-princess-box", label: "Pink Princess" },
  { href: "/collections/study-girl-box", label: "Study Girl" },
  { href: "/collections/self-care-box", label: "Self Care" },
  { href: "/collections/bestie-forever-box", label: "Bestie Forever" },
];

export function Header({ brandName, logoUrl }: { brandName: string; logoUrl: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count, ready } = useCart();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-blush-100/70 bg-cream-50/85 backdrop-blur-lg">
      <div className="container-x flex h-16 items-center justify-between gap-3">
        <button className="btn-ghost -ml-2 px-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </button>
        <Logo name={brandName} logoUrl={logoUrl} />
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.slice(0, 3).map((n) => (
            <Link key={n.href} href={n.href} className={cn("rounded-full px-3 py-2 text-sm font-semibold hover:bg-blush-50", pathname === n.href && "text-blush-600")}>
              {n.label}
            </Link>
          ))}
          <div className="group relative">
            <button className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-blush-50">Boxes ▾</button>
            <div className="invisible absolute left-0 top-full w-56 translate-y-1 rounded-2xl bg-white p-2 opacity-0 shadow-soft transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {NAV.slice(3).map((n) => (
                <Link key={n.href} href={n.href} className="block rounded-xl px-3 py-2 text-sm hover:bg-blush-50">{n.label} Box</Link>
              ))}
            </div>
          </div>
          <Link href="/customise" className="ml-1 inline-flex items-center gap-1 rounded-full bg-lavender-100 px-3 py-2 text-sm font-semibold text-lavender-600 hover:bg-lavender-200">
            <Sparkles className="h-4 w-4" /> Customise
          </Link>
          <Link href="/about" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-blush-50">About</Link>
          <Link href="/contact" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-blush-50">Contact</Link>
        </nav>
        <div className="flex items-center gap-1">
          <Link href="/account" className="btn-ghost px-2.5" aria-label="My account"><User className="h-5 w-5" /></Link>
          <Link href="/cart" className="btn-ghost relative px-2.5" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {ready && count > 0 && (
              <span className="absolute right-0.5 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blush-500 px-1 text-[11px] font-bold text-white">{count}</span>
            )}
          </Link>
        </div>
      </div>

    </header>

      {/* mobile drawer: outside <header> because backdrop-filter traps fixed children */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
        <div className={cn("absolute inset-0 bg-ink/30 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <aside className={cn("absolute left-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-cream-50 p-5 shadow-2xl transition-transform duration-300", open ? "translate-x-0" : "-translate-x-full")}>
          <div className="mb-6 flex items-center justify-between">
            <Logo name={brandName} logoUrl={logoUrl} />
            <button className="btn-ghost px-2" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-6 w-6" /></button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
            <Link href="/" className="rounded-2xl px-4 py-3 font-semibold hover:bg-blush-50">Home</Link>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={cn("rounded-2xl px-4 py-3 font-semibold hover:bg-blush-50", pathname === n.href && "bg-blush-50 text-blush-600")}>
                {n.label}
              </Link>
            ))}
            <Link href="/customise" className="mt-2 flex items-center gap-2 rounded-2xl bg-lavender-100 px-4 py-3 font-semibold text-lavender-600">
              <Sparkles className="h-4 w-4" /> Customise Your Surprise
            </Link>
            <div className="my-3 border-t border-blush-100" />
            <Link href="/account" className="rounded-2xl px-4 py-3 font-semibold hover:bg-blush-50">My Account</Link>
            <Link href="/account/orders" className="rounded-2xl px-4 py-3 font-semibold hover:bg-blush-50">My Orders</Link>
            <Link href="/about" className="rounded-2xl px-4 py-3 font-semibold hover:bg-blush-50">About Us</Link>
            <Link href="/contact" className="rounded-2xl px-4 py-3 font-semibold hover:bg-blush-50">Contact Us</Link>
          </nav>
        </aside>
      </div>
    </>
  );
}
