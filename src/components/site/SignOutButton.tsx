"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className = "btn-outline" }: { className?: string }) {
  const router = useRouter();
  return (
    <button className={className} onClick={async () => { await createClient().auth.signOut(); router.replace("/"); router.refresh(); }}>
      <LogOut className="h-4 w-4" /> Log out
    </button>
  );
}
