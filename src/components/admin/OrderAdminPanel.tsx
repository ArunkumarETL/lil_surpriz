"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ORDER_STATUSES, type Order } from "@/lib/types";

export function OrderAdminPanel({ order }: { order: Order }) {
  const router = useRouter();
  const [f, setF] = useState({ status: order.status, courier: order.courier ?? "", tracking_number: order.tracking_number ?? "", tracking_url: order.tracking_url ?? "", notes: order.notes ?? "" });
  const [cancel, setCancel] = useState({ reason: "", restock: true });
  const [busy, setBusy] = useState<string | null>(null);
  const unpaid = order.payment_status !== "paid";
  const allowed = ORDER_STATUSES.filter((s) => s !== "cancelled" && (!unpaid || s === "pending"));

  const save = async () => {
    if (f.tracking_url && !/^https?:\/\//.test(f.tracking_url)) return toast.error("Tracking URL must start with http(s)://");
    setBusy("save");
    const { error } = await createClient().from("orders").update({ status: f.status, courier: f.courier.trim() || null, tracking_number: f.tracking_number.trim() || null, tracking_url: f.tracking_url.trim() || null, notes: f.notes.trim() || null }).eq("id", order.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Order updated");
    router.refresh();
  };

  const doCancel = async () => {
    if (!confirm("Cancel this order?")) return;
    setBusy("cancel");
    const { error } = await createClient().rpc("admin_cancel_order", { p_order_id: order.id, p_reason: cancel.reason, p_restock: cancel.restock });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Order cancelled");
    router.refresh();
  };

  const recheck = async () => {
    setBusy("sync");
    const res = await fetch(`/api/admin/orders/${order.id}/sync`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error(j.error || "Could not verify payment");
    toast.success(`Cashfree status: ${j.payment_status}`);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-4 p-5">
        <h2 className="font-bold">Update order</h2>
        {order.status === "cancelled" ? <p className="text-sm text-red-500">This order is cancelled{order.cancel_reason && `: ${order.cancel_reason}`}.</p> : (
          <>
            <div><label className="label" htmlFor="ostatus">Order status</label>
              <select id="ostatus" className="input capitalize" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Order["status"] })}>{allowed.map((s) => <option key={s} value={s}>{s}</option>)}</select>
              {unpaid && <p className="mt-1 text-xs text-ink-faint">Unpaid orders can only move forward after Cashfree confirms payment.</p>}
            </div>
            <div><label className="label" htmlFor="courier">Courier</label><input id="courier" className="input" value={f.courier} onChange={(e) => setF({ ...f, courier: e.target.value })} placeholder="Delhivery, Blue Dart…" /></div>
            <div><label className="label" htmlFor="awb">Tracking number</label><input id="awb" className="input" value={f.tracking_number} onChange={(e) => setF({ ...f, tracking_number: e.target.value })} /></div>
            <div><label className="label" htmlFor="turl">Tracking URL</label><input id="turl" type="url" className="input" value={f.tracking_url} onChange={(e) => setF({ ...f, tracking_url: e.target.value })} /></div>
            <div><label className="label" htmlFor="notes">Internal notes</label><textarea id="notes" className="input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
            <button className="btn-primary w-full" onClick={save} disabled={!!busy}>{busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />} Save changes</button>
          </>
        )}
      </div>
      {order.cashfree_order_id && order.payment_status !== "paid" && (
        <div className="card p-5"><h2 className="font-bold">Payment verification</h2><p className="mt-1 text-sm text-ink-soft">Check the latest status directly with Cashfree.</p>
          <button className="btn-outline mt-3 w-full" onClick={recheck} disabled={!!busy}>{busy === "sync" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Re-check with Cashfree</button></div>
      )}
      {order.status !== "cancelled" && order.status !== "delivered" && (
        <div className="card space-y-3 p-5">
          <h2 className="font-bold text-red-500">Cancel order</h2>
          <input className="input" placeholder="Reason (shown to customer)" value={cancel.reason} onChange={(e) => setCancel({ ...cancel, reason: e.target.value })} aria-label="Cancel reason" />
          {!unpaid && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-blush-500" checked={cancel.restock} onChange={(e) => setCancel({ ...cancel, restock: e.target.checked })} /> Return items to stock</label>}
          {!unpaid && <p className="text-xs text-ink-faint">Refunds must be issued from your Cashfree dashboard.</p>}
          <button className="btn w-full bg-red-50 text-red-600 hover:bg-red-100" onClick={doCancel} disabled={!!busy}>{busy === "cancel" && <Loader2 className="h-4 w-4 animate-spin" />} Cancel order</button>
        </div>
      )}
    </div>
  );
}
