import { Code } from "lucide-react";
import type { Metadata } from "next";
import { PlaceholderPage, placeholderMetadata } from "../../../../components/placeholder-page";
import { requireAppContext } from "../../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("api");
}

export default async function ApiPage() {
  await requireAppContext({ path: "/einstellungen/api" });
  return <PlaceholderPage pageKey="api" icon={<Code aria-hidden="true" />} />;
}
