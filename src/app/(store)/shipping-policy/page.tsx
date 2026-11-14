import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { PolicyPage } from "@/components/site/PolicyPage";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Shipping Policy", alternates: { canonical: "/shipping-policy" } };

export default async function Page() {
  const s = await getSettings();
  return (
    <PolicyPage title="Shipping Policy">
      <h2>Where we ship</h2>
      <p>We deliver across India through trusted courier partners.</p>
      <h2>Charges</h2>
      <ul>
        <li>Standard delivery: {formatINR(s.shipping_charge)} per order.</li>
        {Number(s.free_shipping_threshold) > 0 && <li>FREE delivery on orders of {formatINR(s.free_shipping_threshold)} or more (after discounts).</li>}
      </ul>
      <h2>Processing time</h2>
      <p>Ready-made hampers are usually dispatched within 1–3 business days. Customised hampers may take 2–5 business days to prepare.</p>
      <h2>Delivery time</h2>
      <p>Most orders arrive within 3–7 business days after dispatch, depending on your location.</p>
      <h2>Tracking</h2>
      <p>Once shipped, tracking details are added to your order and visible in My Orders.</p>
      <h2>Address accuracy</h2>
      <p>Please make sure your address, pincode and mobile number are correct. We are not responsible for delays caused by incorrect details.</p>
    </PolicyPage>
  );
}
