"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { startCashfreeCheckout } from "./cashfreeCheckout";

export function RetryPaymentButton({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button className="btn-primary" disabled={busy} onClick={async () => {
      setBusy(true);
      try {
        const r = await fetch("/api/payments/retry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        await startCashfreeCheckout(j.paymentSessionId, j.mode);
      } catch (e) {
        toast.error((e as Error).message || "Could not start payment");
        setBusy(false);
      }
    }}>
      {busy && <Loader2 className="h-4 w-4 animate-spin" />} Pay now
    </button>
  );
}
