import { getSettings } from "@/lib/data";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <div className="flex min-h-screen flex-col">
      {settings.announcement_enabled && settings.announcement && <AnnouncementBar text={settings.announcement} />}
      <Header brandName={settings.brand_name} logoUrl={settings.logo_url} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </div>
  );
}
