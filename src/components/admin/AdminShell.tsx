"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Package, PlusCircle, FolderTree, ShoppingCart, Users, Sparkles, Ticket, Settings, Menu, X, Store } from "lucide-react";
import { SignOutButton } from "@/components/site/SignOutButton";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/products/new", label: "Add Product", icon: PlusCircle },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/enquiries", label: "Custom Enquiries", icon: Sparkles },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/settings", label: "Website Settings", icon: Settings },
];

export function AdminShell({ children, brandName, email }: { children: React.ReactNode; brandName: string; email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : href === "/admin/products" ? pathname.startsWith(href) && pathname !== "/admin/products/new" : pathname.startsWith(href);

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition", isActive(href) ? "bg-blush-500 text-white shadow-soft" : "text-ink-soft hover:bg-blush-50")}>
          <Icon className="h-5 w-5" /> {label}
        </Link>
      ))}
      <Link href="/" target="_blank" className="mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-lavender-600 hover:bg-lavender-50"><Store className="h-5 w-5" /> View store</Link>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#fbf7fa]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-blush-100 bg-white/90 px-4 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} className="btn-ghost -ml-2 px-2" aria-label="Open admin menu"><Menu className="h-6 w-6" /></button>
        <span className="font-display font-bold">{brandName} Admin</span>
        <span className="w-10" />
      </header>
      <div className={cn("fixed inset-0 z-40 lg:hidden", open ? "" : "pointer-events-none")}>
        <div className={cn("absolute inset-0 bg-ink/30 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <aside className={cn("absolute left-0 top-0 h-full w-72 overflow-y-auto bg-white p-4 transition-transform", open ? "translate-x-0" : "-translate-x-full")}>
          <div className="mb-4 flex items-center justify-between"><span className="font-display text-lg font-bold">{brandName}</span><button onClick={() => setOpen(false)} className="btn-ghost px-2" aria-label="Close"><X className="h-5 w-5" /></button></div>
          {nav}
          <div className="mt-6 border-t border-blush-100 pt-4 text-xs text-ink-faint">{email}<div className="mt-2"><SignOutButton className="btn-ghost px-0 text-sm" /></div></div>
        </aside>
      </div>
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-blush-100 bg-white p-4 lg:flex">
          <Link href="/admin" className="mb-6 px-2 font-display text-xl font-bold"><span className="text-blush-500">{brandName}</span> <span className="text-sm text-ink-faint">admin</span></Link>
          {nav}
          <div className="mt-auto border-t border-blush-100 pt-4 text-xs text-ink-faint">{email}<div className="mt-2"><SignOutButton className="btn-ghost px-0 text-sm" /></div></div>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
