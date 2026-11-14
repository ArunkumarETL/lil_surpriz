import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { Toaster } from "sonner";
import { CartProvider } from "@/components/site/CartProvider";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

const display = Fredoka({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700"] });
const body = Nunito({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "LILSURPRIZ – Little gifts, big surprises.", template: "%s | LILSURPRIZ" },
  description: "Cute, premium customised and ready-made gift hampers delivered across India. Shop girls & boys hampers or build your own surprise box.",
  keywords: ["gift hampers", "custom gift box", "gifts for girlfriend", "birthday hamper India", "LILSURPRIZ"],
  openGraph: {
    type: "website",
    siteName: "LILSURPRIZ",
    locale: "en_IN",
    title: "LILSURPRIZ – Little gifts, big surprises.",
    description: "Customised and ready-made gift hampers delivered across India.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#ffd1e1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable}`}>
      <body>
        <CartProvider>{children}</CartProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
