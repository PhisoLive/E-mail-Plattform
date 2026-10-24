import { FileUp } from "lucide-react";
import type { Metadata } from "next";
import { PlaceholderPage, placeholderMetadata } from "../../../../components/placeholder-page";
import { requireAppContext } from "../../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("contactImport");
}

export default async function ContactImportPage() {
  await requireAppContext({ path: "/kontakte/import" });
  return <PlaceholderPage pageKey="contactImport" icon={<FileUp aria-hidden="true" />} />;
}
