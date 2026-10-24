import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { HydrationMarker } from "../components/hydration-marker";
import { parseTheme, themeClass, themeCookie } from "../lib/theme";
import { TrpcProviders } from "../lib/trpc";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("tagline"),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#16181d" },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Reading the request headers renders every page dynamically. That is required for the
  // nonce-based CSP: Next.js attaches the per-request nonce from proxy.ts to its scripts,
  // which static pages cannot carry (ENTSCHEIDUNGEN E-026).
  await headers();
  const theme = themeClass(parseTheme((await cookies()).get(themeCookie)?.value));
  return (
    <html
      lang="de"
      className={[GeistSans.variable, GeistMono.variable, theme].filter(Boolean).join(" ")}
    >
      <body className="min-h-dvh bg-bg font-sans text-text antialiased">
        <NextIntlClientProvider>
          <TrpcProviders>{children}</TrpcProviders>
          <HydrationMarker />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
