import Image from "next/image";
import { Gift, Truck } from "lucide-react";
import type { Order } from "@/lib/types";
import { STATUS_STYLES, formatINR } from "@/lib/utils";

const STEPS = ["paid", "processing", "packed", "shipped", "delivered"] as const;

export function OrderDetails({ order }: { order: Order }) {
  const items = order.order_items ?? [];
  const stepIdx = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Order {order.order_number}</h2>
          <p className="text-xs text-ink-faint">{new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
        </div>
        <div className="flex gap-2">
          <span className={`chip capitalize ${STATUS_STYLES[order.status]}`}>{order.status}</span>
          <span className={`chip capitalize ${STATUS_STYLES[order.payment_status]}`}>Payment: {order.payment_status}</span>
        </div>
      </div>

      {stepIdx >= 0 && (
        <ol className="mt-5 flex items-center gap-1">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col items-center gap-1">
              <span className={`h-2 w-full rounded-full ${i <= stepIdx ? "bg-blush-400" : "bg-blush-100"}`} />
              <span className={`text-[10px] capitalize sm:text-xs ${i <= stepIdx ? "font-bold text-blush-600" : "text-ink-faint"}`}>{s}</span>
            </li>
          ))}
        </ol>
      )}

      {(order.tracking_number || order.tracking_url) && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-lavender-50 p-4 text-sm">
          <Truck className="mt-0.5 h-5 w-5 text-lavender-500" />
          <div>
            <p className="font-semibold">{order.courier || "Shipment"} {order.tracking_number && <>· {order.tracking_number}</>}</p>
            {order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-lavender-600 underline">Track package</a>}
          </div>
        </div>
      )}

      <ul className="mt-5 divide-y divide-blush-50">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-3 py-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-blush-50">
              {i.image_url ? <Image src={i.image_url} alt="" fill sizes="56px" className="object-cover" /> : <Gift className="m-auto h-full w-6 text-blush-300" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{i.product_name}</p>
              <p className="text-xs text-ink-soft">{formatINR(i.unit_price)} × {i.quantity}{i.customisation?.part_of === "custom_box" && " · in custom box"}</p>
              {i.customisation?.type === "custom_box" && typeof i.customisation.personal_message === "string" && i.customisation.personal_message && (
                <p className="truncate text-xs italic text-ink-faint">“{i.customisation.personal_message}”</p>
              )}
            </div>
            <span className="text-sm font-bold">{formatINR(i.line_total)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-3 space-y-1 border-t border-blush-100 pt-3 text-sm">
        <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
        {Number(order.discount) > 0 && <div className="flex justify-between text-emerald-600"><dt>Discount {order.coupon_code && `(${order.coupon_code})`}</dt><dd>−{formatINR(order.discount)}</dd></div>}
        <div className="flex justify-between"><dt className="text-ink-soft">Delivery</dt><dd>{Number(order.shipping_fee) === 0 ? "FREE" : formatINR(order.shipping_fee)}</dd></div>
        <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
      </dl>
      <div className="mt-4 rounded-2xl bg-cream-100 p-4 text-sm">
        <p className="font-semibold">Delivering to {order.customer_name}</p>
        <p className="text-ink-soft">{order.shipping_address.line1}{order.shipping_address.line2 && `, ${order.shipping_address.line2}`}, {order.shipping_address.city}, {order.shipping_address.state} – {order.shipping_address.pincode}</p>
      </div>
    </div>
  );
}
