import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream-50 px-6 text-center">
      <div className="text-7xl">🎈</div>
      <h1 className="mt-4 text-3xl font-bold">Oops, this surprise got lost</h1>
      <p className="mt-2 text-ink-soft">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
