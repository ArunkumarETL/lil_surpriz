"use client";

import Image from "next/image";
import { useState } from "react";
import { Gift } from "lucide-react";
import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  if (!images.length)
    return <div className="flex aspect-square items-center justify-center rounded-3xl bg-blush-50 text-blush-300"><Gift className="h-20 w-20" /></div>;
  return (
    <div className="md:sticky md:top-24 md:self-start">
      <div
        className="no-scrollbar flex aspect-square snap-x snap-mandatory overflow-x-auto rounded-3xl bg-blush-50"
        onScroll={(e) => {
          const el = e.currentTarget;
          setActive(Math.round(el.scrollLeft / el.clientWidth));
        }}
        id="gallery-track"
      >
        {images.map((img, i) => (
          <div key={img.id} className="relative aspect-square w-full shrink-0 snap-center">
            <Image src={img.url} alt={`${name} – photo ${i + 1}`} fill priority={i === 0} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button key={img.id} type="button" aria-label={`Show photo ${i + 1}`}
              onClick={() => {
                const el = document.getElementById("gallery-track");
                el?.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
                setActive(i);
              }}
              className={cn("relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 transition sm:h-20 sm:w-20", i === active ? "border-blush-500" : "border-transparent opacity-70")}>
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
