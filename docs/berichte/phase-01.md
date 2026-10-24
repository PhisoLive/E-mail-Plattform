# Prüfbericht Phase 1 – Design-System und App-Schale

Stand: 24.10.2026 · Branch `claude/amazing-carson-fippeq`

## Erledigte Punkte (Umfang laut Kapitel 20)

| Umfang | Umsetzung |
| --- | --- |
| Design-Tokens | `packages/ui/src/styles.css`: warme Neutraltöne, eine Akzentfarbe „Petrol“, Status- und Infofarben, Radien 8/10/12 px, drei Schattenstufen, Abstände im 4-px-Raster (Tailwind), Animationen mit `prefers-reduced-motion`; alles als CSS-Variablen, Komponenten nutzen nur Tokens (E-037) |
| Hell- und Dunkelmodus | Dunkle Token-Werte für `.dark` und für die Systemeinstellung; Wahl „Hell / Dunkel / Wie das System“ im Profil, im Profilmenü und in der Befehlspalette, gespeichert im Cookie `ep_theme` (Server rendert die richtige Klasse) |
| Komponenten | `packages/ui`: Button/IconButton/`buttonClasses`, Input/Textarea/Select/Checkbox/Field, Card, Badge/StatusDot/Kbd, Alert, Skeleton/LoadingState/EmptyState/ErrorState, PageHeader, Stat, Avatar, Dialog, Drawer, DropdownMenu, Tooltip, Tabs, Switch, Segmented, Toaster (Rückgängig-fähig), CommandDialog |
| `SuggestOrWrite` | `packages/ui/src/suggest-or-write.tsx` mit allen Props aus Kapitel 13 (`suggestions` 2–5, `value`, `onChange` mit Quelle, `allowFreeText`, `aiFill`, `explain`), eingesetzt für Ziel, Ton und Ansprache im Assistenten; Komponententests |
| Seitenleiste | `apps/web/components/shell/sidebar.tsx`: einklappbar (Cookie `ep_sidebar`), oben „Neuer Auftrag“ und Suche, Start, Posteingang mit Zähler, Aufträge, Kontakte, Vorlagen, Postfächer; Abschnitt „Agenten“ mit den jüngsten Gesprächen; unten Einstellungen, Betreiberbereich (nur `platform_admin`), Hilfe, Arbeitsbereich-Wechsel, Profilmenü; unter 1024 px als Schublade |
| Befehlspalette | Strg+K / ⌘K (`components/shell/command-palette.tsx`): Aktionen (Auftrag, Postfach verbinden, Import, Agent, Einladen), alle Seiten, alle Einstellungen, Arbeitsbereich wechseln, Darstellung |
| Startseite mit Platzhalter-Blöcken | `/start`: Begrüßung, Einrichtungs-Checkliste aus echten Daten, Kennzahlen nach den Definitionen aus Kapitel 13, „Heute erledigt“, „Wartet auf dich“, laufende Aufträge, Postfach-Ampeln – jeweils mit leerem Zustand und nächstem Schritt |
| Einstellungen (Profil, Team, Absenderprofil) | Profil: Name, Darstellung, Passwort ändern, 2FA. Team: Mitglieder mit Rolle ändern und entfernen (Bestätigungsdialog), Einladungen. Absender: Pflichtangaben je Rechtsform (14 Rechtsformen, DE/AT/CH), Vorschau der Signaturzeilen, Speichern nur vollständig (E-038); die übrigen sechs Bereiche als Platzhalter |
| Deutsche Texte in `messages/de.json` | alle Texte der neuen Seiten; Schlüssel sind typgeprüft (`global.d.ts`), Fristen in Texten kommen als Parameter aus `defaults.ts` |
| Leer-, Lade- und Fehlerzustände | `EmptyState`/`ErrorState`/`LoadingState` in `packages/ui`; `app/(app)/loading.tsx` (Skelett), `app/(app)/error.tsx` und `not-found.tsx` innerhalb der Schale; Detailseiten zeigen „Nicht gefunden“ ohne zu verraten, ob es das Objekt anderswo gibt |
| Onboarding-Gerüst | `/willkommen` in eigener Schale: Arbeitsbereich → (2FA für Inhaber) → Postfach → Absender → Agent → erster Auftrag; Fortschritt aus den Daten (E-040) |

Zusätzlich: alle Routen aus Kapitel 13 inklusive Website, Betreiberbereich (E-041), öffentliche Seiten `/u/[token]` und `/c/[token]` (E-042), „Passwort vergessen“ (E-043), Vorlagengalerie und Einstieg in den Assistenten (E-045), Nachschlage-Dienst für Detailseiten (E-039), Seitenleisten-Daten (`shellService`).

## Abnahmekriterien mit Nachweis

| Kriterium | Ergebnis | Nachweis |
| --- | --- | --- |
| Alle Routen aus Kapitel 13 existieren (Platzhalter erlaubt) | erfüllt | `e2e/phase-1-shell.spec.ts` › „Alle Routen aus Kapitel 13 existieren, mit deutschen Texten und ohne Barrieren“: 33 App-Routen (inkl. aller Detailrouten mit echten Objekten und der neun Einstellungsbereiche) und 12 öffentliche Routen, je HTTP-Status < 400, sichtbare Überschrift, keine fehlenden Texte; „Detailseiten zeigen nur Objekte des eigenen Arbeitsbereichs“ (Reiter des Auftrags, „Nicht gefunden“ für fremde/unbekannte IDs); „Betreiberbereich nur für platform_admin“ |
| Lighthouse-Barrierefreiheit mindestens 95 | erfüllt | `e2e/phase-1-lighthouse.spec.ts`: 15 Seiten (Website, Anmeldung, App, Einstellungen, Onboarding), je Desktop und 360 px, angemeldet als Inhaber. Letzter Lauf (Produktions-Build): alle 30 Messungen 100; Werte in `test-results/lighthouse-accessibility.json`. Zusätzlich axe (WCAG 2.0–2.2 A/AA) auf jeder Route, im Dunkelmodus, in der Befehlspalette, eingeklappt und bei 360 px |
| Sauber ab 360 px | erfüllt | `e2e/phase-1-shell.spec.ts` › „Sauber ab 360 px: kein seitliches Scrollen, Navigation als Schublade“: alle 45 Routen bei 360 × 740 ohne horizontales Scrollen, Navigation als Schublade (öffnen, navigieren, schließen), axe bei 360 px |
| Das Absenderprofil speichert die Pflichtangaben | erfüllt | `e2e/phase-1-shell.spec.ts` › „Absenderprofil speichert die Pflichtangaben je Rechtsform“ (GmbH: fehlende Felder werden benannt, nach dem Ausfüllen gespeichert, nach dem Neuladen vorhanden, Kontrolle in der Datenbank, Anzeige auf der Abmeldeseite); `packages/core/src/sender/legal-forms.test.ts` (11 Tests: Pflichtfelder je Rechtsform, DE/AT/CH-Formate, Normalisierung); `packages/core/src/services/sender-profile.int.test.ts` (6 Tests: Speichern, Ablehnen unvollständiger Profile, Rechte, Mandantentrennung, Audit ohne Werte) |

Weitere Nachweise: Mandantentests für jede neue tRPC-Prozedur (`senderProfile.get`, `senderProfile.update`, `workspace.onboarding`, `workspace.shell`, `lookup.get` in `apps/web/server/trpc/tenant-isolation.int.test.ts`, der Abdeckungstest erzwingt sie), Dienste `onboarding.int.test.ts`, `lookup.int.test.ts`, `shell.int.test.ts`, `scope.int.test.ts`; Komponenten `suggest-or-write.test.tsx`, `command.test.tsx`; E2E „Seitenleiste …“, „Befehlspalette mit Strg+K …“, „Dunkelmodus …“, „Team: Rolle ändern und Mitglied entfernen“, „Neuer Auftrag: Vorschlag wählen oder selbst schreiben“.

Prüfbefehle (letzter Lauf vor der Übernahme): `pnpm lint` → Exit 0 (316 Dateien, keine Warnungen), `pnpm typecheck` → Exit 0 (10 Pakete + Skripte und E2E), `pnpm test` → Exit 0 (30 Dateien, 129 Tests), `pnpm test:e2e` (`next dev`) → Exit 0 (18 Tests), `pnpm test:e2e:prod` (Produktions-Build wie die CI) → Exit 0 (18 Tests).

## Offene Punkte

- **Inhalte der Platzhalterseiten** folgen mit den Fachphasen (Kontakte Phase 2, Postfächer Phase 3, Nachrichten/Einzelmail Phase 4, Aufträge Phase 5, Posteingang Phase 6, Agenten und Chat Phase 7, Betreiberbereich Phase 11).
- **`/u/[token]` und `/c/[token]`** zieht Phase 4 in den Edge-Dienst um (E-042).
- **Rechtstexte** (Impressum, Datenschutz, AGB, AVV) – offen, braucht: Betreiberangaben und die Prüfung durch eine Kanzlei (Kapitel 17 und 23).
- **Sprachnachricht** im Chat ist als Knopf vorbereitet; Aufnahme und Transkription kommen mit Phase 7.
- Der Lighthouse-Test dauert rund 7 Minuten (30 Messungen); bei Bedarf lässt er sich in der CI auf einen nächtlichen Lauf verlegen.

## Abweichungen

Alle Abweichungen und Ergänzungen stehen mit Begründung in `docs/ENTSCHEIDUNGEN.md` (E-037 bis E-046).
