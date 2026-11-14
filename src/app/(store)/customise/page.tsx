import type { Metadata } from "next";
import { getProducts, getSettings } from "@/lib/data";
import { CustomBuilder } from "@/components/site/CustomBuilder";
import { effectivePrice, mainImage } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Customise Your Surprise",
  description: "Build your own custom gift hamper – pick the goodies, box colour and a personal message. Pay online or order on WhatsApp.",
  alternates: { canonical: "/customise" },
};

export default async function CustomisePage() {
  const [settings, products] = await Promise.all([getSettings(), getProducts({ customisable: true })]);
  const items = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: effectivePrice(p),
    image: mainImage(p),
    stock: p.availability === "out_of_stock" ? 0 : p.stock,
    category: p.categories?.name ?? "Goodies",
  }));
  return (
    <CustomBuilder
      items={items}
      basePrice={Number(settings.custom_box_base_price)}
      boxColours={settings.box_colours}
      occasions={settings.occasions}
      whatsappEnabled={!!settings.whatsapp_number}
    />
  );
}
