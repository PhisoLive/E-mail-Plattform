import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
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
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1d22" },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Reading the request headers renders every page dynamically. That is required for the
  // nonce-based CSP: Next.js attaches the per-request nonce from proxy.ts to its scripts,
  // which static pages cannot carry (ENTSCHEIDUNGEN E-026).
  await headers();
  return (
    <html lang="de" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh bg-bg font-sans text-text antialiased">
        <NextIntlClientProvider>
          <TrpcProviders>{children}</TrpcProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
