import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { PolicyPage } from "@/components/site/PolicyPage";

export const metadata: Metadata = { title: "Terms and Conditions", alternates: { canonical: "/terms" } };

export default async function Page() {
  const s = await getSettings();
  return (
    <PolicyPage title="Terms and Conditions">
      <p>By using the {s.brand_name} website and placing an order, you agree to these terms.</p>
      <h2>Products</h2>
      <p>We try our best to display products accurately. Since many hampers are hand-assembled, small variations in colour, packaging or individual items may occur. If an item is unavailable, we may replace it with an item of similar or higher value.</p>
      <h2>Pricing</h2>
      <p>All prices are in Indian Rupees (INR) and inclusive of applicable taxes unless stated otherwise. Delivery charges, if any, are shown at checkout. We reserve the right to correct pricing errors.</p>
      <h2>Orders and payment</h2>
      <p>An order is confirmed only after successful payment is verified with our payment partner, Cashfree Payments. WhatsApp custom hamper enquiries are not confirmed orders until payment is received.</p>
      <h2>Custom hampers</h2>
      <p>Personalised messages and custom selections are prepared as provided by you. Please double-check names and messages before ordering.</p>
      <h2>Accounts</h2>
      <p>You are responsible for keeping your account credentials confidential and for activity under your account.</p>
      <h2>Liability</h2>
      <p>Our liability for any order is limited to the amount paid for that order.</p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India.</p>
    </PolicyPage>
  );
}
