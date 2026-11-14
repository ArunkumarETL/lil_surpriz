"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

export function ShopFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const update = (key: string, value: string) => {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.push(`?${p.toString()}`);
  };

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
      <form className="relative flex-1" onSubmit={(e) => { e.preventDefault(); update("q", q.trim()); }}>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input className="input pl-10" placeholder="Search hampers…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
      </form>
      <select className="input sm:w-56" value={params.get("sort") ?? ""} onChange={(e) => update("sort", e.target.value)} aria-label="Sort products">
        <option value="">Featured</option>
        <option value="new">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
      </select>
    </div>
  );
}
