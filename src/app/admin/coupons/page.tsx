import { createClient } from "@/lib/supabase/server";
import { CouponsManager } from "@/components/admin/CouponsManager";
import type { Coupon } from "@/lib/types";

export const metadata = { title: "Coupons" };

export default async function AdminCoupons() {
  const { data } = await createClient().from("coupons").select("*").order("created_at", { ascending: false });
  return <CouponsManager coupons={(data ?? []) as Coupon[]} />;
}
