import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { PlaceholderPage, placeholderMetadata } from "../../../../components/placeholder-page";
import { requireAppContext } from "../../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("privacy");
}

export default async function PrivacyPage() {
  await requireAppContext({ path: "/einstellungen/datenschutz" });
  return <PlaceholderPage pageKey="privacy" icon={<ShieldCheck aria-hidden="true" />} />;
}
