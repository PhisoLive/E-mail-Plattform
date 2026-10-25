import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, expect, test } from "@playwright/test";
import {
  createWorkspace,
  defaultPassword,
  enableTwoFactor,
  login,
  registerAndVerify,
  uniqueAddress,
} from "./helpers";

/**
 * Phase 1 acceptance (concept chapter 20): Lighthouse accessibility score of at least 95.
 * Lighthouse drives a Chromium that is signed in as a workspace owner, so app pages count too.
 */
const minimumScore = 0.95;

const pages = [
  "/",
  "/preise",
  "/login",
  "/registrieren",
  "/start",
  "/posteingang",
  "/auftraege/neu",
  "/vorlagen",
  "/postfaecher/verbinden",
  "/agenten/neu",
  "/einstellungen/profil",
  "/einstellungen/team",
  "/einstellungen/absender",
  "/einstellungen/abmeldeseite",
  "/willkommen?schritt=agent",
];

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() =>
        typeof address === "object" && address
          ? resolve(address.port)
          : reject(new Error("no port")),
      );
    });
  });
}

test("Lighthouse-Barrierefreiheit mindestens 95 auf Website und App", async () => {
  const testInfo = test.info();
  test.setTimeout(600_000);
  const baseURL = testInfo.project.use.baseURL ?? "http://127.0.0.1:4400";
  const port = await freePort();
  const profile = mkdtempSync(join(tmpdir(), "ep-lighthouse-"));
  const context = await chromium.launchPersistentContext(profile, {
    args: [`--remote-debugging-port=${port}`],
    baseURL,
    viewport: { width: 1350, height: 940 },
    locale: "de-DE",
  });
  try {
    const page = await context.newPage();
    const owner = {
      name: "Lena Lighthouse",
      email: uniqueAddress("lh"),
      password: defaultPassword,
    };
    await registerAndVerify(page, owner);
    await login(page, owner);
    await createWorkspace(page, "Prüfstand GmbH");
    await enableTwoFactor(page, owner.password);

    const { default: lighthouse } = await import("lighthouse");
    const scores: Record<string, { desktop: number; mobile: number; failing: string[] }> = {};
    for (const path of pages) {
      const entry = { desktop: 0, mobile: 0, failing: [] as string[] };
      for (const formFactor of ["desktop", "mobile"] as const) {
        const result = await lighthouse(`${baseURL}${path}`, {
          port,
          output: "json",
          logLevel: "error",
          onlyCategories: ["accessibility"],
          disableStorageReset: true,
          formFactor,
          screenEmulation:
            formFactor === "desktop"
              ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }
              : { mobile: true, width: 360, height: 740, deviceScaleFactor: 2, disabled: false },
          throttlingMethod: "provided",
        });
        const lhr = result?.lhr;
        if (!lhr) throw new Error(`no Lighthouse result for ${path}`);
        // Measure the intended page – not a login or onboarding page after a redirect.
        const measured = new URL(lhr.finalDisplayedUrl);
        expect(`${measured.pathname}${measured.search}`, `measured page for ${path}`).toBe(path);
        entry[formFactor] = lhr.categories.accessibility?.score ?? 0;
        for (const audit of Object.values(lhr.audits)) {
          if (audit.score !== null && audit.score < 1 && audit.scoreDisplayMode === "binary")
            entry.failing.push(`${formFactor}: ${audit.id}`);
        }
      }
      scores[path] = entry;
    }
    mkdirSync("test-results", { recursive: true });
    writeFileSync(
      "test-results/lighthouse-accessibility.json",
      `${JSON.stringify(scores, null, 2)}\n`,
    );
    testInfo.attach("lighthouse-accessibility", {
      body: JSON.stringify(scores, null, 2),
      contentType: "application/json",
    });
    for (const [path, entry] of Object.entries(scores)) {
      expect(entry.desktop, `${path} desktop ${entry.failing.join(", ")}`).toBeGreaterThanOrEqual(
        minimumScore,
      );
      expect(entry.mobile, `${path} mobile ${entry.failing.join(", ")}`).toBeGreaterThanOrEqual(
        minimumScore,
      );
    }
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
});
