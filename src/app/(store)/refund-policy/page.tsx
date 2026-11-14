import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { PolicyPage } from "@/components/site/PolicyPage";

export const metadata: Metadata = { title: "Refund and Cancellation Policy", alternates: { canonical: "/refund-policy" } };

export default async function Page() {
  const s = await getSettings();
  const contact = s.whatsapp_number ? `WhatsApp (${s.whatsapp_number})` : s.contact_email ?? "our contact page";
  return (
    <PolicyPage title="Refund and Cancellation Policy">
      <h2>Cancellations</h2>
      <ul>
        <li>Ready-made hampers can be cancelled before they are packed. Contact us via {contact} with your order number.</li>
        <li>Customised hampers cannot be cancelled once preparation has started, as they are made specially for you.</li>
      </ul>
      <h2>Damaged or wrong items</h2>
      <p>If your hamper arrives damaged or incorrect, please share an unboxing video/photos within 48 hours of delivery. We will offer a replacement or refund after review.</p>
      <h2>Refunds</h2>
      <ul>
        <li>Approved refunds are processed to the original payment method via Cashfree Payments.</li>
        <li>Refunds typically reflect within 5–7 business days, depending on your bank.</li>
        <li>Delivery charges are non-refundable unless the error was ours.</li>
      </ul>
      <h2>Non-returnable items</h2>
      <p>For hygiene reasons, opened self-care, cosmetic and food items cannot be returned.</p>
    </PolicyPage>
  );
}
