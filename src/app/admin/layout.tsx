import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAndAdmin, getSettings } from "@/lib/data";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = await getUserAndAdmin();
  if (!user) redirect("/account/login?next=/admin");
  if (!isAdmin)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream-50 p-6 text-center">
        <div className="text-6xl">🔒</div>
        <h1 className="mt-4 text-2xl font-bold">Admins only</h1>
        <p className="mt-2 text-ink-soft">Your account ({user.email}) doesn&apos;t have admin access.</p>
        <Link href="/" className="btn-primary mt-6">Back to store</Link>
      </div>
    );
  const settings = await getSettings();
  return <AdminShell brandName={settings.brand_name} email={user.email ?? ""}>{children}</AdminShell>;
}
