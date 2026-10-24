import { MailpitClient } from "@ep/testing";
import { expect, test } from "@playwright/test";
import {
  createWorkspace,
  defaultPassword,
  enableTwoFactor,
  login,
  mailpit,
  registerAndVerify,
  uniqueAddress,
} from "./helpers";

/**
 * Phase 0 acceptance (concept chapter 20): register, sign in, 2FA, create a workspace and
 * invite a member – all through the real UI, with system mails from Mailpit.
 */
test("Registrieren → Anmelden → 2FA → Arbeitsbereich → Mitglied einladen", async ({ browser }) => {
  const owner = { name: "Olga Owner", email: uniqueAddress("owner"), password: defaultPassword };
  const ownerPage = await (await browser.newContext()).newPage();

  await registerAndVerify(ownerPage, owner);
  await login(ownerPage, owner);
  await createWorkspace(ownerPage, "Bäckerei Huber");

  // Owners need 2FA before working in the workspace (concept chapter 16).
  await expect(
    ownerPage.getByText("Als Inhaber oder Admin brauchst du die Zwei-Faktor-Anmeldung"),
  ).toBeVisible();
  const secret = await enableTwoFactor(ownerPage, owner.password);

  // Sign out and in again – now with TOTP.
  await ownerPage.context().clearCookies();
  await login(ownerPage, { ...owner, totpSecret: secret });
  await expect(ownerPage.getByRole("heading", { name: /Hallo Olga/ })).toBeVisible();

  // Invite a member.
  const member = {
    name: "Max Mitglied",
    email: uniqueAddress("member"),
    password: defaultPassword,
  };
  const inviteSent = new Date(Date.now() - 1000);
  await ownerPage.goto("/einstellungen/team");
  await ownerPage.getByLabel("E-Mail-Adresse").fill(member.email);
  await ownerPage.getByLabel("Rolle").selectOption("member");
  await ownerPage.getByRole("button", { name: "Einladung senden" }).click();
  await expect(ownerPage.getByText(`Einladung an ${member.email} verschickt.`)).toBeVisible();
  await expect(ownerPage.getByRole("list", { name: "Offene Einladungen" })).toContainText(
    member.email,
  );

  const invitationMail = await mailpit.waitForMail(member.email, {
    subject: "Einladung zu Bäckerei Huber",
    after: inviteSent,
  });
  const invitationLink = MailpitClient.firstLink(invitationMail);

  // The invited person registers, confirms the address and accepts the invitation.
  const memberPage = await (await browser.newContext()).newPage();
  await registerAndVerify(memberPage, member);
  await login(memberPage, member);
  await memberPage.goto(invitationLink);
  await expect(
    memberPage.getByRole("heading", { name: "Einladung zu Bäckerei Huber" }),
  ).toBeVisible();
  await memberPage.getByRole("button", { name: "Einladung annehmen" }).click();
  await expect(memberPage.getByRole("heading", { name: /Hallo Max/ })).toBeVisible();

  // The owner now sees the new member.
  await ownerPage.reload();
  await expect(ownerPage.getByRole("list", { name: "Mitglieder" })).toContainText(member.email);
});

test("Anmeldung per Magic Link", async ({ page }) => {
  const user = { name: "Lena Link", email: uniqueAddress("magic"), password: defaultPassword };
  await registerAndVerify(page, user);
  await page.context().clearCookies();
  const requested = new Date(Date.now() - 1000);
  await page.goto("/login");
  await page.getByLabel("E-Mail-Adresse").fill(user.email);
  await page.getByRole("button", { name: "Anmeldelink per E-Mail schicken" }).click();
  await expect(
    page.getByText(`Wir haben dir einen Anmeldelink an ${user.email} geschickt.`),
  ).toBeVisible();
  const mail = await mailpit.waitForMail(user.email, {
    subject: "Dein Anmeldelink",
    after: requested,
  });
  await page.goto(MailpitClient.firstLink(mail));
  await expect(page.getByRole("heading", { name: "Dein Arbeitsbereich" })).toBeVisible();
});

test("Falsches Passwort und unbestätigte Adresse werden abgewiesen", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-Mail-Adresse").fill(uniqueAddress("nobody"));
  await page.getByLabel("Passwort").fill("falsches-passwort-123");
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(page.getByText("E-Mail-Adresse oder Passwort stimmen nicht.")).toBeVisible();
});

test("Health-Endpunkte von Web, Edge und Worker", async ({ request }) => {
  const web = await request.get("/api/health");
  expect(web.status()).toBe(200);
  expect(await web.json()).toMatchObject({ status: "ok" });
  const edge = await request.get(`http://127.0.0.1:${process.env.EDGE_PORT ?? "4401"}/health`);
  expect(edge.status()).toBe(200);
  const worker = await request.get(`http://127.0.0.1:${process.env.WORKER_PORT ?? "4402"}/health`);
  expect(worker.status()).toBe(200);
});

test("Magic Link umgeht die Zwei-Faktor-Anmeldung nicht", async ({ page }) => {
  const user = { name: "Tom Totp", email: uniqueAddress("tfa"), password: defaultPassword };
  await registerAndVerify(page, user);
  await login(page, user);
  await createWorkspace(page, "Firma mit 2FA");
  await enableTwoFactor(page, user.password);
  await page.context().clearCookies();

  const requested = new Date(Date.now() - 1000);
  await page.goto("/login");
  await page.getByLabel("E-Mail-Adresse").fill(user.email);
  await page.getByRole("button", { name: "Anmeldelink per E-Mail schicken" }).click();
  const mail = await mailpit.waitForMail(user.email, {
    subject: "Anmeldung mit Zwei-Faktor-Code",
    after: requested,
  });
  expect(mail).toContain("Passwort und dem Code");
  expect(mail).not.toMatch(/magic-link\/verify/);
});
