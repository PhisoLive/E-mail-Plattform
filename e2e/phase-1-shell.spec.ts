import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { type Browser, expect, type Page, test } from "@playwright/test";
import {
  collectTextErrors,
  createOwnerSession,
  type E2eObjects,
  expectNoHorizontalOverflow,
  gotoReady,
  insertDetailObjects,
  type OwnerSession,
  withE2eSql,
} from "./helpers";

/**
 * Phase 1 acceptance (concept chapter 20): every route of chapter 13 exists, accessibility
 * (axe, WCAG 2.2 AA), clean from 360 px, dark mode, and the sender profile saves the
 * mandatory details.
 */
test.describe.configure({ mode: "serial" });

let session: OwnerSession;
let objects: E2eObjects;

test.beforeAll(async ({ browser }) => {
  session = await createOwnerSession(browser, "Olga Owner", "Bäckerei Huber");
  objects = await insertDetailObjects(session.user.email);
});

async function ownerPage(browser: Browser, viewport?: { width: number; height: number }) {
  const context = await browser.newContext({
    storageState: session.storageState,
    ...(viewport ? { viewport } : {}),
  });
  return context.newPage();
}

/** Every route of chapter 13 with the heading it must show. */
function appRoutes(): Array<[string, string | RegExp]> {
  return [
    ["/start", /Hallo Olga/],
    ["/posteingang", "Posteingang"],
    [`/posteingang/${objects.mailboxId}`, /info-.*@baeckerei\.test/],
    [`/posteingang/thread/${objects.threadId}`, "Frage zum Angebot"],
    ["/auftraege", "Aufträge"],
    ["/auftraege/neu", "Neuer Auftrag"],
    [`/auftraege/${objects.campaignId}`, /Sommerfest 2027/],
    ["/kontakte", "Kontakte"],
    [`/kontakte/${objects.contactId}`, "Erika Mustermann"],
    ["/kontakte/listen", "Listen"],
    ["/kontakte/import", "Kontakte importieren"],
    ["/vorlagen", "Vorlagen"],
    ["/postfaecher", "Postfächer"],
    ["/postfaecher/verbinden", "Postfach verbinden"],
    ["/postfaecher/kaufen", "Postfach kaufen"],
    [`/postfaecher/${objects.mailboxId}`, /info-.*@baeckerei\.test/],
    ["/agenten", "Agenten"],
    ["/agenten/neu", "Agenten anlegen"],
    [`/agenten/${objects.agentId}`, "Agentin Anna"],
    [`/chat/${objects.agentId}/${objects.conversationId}`, "Einladung planen"],
    ["/einstellungen/profil", "Profil"],
    ["/einstellungen/team", "Team"],
    ["/einstellungen/absender", "Absender"],
    ["/einstellungen/abmeldeseite", "Abmeldeseite"],
    ["/einstellungen/tarif", "Tarif"],
    ["/einstellungen/datenschutz", "Datenschutz"],
    ["/einstellungen/benachrichtigungen", "Benachrichtigungen"],
    ["/einstellungen/verbindungen", "Verbindungen"],
    ["/einstellungen/api", "API"],
    ["/willkommen?schritt=postfach", "Verbinde dein Postfach"],
    ["/willkommen?schritt=absender", "Wer schreibt?"],
    ["/willkommen?schritt=agent", "Wähle deinen ersten Agenten"],
    ["/willkommen?schritt=auftrag", "Dein erster Auftrag"],
  ];
}

const publicRoutes: Array<[string, string | RegExp]> = [
  ["/", "Du sagst das Ziel, nicht die E-Mail."],
  ["/preise", "Preise"],
  ["/impressum", "Impressum"],
  ["/datenschutz", "Datenschutzerklärung"],
  ["/agb", "Allgemeine Geschäftsbedingungen"],
  ["/avv", "Vertrag zur Auftragsverarbeitung"],
  [`/u/${"t".repeat(22)}`, "Abmelden"],
  [`/c/${"t".repeat(22)}`, "Link nicht gefunden"],
  ["/login", "Willkommen zurück"],
  ["/registrieren", /Konto/],
  ["/passwort-vergessen", "Passwort vergessen"],
  ["/passwort-neu", "Neues Passwort"],
];

async function visit(page: Page, path: string, heading: string | RegExp) {
  const response = await gotoReady(page, path);
  expect(response?.status(), path).toBeLessThan(400);
  await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  if (process.env.E2E_SCREENSHOTS === "1") {
    const width = page.viewportSize()?.width ?? 0;
    const name = `${path.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home"}-${width}`;
    await page.screenshot({ path: `test-results/screens/${name}.png`, fullPage: true });
  }
}

async function expectAccessible(page: Page, label: string) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const violations = result.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(" "))
        .join(" | ")}`,
  );
  expect(violations, `axe on ${label}`).toEqual([]);
}

test("Alle Routen aus Kapitel 13 existieren, mit deutschen Texten und ohne Barrieren", async ({
  browser,
}) => {
  test.setTimeout(420_000);
  const page = await ownerPage(browser);
  const textErrors = collectTextErrors(page);
  for (const [path, heading] of appRoutes()) {
    await visit(page, path, heading);
    await expectAccessible(page, path);
  }
  const anonymous = await (await browser.newContext()).newPage();
  const publicErrors = collectTextErrors(anonymous);
  for (const [path, heading] of publicRoutes) {
    await visit(anonymous, path, heading);
    await expectAccessible(anonymous, path);
  }
  expect([...textErrors, ...publicErrors]).toEqual([]);
});

test("Detailseiten zeigen nur Objekte des eigenen Arbeitsbereichs", async ({ browser }) => {
  const page = await ownerPage(browser);
  for (const path of [
    `/auftraege/${randomUUID()}`,
    `/kontakte/${randomUUID()}`,
    `/postfaecher/${randomUUID()}`,
    `/agenten/${randomUUID()}`,
    `/posteingang/thread/${randomUUID()}`,
    `/chat/${objects.agentId}/${randomUUID()}`,
    "/auftraege/kein-gueltiger-schluessel",
  ]) {
    await gotoReady(page, path);
    await expect(page.getByText("Nicht gefunden", { exact: true })).toBeVisible();
  }
  // The campaign has the tabs of chapter 13.
  await gotoReady(page, `/auftraege/${objects.campaignId}`);
  const tabs = page.getByRole("tablist", { name: "Bereiche des Auftrags" });
  for (const tab of [
    "Übersicht",
    "Live",
    "Empfänger",
    "Nachrichten",
    "Antworten",
    "Ergebnis",
    "Bericht",
  ]) {
    await expect(tabs.getByRole("tab", { name: tab })).toBeVisible();
  }
  await tabs.getByRole("tab", { name: "Antworten" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("sortiert nach Absicht");
});

test("Sauber ab 360 px: kein seitliches Scrollen, Navigation als Schublade", async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const page = await ownerPage(browser, { width: 360, height: 740 });
  for (const [path, heading] of appRoutes()) {
    await visit(page, path, heading);
    await expectNoHorizontalOverflow(page);
  }
  const anonymous = await (
    await browser.newContext({ viewport: { width: 360, height: 740 } })
  ).newPage();
  for (const [path, heading] of publicRoutes) {
    await visit(anonymous, path, heading);
    await expectNoHorizontalOverflow(anonymous);
  }
  await gotoReady(anonymous, "/");
  await expectAccessible(anonymous, "/ (360 px)");

  // Sidebar is hidden on phones; the drawer opens, navigates and closes.
  await gotoReady(page, "/start");
  await expect(page.getByRole("complementary", { name: "Seitenleiste" })).toBeHidden();
  await page.getByRole("button", { name: "Navigation öffnen" }).click();
  const drawer = page.getByRole("dialog", { name: "Navigation" });
  await drawer.getByRole("link", { name: "Kontakte" }).click();
  await expect(page).toHaveURL(/\/kontakte$/);
  await expect(drawer).toBeHidden();
  await expectAccessible(page, "/kontakte (360 px)");
});

test("Seitenleiste: aktiver Eintrag, Einklappen bleibt nach dem Neuladen", async ({ browser }) => {
  const page = await ownerPage(browser, { width: 1280, height: 860 });
  await gotoReady(page, "/vorlagen");
  const sidebar = page.getByRole("complementary", { name: "Seitenleiste" });
  const nav = sidebar.getByRole("navigation", { name: "Hauptnavigation" });
  await expect(nav.getByRole("link", { name: "Vorlagen" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Start" })).not.toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(sidebar.getByRole("link", { name: "Neuer Auftrag" })).toBeVisible();
  // Agents with their most recent conversations (concept chapter 13).
  const agents = sidebar.getByRole("list", { name: "Agenten" });
  await expect(agents.getByRole("link", { name: "Agentin Anna" })).toBeVisible();
  await agents.getByRole("link", { name: "Einladung planen" }).click();
  await expect(page).toHaveURL(new RegExp(`/chat/${objects.agentId}/${objects.conversationId}$`));
  await expect(agents.getByRole("link", { name: "Einladung planen" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await gotoReady(page, "/vorlagen");

  await sidebar.getByRole("button", { name: "Seitenleiste einklappen" }).click();
  await expect(sidebar.getByRole("button", { name: "Seitenleiste ausklappen" })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("complementary", { name: "Seitenleiste" }).getByRole("button", {
      name: "Seitenleiste ausklappen",
    }),
  ).toBeVisible();
  // Collapsed links keep their names for screen readers.
  await expect(nav.getByRole("link", { name: "Posteingang" })).toBeVisible();
  await expectAccessible(page, "/vorlagen (eingeklappt)");
  await page
    .getByRole("complementary", { name: "Seitenleiste" })
    .getByRole("button", { name: "Seitenleiste ausklappen" })
    .click();
});

test("Befehlspalette mit Strg+K: suchen, springen, Darstellung wechseln", async ({ browser }) => {
  const page = await ownerPage(browser);
  await gotoReady(page, "/start");
  await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog", { name: "Befehlspalette" });
  await expect(palette).toBeVisible();
  await page.keyboard.type("Vorlagen");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/vorlagen$/);
  await expect(palette).toBeHidden();

  await page.keyboard.press("Control+k");
  await page.keyboard.type("Postfach verbinden");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/postfaecher\/verbinden$/);

  await page.getByRole("button", { name: "Suchen und springen" }).first().click();
  await expect(palette).toBeVisible();
  await expectAccessible(page, "Befehlspalette");
  await page.keyboard.press("Escape");
  await expect(palette).toBeHidden();
});

test("Dunkelmodus: Wahl bleibt erhalten, Kontraste stimmen", async ({ browser }) => {
  const page = await ownerPage(browser);
  await gotoReady(page, "/einstellungen/profil");
  await page.getByRole("radio", { name: "Dunkel" }).click();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(luminance(background), background).toBeLessThan(0.1);
  for (const path of ["/start", "/einstellungen/absender", "/vorlagen", "/auftraege/neu"]) {
    await gotoReady(page, path);
    await expectAccessible(page, `${path} (dunkel)`);
  }

  // Without a choice the system setting decides.
  const system = await (
    await browser.newContext({ storageState: session.storageState, colorScheme: "dark" })
  ).newPage();
  await gotoReady(system, "/start");
  const systemBackground = await system.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  expect(luminance(systemBackground), systemBackground).toBeLessThan(0.1);

  await gotoReady(page, "/einstellungen/profil");
  await page.getByRole("radio", { name: "Hell" }).click();
  await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
});

test("Absenderprofil speichert die Pflichtangaben je Rechtsform", async ({ browser }) => {
  const page = await ownerPage(browser);
  await gotoReady(page, "/einstellungen/absender");
  const form = page.getByRole("form", { name: "Absenderprofil" });
  await form.getByLabel("Rechtsform").selectOption("gmbh");
  await expect(form.getByRole("textbox", { name: "Registergericht", exact: true })).toBeVisible();
  await expect(form.getByRole("textbox", { name: "Geschäftsführung", exact: true })).toBeVisible();

  // Mandatory fields are named before anything is saved.
  await form.getByRole("button", { name: "Speichern" }).click();
  await expect(page.getByText(/Bitte prüfe die \d+ markierten Felder/)).toBeVisible();
  await expect(form.getByRole("textbox", { name: "Registernummer", exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );

  await form.getByRole("textbox", { name: "Firma", exact: true }).fill("Bäckerei Huber GmbH");
  await form
    .getByRole("textbox", { name: "Straße und Hausnummer", exact: true })
    .fill("Hauptstraße 1");
  await form.getByRole("textbox", { name: "PLZ", exact: true }).fill("80331");
  await form.getByRole("textbox", { name: "Ort", exact: true }).fill("München");
  await form
    .getByRole("textbox", { name: "Registergericht", exact: true })
    .fill("Amtsgericht München");
  await form.getByRole("textbox", { name: "Registernummer", exact: true }).fill("HRB 123456");
  await form
    .getByRole("textbox", { name: "Geschäftsführung", exact: true })
    .fill("Anna Huber, Max Huber");
  await form.getByRole("textbox", { name: "USt-IdNr.", exact: true }).fill("de 123 456 789");
  await expect(page.getByText("Amtsgericht München, HRB 123456")).toBeVisible();
  await form.getByRole("button", { name: "Speichern" }).click();
  await expect(page.getByText("Absenderprofil gespeichert.")).toBeVisible();

  await page.reload();
  await expect(form.getByRole("textbox", { name: "Registernummer", exact: true })).toHaveValue(
    "HRB 123456",
  );
  await expect(form.getByRole("textbox", { name: "USt-IdNr.", exact: true })).toHaveValue(
    "DE123456789",
  );
  await expect(form.getByText("Vollständig", { exact: true })).toBeVisible();

  const [row] = await withE2eSql(
    (sql) => sql<{ legalForm: string; managingDirectors: string; registerCourt: string }[]>`
      select legal_form as "legalForm", managing_directors as "managingDirectors",
        register_court as "registerCourt"
      from sender_profiles where workspace_id = ${objects.workspaceId}`,
  );
  expect(row).toEqual({
    legalForm: "gmbh",
    managingDirectors: "Anna Huber, Max Huber",
    registerCourt: "Amtsgericht München",
  });

  // The start page counts the step, the unsubscribe page shows the details.
  await gotoReady(page, "/einstellungen/abmeldeseite");
  await expect(page.getByText("Amtsgericht München, HRB 123456")).toBeVisible();
});

test("Betreiberbereich nur für platform_admin", async ({ browser }) => {
  const page = await ownerPage(browser);
  await gotoReady(page, "/admin");
  await expect(page.getByText("Seite nicht gefunden")).toBeVisible();

  await withE2eSql(
    (sql) =>
      sql`update "user" set platform_role = 'platform_admin' where lower(email) = ${session.user.email.toLowerCase()}`,
  );
  await gotoReady(page, "/admin");
  await expect(page.getByRole("heading", { level: 1, name: "Betreiberbereich" })).toBeVisible();
  await page.getByRole("link", { name: /Systemzustand/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Systemzustand" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("link", {
      name: "Betreiberbereich",
    }),
  ).toBeVisible();
  await expectAccessible(page, "/admin/system");
  // Taking the role away works with the next request, not only after a new sign-in.
  await withE2eSql(
    (sql) =>
      sql`update "user" set platform_role = 'user' where lower(email) = ${session.user.email.toLowerCase()}`,
  );
  await gotoReady(page, "/admin/system");
  await expect(page.getByText("Seite nicht gefunden")).toBeVisible();
});

test("Team: Rolle ändern und Mitglied entfernen", async ({ browser }) => {
  const page = await ownerPage(browser);
  const memberEmail = `kollegin-${randomUUID().slice(0, 8)}@beispiel.test`;
  await withE2eSql(async (sql) => {
    const [user] = await sql<{ id: string }[]>`
      insert into "user" (name, email, email_verified) values ('Klara Kollegin', ${memberEmail}, true)
      returning id`;
    await sql`insert into workspace_members (workspace_id, user_id, role)
      values (${objects.workspaceId}, ${user?.id ?? ""}, 'member')`;
  });
  await gotoReady(page, "/einstellungen/team");
  await page.getByRole("button", { name: "Aktionen für Klara Kollegin" }).click();
  await page.getByRole("menuitemradio", { name: "Admin" }).click();
  await expect(page.getByText("Rolle geändert.")).toBeVisible();
  const members = page.getByRole("list", { name: "Mitglieder" });
  await expect(members.getByRole("listitem").filter({ hasText: "Klara Kollegin" })).toContainText(
    "Admin",
  );

  await page.getByRole("button", { name: "Aktionen für Klara Kollegin" }).click();
  await page.getByRole("menuitem", { name: "Aus dem Team entfernen" }).click();
  const dialog = page.getByRole("dialog", { name: "Klara Kollegin aus dem Team entfernen?" });
  await dialog.getByRole("button", { name: "Entfernen" }).click();
  await expect(page.getByText("Aus dem Team entfernt.")).toBeVisible();
  await expect(members).not.toContainText("Klara Kollegin");
});

test("Neuer Auftrag: Vorschlag wählen oder selbst schreiben", async ({ browser }) => {
  const page = await ownerPage(browser);
  await gotoReady(page, "/vorlagen");
  await page.getByRole("button", { name: "Vorschau: Einladung zum Fest" }).click();
  const preview = page.getByRole("dialog", { name: "Einladung zum Fest" });
  await expect(preview).toContainText("{anrede} {nachname}");
  await preview.getByRole("link", { name: "Verwenden" }).click();
  await expect(page).toHaveURL(/\/auftraege\/neu\?vorlage=summerParty$/);
  const goal = page.getByLabel("Dein Ziel");
  await expect(goal).toHaveValue(/Sommerfest/);

  const suggestions = page.getByRole("group", { name: "Vorschläge" }).first();
  await suggestions.getByRole("button", { name: "Angebot nachfassen" }).click();
  await expect(goal).toHaveValue(/Fass bei allen nach/);
  await expect(suggestions.getByRole("button", { name: "Angebot nachfassen" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await goal.fill("Kunden aus Rosenheim zum Tag der offenen Tür einladen");
  await expect(suggestions.getByRole("button", { name: "Angebot nachfassen" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.getByRole("button", { name: "Weiter zu den Empfängern" }).click();
  await expect(page.getByText(/sind bald verfügbar/)).toBeVisible();
});

/** Relative luminance of an `rgb()`, `lab()` or `oklch()` color as reported by the browser. */
function luminance(color: string): number {
  const rgb = color.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
  if (rgb) {
    const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map((value) => {
      const channel = Number(value) / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
  }
  const lab = color.match(/^lab\(([\d.]+)/);
  if (lab) {
    const lightness = Number(lab[1]);
    return lightness > 8 ? ((lightness + 16) / 116) ** 3 : lightness / 903.3;
  }
  const oklch = color.match(/oklch\(([\d.]+)/);
  if (oklch) return Number(oklch[1]) ** 3;
  throw new Error(`unknown color ${color}`);
}
