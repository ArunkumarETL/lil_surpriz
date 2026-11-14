import type { Metadata } from "next";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { Instagram } from "@/components/site/SocialIcons";
import { getSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/utils";

export const metadata: Metadata = { title: "Contact Us", description: "Get in touch with LILSURPRIZ on WhatsApp, email or Instagram.", alternates: { canonical: "/contact" } };

export default async function ContactPage() {
  const s = await getSettings();
  const channels = [
    s.whatsapp_number && { icon: MessageCircle, label: "WhatsApp", value: s.whatsapp_number, href: whatsappLink(s.whatsapp_number, `Hi ${s.brand_name}! I have a question.`), cls: "bg-emerald-50 text-emerald-600" },
    s.contact_phone && { icon: Phone, label: "Call us", value: s.contact_phone, href: `tel:${s.contact_phone.replace(/\s/g, "")}`, cls: "bg-sky-50 text-sky-600" },
    s.contact_email && { icon: Mail, label: "Email", value: s.contact_email, href: `mailto:${s.contact_email}`, cls: "bg-blush-50 text-blush-600" },
    s.instagram_url && { icon: Instagram, label: "Instagram", value: "Follow & DM us", href: s.instagram_url, cls: "bg-lavender-50 text-lavender-600" },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href: string; cls: string }[];
  return (
    <div className="container-x max-w-3xl py-10 sm:py-14">
      <h1 className="text-3xl font-bold sm:text-4xl">Contact us</h1>
      <p className="mt-2 text-ink-soft">Questions about an order, a custom hamper or bulk gifting? We&apos;d love to hear from you.</p>
      {channels.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {channels.map(({ icon: Icon, label, value, href, cls }) => (
            <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${cls}`}><Icon className="h-6 w-6" /></span>
              <span><span className="block font-bold">{label}</span><span className="text-sm text-ink-soft">{value}</span></span>
            </a>
          ))}
        </div>
      ) : (
        <p className="card mt-8 p-6 text-ink-soft">Contact details will be available soon.</p>
      )}
    </div>
  );
}
