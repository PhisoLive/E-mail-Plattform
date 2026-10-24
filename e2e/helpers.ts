import { randomUUID } from "node:crypto";
import { MailpitClient, secretFromOtpauth, totp } from "@ep/testing";
import { expect, type Page } from "@playwright/test";

export const mailpit = new MailpitClient(process.env.E2E_MAILPIT_API);

export function uniqueAddress(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 10)}@beispiel.test`;
}

export const defaultPassword = "Sicheres-Passwort-2026!";

export interface RegisteredUser {
  name: string;
  email: string;
  password: string;
  totpSecret?: string;
}

/** Registers through the UI and confirms the e-mail address via the link from Mailpit. */
export async function registerAndVerify(page: Page, user: RegisteredUser): Promise<void> {
  const started = new Date(Date.now() - 1000);
  await page.goto("/registrieren");
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
}

export async function login(page: Page, user: RegisteredUser): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-Mail-Adresse").fill(user.email);
  await page.getByLabel("Passwort").fill(user.password);
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  if (user.totpSecret) {
    await expect(page.getByRole("heading", { name: "Zwei-Faktor-Anmeldung" })).toBeVisible();
    await page.getByLabel("Code").fill(totp(user.totpSecret));
    await page.getByRole("button", { name: "Bestätigen" }).click();
  }
}

export async function createWorkspace(page: Page, name: string): Promise<void> {
  await expect(page.getByRole("heading", { name: "Dein Arbeitsbereich" })).toBeVisible();
  await page.getByLabel("Name des Arbeitsbereichs").fill(name);
  await page.getByRole("button", { name: "Arbeitsbereich anlegen" }).click();
}

/** Enables TOTP 2FA in the profile settings and returns the secret. */
export async function enableTwoFactor(page: Page, password: string): Promise<string> {
  await page.goto("/einstellungen/profil");
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
