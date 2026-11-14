import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Sparkles, Gift } from "lucide-react";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "About Us", description: "The story behind LILSURPRIZ – little gifts, big surprises.", alternates: { canonical: "/about" } };

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <div>
      <section className="bg-gradient-to-br from-blush-100 to-lavender-100">
        <div className="container-x max-w-3xl py-14 text-center">
          <h1 className="text-3xl font-bold sm:text-5xl">Hi, we&apos;re {s.brand_name} 💕</h1>
          <p className="mt-4 text-lg text-ink-soft">{s.tagline}</p>
        </div>
      </section>
      <div className="container-x max-w-3xl py-12">
        <p className="text-lg leading-relaxed text-ink-soft">
          {s.brand_name} started with a simple idea: the best gifts aren&apos;t the biggest — they&apos;re the ones that make someone feel truly seen.
          We curate cute, premium gift hampers and help you build your own custom surprise boxes, packed by hand and delivered across India.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Gift, t: "Thoughtfully curated", d: "Every item is hand-picked to delight." },
            { icon: Heart, t: "Packed with love", d: "Wrapped beautifully, ready to gift." },
            { icon: Sparkles, t: "Made personal", d: "Add notes, pick colours, build your own." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="card p-5 text-center">
              <Icon className="mx-auto h-8 w-8 text-blush-500" />
              <h2 className="mt-3 font-bold">{t}</h2>
              <p className="mt-1 text-sm text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center"><Link href="/shop" className="btn-primary px-8">Explore our hampers</Link></div>
      </div>
    </div>
  );
}
