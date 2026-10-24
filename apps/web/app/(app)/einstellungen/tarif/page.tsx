import { CreditCard } from "lucide-react";
import type { Metadata } from "next";
import { PlaceholderPage, placeholderMetadata } from "../../../../components/placeholder-page";
import { requireAppContext } from "../../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("plan");
}

export default async function PlanPage() {
  await requireAppContext({ path: "/einstellungen/tarif" });
  return <PlaceholderPage pageKey="plan" icon={<CreditCard aria-hidden="true" />} />;
}
