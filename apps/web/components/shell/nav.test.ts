import { describe, expect, it } from "vitest";
import { isActive, mainNav, settingsNav } from "./nav";

describe("navigation of the app shell", () => {
  it("has the main entries of chapter 13 in order", () => {
    expect(mainNav.map((item) => item.href)).toEqual([
      "/start",
      "/posteingang",
      "/auftraege",
      "/kontakte",
      "/vorlagen",
      "/postfaecher",
    ]);
  });

  it("has all nine settings sections", () => {
    expect(settingsNav.map((item) => item.href)).toEqual([
      "/einstellungen/profil",
      "/einstellungen/team",
      "/einstellungen/absender",
      "/einstellungen/abmeldeseite",
      "/einstellungen/tarif",
      "/einstellungen/datenschutz",
      "/einstellungen/benachrichtigungen",
      "/einstellungen/verbindungen",
      "/einstellungen/api",
    ]);
  });

  it("marks sections active for their sub pages only", () => {
    expect(isActive("/start", "/start")).toBe(true);
    expect(isActive("/start/x", "/start")).toBe(false);
    expect(isActive("/auftraege/neu", "/auftraege")).toBe(true);
    expect(isActive("/auftraegex", "/auftraege")).toBe(false);
    expect(isActive("/einstellungen/team", "/einstellungen/profil")).toBe(true);
    expect(isActive("/kontakte", "/postfaecher")).toBe(false);
  });
});
