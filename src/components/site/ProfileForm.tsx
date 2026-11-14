"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/lib/types";
import { INDIAN_STATES } from "@/lib/utils";

export function ProfileForm({ customer }: { customer: Customer | null }) {
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    full_name: customer?.full_name ?? "", phone: customer?.phone ?? "", address_line1: customer?.address_line1 ?? "",
    address_line2: customer?.address_line2 ?? "", city: customer?.city ?? "", state: customer?.state ?? "", pincode: customer?.pincode ?? "",
  });
  if (!customer) return null;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.phone && !/^[6-9]\d{9}$/.test(f.phone)) return toast.error("Enter a valid 10-digit mobile number");
    if (f.pincode && !/^[1-9]\d{5}$/.test(f.pincode)) return toast.error("Enter a valid 6-digit pincode");
    setBusy(true);
    const { error } = await createClient().from("customers").update(f).eq("id", customer.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  return (
    <form onSubmit={save} className="card p-5 sm:p-6">
      <h2 className="text-lg font-bold">Profile & saved address</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div><label className="label">Full name</label><input className="input" value={f.full_name} onChange={set("full_name")} /></div>
        <div><label className="label">Mobile</label><input className="input" inputMode="numeric" value={f.phone} onChange={set("phone")} /></div>
        <div className="sm:col-span-2"><label className="label">Address</label><input className="input" value={f.address_line1} onChange={set("address_line1")} /></div>
        <div className="sm:col-span-2"><label className="label">Landmark / area</label><input className="input" value={f.address_line2} onChange={set("address_line2")} /></div>
        <div><label className="label">City</label><input className="input" value={f.city} onChange={set("city")} /></div>
        <div><label className="label">Pincode</label><input className="input" inputMode="numeric" value={f.pincode} onChange={set("pincode")} /></div>
        <div className="sm:col-span-2"><label className="label">State</label>
          <select className="input" value={f.state} onChange={set("state")}><option value="">Select state</option>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
      </div>
      <button className="btn-primary mt-5" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
    </form>
  );
}
