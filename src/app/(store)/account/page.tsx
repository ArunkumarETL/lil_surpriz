import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserAndAdmin } from "@/lib/data";
import type { Customer } from "@/lib/types";
import { ProfileForm } from "@/components/site/ProfileForm";
import { SignOutButton } from "@/components/site/SignOutButton";

export const metadata: Metadata = { title: "My Account", robots: { index: false } };

export default async function AccountPage() {
  const { user, isAdmin } = await getUserAndAdmin();
  if (!user) redirect("/account/login");
  const { data } = await createClient().from("customers").select("*").eq("user_id", user.id).maybeSingle();
  return (
    <div className="container-x max-w-3xl py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title">My account</h1>
          <p className="text-sm text-ink-soft">{user.email}</p>
        </div>
        <SignOutButton />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="/account/orders" className="card flex items-center gap-3 p-5 hover:shadow-soft"><Package className="h-6 w-6 text-blush-500" /><span className="font-bold">My orders</span></Link>
        {isAdmin && <Link href="/admin" className="card flex items-center gap-3 p-5 hover:shadow-soft"><LayoutDashboard className="h-6 w-6 text-lavender-500" /><span className="font-bold">Admin dashboard</span></Link>}
      </div>
      <div className="mt-6"><ProfileForm customer={data as Customer | null} /></div>
    </div>
  );
}
