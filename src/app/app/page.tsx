import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { requireUser } from "@/lib/identity/session";

export const metadata: Metadata = { title: "My prompts — PromptVault", robots: { index: false } };

export default async function Page() {
  await requireUser();
  return <ComingSoon title="My prompts" />;
}
