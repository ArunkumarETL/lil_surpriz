import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/site/CheckoutForm";
import type { Customer } from "@/lib/types";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let customer: Customer | null = null;
  if (user) {
    const { data } = await supabase.from("customers").select("*").eq("user_id", user.id).maybeSingle();
    customer = data as Customer | null;
  }
  return <CheckoutForm customer={customer} email={user?.email ?? null} />;
}
