import Link from "next/link";
import { Gift, Heart, Sparkles, Truck, Palette, MessageCircleHeart } from "lucide-react";
import { getCategories, getProducts, getSettings } from "@/lib/data";
import { ProductGrid } from "@/components/site/ProductCard";
import { formatINR } from "@/lib/utils";

const COLLECTION_STYLES: Record<string, { emoji: string; bg: string }> = {
  girls: { emoji: "🎀", bg: "from-blush-100 to-blush-200" },
  boys: { emoji: "🎮", bg: "from-sky-100 to-lavender-100" },
  "pink-princess-box": { emoji: "👑", bg: "from-blush-100 to-pink-200" },
  "study-girl-box": { emoji: "📚", bg: "from-lavender-100 to-lavender-200" },
  "self-care-box": { emoji: "🧴", bg: "from-cream-100 to-blush-100" },
  "bestie-forever-box": { emoji: "💞", bg: "from-lavender-100 to-blush-100" },
};

export default async function HomePage() {
  const [settings, categories, featured, newArrivals] = await Promise.all([
    getSettings(),
    getCategories(),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ newArrival: true, limit: 8 }),
  ]);
  const latest = featured.length ? featured : await getProducts({ limit: 8 });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blush-100 via-cream-50 to-lavender-100">
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blush-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-lavender-200/60 blur-3xl" />
        <div className="container-x relative grid items-center gap-10 py-14 sm:py-20 md:grid-cols-2">
          <div className="animate-fade-up text-center md:text-left">
            <span className="chip mb-4 bg-white/80 text-blush-600 shadow-card"><Sparkles className="mr-1 h-3.5 w-3.5" /> Gift hampers delivered across India</span>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              {settings.tagline.split(",")[0]},<br />
              <span className="bg-gradient-to-r from-blush-500 to-lavender-500 bg-clip-text text-transparent">{settings.tagline.split(",").slice(1).join(",").trim() || "big surprises."}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-ink-soft md:mx-0">
              Cute, premium hampers packed with love — pick a ready-made box or build your very own surprise.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
              <Link href="/shop" className="btn-primary px-7"><Gift className="h-4 w-4" /> Shop hampers</Link>
              <Link href="/customise" className="btn-outline px-7"><Palette className="h-4 w-4" /> Build your own</Link>
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-sm animate-fade-up [animation-delay:150ms]">
            <div className="absolute inset-6 rotate-6 rounded-[3rem] bg-gradient-to-br from-lavender-200 to-lavender-300" />
            <div className="absolute inset-6 -rotate-3 rounded-[3rem] bg-gradient-to-br from-blush-200 to-blush-300 shadow-soft" />
            <div className="absolute inset-0 flex items-center justify-center text-[9rem] sm:text-[11rem]"><span className="animate-float drop-shadow-xl">🎁</span></div>
            <span className="absolute left-2 top-8 animate-float text-4xl [animation-delay:1s]">💖</span>
            <span className="absolute bottom-10 right-2 animate-float text-4xl [animation-delay:2s]">✨</span>
            <span className="absolute right-8 top-2 animate-float text-3xl [animation-delay:.5s]">🎀</span>
          </div>
        </div>
      </section>

      {/* USP strip */}
      <section className="container-x -mt-6 relative z-10">
        <div className="grid grid-cols-3 gap-2 rounded-3xl bg-white p-3 shadow-card sm:gap-4 sm:p-5">
          {[
            { icon: Truck, title: "Pan-India delivery", sub: Number(settings.free_shipping_threshold) > 0 ? `Free above ${formatINR(settings.free_shipping_threshold)}` : "Fast & safe" },
            { icon: Heart, title: "Packed with love", sub: "Premium wrapping" },
            { icon: MessageCircleHeart, title: "Personal notes", sub: "Free message card" },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex flex-col items-center gap-1 text-center sm:flex-row sm:gap-3 sm:text-left">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blush-50 text-blush-500"><Icon className="h-5 w-5" /></span>
              <div><p className="text-xs font-bold sm:text-sm">{title}</p><p className="hidden text-xs text-ink-soft sm:block">{sub}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* Collections */}
      {categories.length > 0 && (
        <section className="container-x mt-16">
          <h2 className="section-title text-center">Shop by collection</h2>
          <div className="no-scrollbar mt-6 -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
            {categories.map((c) => {
              const s = COLLECTION_STYLES[c.slug] ?? { emoji: "🎁", bg: "from-blush-100 to-lavender-100" };
              return (
                <Link key={c.id} href={`/collections/${c.slug}`}
                  className={`flex w-36 shrink-0 snap-start flex-col items-center gap-2 rounded-3xl bg-gradient-to-br ${s.bg} p-5 text-center transition hover:-translate-y-1 hover:shadow-soft sm:w-auto`}>
                  <span className="text-4xl">{s.emoji}</span>
                  <span className="text-sm font-bold leading-tight">{c.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="container-x mt-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="section-title">{featured.length ? "Bestsellers & favourites" : "Our hampers"}</h2>
          <Link href="/shop" className="text-sm font-bold text-blush-600 hover:underline">View all →</Link>
        </div>
        <ProductGrid products={latest} emptyText="Our first hampers are being wrapped right now — check back very soon!" />
      </section>

      {/* Custom CTA */}
      <section className="container-x mt-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-lavender-400 to-blush-400 p-8 text-white sm:p-12">
          <div className="absolute -right-6 -top-6 text-[8rem] opacity-30">🎀</div>
          <h2 className="text-3xl font-bold sm:text-4xl">Customise your surprise</h2>
          <p className="mt-2 max-w-lg text-white/90">Pick the goodies, choose a box colour, add a sweet note — we&apos;ll wrap it up beautifully. Pay online or chat with us on WhatsApp.</p>
          <Link href="/customise" className="btn mt-6 bg-white px-7 text-blush-600 hover:bg-cream-100"><Sparkles className="h-4 w-4" /> Start building</Link>
        </div>
      </section>

      {newArrivals.length > 0 && (
        <section className="container-x mt-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="section-title">New arrivals</h2>
            <Link href="/shop?sort=new" className="text-sm font-bold text-blush-600 hover:underline">See more →</Link>
          </div>
          <ProductGrid products={newArrivals} />
        </section>
      )}
    </>
  );
}
