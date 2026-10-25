# Nachabnahme Phase 1 – Design-System und App-Schale

*Unabhängige Prüfung der Behebungen nach der ersten Abnahme. Der Text gibt das Ergebnis des Prüfers wieder; die Behebung seiner Auflagen steht am Ende unter „Umgang mit den Auflagen“.*

| | |
| --- | --- |
| Geprüfter Stand | Zweig `phase1-wip`, HEAD `04e4414` („wip: acceptance fixes rules“). Diff zur ersten Abnahme: `cc958b5..04e4414` (104 Dateien). Nicht committet waren nur `docs/STAND.md` und `docs/berichte/phase-01.md` (Abschnitt „Nachbesserung …“). |
| Datum | 24.10.2026 |
| `pnpm lint` | Exit 0 (Biome, 332 Dateien, keine Befunde) |
| `pnpm typecheck` | Exit 0 ohne Cache (`TURBO_FORCE=true`), 10 von 10 Paketen |
| Nicht ausgeführt (laut Auftrag) | `pnpm test`, `pnpm test:e2e`, Server, Browser – der E2E-Lauf lief parallel. Aussagen zu Tests stützen sich auf den Code; die WCAG-Kontraste sind aus den OKLCH-Tokens nachgerechnet. |

Prüfer-Kürzel der ersten Abnahme: **AK** Abnahmekriterien, **MT** Mandantentrennung, **TS** Texte und Startwerte, **OB** Oberfläche und Barrierefreiheit, **MR** Muss-Regeln. „Widerlegt“ heißt: Die Verifikation der ersten Abnahme hat den Befund verneint.

## 1. Befunde der ersten Abnahme (64 Einzelbefunde, zusammengefasst)

| # | Befund (Prüfer) | Schwere | Status | Beleg |
| --- | --- | --- | --- | --- |
| 1 | GmbH & Co. KG ohne Angaben der Komplementär-GmbH (AK, MR) | major | behoben, Rest minor | `legal-forms.ts` (GeneralPartner, Pflichtfelder, Impressum), Migration `0005`. Rest: „KG“ mit Firma „… GmbH & Co. KG“ speichert ohne Komplementärangaben; Aufsichtsrat der Komplementärin nicht erfassbar; GmbH & Co. OHG nicht abgedeckt. |
| 2 | Ausgeblendete Felder einer früheren Rechtsform gespeichert oder blockieren unsichtbar (AK, MR) | major | behoben | `offeredValues`, angewandt beim Speichern und im Impressum; das Formular prüft lokal mit derselben Funktion |
| 3 | Aufsichtsratsvorsitz für Schweizer AG/Genossenschaft und kleine eG Pflicht (MR) | major | behoben | Pflicht nur für die deutsche AG, sonst freiwillig; Verwaltungsrat/Verwaltung in der Schweiz |
| 4 | Zähler der Pflichtangaben ignoriert die Rechtsform (AK) | minor | behoben | `sender-profile-form.tsx` |
| 5 | Vorschau der Abmeldeseite ohne alle Pflichtangaben (AK, TS, MR) | minor | behoben | dieselbe Quelle `imprintParts` wie das Formular |
| 6 | Rechtsformzusatz ungeprüft, Sitz aus dem Ort abgeleitet (MR) | minor | behoben, erzeugt N1 | Spalte `seat` (Migration `0006`), Zusatzprüfung |
| 7 | „Andere Rechtsform“ ohne Registerfelder (MR) | minor | behoben | freiwillige Register- und Vertretungsfelder |
| 8 | Österreich und Schweiz nur teilweise angepasst (MR) | minor | behoben | `legalFormsFor`, Bezeichnungen je Land, Vereinsbehörde/ZVR-Zahl |
| 9 | Betreiberbereich erkennbar (MT, AK, OB, TS) | minor | behoben, Rest minor | eigene Routengruppe ohne `loading.tsx`, Rolle vor dem Titel geprüft, keine Login-Weiterleitung, Client-Texte nur aus `clientNamespaces`. Rest: Der Pfad `/admin` steckt im Client-Modul `sidebar.tsx`, das über `BrandMark` auch die Layouts `(auth)` und `(site)` laden. |
| 10 | Mandantentest für `workspace.onboarding` wirkungslos (MT) | minor | behoben | `tenant-isolation.int.test.ts`, `onboarding.int.test.ts` |
| 11 | Kein Test für Anonyme und Admins ohne 2FA (MT) | minor | behoben | E2E „Betreiberbereich …“ (siehe N3) |
| 12 | Seite und Formular nach Wechsel in einem anderen Tab mit verschiedenen Arbeitsbereichen (MT) | minor | teilweise | Absenderprofil und Team behoben; die Ursache (`x-workspace-id` aus der Modulvariablen ohne Abgleich mit `ep_ws`) bleibt – nur Anzeige, keine Rechteausweitung |
| 13 | CardHeader bei 360 px gequetscht (AK) | minor | behoben | `card.tsx` |
| 14 | Abstände ohne Token und außerhalb des 4-px-Rasters (AK) | minor | behoben | `--spacing`, keine Halbschritte mehr |
| 15 | SuggestOrWrite ohne Freitext: Label ohne Feld, Erklärung nicht verknüpft (AK, OB) | minor | behoben | `suggest-or-write.tsx` + Test |
| 16 | Onboarding-Fortschritt unter 640 px ohne Namen (AK, OB) | minor | behoben | `onboarding-progress.tsx` |
| 17 | Lighthouse prüft die gemessene URL nicht (AK) | minor | behoben | `phase-1-lighthouse.spec.ts` |
| 18 | Seitenleisten-Abfrage ohne Grenze (AK, MR) | minor | behoben | `shell.ts` (`rank <= 3` in SQL) |
| 19 | Bericht nennt E-037 bis E-046 (AK, MR) | minor | behoben | `phase-01.md` |
| 20 | Leerzustände ohne nächsten Schritt (TS) | major (verifiziert: minor) | behoben | `placeholder-page.tsx`, Startseite |
| 21 | „je Viertelstunde“ fest im Text (TS) | minor | behoben | Parameter `{minutes}` |
| 22 | 100 Empfänger und 3 MB fest im Text (TS) | minor | widerlegt (Text aus Anhang D), trotzdem geändert – siehe N2 | `de.json` |
| 23 | 30 Tage und 72 Stunden fest, falscher Kennzahlen-Titel (TS) | minor | behoben | `defaults.metrics`, Startseite |
| 24 | Plural fehlt bei Zahlen (TS) | minor | behoben | ICU-Plurale |
| 25 | Fehlertexte ohne Werte gefüllt (TS) | minor | behoben, Rest siehe N2 | `use-error-message.ts` |
| 26 | sonner mit englischem Label und ohne Dunkelmodus (TS, OB) | minor | behoben | `toaster.tsx`, `app-shell.tsx` |
| 27 | Tasten „Esc“ und „Tab“ fest im Code (TS) | minor | widerlegt, trotzdem umgesetzt | `shell.keys.*` |
| 28 | „Hilfe“ im Profilmenü öffnet die Befehlspalette (TS, OB) | minor | behoben | `user-menu.tsx`, `sidebar.tsx` |
| 29 | Beim Verlassen erscheint der Entfernen-Text (TS) | minor | behoben | `team-settings.tsx` |
| 30 | Eingeklappte Seitenleiste ohne Posteingangs-Zähler (TS, OB) | minor | behoben | `sidebar.tsx` |
| 31 | Kein Ladezustand außerhalb der App-Schale (TS) | minor | behoben | `loading.tsx` für `(auth)`, `(onboarding)`, `(public)`; `(admin)` bewusst ohne (E-048) |
| 32 | Einladung: jeder Fehler wird zu „gibt es nicht“ (TS) | minor | behoben | `einladung/[token]/page.tsx` |
| 33 | Empfängerseiten fallen auf die Fehlerseite der App zurück (TS) | minor | behoben | `(public)/error.tsx` (Sie-Form) |
| 34 | Zeitzone fest im Code (TS) | minor | teilweise | aus `defaults.ts`; die Zeitzone des Arbeitsbereichs wird noch nicht genutzt |
| 35 | Schwellen fest im Assistenten und im Arbeitsbereich-Formular (TS) | minor | behoben | `defaults.ts`, `new-campaign.tsx`, `create-workspace-form.tsx`, `workspaces.ts` |
| 36 | Fachbegriffe ohne Erklärung (TS) | minor | behoben | nur noch in Einrichtungshinweisen mit den Menünamen der Anbieter |
| 37 | Ungenutzte Schlüssel in de.json (TS) | minor | behoben | entfernt |
| 38 | Fokus landet nach Esc auf `<body>` (OB) | major | behoben | `focus-return.ts`; Palette, Dialog, Schublade; E2E und `command.test.tsx` |
| 39 | Ränder von Eingabefeldern unter 3:1 (OB) | major | behoben | `--ep-border-control`; E2E misst hell und dunkel |
| 40 | Switch (aus) und Segmentschalter (gewählt) unter 3:1 (OB) | minor | behoben | 3,91/3,55:1 bzw. Ring 3,46/3,30:1 |
| 41 | Tastatur-Hervorhebung in Menüs und Palette kaum sichtbar (OB) | minor | behoben | Akzent-Strich 5,58:1 hell, 7,05:1 dunkel |
| 42 | Fokusrahmen der Reiter abgeschnitten (OB) | minor | behoben | `-outline-offset-2` |
| 43 | Select-Pfeil und `theme-color` mit festen Farben (OB) | minor | behoben | Symbol in Token-Farbe, `theme-colors.ts` + Test |
| 44 | Schließen-Knopf im Dialog gestaucht (OB) | minor | behoben | `shrink-0` |
| 45 | „2FA fehlt“ unter 640 px ausgeblendet (OB) | minor | behoben | Symbol mit Beschriftung |
| 46 | Formular verliert Eingaben beim Neuladen der Abfrage (MR) | minor | behoben | Editor nur nach eigenem Speichern neu |
| 47 | E-046: mehrere Sitzungsabfragen je Seite, `emailVerified` aus dem Cache (MR) | minor | behoben | `session.ts` (React `cache`, nur im Seitenaufruf), `caller.ts`, `http-context.ts` |
| 48 | Hydrations-Marker zu früh, Formulare senden nativ (MR) | minor | behoben (Ursache) | `method="post"` überall (Test), Absendeknöpfe bis zur Hydration gesperrt (Test) |
| 49 | Team-Dialog: alter Fehler, Verlassen und Selbst-Herabstufung (MR) | minor | behoben | `team-settings.tsx` |

**Selbstauskunft im Bericht:** im Wesentlichen zutreffend; #12 und #34 sind nur teilweise behoben, die Zeitzone des Arbeitsbereichs fehlt, und die Prüfbefehle nannten noch die Zahlen vor der Nachbesserung.

## 2. Adversariale Prüfung des Diffs

Kontraste von `--ep-border-control` (OKLCH → OKLab → sRGB, WCAG):

| Hintergrund | hell (#837f7a) | dunkel (#6a6f76) |
| --- | --- | --- |
| `--ep-surface` | 3,91:1 | 3,55:1 |
| `--ep-bg` | 3,74:1 | 3,74:1 |
| `--ep-surface-muted` | 3,46:1 | 3,30:1 |
| `--ep-sidebar` | 3,52:1 | 3,87:1 |
| `--ep-surface-hover` | 3,30:1 | 3,08:1 |

Überall mindestens 3:1 (WCAG 1.4.11); der alte Token lag bei 1,46 bis 1,88:1.

Ohne Befund geprüft: Migration `0006` (Snapshot-Kette konsistent), `focus-return.ts`, gesperrte Absendeknöpfe (`useSyncExternalStore` je Suspense-Grenze, auch Enter blockiert), React `cache` für die Sitzung (kein Leck über Anfragen), `generateViewport`, Client-Namensräume (alle genutzten vorhanden), Absenderformular.

**N1 – major:** Die Prüfung des Rechtsformzusatzes lehnt gültige eingetragene Firmennamen ab („… PartGmbB“, „… PartmbB“, „GmbH u. Co. KG“, „GmbH + Co. KG“, „GmbH & Co. Kommanditgesellschaft“, „gUG (haftungsbeschränkt)“, „e.G.“, „S.A.“, „S.à r.l.“, „società cooperativa“). Speichern ist dann unmöglich, und weil `isSenderProfileComplete` jetzt `validateSenderProfile` nutzt, werden gespeicherte Profile nachträglich und ohne Hinweis unvollständig (Onboarding springt zurück, das Formular zeigt „Alles ausgefüllt“). Empfehlung: Muster ergänzen, fehlenden Zusatz als Hinweis behandeln, strengere Regeln nicht stillschweigend auf gespeicherte Profile anwenden.

**N2 – minor:** Fehlertexte weichen ohne Eintrag in `ENTSCHEIDUNGEN.md` von Anhang D ab (`{anzahl}` → `{count}`, umformulierte Texte), und vorbelegte Standardwerte (`count: 0`, `limit: ""`) verdecken fehlende Parameter („In 0 Mails …“, „Dein Tarif erlaubt .“).

**N3 – minor:** E-048 beschreibt eine 404 auch für Admins ohne 2FA; tatsächlich werden sie zur Einrichtung der 2FA geleitet (so auch der Test).

**N4 – minor:** Der Bericht nennt die Zahlen des Laufs vor der Nachbesserung; Bericht und STAND waren nicht committet.

## 3. Abnahmekriterien

| Kriterium | Status |
| --- | --- |
| Alle Routen aus Kapitel 13 existieren | erfüllt (nach Code; E2E-Ergebnis stand bei der Prüfung aus) |
| Lighthouse-Barrierefreiheit mindestens 95 | erfüllt (nach Code; Lauf stand aus) |
| Sauber ab 360 px | erfüllt (nach Code; Lauf stand aus) |
| Das Absenderprofil speichert die Pflichtangaben | weitgehend erfüllt – eingeschränkt durch N1 |

## 4. Gesamturteil

**Phase 1 abgenommen: ja mit Auflagen.** Alle sechs major-Befunde der ersten Abnahme sind behoben, lint und typecheck grün, die vier Kriterien nach Code und Testaufbau erfüllt.

Auflagen:
1. `pnpm test`, `pnpm test:e2e` und `test:e2e:prod` grün auf dem geprüften Stand, aktuelle Zahlen im Bericht (N4) – ohne grünen Lauf lautet das Urteil „nein“.
2. N1 beheben (Muster ergänzen und testen; bestehende Profile nicht an der Zusatzprüfung scheitern lassen oder sichtbar darauf hinweisen).
3. N2 und N3 in `ENTSCHEIDUNGEN.md` nachtragen bzw. korrigieren; Bericht und STAND committen.
4. Ohne Frist: Reste aus #1, #9, #12 und #34.

## Umgang mit den Auflagen

| Auflage | Umgang | Nachweis |
| --- | --- | --- |
| 1 – Testläufe grün auf dem geprüften Stand, aktuelle Zahlen | Auf `04e4414` liefen `pnpm test` (33 Dateien, 150 Tests), `pnpm test:e2e` (19 Tests) und `pnpm test:e2e:prod` (19 Tests) grün. Nach allen Behebungen liefen alle Läufe erneut auf `ea40f9a` grün (39 Dateien, 238 Tests; E2E dev und Produktions-Build je 19); die Zahlen stehen in `phase-01.md` unter „Prüfbefehle“. | Logs der Läufe, `phase-01.md` |
| 2 – N1 | Der Rechtsformzusatz wird nur noch erkannt, nie erzwungen: Hinweis im Formular, eigene Zeile „Rechtsform: …“ in den Pflichtangaben; Muster für alle hier und in der parallelen Prüfung genannten Schreibweisen; vollständig ist ein Profil allein nach seinen Pflichtfeldern, Formate prüft nur das Speichern (E-053) | `legal-forms.test.ts` |
| 3 – N2, N3, Bericht und STAND | N2: Wortlaut von Anhang D, Pflichtwerte als Typ, keine Ersatzwerte (E-055). N3: E-048 korrigiert. Bericht, STAND und diese Nachabnahme sind committet. | `error-messages.test.ts`, `ENTSCHEIDUNGEN.md` |
| 4 – Reste #1, #9, #12, #34 | #1: KG/OHG mit haftender Kapitalgesellschaft muss „GmbH & Co. KG oder ähnliche“ wählen, Aufsichtsrat der Gesellschafterin erfassbar, Bezeichnung umfasst auch „& Co. OHG“. #9: Logo als eigenes Modul, anonyme Seiten laden die Schale nicht mehr; ohne Sitzung schreibt der Proxy `/admin…` auf eine unbekannte Route um. #12: andere Tabs melden einen Wechsel des Arbeitsbereichs und bieten „Neu laden“ an. #34: Datumsangaben in der Zeitzone des aktiven Arbeitsbereichs (E-056). | `legal-forms.test.ts`, `workspace-provider.test.tsx`, E2E „Betreiberbereich …“ |

Weitere Befunde einer parallelen Prüfung des Diffs aus fünf Blickwinkeln (u. a. der Textkatalog über `global-error.tsx`, Fokus in Safari und aus der Schublade) sind in `phase-01.md` unter „Nachbesserung nach der Nachabnahme“ aufgeführt.
