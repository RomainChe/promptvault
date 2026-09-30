import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Explore prompts — PromptVault", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Explore prompts" />;
}
