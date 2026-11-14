import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/site/AuthForm";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function SignupPage() {
  return <Suspense><AuthForm mode="signup" /></Suspense>;
}
