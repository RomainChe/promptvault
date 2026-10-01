"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "./safe-next-path";

export type MagicLinkState = { status: "idle" | "invalid" | "sent" | "error"; email?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function callbackUrl(formData: FormData) {
  const next = safeNextPath(String(formData.get("next") ?? ""));
  const origin = (await headers()).get("origin");
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

// Same answer whether or not the account exists: the form never reveals who is registered.
export async function sendMagicLink(_prev: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const email = String(formData.get("email") ?? "").trim();
  if (email.length > 254 || !EMAIL.test(email)) return { status: "invalid", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: await callbackUrl(formData) } });
  return { status: error ? "error" : "sent", email };
}

export async function signInWithGitHub(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: await callbackUrl(formData) },
  });
  redirect(error || !data.url ? "/sign-in?error=link" : data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
