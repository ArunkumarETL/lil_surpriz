export function PolicyPage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <div className="container-x max-w-3xl py-10 sm:py-14">
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      {updated && <p className="mt-1 text-sm text-ink-faint">Last updated: {updated}</p>}
      <div className="prose-policy mt-6">{children}</div>
    </div>
  );
}
