import { randomUUID } from "node:crypto";
import { MailpitClient, secretFromOtpauth, totp } from "@ep/testing";
import { expect, type Page } from "@playwright/test";

export const mailpit = new MailpitClient(process.env.E2E_MAILPIT_API);

export function uniqueAddress(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 10)}@beispiel.test`;
}

export const defaultPassword = "Sicheres-Passwort-2026!";

/** Navigates and waits until React is interactive (forms would otherwise submit natively). */
export async function gotoReady(page: Page, path: string) {
  const response = await page.goto(path);
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
  return response;
}

/** Waits for the page that a full navigation (window.location.assign) leads to. */
export async function waitReady(page: Page): Promise<void> {
  await page.waitForLoadState("load");
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

export interface RegisteredUser {
  name: string;
  email: string;
  password: string;
  totpSecret?: string;
}

/** Registers through the UI and confirms the e-mail address via the link from Mailpit. */
export async function registerAndVerify(page: Page, user: RegisteredUser): Promise<void> {
  const started = new Date(Date.now() - 1000);
  await gotoReady(page, "/registrieren");
  await page.getByLabel("Dein Name").fill(user.name);
  await page.getByLabel("E-Mail-Adresse").fill(user.email);
  await page.getByLabel("Passwort").fill(user.password);
  await page.getByRole("button", { name: "Konto anlegen" }).click();
  await expect(page.getByRole("heading", { name: "Fast geschafft" })).toBeVisible();
  const mail = await mailpit.waitForMail(user.email, {
    subject: "Bitte bestätige deine E-Mail-Adresse",
    after: started,
  });
  await page.goto(MailpitClient.firstLink(mail));
  await waitReady(page);
}

export async function login(page: Page, user: RegisteredUser): Promise<void> {
  await gotoReady(page, "/login");
  await page.getByLabel("E-Mail-Adresse").fill(user.email);
  await page.getByLabel("Passwort").fill(user.password);
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  if (user.totpSecret) {
    await expect(page.getByRole("heading", { name: "Zwei-Faktor-Anmeldung" })).toBeVisible();
    await page.getByLabel("Code").fill(totp(user.totpSecret));
    await page.getByRole("button", { name: "Bestätigen" }).click();
  }
  // Sign-in ends with a full navigation away from /login.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  await waitReady(page);
}

export async function createWorkspace(page: Page, name: string): Promise<void> {
  await expect(page.getByRole("heading", { name: "Dein Arbeitsbereich" })).toBeVisible();
  await page.getByLabel("Name des Arbeitsbereichs").fill(name);
  await page.getByRole("button", { name: "Arbeitsbereich anlegen" }).click();
  // The form navigates on its own (full page load); wait for it so the next goto does not race.
  await page.waitForURL(
    (url) => !url.pathname.startsWith("/willkommen") || url.searchParams.has("schritt"),
  );
  await waitReady(page);
}

/** Enables TOTP 2FA in the profile settings and returns the secret. */
export async function enableTwoFactor(page: Page, password: string): Promise<string> {
  await gotoReady(page, "/einstellungen/profil");
  await page.getByRole("button", { name: "Zwei-Faktor-Anmeldung einrichten" }).click();
  await page.getByLabel("Bestätige mit deinem Passwort").fill(password);
  await page.getByRole("button", { name: "Weiter" }).click();
  const uri = await page.getByTestId("otpauth-uri").getAttribute("data-uri");
  if (!uri) throw new Error("otpauth uri missing");
  const secret = secretFromOtpauth(uri);
  await page.getByLabel("Code aus der App").fill(totp(secret));
  await page.getByRole("button", { name: "Aktivieren" }).click();
  await expect(page.getByText("Zwei-Faktor-Anmeldung ist jetzt aktiv.")).toBeVisible();
  return secret;
}

/** Collects Content-Security-Policy violations reported by the browser. */
export function collectCspViolations(page: Page): string[] {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (/Content Security Policy|Content-Security-Policy/i.test(message.text()))
      violations.push(message.text());
  });
  page.on("pageerror", (error) => {
    if (/Content Security Policy/i.test(error.message)) violations.push(error.message);
  });
  return violations;
}

/** Audit actions of a user, read directly from the E2E database. */
export async function auditActions(email: string): Promise<string[]> {
  const url = process.env.E2E_DATABASE_URL;
  if (!url) throw new Error("E2E_DATABASE_URL missing");
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    const rows = await sql<{ action: string }[]>`
      select a.action from audit_logs a join "user" u on u.id::text = a.actor_id
      where lower(u.email) = ${email.toLowerCase()} order by a.created_at`;
    return rows.map((row) => row.action);
  } finally {
    await sql.end({ timeout: 2 });
  }
}

/** SQL against the E2E database (setup of fixtures the UI cannot create yet). */
export async function withE2eSql<T>(fn: (sql: import("postgres").Sql) => Promise<T>): Promise<T> {
  const url = process.env.E2E_DATABASE_URL;
  if (!url) throw new Error("E2E_DATABASE_URL missing");
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    return await fn(sql);
  } finally {
    await sql.end({ timeout: 2 });
  }
}

export interface OwnerSession {
  user: RegisteredUser;
  workspace: string;
  storageState: Awaited<ReturnType<import("@playwright/test").BrowserContext["storageState"]>>;
}

/** Registers an owner with workspace and 2FA once; tests reuse the signed-in browser state. */
export async function createOwnerSession(
  browser: import("@playwright/test").Browser,
  name: string,
  workspace: string,
): Promise<OwnerSession> {
  const user: RegisteredUser = { name, email: uniqueAddress("owner"), password: defaultPassword };
  const context = await browser.newContext();
  const page = await context.newPage();
  await registerAndVerify(page, user);
  await login(page, user);
  await createWorkspace(page, workspace);
  user.totpSecret = await enableTwoFactor(page, user.password);
  const storageState = await context.storageState();
  await context.close();
  return { user, workspace, storageState };
}

export interface E2eObjects {
  workspaceId: string;
  campaignId: string;
  mailboxId: string;
  contactId: string;
  agentId: string;
  threadId: string;
  conversationId: string;
}

/** One object of every kind with a detail page, in the workspace of the given owner. */
export async function insertDetailObjects(ownerEmail: string): Promise<E2eObjects> {
  return withE2eSql(async (sql) => {
    const [owner] = await sql<{ userId: string; workspaceId: string }[]>`
      select m.user_id as "userId", m.workspace_id as "workspaceId"
      from workspace_members m join "user" u on u.id = m.user_id
      where lower(u.email) = ${ownerEmail.toLowerCase()} and m.role = 'owner' limit 1`;
    if (!owner) throw new Error("owner not found");
    const ws = owner.workspaceId;
    const suffix = randomUUID().slice(0, 8);
    const [agent] = await sql<{ id: string }[]>`
      insert into agents (workspace_id, name, approval_threshold, allowed_actions, reply_policy,
        working_hours, daily_send_cap, report_schedule)
      values (${ws}, 'Agentin Anna', 25, '{}', ${sql.json({ autoReplyIntents: [], mode: "draft" })},
        ${sql.json({ days: [1, 2, 3, 4, 5], start: "08:00", end: "17:00" })}, 50,
        ${sql.json({ onCompletion: true, daily: false, weekly: false, time: "08:00" })})
      returning id`;
    const [mailbox] = await sql<{ id: string }[]>`
      insert into mailboxes (workspace_id, email, display_name, provider)
      values (${ws}, ${`info-${suffix}@baeckerei.test`}, 'Info', 'imap_smtp') returning id`;
    const [contact] = await sql<{ id: string }[]>`
      insert into contacts (workspace_id, email, email_hash, first_name, last_name)
      values (${ws}, ${`erika-${suffix}@kunde.test`}, ${`hash-${suffix}`}, 'Erika', 'Mustermann')
      returning id`;
    const [campaign] = await sql<{ id: string }[]>`
      insert into campaigns (workspace_id, kind, name) values (${ws}, 'bulk', 'Sommerfest 2027')
      returning id`;
    if (!agent || !mailbox || !contact || !campaign) throw new Error("insert failed");
    const [thread] = await sql<{ id: string }[]>`
      insert into threads (workspace_id, mailbox_id, subject_normalized)
      values (${ws}, ${mailbox.id}, 'Frage zum Angebot') returning id`;
    const [conversation] = await sql<{ id: string }[]>`
      insert into conversations (workspace_id, agent_id, user_id, title)
      values (${ws}, ${agent.id}, ${owner.userId}, 'Einladung planen') returning id`;
    if (!thread || !conversation) throw new Error("insert failed");
    return {
      workspaceId: ws,
      campaignId: campaign.id,
      mailboxId: mailbox.id,
      contactId: contact.id,
      agentId: agent.id,
      threadId: thread.id,
      conversationId: conversation.id,
    };
  });
}

/** Console errors of next-intl (missing texts, broken ICU messages) and React. */
export function collectTextErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/MISSING_MESSAGE|FORMATTING_ERROR|INVALID_MESSAGE|INVALID_KEY|hydrat/i.test(text))
      errors.push(text);
  });
  return errors;
}

/** The page must not scroll sideways (concept chapter 13: clean from 360 px). */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return { scroll: root.scrollWidth, client: root.clientWidth };
  });
  expect(overflow.scroll, `horizontal overflow on ${page.url()}`).toBeLessThanOrEqual(
    overflow.client,
  );
}
