import { defaults } from "@ep/config/defaults";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { isWorkspacePage } from "../lib/app-paths";
import messages from "../messages/de.json";
import { shellContext } from "../server/app-context";

/**
 * Dates on workspace pages follow the time zone of the active workspace (read once per request,
 * React cache). Website, sign-in and recipient pages keep the default and never need the
 * database for it; a failed lookup falls back to the default as well.
 */
async function timeZone(): Promise<string> {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (!isWorkspacePage(pathname)) return defaults.workspace.timezone;
  try {
    return (await shellContext())?.active?.timezone ?? defaults.workspace.timezone;
  } catch (error) {
    unstable_rethrow(error); // Next.js control flow (dynamic rendering, redirects) passes through
    return defaults.workspace.timezone;
  }
}

/** Single locale "de" without locale routing; all UI texts come from messages/de.json. */
export default getRequestConfig(async () => ({
  locale: "de",
  messages,
  timeZone: await timeZone(),
}));
