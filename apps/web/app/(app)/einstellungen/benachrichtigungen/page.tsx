import { Bell } from "lucide-react";
import type { Metadata } from "next";
import { PlaceholderPage, placeholderMetadata } from "../../../../components/placeholder-page";
import { requireAppContext } from "../../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("notifications");
}

export default async function NotificationsPage() {
  await requireAppContext({ path: "/einstellungen/benachrichtigungen" });
  return <PlaceholderPage pageKey="notifications" icon={<Bell aria-hidden="true" />} />;
}
