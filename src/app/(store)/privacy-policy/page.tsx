import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { PolicyPage } from "@/components/site/PolicyPage";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy-policy" } };

export default async function Page() {
  const s = await getSettings();
  return (
    <PolicyPage title="Privacy Policy">
      <p>{s.brand_name} (&quot;we&quot;, &quot;us&quot;) respects your privacy. This policy explains what information we collect when you use our website and how we use it.</p>
      <h2>Information we collect</h2>
      <ul>
        <li>Contact details you provide: name, email address, mobile number and delivery address.</li>
        <li>Order details: products purchased, custom hamper preferences, gift messages and order history.</li>
        <li>Account information if you create an account (email and an encrypted password).</li>
        <li>Basic technical data such as browser type and pages visited, used to keep the site working securely.</li>
      </ul>
      <h2>Payments</h2>
      <p>Payments are processed by Cashfree Payments. We never see or store your card, UPI PIN or net-banking credentials. We only receive the payment status and a payment reference ID.</p>
      <h2>How we use your information</h2>
      <ul>
        <li>To process, pack and deliver your orders and send order updates.</li>
        <li>To respond to your enquiries, including WhatsApp custom hamper requests.</li>
        <li>To prevent fraud and keep our store secure.</li>
      </ul>
      <h2>Sharing</h2>
      <p>We share information only with service providers needed to fulfil your order (payment gateway, courier partners, hosting and database providers). We do not sell your personal data.</p>
      <h2>Your choices</h2>
      <p>You can view and update your profile from My Account, or contact us{ s.contact_email ? <> at <a className="text-blush-600 underline" href={`mailto:${s.contact_email}`}>{s.contact_email}</a></> : null} to request access to or deletion of your data.</p>
      <h2>Cookies</h2>
      <p>We use essential cookies and local storage to keep you logged in and remember your cart.</p>
    </PolicyPage>
  );
}
