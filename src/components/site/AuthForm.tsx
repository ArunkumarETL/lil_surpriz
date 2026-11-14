"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/account";
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const supabase = createClient();
    const { data, error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        : await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: { data: { full_name: form.name }, emailRedirectTo: `${window.location.origin}/account` },
          });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (mode === "signup" && !data.session) {
      toast.success("Check your email to confirm your account, then log in.");
      return router.push("/account/login");
    }
    toast.success(mode === "login" ? "Welcome back!" : "Account created!");
    router.replace(next);
    router.refresh();
  };

  return (
    <div className="container-x flex justify-center py-12 sm:py-20">
      <form onSubmit={submit} className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold">{mode === "login" ? "Welcome back 💕" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-ink-soft">{mode === "login" ? "Log in to view your orders and checkout faster." : "Track orders and save your details for next time."}</p>
        <div className="mt-6 space-y-4">
          {mode === "signup" && (
            <div><label className="label" htmlFor="name">Full name</label><input id="name" className="input" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></div>
          )}
          <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></div>
          <div><label className="label" htmlFor="password">Password</label><input id="password" type="password" className="input" required minLength={mode === "signup" ? 8 : 1} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete={mode === "login" ? "current-password" : "new-password"} /></div>
        </div>
        <button className="btn-primary mt-6 w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "login" ? "Log in" : "Sign up"}</button>
        <p className="mt-4 text-center text-sm text-ink-soft">
          {mode === "login" ? <>New here? <Link href={`/account/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-blush-600">Create an account</Link></>
            : <>Already have an account? <Link href={`/account/login?next=${encodeURIComponent(next)}`} className="font-semibold text-blush-600">Log in</Link></>}
        </p>
      </form>
    </div>
  );
}
