import { createClient } from "@/lib/supabase/server";
import { EnquiriesList } from "@/components/admin/EnquiriesList";
import type { CustomEnquiry } from "@/lib/types";

export const metadata = { title: "Custom Enquiries" };

export default async function AdminEnquiries() {
  const { data } = await createClient().from("custom_enquiries").select("*").order("created_at", { ascending: false }).limit(300);
  return <EnquiriesList enquiries={(data ?? []) as CustomEnquiry[]} />;
}
