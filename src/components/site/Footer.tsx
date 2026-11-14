import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Instagram, Facebook, Youtube, Twitter } from "./SocialIcons";
import type { StoreSettings } from "@/lib/types";
import { whatsappLink } from "@/lib/utils";
import { Logo } from "./Logo";

export function Footer({ settings }: { settings: StoreSettings }) {
  const socials = [
    { url: settings.instagram_url, icon: Instagram, label: "Instagram" },
    { url: settings.facebook_url, icon: Facebook, label: "Facebook" },
    { url: settings.youtube_url, icon: Youtube, label: "YouTube" },
    { url: settings.twitter_url, icon: Twitter, label: "X / Twitter" },
  ].filter((s) => s.url);
  return (
    <footer className="mt-20 bg-gradient-to-b from-blush-50 to-lavender-50">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo name={settings.brand_name} logoUrl={settings.logo_url} />
          <p className="mt-3 text-sm text-ink-soft">{settings.tagline}</p>
          {socials.length > 0 && (
            <div className="mt-4 flex gap-2">
              {socials.map(({ url, icon: Icon, label }) => (
                <a key={label} href={url!} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blush-500 shadow-card hover:bg-blush-100">
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="mb-3 font-bold">Shop</h3>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link href="/shop" className="hover:text-blush-600">Shop All</Link></li>
            <li><Link href="/collections/girls" className="hover:text-blush-600">Girls Collection</Link></li>
            <li><Link href="/collections/boys" className="hover:text-blush-600">Boys Collection</Link></li>
            <li><Link href="/customise" className="hover:text-blush-600">Customise Your Surprise</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-bold">Help</h3>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link href="/shipping-policy" className="hover:text-blush-600">Shipping Policy</Link></li>
            <li><Link href="/refund-policy" className="hover:text-blush-600">Refund & Cancellation</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-blush-600">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-blush-600">Terms & Conditions</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-bold">Say hi</h3>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link href="/about" className="hover:text-blush-600">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-blush-600">Contact Us</Link></li>
            {settings.contact_email && (
              <li><a href={`mailto:${settings.contact_email}`} className="inline-flex items-center gap-2 hover:text-blush-600"><Mail className="h-4 w-4" />{settings.contact_email}</a></li>
            )}
            {settings.whatsapp_number && (
              <li><a href={whatsappLink(settings.whatsapp_number, "Hi! I have a question.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-blush-600"><Phone className="h-4 w-4" />WhatsApp us</a></li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-blush-100 py-5 text-center text-xs text-ink-faint">
        © {new Date().getFullYear()} {settings.brand_name}. Made with ♡ in India.
      </div>
    </footer>
  );
}
