"use client";

// Rendered outside the root layout: no providers, own <html>. The three texts come from a
// subset of de.json (`pages.error`, kept equal by global-error-texts.test.ts) – importing
// de.json here would ship the whole catalog to every visitor (E-048).
import texts from "../messages/global-error.json";

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="de">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <main style={{ maxWidth: 520, margin: "20vh auto", padding: "0 16px" }}>
          <h1 style={{ fontSize: 24 }}>{texts.title}</h1>
          <p>{texts.text}</p>
          <button type="button" onClick={retry} style={{ padding: "8px 16px", borderRadius: 8 }}>
            {texts.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
