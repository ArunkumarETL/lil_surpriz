import Image from "next/image";
import Link from "next/link";

export function Logo({ name, logoUrl, className = "" }: { name: string; logoUrl?: string | null; className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} aria-label={`${name} home`}>
      {logoUrl ? (
        <Image src={logoUrl} alt={name} width={140} height={40} className="h-9 w-auto object-contain" priority />
      ) : (
        <span className="font-display text-2xl font-bold tracking-tight">
          <span className="text-blush-500">lil</span>
          <span className="text-lavender-500">surpriz</span>
          <span className="ml-0.5 inline-block animate-float text-blush-400">♡</span>
        </span>
      )}
    </Link>
  );
}
