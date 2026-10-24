"use client";

import { createTranslator } from "next-intl";
import messages from "../messages/de.json";

// Rendered outside the root layout: no providers, own <html>, texts straight from de.json.
const t = createTranslator({ locale: "de", messages, namespace: "pages.error" });

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="de">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <main style={{ maxWidth: 520, margin: "20vh auto", padding: "0 16px" }}>
          <h1 style={{ fontSize: 24 }}>{t("title")}</h1>
          <p>{t("text")}</p>
          <button type="button" onClick={retry} style={{ padding: "8px 16px", borderRadius: 8 }}>
            {t("retry")}
          </button>
        </main>
      </body>
    </html>
  );
}
