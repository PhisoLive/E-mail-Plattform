import { Plug } from "lucide-react";
import type { Metadata } from "next";
import { PlaceholderPage, placeholderMetadata } from "../../../../components/placeholder-page";
import { requireAppContext } from "../../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("connections");
}

export default async function ConnectionsPage() {
  await requireAppContext({ path: "/einstellungen/verbindungen" });
  return <PlaceholderPage pageKey="connections" icon={<Plug aria-hidden="true" />} />;
}
