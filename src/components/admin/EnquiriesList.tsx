"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { CustomEnquiry } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";

const STATUSES = ["new", "contacted", "converted", "closed"] as const;
const CLS: Record<string, string> = { new: "bg-blush-50 text-blush-600", contacted: "bg-sky-50 text-sky-700", converted: "bg-emerald-50 text-emerald-700", closed: "bg-gray-100 text-gray-600" };

export function EnquiriesList({ enquiries }: { enquiries: CustomEnquiry[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const list = filter ? enquiries.filter((e) => e.status === filter) : enquiries;

  const update = async (id: string, patch: Partial<CustomEnquiry>) => {
    const { error } = await createClient().from("custom_enquiries").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Enquiry updated");
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Custom hamper enquiries</h1>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {["", ...STATUSES].map((s) => <button key={s} onClick={() => setFilter(s)} className={cn("chip shrink-0 capitalize", filter === s ? "bg-blush-500 text-white" : "bg-white text-ink-soft")}>{s || "All"}</button>)}
      </div>
      {!list.length ? <div className="card p-10 text-center text-ink-soft">No enquiries.</div> : list.map((e) => (
        <div key={e.id} className="card space-y-3 p-4 text-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{e.customer_name} <span className={cn("chip ml-1 text-[11px] capitalize", CLS[e.status])}>{e.status}</span> <span className="chip bg-lavender-50 text-[11px] text-lavender-600">{e.channel === "whatsapp" ? "WhatsApp" : "Paid online"}</span></p>
              <p className="text-ink-soft">{e.phone}{e.email && ` · ${e.email}`}</p>
              <p className="text-xs text-ink-faint">{new Date(e.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
            </div>
            <p className="text-lg font-bold">{formatINR(e.estimated_total)}<span className="block text-right text-[11px] font-normal text-ink-faint">estimated</span></p>
          </div>
          <ul className="rounded-2xl bg-cream-50 p-3">
            {e.items.map((i, idx) => <li key={idx} className="flex justify-between"><span>{i.name} × {i.quantity}</span><span>{formatINR(i.unit_price * i.quantity)}</span></li>)}
          </ul>
          <div className="grid gap-1 text-ink-soft sm:grid-cols-2">
            {e.occasion && <p><b>Occasion:</b> {e.occasion}</p>}
            {e.recipient_name && <p><b>For:</b> {e.recipient_name}</p>}
            {e.box_colour && <p><b>Box:</b> {e.box_colour}</p>}
            {e.personal_message && <p className="sm:col-span-2"><b>Message:</b> “{e.personal_message}”</p>}
            {e.special_instructions && <p className="sm:col-span-2"><b>Instructions:</b> {e.special_instructions}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-blush-50 pt-3">
            <select className="input w-auto py-2" value={e.status} onChange={(ev) => update(e.id, { status: ev.target.value as CustomEnquiry["status"] })} aria-label="Enquiry status">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <a href={`https://wa.me/${e.phone.replace(/\D/g, "").replace(/^(?!91)(\d{10})$/, "91$1")}`} target="_blank" rel="noopener" className="btn-whatsapp py-2"><MessageCircle className="h-4 w-4" /> Chat</a>
            {e.order_id && <Link href={`/admin/orders/${e.order_id}`} className="btn-outline py-2">View order</Link>}
          </div>
          <div className="flex gap-2">
            <input className="input py-2" placeholder="Admin notes" defaultValue={e.admin_notes ?? ""} onChange={(ev) => setNotes({ ...notes, [e.id]: ev.target.value })} aria-label="Admin notes" />
            {notes[e.id] !== undefined && <button className="btn-outline py-2" onClick={() => update(e.id, { admin_notes: notes[e.id] })}>Save</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
