# Unabhängige Abnahme Phase 1 – Design-System und App-Schale

Stand: 24.10.2026 · Branch `claude/amazing-carson-fippeq` · geprüfter Commit `cc958b5`, Arbeitsbaum bis auf diesen Bericht sauber (`git status` leer)
Grundlage: `CLAUDE.md`, `docs/KONZEPT.md` Kapitel 13, 17 (Pflichtangaben) und Phase 1 in Kapitel 20, `docs/ENTSCHEIDUNGEN.md` (E-037 bis E-047), `docs/berichte/phase-01.md`.
Vorgehen: Alle Prüfbefehle selbst ausgeführt, Code gelesen, jeden Befund im Code nachgelesen und, wo möglich, mit eigenen Proben nachgestellt (tsx-Skripte gegen die echten Module, `curl` und Playwright gegen den laufenden Dev-Server auf 127.0.0.1:4300, `EXPLAIN` und `pg_stat_user_indexes` in der Dev-Datenbank, Kontrastrechnung aus den Tokens). Am Code habe ich nichts geändert, den laufenden `pnpm dev` habe ich weder gestartet noch gestoppt. Für die Proben habe ich in der Dev-Datenbank Wegwerf-Konten angelegt (`abnahme-1792880255@beispiel.test` mit Arbeitsbereich „Abnahme Prüfstand GmbH“, `verify-1792882862@beispiel.test`, `repro-u-…`/`repro-v-…@beispiel.test` mit den Arbeitsbereichen „Alpha …“ und „Home …“, `e046-review-1792885394@example.test` mit „E046 Prüfung“). Eine Probe mit 2000 Gesprächen lief in einer Transaktion mit `ROLLBACK`.

## Abgenommen: nein

Begründung: Drei der vier Abnahmekriterien sind erfüllt. Das vierte, „das Absenderprofil speichert die Pflichtangaben“, ist es nicht: Für die GmbH & Co. KG fehlen die Pflichtangaben der Komplementär-GmbH (M1), ausgeblendete Felder einer früher gewählten Rechtsform werden still gespeichert oder blockieren das Speichern unsichtbar (M2), und für Schweizer AGs und Genossenschaften sowie deutsche eGs ohne Aufsichtsrat lässt sich kein wahrheitsgemäßes vollständiges Profil speichern (M3). Dazu kommen zwei schwere Verstöße gegen die Muss-Vorgabe WCAG 2.2 AA aus Kapitel 13 (Fokusverlust nach Dialogen M4, Feldrahmen unter 3:1 M5), die axe und Lighthouse nicht messen. Blocker gibt es keine. Die 39 leichten Befunde halten die Abnahme nicht auf.

## Eigene Prüfläufe

| Befehl / Probe | Exit-Code | Ergebnis |
| --- | --- | --- |
| `pnpm lint` | 0 | „Checked 316 files in 572ms. No fixes applied.“ – keine Fehler, keine Warnungen |
| `pnpm typecheck` | 0 | vollständig aus dem Turbo-Cache |
| `TURBO_FORCE=true pnpm typecheck` | 0 | ohne Cache: „Tasks: 10 successful, 10 total, Cached: 0 cached“, danach `tsc -p tsconfig.json` ohne Fehler |
| `pnpm test` | 0 | „Test Files 30 passed (30), Tests 129 passed (129)“; `tenant-isolation.int.test.ts` deckt `senderProfile.get/update`, `workspace.shell/onboarding`, `lookup.get` ab, dazu „covers every procedure of the app router“ |
| `pnpm test:e2e:prod` (Produktions-Build wie die CI, inkl. Lighthouse) | 0 | „18 passed (8.5m)“: alle Tests aus `phase-0-auth`, `phase-1-shell` und `phase-1-lighthouse`; Lighthouse-Test 7,4 min, `test-results/lighthouse-accessibility.json`: 15 Seiten × Desktop/360 px, alle 30 Werte 1.0 |
| `pnpm test:e2e` (`next dev`) | – | nicht separat ausgeführt; dieselben 18 Tests liefen im Produktions-Build |
| `curl` auf alle Routen aus Kapitel 13 (anonym, 127.0.0.1:4300) | – | öffentliche Routen 200, geschützte 307 auf `/login?next=<Pfad>`, `/gibtsnicht` 404 |
| `curl http://127.0.0.1:4300/api/health` | – | 200 |
| Playwright gegen den Dev-Server: 31 Routen × hell/dunkel × 360/1280 px, Inhaber mit 2FA | – | alle Routen 200 mit passender H1, `scrollWidth ≤ clientWidth` überall, kein Element außerhalb des Viewports, 0 axe-Verstöße (WCAG 2.0–2.2 A/AA); Screenshots unter `/tmp/claude-0/-home-user-E-mail-Plattform/7a423f89-91ee-55e9-ae73-b24be485b4bd/scratchpad/shots/` |
| tsx-Probe `validateSenderProfile` / `isSenderProfileComplete` | – | GmbH & Co. KG ohne Angaben zur Komplementärin → `ok:true`, vollständig (M1); Einzelunternehmen mit `registerNumber:"abc"` → `VALIDATION {registerNumber:"invalid"}`, mit gültigen Restwerten → alle vier Fremdfelder gespeichert (M2); Schweizer AG mit Verwaltungsrat → `{supervisoryBoardChair:"required"}` (M3) |
| Playwright: Fokus nach dem Schließen (Strg+K → Esc, Hilfe → Esc/X, Team-Menü → Dialog → Esc/Abbrechen) | – | `document.activeElement` jeweils `BODY`, nächster Tab landet auf „Zum Inhalt springen“ (M4) |
| Kontrast aus den Tokens und gerendert in Chromium (`/login`) | – | Feldrahmen `border-strong` gegen `surface`: 1,73:1 hell, 1,72:1 dunkel (M5); Segmented gewählt 1,13/1,08:1, Switch-Spur 1,73/1,72:1 (m18); Menü-Hervorhebung 1,18/1,15:1 (m19) |
| `curl` als angemeldeter Nicht-Admin auf `/admin`, `/admin/system`, `/admin/gibtsnicht` | – | jeweils 200 mit Titel „Betreiberbereich“ bzw. „Systemzustand · E-Mail-Plattform“, dagegen `/gibtsnicht` 404 (m7) |
| Lighthouse 13.5.0 ohne Sitzung auf `/vorlagen`, `/einstellungen/team` | – | endet auf `/login?next=…`, Wert 1 – der Test hätte das als App-Seite gezählt (m17) |
| `EXPLAIN ANALYZE` der Seitenleisten-Abfrage (2000 Gespräche, `ROLLBACK`) | – | Seq Scan → Sort → WindowAgg liefert alle 2000 Zeilen, angezeigt werden 3 (m11) |
| `pg_stat_user_indexes` (`user_pkey`) um einen `GET /start` | – | +4 Profiltransaktionen je Seitenaufruf, `/start` plus Chat-Detailseite +9 (m12) |

## Abnahmekriterien aus Kapitel 20

| Kriterium | Ergebnis | Eigener Nachweis |
| --- | --- | --- |
| Alle Routen aus Kapitel 13 existieren (Platzhalter erlaubt) | erfüllt | Routentabelle vollständig in `apps/web/app` (`/login`, `/registrieren`, `/einladung/[token]`, `/willkommen`, `/start`, `/chat/[agentId]/[conversationId]`, `/auftraege` mit `neu` und `[id]`, `/posteingang` mit `[mailboxId]` und `thread/[threadId]`, `/kontakte` mit `[id]`, `listen`, `import`, `/vorlagen`, `/postfaecher` mit `verbinden`, `kaufen`, `[id]`, `/agenten` mit `neu` und `[id]`, neun Bereiche unter `/einstellungen`, `/admin` mit `[section]`, `/u/[token]`, `/c/[token]`, Website mit `/preise`, `/impressum`, `/datenschutz`, `/agb`, `/avv`). `curl` und eigener Playwright-Lauf siehe oben; die Auftrags-Detailseite hat alle Reiter (Übersicht, Live, Empfänger, Nachrichten, Antworten, Ergebnis, Bericht). E2E „Alle Routen aus Kapitel 13 existieren …“ (45,4 s) und „Detailseiten zeigen nur Objekte des eigenen Arbeitsbereichs“ grün. |
| Lighthouse-Barrierefreiheit mindestens 95 | erfüllt | eigener Lauf `pnpm test:e2e:prod`: „Lighthouse-Barrierefreiheit mindestens 95 auf Website und App“ grün, alle 30 Messungen 1.0, keine fehlschlagenden Audits; zusätzlich 0 axe-Verstöße in meinem Browser-Lauf. Einschränkungen: Der Test prüft nicht, welche URL gemessen wurde (m17), und Lighthouse/axe messen den Kontrast von Bedienelementen (WCAG 1.4.11) nicht (M5, m18, m19). |
| Sauber ab 360 px | erfüllt, mit Mängeln | E2E „Sauber ab 360 px: kein seitliches Scrollen, Navigation als Schublade“ grün (16,7 s); eigener Lauf 360 × 800 hell und dunkel auf 31 Routen ohne seitliches Scrollen und ohne Element außerhalb des Viewports. Mängel: CardHeader quetscht die Beschreibung (m13), Onboarding-Fortschritt ohne zugängliche Namen (m16), 2FA-Hinweis im Team ausgeblendet (m26). |
| Das Absenderprofil speichert die Pflichtangaben | **nicht erfüllt** | Der GmbH-Weg ist erfüllt: E2E „Absenderprofil speichert die Pflichtangaben je Rechtsform“ (fehlende Felder benannt, gespeichert, in der Datenbank geprüft, auf der Abmeldeseite angezeigt), `legal-forms.test.ts` (11) und `sender-profile.int.test.ts` (6) grün. Je Rechtsform aber nicht: GmbH & Co. KG ohne Komplementär-Angaben gilt als vollständig (M1), ausgeblendete Felder werden gespeichert bzw. blockieren unsichtbar (M2), Aufsichtsratsvorsitz wird auch dort verlangt, wo es kein Organ gibt (M3). `docs/berichte/phase-01.md:30` belegt das Kriterium nur mit dem GmbH-Fall. |

## Umfang Phase 1 – Einzelprüfung

| Punkt | Ergebnis | Nachweis |
| --- | --- | --- |
| Design-Tokens | teilweise | `packages/ui/src/styles.css`: Farben, Radien 8/10/12 px, drei Schattenstufen als CSS-Variablen (hell, `.dark`, Systemeinstellung). Abstände sind keine Tokens in `packages/ui`, 65 Halbschritte außerhalb des 4-px-Rasters (m14); feste Farben (m22); Feldrahmen-Token unter 3:1 (M5) |
| Hell- und Dunkelmodus | ja | Cookie `ep_theme` (`light`/`dark`/`system`), Klasse serverseitig gerendert; E2E „Dunkelmodus: Wahl bleibt erhalten, Kontraste stimmen“ grün; eigener Lauf dunkel 0 axe-Verstöße. Mängel: Sonner ohne Dunkelmodus (m21), `theme-color` folgt dem Cookie nicht (m22) |
| Komponenten | ja | Button, Input/Textarea/Select/Field, Card, Badge, Alert, Skeleton/LoadingState/EmptyState/ErrorState, PageHeader, Stat (Tabellenziffern), Avatar, Dialog, Drawer, DropdownMenu, Tooltip, Tabs, Switch, Segmented, Toaster, CommandDialog; `command.test.tsx` grün. Mängel M4, m13, m18–m23 |
| `SuggestOrWrite` | ja | `packages/ui/src/suggest-or-write.tsx` mit `suggestions` (auf 5 begrenzt), `value`, `onChange` (mit Quelle), `allowFreeText`, `aiFill`, `explain`; `suggest-or-write.test.tsx` (3) und E2E „Neuer Auftrag: Vorschlag wählen oder selbst schreiben“ grün. Mangel m15 |
| Seitenleiste | ja | `apps/web/components/shell/sidebar.tsx`: alle Einträge aus Kapitel 13, einklappbar (Cookie), unter 1024 px Schublade; E2E „Seitenleiste: aktiver Eintrag, Einklappen bleibt nach dem Neuladen“ grün. Mängel m11, m24, m25, m27 |
| Befehlspalette | ja | Strg+K/⌘K (`app-shell.tsx:73-83`) mit Aktionen, Seiten, Einstellungen, Arbeitsbereich-Wechsel, Darstellung; E2E „Befehlspalette mit Strg+K …“ grün. Mängel M4, m19 |
| Startseite mit Platzhalter-Blöcken | ja | `app/(app)/start/page.tsx`: Begrüßung, Checkliste aus echten Daten, 5 Kennzahlen, „Heute erledigt“, „Wartet auf dich“, laufende Aufträge, Postfach-Ampeln mit leeren Zuständen; Screenshots geprüft. Mangel m36 |
| Einstellungen (Profil, Team, Absenderprofil) | Profil und Team ja, Absenderprofil nein | Profil: Name, Darstellung, Passwort, 2FA. Team: Rolle ändern/entfernen mit `freshWorkspaceProcedure` (E2E grün). Absender: Rechteprüfung `settings.manage`, Audit `sender_profile.updated`, aber M1–M3 und m1–m6. Mängel im Team m26, m28–m30 |
| Deutsche Texte in `messages/de.json` | ja, mit Ausnahme | Suche nach deutschen Literalen in `app`, `components`, `lib`, `server`, `packages/ui` findet nur Tastennamen; Schlüssel typgeprüft (`global.d.ts`); E2E sammelt `MISSING_MESSAGE`/`FORMATTING_ERROR`. Ausnahme: englisches Sonner-Label (m21); feste Fristen in Texten (m35, m36) |
| Leer-, Lade- und Fehlerzustände | ja, mit Lücken | `app/(app)/loading.tsx` (Skelett, `role=status`), `app/(app)/error.tsx`, `not-found.tsx`, `global-error.tsx`, `NotFoundState`; SenderProfileForm mit Lade-/Fehlerzustand. Lücken: m31–m34 |
| Onboarding-Gerüst | ja | `app/(onboarding)/willkommen/page.tsx`: Arbeitsbereich, 2FA-Pflicht, Postfach, Absender, Agent, erster Auftrag; Fortschritt aus Daten (E-040); alle `?schritt=`-Seiten mit H1 und ohne axe-Verstöße. Mängel m16, m32 |

## Muss-Regeln – gezielte Suche

- **Mandantentrennung:** Jede neue Prozedur hat einen Mandantentest, der Abdeckungstest erzwingt das. Der Fall `workspace.onboarding` prüft aber nur einen festen Wert (m9). Seite und Client-Formular können nach einem Wechsel in einem anderen Tab verschiedene Arbeitsbereiche nutzen; der Server prüft Mitgliedschaft und Rolle, fremde Mandanten sind nicht betroffen (m10).
- **Betreiberbereich nur mit `platform_admin`:** `requirePlatformAdmin` prüft Rolle und 2FA serverseitig, die Rolle kommt frisch aus der Datenbank (E-046). Der Bereich verrät sich aber über Titel, Status und Weiterleitung (m7), und die 2FA-Pflicht ist ungetestet (m8).
- **Barrierefreiheit (WCAG 2.2 AA, Kapitel 13):** axe und Lighthouse sind sauber, decken aber Fokusrückgabe und Nicht-Text-Kontrast nicht ab: M4, M5, m15, m16, m18–m20, m24, m25.
- **Texte nur in `de.json`:** sauber bis auf das Sonner-Label (m21).
- **Startwerte nur aus `defaults.ts`:** Verstöße m35, m36, m37.
- **Pflichtangaben je Rechtsform (Kapitel 17, E-038):** M1–M3, m3–m5.

## Befunde

Doppelt gemeldete Befunde verschiedener Prüfer sind zusammengefasst.

### Blocker

Keine.

### Schwer (major)

**M1 – GmbH & Co. KG: Pflichtangaben der Komplementär-GmbH fehlen, das Profil gilt trotzdem als vollständig**
`packages/core/src/sender/legal-forms.ts:101` nimmt `gmbh_co_kg` nur in `withDirectors` auf; `requiredSenderFields` (`:117-124`) verlangt daher nur Firma, Anschrift, Registergericht, Registernummer und Geschäftsführung, `optionalSenderFields` (`:147-150`) bietet nicht einmal den Aufsichtsratsvorsitz an. Für Firma, Rechtsform, Sitz, Registergericht, Registernummer und Geschäftsführung der persönlich haftenden Gesellschafterin gibt es weder Felder noch Spalten (`packages/db/src/schema/workspaces.ts:99-126`). Nach § 177a i. V. m. § 125a Abs. 1 S. 2 HGB a. F. (heute § 125 HGB) gehören sie bei einer KG ohne natürliche Person als Vollhafter auf jede Geschäftsmail; Kapitel 17 (`KONZEPT.md:1208`) und E-038 berufen sich ausdrücklich auf §§ 125a, 177a HGB. Probe: das Profil `{gmbh_co_kg, "Muster GmbH & Co. KG", Anschrift, "Amtsgericht München", "HRA 12345", "Max Muster"}` ergibt `ok:true` und `isSenderProfileComplete → true`; das Onboarding zählt den Schritt als erledigt (`packages/core/src/services/onboarding.ts:58`). Das Formular lenkt zusätzlich weg („Alle Personen mit Vor- und Nachnamen“, `apps/web/messages/de.json:421`) und verspricht „Wir fragen genau das ab, was für deine Rechtsform Pflicht ist“ (`de.json:404`). Gleiches gilt für KG/OHG mit juristischer Person als Vollhafter (UG & Co. KG), für die nicht einmal die Geschäftsführung Pflicht ist; `legal-forms.test.ts:38-45` schreibt das fest.

**M2 – Ausgeblendete Felder einer früheren Rechtsform werden mitgespeichert oder blockieren das Speichern unsichtbar**
`packages/core/src/sender/legal-forms.ts:226-277` bereinigt und prüft alle Felder ohne Rücksicht auf die Rechtsform (Registernummer `:256`), `:282-294` übernimmt sie. Das Formular blendet Felder aus (`apps/web/components/settings/sender-profile-form.tsx:227`, Karte `:354-355`), schickt sie in `toInput` (`:56-76`) aber mit; `packages/core/src/services/sender-profile.ts:122-137` speichert `validated.value` ungefiltert. Probe: Einzelunternehmen mit Restwerten `registerCourt`, `registerNumber`, `managingDirectors`, `supervisoryBoardChair` → `ok:true`, alle vier stehen im gespeicherten Profil und in beiden Vorschauen (`einstellungen/abmeldeseite/page.tsx:25-26`, `sender-profile-form.tsx:436-449`, dort sogar als „Geschäftsführung“). Mit ungültiger Registernummer im ausgeblendeten Feld → `VALIDATION`; es erscheint „Bitte prüfe das markierte Feld.“ (`de.json:432`), kein Feld ist markiert, `getElementById("sender-registerNumber")` (`sender-profile-form.tsx:206`) findet nichts. Die falschen Werte lassen sich nur löschen, indem man zur alten Rechtsform zurückwechselt. Einstufung: Ein Prüfer wertete minor, weil der Fehler nur beim Wechsel auf eine Rechtsform mit weniger Feldern auftritt; ich werte major, weil dauerhaft falsche Pflichtangaben in der Quelle der Wahrheit landen und ab Phase 4 automatisch an Mails gehängt würden, also das Kriterium 4 betroffen ist.

**M3 – Aufsichtsratsvorsitz für AG und eG immer Pflicht, auch ohne dieses Organ (CH, eG ohne Aufsichtsrat)**
`packages/core/src/sender/legal-forms.ts:117` kennt kein Land, `:122` verlangt `supervisoryBoardChair` für jede `ag` und `eg`. Eine Schweizer AG hat einen Verwaltungsrat, eine Schweizer Genossenschaft eine Verwaltung; eine deutsche eG mit höchstens 20 Mitgliedern kann nach § 9 Abs. 1 S. 2 GenG auf den Aufsichtsrat verzichten, § 25a GenG verlangt den Vorsitz nur, „sofern der Aufsichtsrat einen Vorsitzenden hat“. Probe: Schweizer AG (Handelsregisteramt Zürich, CHE-123.456.789) → `{supervisoryBoardChair:"required"}`, `isSenderProfileComplete → false`; deutsche eG ohne Aufsichtsrat ebenso. Diese Absender können nur mit erfundenen Angaben oder der falschen Rechtsform „Andere“ speichern und den Onboarding-Schritt abschließen. E-038 verspricht für AT/CH „dieselben Felder mit eigenen Bezeichnungen“, das Feld heißt aber immer „Vorsitz des Aufsichtsrats“ (`de.json:449`) und das Personenfeld in CH „Vorstand“ (`legal-forms.ts:105-110`, `de.json:507`).

**M4 – Fokus geht nach dem Schließen von Befehlspalette und Dialogen verloren (landet auf `<body>`)**
`packages/ui/src/command.tsx:29` öffnet `RadixDialog.Root` gesteuert, ohne `Trigger` und ohne `onCloseAutoFocus`; `packages/ui/src/dialog.tsx:30` reicht `onCloseAutoFocus` nicht durch. Ebenso gesteuert: Hilfe-Dialog (`apps/web/components/shell/app-shell.tsx:161`) und „Mitglied entfernen“ (`apps/web/components/team-settings.tsx:307`). Radix 1.3.1 ruft im modalen Dialog `preventDefault()` auf und fokussiert nur `triggerRef.current`, der hier `null` ist. Nachgestellt: „Kontakte“ fokussiert → Strg+K → Esc: `BODY`, nächster Tab auf „Zum Inhalt springen“; Hilfe → Esc oder X: `BODY`; Team-Menü → „Arbeitsbereich verlassen“ → Esc oder Abbrechen: `BODY`. Verletzt WCAG 2.4.3 (Stufe A) und die Muss-Vorgabe „Tastaturbedienung“ aus Kapitel 13, ausgerechnet auf dem zentralen Weg Strg+K → Esc; E-047 begründet `radix-ui` sogar mit „Fokusführung“. Kein Test prüft die Fokusrückgabe.

**M5 – Rahmen von Eingabefeldern unter 3:1, Felder in Karten kaum als Felder erkennbar (WCAG 1.4.11)**
`packages/ui/src/input.tsx:25`, `:46`, `:68`: Input, Textarea und Select haben `bg-surface` und 1 px `border-border-strong`, keinen Schatten und keine eigene Füllung; Card ist ebenfalls `bg-surface` (`card.tsx:7`). Token `--ep-border-strong` in `packages/ui/src/styles.css:17` (hell), `:53` und `:87` (dunkel). Gerendert auf `/login`: Rahmen rgb(199,196,190) auf rgb(255,254,253) = 1,73:1 (hell), rgb(60,64,70) auf rgb(20,23,27) = 1,72:1 (dunkel); Feld gegen Karte 1,00:1. Damit ist der Rahmen das einzige Merkmal des Felds und liegt unter den 3:1, die WCAG 1.4.11 (AA) verlangt; Kapitel 13 fordert WCAG 2.2 AA als Muss. Betrifft alle Formulare in beiden Farbmodi. axe und Lighthouse messen das nicht, deshalb ist es trotz Wert 100 durchgerutscht.

### Leicht (minor)

*Absenderprofil*

**m1 – Pflichtangaben-Zähler ignoriert die Rechtsform** – `apps/web/components/settings/sender-profile-form.tsx:267`: `missing` zählt nur `requiredSenderFields`, `legalForm` gehört nie dazu, obwohl `validateSenderProfile` sie verlangt (`legal-forms.ts:218`). Mit Firma und Anschrift, aber ohne Rechtsform zeigt das Badge (`:293`) „Alles ausgefüllt – jetzt speichern“ (`de.json:414`), das Speichern scheitert an `legalForm: required` (per tsx nachgestellt).

**m2 – Vorschau der Abmeldeseite zeigt nicht alle Pflichtangaben** – `apps/web/app/(app)/einstellungen/abmeldeseite/page.tsx:22-27` baut `senderLines` nur aus Firma, Anschrift, Register und nackten Namen aus `managingDirectors`; es fehlen der für AG/eG verpflichtende Aufsichtsratsvorsitz (E-038), die Bezeichnung Geschäftsführung/Vorstand und „Sitz“. Die Formular-Vorschau (`sender-profile-form.tsx:436-449`) gibt all das aus. Kapitel 13: „Die Seite zeigt den Absender mit Pflichtangaben“; `de.json` verspricht „Sie zeigt deinen Namen und deine Pflichtangaben“. Der E2E-Test (`e2e/phase-1-shell.spec.ts:344-346`) prüft nur eine GmbH.

**m3 – Sitz wird aus dem Ort der Geschäftsanschrift abgeleitet** – `sender-profile-form.tsx:436-437` mit `de.json:516` („Sitz: {city}“). Der Satzungssitz kann abweichen (§ 4a GmbHG, § 5 AktG), Kapitel 8 (`KONZEPT.md:565`) nennt ihn als eigene Pflichtangabe, ein Feld fehlt. Anders als beim Aufsichtsratsvorsitz (E-038) ist die Vereinfachung nicht dokumentiert.

**m4 – „Andere Rechtsform“ bietet keine Register- und Vertretungsfelder an** – `packages/core/src/sender/legal-forms.ts:144-150` bietet `registerCourt`, `registerNumber` und `managingDirectors` nur für die fest verdrahteten Formen; bei `other` blendet `sender-profile-form.tsx:354-355` die ganze Karte aus. SE und KGaA (§ 80 AktG bzw. § 278 Abs. 3 AktG) können ihre Registerangaben nicht eintragen, das Profil gilt mit Firma und Anschrift als vollständig (tsx-Probe).

**m5 – Österreich- und Schweiz-Varianten nur teilweise angepasst** – Die Rolle des Personenfelds hängt nur an der Rechtsform, nicht am Land (`sender-profile-form.tsx:369`, `:445`; `requiredSenderFields` `legal-forms.ts:117-124`), „Vorsitz des Aufsichtsrats“ ist fest (`de.json:449`). Ein österreichischer Verein soll „Firmenbuchgericht“/„Firmenbuchnummer“ mit Beispiel „FN 123456a“ angeben (`de.json:487`, `:499`), hat aber ZVR-Zahl und Vereinsbehörde. Überschneidet sich mit M3; der Bericht (`phase-01.md:16`) behauptet „DE/AT/CH“, getestet ist für AT/CH nur die GmbH (`legal-forms.test.ts:113-134`).

**m6 – Absenderformular verliert ungespeicherte Eingaben beim Neuladen der Abfrage** – `sender-profile-form.tsx:108`: `key={query.dataUpdatedAt}` mountet den Editor bei jedem erfolgreichen Abruf neu; `refetchOnReconnect` bleibt an (`apps/web/lib/trpc.tsx:17` schaltet nur `refetchOnWindowFocus` ab). Nachgestellt mit jsdom: getippter Wert, `offline`/`online` → Feld zeigt wieder den Serverstand.

*Betreiberbereich, Mandanten, Server*

**m7 – Betreiberbereich verrät sich trotz „Seite nicht gefunden“ (E-041)** – `apps/web/app/(app)/admin/page.tsx:9-12` und `admin/[section]/page.tsx:11-19`: `generateMetadata` setzt den Titel ohne Rollenprüfung; `notFound()` (`apps/web/server/app-context.ts:76`) greift erst nach Beginn des Streamings durch `app/(app)/loading.tsx`. Als Nicht-Admin: `/admin` 200 „Betreiberbereich“, `/admin/system` 200 „Systemzustand“, `/admin/gibtsnicht` 200 „Betreiberbereich“ (Slug-Orakel), `/gibtsnicht` 404. Anonym: `apps/web/proxy.ts:19` leitet `/admin/*` mit 307 auf `/login` um, unbekannte Pfade liefern 404. Zusätzlich gibt `apps/web/app/layout.tsx:42` die ganze `de.json` (53 KB, inkl. `admin.*`) an jede Seite. Hinweis zur Behebung: Ein `admin/layout.tsx` liegt noch innerhalb der Suspense-Grenze; neutraler Titel in `generateMetadata`, `notFound()` auch für Anonyme und Namensräume nur dort, wo sie gebraucht werden.

**m8 – Kein Test für `platform_admin` ohne 2FA und für anonyme Aufrufe des Betreiberbereichs** – Die 2FA-Pflicht steht nur in `apps/web/server/app-context.ts:77`. Der einzige Test (`e2e/phase-1-shell.spec.ts:349-375`) nutzt einen Inhaber mit 2FA (`e2e/helpers.ts:151`), kein Test ruft eine geschützte Route ohne Anmeldung auf. Würde Zeile 77 entfernt, schlüge kein Test fehl.

**m9 – Mandantentest für `workspace.onboarding` prüft einen festen Wert** – `apps/web/server/trpc/tenant-isolation.int.test.ts:123-127` prüft für B nur `steps.workspace === true`, der in `packages/core/src/services/onboarding.ts:56` fest auf `true` steht. Fehlte der Filter `workspaceId` in `onboarding.ts:43-54`, stünden für B `mailbox`, `agent` und `campaign` auf `true`, obwohl `createPlaceholderObjects(deps, a)` (`:93`) die Objekte von A schon anlegt; der Test bliebe grün (CLAUDE.md Regel 4).

**m10 – Seite und Client-Formular nutzen nach einem Wechsel in einem anderen Tab verschiedene Arbeitsbereiche** – `apps/web/app/(app)/einstellungen/absender/page.tsx:19` berechnet `canEdit` aus dem Cookie `ep_ws`, die tRPC-Aufrufe schicken `x-workspace-id` aus der Modulvariablen (`apps/web/lib/trpc.tsx:30-33`, `lib/workspace-store.ts:4`), der Header hat Vorrang (`server/trpc/http-context.ts:23-25`). Nachgestellt mit zwei Tabs: Seitenleiste „Alpha / Leser“, Formular bearbeitbar (Rolle aus „Home“), Speichern → „Dafür fehlen dir die Rechte.“. Fremde Mandanten sind nicht betroffen.

**m11 – Seitenleisten-Abfrage lädt alle Gespräche des Nutzers** – `packages/core/src/services/shell.ts:30-50` berechnet `row_number()` ohne Filter und ohne `LIMIT`, erst `:62` behält in JavaScript 3 je Agent; Aufruf bei jedem vollen Rendern des Layouts (`app/(app)/layout.tsx:21`). `EXPLAIN ANALYZE` mit 2000 Gesprächen: alle 2000 Zeilen übertragen. Heute latent (Gespräche ab Phase 7), Chats bleiben 24 Monate. Besser: `LATERAL … LIMIT 3` je Agent mit passendem Index.

**m12 – E-046: frische Nutzerdaten kosten mehrere Transaktionen je Seitenaufruf** – `apps/web/server/session.ts:16` liest je Aufruf Sitzung und Profil (`withUser`: BEGIN, `SET LOCAL ROLE`, `set_config`, SELECT, COMMIT); `serverCaller()` (`server/caller.ts:10-13`) und `activeCaller()` (`server/workspace-caller.ts:9-11`) sind nicht je Anfrage gecacht. Gemessen: 4 Profiltransaktionen für `/start`, 5 für die Chat-Detailseite. Die Begründung in E-046 („eine Abfrage je Anfrage“, `ENTSCHEIDUNGEN.md:52`) stimmt nicht.

*Design-System und Barrierefreiheit*

**m13 – CardHeader quetscht die Beschreibung bei 360 px in eine schmale Spalte** – `packages/ui/src/card.tsx:28` (`flex justify-between`, Aktion `shrink-0` in `:36`) ohne Umbruch untereinander. Gemessen bei 360 px: „Wer schreibt?“ (`sender-profile-form.tsx:282`) Beschreibung 66 px breit, 8 Zeilen; ebenso `/willkommen?schritt=absender`, `/einstellungen/abmeldeseite` (97 px, 7 Zeilen), `/start`-Checkliste (Titel 3 Zeilen). Nichts läuft über, ist aber nicht „sauber ab 360 px“.

**m14 – Abstände weder als Tokens in `packages/ui` noch im 4-px-Raster** – `packages/ui/src/styles.css:9-43` definiert Farben, Radien und Schatten, aber keine Abstände; Kapitel 13 (Muss): „Abstände in 4-px-Schritten … Komponenten nutzen nur Tokens“. 65 Halbschritte (2, 6, 10, 14 px; z. B. `sidebar.tsx:53` `gap-2.5 px-2.5`, `card.tsx:31` `gap-0.5`) und feste Werte (`sidebar.tsx:254` `ml-[22px]`, `card.tsx:30` `size-[18px]`, `switch.tsx:16`). Keine Entscheidung erlaubt das; `phase-01.md:9` behauptet das Gegenteil.

**m15 – SuggestOrWrite ohne Freitext: verwaistes `<label>`, Erklärung nicht verknüpft** – `packages/ui/src/suggest-or-write.tsx:87` rendert `<label htmlFor={fieldId}>` immer, das Feld mit dieser `id` nur bei `allowFreeText` (`:120-140`); `explain` (`:91`) hängt nur per `aria-describedby` am Freitextfeld. Bei „Ansprache“ (`apps/web/components/campaigns/new-campaign.tsx:66-79`) zeigt `for="campaign-formality"` ins Leere, die Chips bekommen die Erklärung nicht (per Rendern und jsdom nachgeprüft).

**m16 – Onboarding-Fortschritt unter 640 px ohne zugängliche Schrittnamen** – `apps/web/components/onboarding/onboarding-progress.tsx:31`: Schrittname und sr-only „, erledigt“ liegen in `hidden … sm:flex`. ARIA-Snapshot bei 360 px: fünf leere `listitem`, `aria-current="step"` auf einem leeren Eintrag; der Erledigt-Status ist nur über die Balkenfarbe (`:28`) erkennbar (WCAG 1.3.1).

**m17 – Lighthouse-Test prüft nicht, welche Seite gemessen wurde** – `e2e/phase-1-lighthouse.spec.ts:98` übernimmt den Wert ohne Vergleich von `lhr.finalDisplayedUrl` mit dem Pfad. Probe ohne Sitzung: `/vorlagen` und `/einstellungen/team` enden auf `/login?next=…` mit Wert 1. Heute misst der Test die richtigen Seiten, als Rückschrittschutz (E-044) bleibt er aber grün, wenn eine App-Seite künftig umleitet.

**m18 – Zustand von Segmented (gewählt) und Switch (aus) unter 3:1** – `packages/ui/src/segmented.tsx:42`: gewählt nur `bg-surface` auf `bg-surface-muted` (1,13:1 hell, 1,08:1 dunkel), Textwechsel 2,38/1,86:1, Schatten praktisch unsichtbar; `packages/ui/src/switch.tsx:11`: Spur aus 1,73/1,72:1, Daumen gegen Spur ebenso (WCAG 1.4.11). Segmented ist im Profil eingesetzt (`profile-forms.tsx:100`), Switch bisher nur exportiert.

**m19 – Tastatur-Hervorhebung in Menüs und Befehlspalette kaum sichtbar (1,18/1,15:1)** – `packages/ui/src/dropdown-menu.tsx:41` und `:78` setzen `outline-none` und zeigen den aktiven Eintrag nur über `data-[highlighted]:bg-surface-hover`; `packages/ui/src/command.tsx:93` ebenso über `data-[selected=true]`. In Chromium gemessen 1,18:1 hell, 1,15:1 dunkel; Kapitel 13 verlangt sichtbaren Fokus.

**m20 – Fokusrahmen der Reiter wird vom TabsList abgeschnitten** – `packages/ui/src/tabs.tsx:13` (`overflow-x-auto`, damit auch `overflow-y: auto`) und `:25` (2-px-Outline ohne Offset). Pixelzählung: oben und unten 0 Pixel sichtbar, beim ersten Reiter auch links; übrig bleibt ein senkrechter Strich neben der fast gleichfarbigen Unterstreichung. Betrifft `DetailTabs` (`/auftraege/[id]`, `/postfaecher/[id]`).

**m21 – Hinweis-Baustein (Sonner) ohne Dunkelmodus und mit englischem Screenreader-Label** – `packages/ui/src/toaster.tsx:10` übergibt weder `theme` noch `containerAriaLabel`. Sonner 2.0.8 nimmt `theme='light'` und rendert immer `<section aria-label="Notifications alt+T">` (auf jeder Seite der Schale, `app-shell.tsx:191`); im Dunkelmodus bleibt der Schließen-Knopf weiß (rgb(255,255,255), Screenshot `/tmp/claude-0/-home-user-E-mail-Plattform/7a423f89-91ee-55e9-ae73-b24be485b4bd/scratchpad/vtoast/toast-dark.png`). Verstößt gegen „Texte nur in `de.json`“ und E-047 („das Aussehen kommt aus unseren Tokens“).

**m22 – Feste Farbwerte statt Tokens (Select-Pfeil, `theme-color`)** – `packages/ui/src/input.tsx:67`: data-URI mit `stroke='%23888'`; `apps/web/app/layout.tsx:24-27`: `theme-color` fest `#f9f8f5`/`#16181d` nur nach `prefers-color-scheme`, die Cookie-Wahl fließt nicht ein (nachgestellt: System hell + Cookie dunkel → Leiste hell). Der dunkle Wert weicht auch vom echten `--ep-bg` (#0e1114) ab.

**m23 – Schließen-Knopf im Dialog wird gestaucht** – `packages/ui/src/dialog.tsx:48-50`: `RadixDialog.Close` (`size-8`) ohne `shrink-0` in der Flex-Zeile (`:37`). Gemessen mit der Hilfe-Beschreibung: 26 px breit bei 1280 px, 18,6 px bei 360 px, 16 px bei 320 px statt 32 px; betrifft Hilfe, Vorlagen-Vorschau und „Mitglied entfernen“.

**m24 – Eingeklappte Seitenleiste blendet den Posteingangs-Zähler aus** – `apps/web/components/shell/sidebar.tsx:69` (`{collapsed ? null : trailing}`), `aria-label` (`:50`) und Tooltip (`:73`) nur „Posteingang“. Render-Test mit `inboxCount=7`: eingeklappt weder Zahl noch Screenreader-Text. Kapitel 13: „Posteingang mit Zähler“, der Zustand ist per Cookie dauerhaft.

**m25 – Plural fehlt beim Zähler („1 warten auf dich“)** – `sidebar.tsx:198` setzt die Zahl vor den festen Text `shell.waiting` (`de.json:387`), der zugängliche Name lautet bei einem Thread „Posteingang 1 warten auf dich“. Latent ohne ICU-Plural auch `de.json:32`, `:84`, `:237`, `:282`, `:286`, `:294` (falsch erst bei einem Startwert von 1).

**m26 – Team: Hinweis „ohne Zwei-Faktor“ unter 640 px komplett ausgeblendet** – `apps/web/components/team-settings.tsx:153`: Badge mit `hidden sm:inline-flex`, ohne Ersatz; auf dem Handy sieht ein Inhaber nicht, dass einem Admin die Pflicht-2FA fehlt (WCAG 1.4.10: Inhalt geht bei schmaler Ansicht verloren). Die 2FA-Pflicht selbst greift serverseitig.

*Team und Bedienung*

**m27 – „Hilfe“ im Profilmenü öffnet die Befehlspalette** – `apps/web/components/shell/user-menu.tsx:76` hat `onSelect={onOpenCommands}` wie „Befehlspalette“ (`:71`); `sidebar.tsx:325` übergibt kein `onOpenHelp`. Der Dialog „Hilfe und Tastenkürzel“ (`app-shell.tsx:161-189`) ist aus dem Profilmenü nicht erreichbar.

**m28 – Bestätigungsdialog beim Verlassen zeigt den Text fürs Entfernen** – Menüpunkt „Arbeitsbereich verlassen“ für die eigene Zeile (`team-settings.tsx:194`), der Dialog (`:307-333`) nutzt immer `removeTitle`/`removeText`/`removeConfirm` (`de.json:233-236`): „{eigener Name} aus dem Team entfernen? … Du kannst sie später wieder einladen.“

**m29 – Team-Dialog: alter Fehler bleibt stehen, Verlassen und Selbst-Herabstufung ohne Folgebehandlung** – `team-settings.tsx:90-98`: `remove.reset()` fehlt beim Öffnen/Schließen, ein Fehler zu Mitglied A erscheint im Dialog für B (`:314-318`). Nach dem eigenen Verlassen kein Neuladen: `refreshMembers()` läuft mit alter `x-workspace-id` in FORBIDDEN, die Schale zeigt weiter den alten Arbeitsbereich. Nach Selbst-Herabstufung bleiben `actorRole`/`canManage` (`:81-89`, `:135`) veraltet.

**m30 – Generische Fehleranzeige füllt Fehlertexte mit Argumenten nicht** – `apps/web/lib/trpc.tsx:51-58` (`errorCode()`) verwirft `appError.params`, alle Aufrufer (`team-settings.tsx:87`, `:123`, `:220`, `:261`, `:264`, `:316`, `create-workspace-form.tsx:45`, `invitation-accept.tsx:22`, `sender-profile-form.tsx:97`, `:408`) rufen `t(...)` ohne Werte. Für `PREFLIGHT_PLACEHOLDER`, `PLAN_LIMIT`, `SEND_UNVERIFIED` (`de.json:270`, `:274`, `:275`) nachgestellt: Entwicklung zeigt den Schlüssel, Produktion „Dein Tarif erlaubt {limit}.“. Latent, weil in Phase 1 keine Prozedur diese Codes wirft.

*Zustände und Texte*

**m31 – Platzhalterseiten ohne nächsten Schritt** – `apps/web/components/placeholder-page.tsx:92-98` übergibt `ComingSoon` nie die vorhandene `action`-Prop; ohne `actions` im Kopf sind diese Seiten ohne Lösungsschritt: `app/(app)/kontakte/import/page.tsx:12`, `einstellungen/tarif/page.tsx:12`, `einstellungen/datenschutz/page.tsx:12`, `einstellungen/benachrichtigungen/page.tsx:12`, `einstellungen/verbindungen/page.tsx:12`, `einstellungen/api/page.tsx:12`. Kapitel 13: „Jede Seite hat einen leeren Zustand mit nächstem Schritt“.

**m32 – Kein Ladezustand außerhalb der App-Schale** – Einziges `loading.tsx` ist `app/(app)/loading.tsx`. `app/(onboarding)/willkommen/page.tsx:91` und `app/(auth)/einladung/[token]/page.tsx:18` warten serverseitig auf Abfragen ohne Skelett, auch bei Client-Navigation aus der Checkliste auf `/start`. Kapitel 13 verlangt für jede Seite einen Ladezustand.

**m33 – Einladungsseite macht aus jedem Fehler „Einladung gibt es nicht“** – `app/(auth)/einladung/[token]/page.tsx:18`: `.catch(() => null)` fängt auch Datenbank- und Verbindungsfehler und zeigt `auth.invitation.invalid` (`de.json:70`) statt der Fehlerseite mit „Noch einmal versuchen“; die Ansicht hat keine H1 und keinen Lösungsschritt (per `curl` geprüft).

**m34 – Empfängerseiten fallen auf die Fehlerseite der App zurück** – `(public)` hat kein `error.tsx`; Fehler auf `/u/[token]` und `/c/[token]` landen in `apps/web/app/error.tsx` mit Du-Form („Versuch es noch einmal“, `de.json:309`) und Link nach `/start` (`error.tsx:18`), also zur Anmeldung. E-042: Empfängerseiten sprechen mit „Sie“ an.

**m35 – Startwert fest im Text: „höchstens eine Mail je Viertelstunde“** – `apps/web/messages/de.json:761` (`placeholders.notifications.soonText`), aufgerufen ohne Parameter (`placeholder-page.tsx:95`); der Wert ist `defaults.notify.emailBundleMinutes` (`packages/config/src/defaults.ts:210`). Verstößt gegen CLAUDE.md und E-043, `phase-01.md:17` behauptet das Gegenteil.

**m36 – Kennzahlen-Texte mit festen Fristen und falscher Aussage** – `de.json:155` („Kennzahlen der letzten 30 Tage“, als sr-only-H2 über allen Kacheln, `start/page.tsx:41-42`) und `:160` („72 Stunden ohne Rückläufer“) ohne Schlüssel in `defaults.ts`; „Offene Freigaben“ ist laut Kapitel 13 ein aktueller Bestand, kein 30-Tage-Wert. Der Hinweis zur Posteingangs-Quote (`:176`) lässt den Werbung-Reiter weg.

**m37 – Zeitzone fest im Code statt aus der Arbeitsbereichs-Einstellung** – `apps/web/i18n/request.ts:8` (`timeZone: "Europe/Berlin"`) und `apps/web/server/email-texts.ts:10`; `defaults.workspace.timezone` und die je Arbeitsbereich gespeicherte Zone (`workspaces.ts:14-17`, änderbar über `workspace.update`) werden nicht gelesen. Betrifft das neue Datum auf `/start` (`start/page.tsx:27`) und „gültig bis“ (`team-settings.tsx:284`); sichtbar falsch erst bei einer Zone außerhalb von MEZ/MESZ (z. B. 2026-10-24T23:30Z: „25. Oktober“ statt „24. Oktober“ für New York).

**m38 – Ungenutzte Schlüssel in `de.json`** – `common.save` (`:7`), `common.saving` (`:8`), `common.back` (`:11`), `common.name` (`:16`), `common.remove` (`:18`), `common.copy` (`:19`), `common.copied` (`:20`), `auth.invitation.accepted` (`:71`), `settings.title` (`:193`, durch Phase 1 verwaist) werden über keinen Weg gelesen (direkt, Namensraum, dynamisch). Pflegemangel ohne Folge für Nutzer.

**m39 – Bericht nennt die falsche Spanne der Entscheidungen und enthält ungenaue Aussagen** – `docs/berichte/phase-01.md:46`: „E-037 bis E-046“, es sind E-037 bis E-047 (Commit `cc958b5`: „decisions E-037 to E-047“); E-047 begründet die neuen Abhängigkeiten und wird im Bericht nirgends erwähnt. Außerdem nicht zutreffend: `:9` („Abstände im 4-px-Raster … Komponenten nutzen nur Tokens“, m14, m22), `:15` („jeweils mit leerem Zustand und nächstem Schritt“, nicht für „Heute erledigt“/„Wartet auf dich“), `:17` („Fristen in Texten kommen als Parameter aus defaults.ts“, m35, m36), `:30` (Kriterium 4 „erfüllt“, M1–M3).

## Widerlegte Befunde

- **Startwerte fest in Fehlertexten (100 Empfänger, 3 MB, `de.json:271`, `:276`)** – Die Texte stehen wörtlich so im Konzept, Anhang D (`KONZEPT.md:1770`, `:1775`), und die Codes werden in Phase 1 nicht ausgelöst.
- **Tastenbeschriftungen „Esc“ und „Tab“ fest im Code (`app-shell.tsx:178`, `:184`)** – Namen von Tastenkappen, die im Deutschen gleich heißen; die sprachabhängige „Strg“-Taste kommt aus `de.json`.
- **Kompletter Text-Katalog an jeden Besucher als eigener Befund (`app/layout.tsx:42`)** – Keine Muss-Regel verlangt verborgene Texte; der Bereich ist über `proxy.ts` und `nav.ts` ohnehin erkennbar. Nur als Teil von m7 gewertet.
- **Feste Schwellen im Assistenten und Arbeitsbereich-Formular (`new-campaign.tsx:84`, `:28`, `create-workspace-form.tsx:52-53`)** – Eingabeprüfungen ohne Startwert aus dem Konzept, der Assistent ist laut E-045 eine Vorschau, der Formular-Code ist aus Phase 0 abgenommen.
- **Fachbegriffe ohne Erklärung (SPF/DKIM/DMARC, IMAP/SMTP)** – Der SPF-Text steht wörtlich im Anhang D, und das Konzept nutzt „IMAP“ im Verbinden-Ablauf selbst (`KONZEPT.md:345`); es gibt kein deutsches Ersatzwort.
- **Hydrations-Marker meldet zu früh (`hydration-marker.tsx:7`)** – React hydriert bei Eingabe und Klick synchron nach. In Läufen mit 8-fach gedrosselter CPU ging keine Eingabe verloren und kein Formular wurde nativ abgeschickt, und die Formulare haben weder `method` noch `name`.
- **Teilaussage „`emailVerified` weiter aus dem Cache“ (zu m12)** – E-046 umfasst nur Name, 2FA und Rolle, und ein veralteter Wert kann nur verweigern, nie Rechte geben.
- **Teilaussage „Startseiten-Block ‚Heute erledigt‘ verstößt gegen Kapitel 13“ (zu m31)** – Kapitel 13 verlangt den nächsten Schritt je Seite, und `/start` hat ihn im Kopf und in der Checkliste. Ungenau ist nur der Bericht (m39).

## Was ich nicht prüfen konnte

- Den echten GitHub-Actions-Lauf auf `cc958b5` (prüft der Orchestrator).
- Einen Kaltstart von `pnpm dev` (laut Auftrag untersagt).
- `pnpm test:e2e` mit `next dev` habe ich nicht separat laufen lassen; dieselben 18 Tests liefen im Produktions-Build.
- Einen Datenbankausfall für m33 habe ich nicht nachgestellt, weil der Dev-Server laufen bleiben musste; der Codepfad ist eindeutig.

## /goal zur Nachbesserung

```text
/goal Bessere Phase 1 „Design-System und App-Schale“ der E-Mail-Plattform nach der Abnahme nach.

Lies zuerst: CLAUDE.md, docs/ENTSCHEIDUNGEN.md (E-037 bis E-047), docs/berichte/phase-01-abnahme.md, Kapitel 13 und 17 sowie Phase 1 in Kapitel 20 von docs/KONZEPT.md.

Ziel: Das Abnahmekriterium „das Absenderprofil speichert die Pflichtangaben“ ist für alle 14 Rechtsformen in DE, AT und CH erfüllt; die schweren Befunde M1–M5 sind behoben; die leichten Befunde m1–m39 sind behoben oder mit Begründung und Zielphase in docs/ENTSCHEIDUNGEN.md verschoben.

Pflicht:
1. M1: Angaben zur persönlich haftenden Gesellschafterin (Firma, Rechtsform, Sitz, Registergericht, Registernummer, Geschäftsführung, ggf. Aufsichtsratsvorsitz) als Spalten mit Migration; Pflicht bei gmbh_co_kg, bei kg/ohg über die Angabe „Vollhafter ist eine juristische Person“; Formular, beide Vorschauen und isSenderProfileComplete angleichen; Tests je Fall (Test zuerst).
2. M2: validateSenderProfile prüft und übernimmt nur Felder, die requiredSenderFields/optionalSenderFields für Rechtsform und Land anbieten; der Server leert alle übrigen Felder beim Speichern. Test: Wechsel GmbH → Einzelunternehmen mit ungültiger Registernummer speichert und leert Register, Geschäftsführung und Aufsichtsratsvorsitz; kein Fehler an unsichtbaren Feldern.
3. M3 und m5: Pflichtfelder hängen auch vom Land ab. Aufsichtsratsvorsitz nur, wo ein Aufsichtsrat besteht (Schalter bei eG; in CH kein Aufsichtsrat, Personenfeld „Verwaltungsrat“ bzw. „Verwaltung“); Bezeichnungen je Land in de.json, österreichischer Verein mit ZVR-Zahl und Vereinsbehörde. E-038 ergänzen.
4. m1–m4, m6: Zähler mit Rechtsform; Abmeldeseiten-Vorschau nutzt dieselbe Funktion wie die Formular-Vorschau (Sitz, Rollenbezeichnung, Aufsichtsratsvorsitz) mit E2E für eine AG; eigenes Feld für den Satzungssitz oder dokumentierte Entscheidung; „Andere Rechtsform“ bietet Register- und Vertretungsfelder optional an; ungespeicherte Eingaben überleben ein Neuladen der Abfrage.
5. M4: CommandDialog und DialogContent reichen onCloseAutoFocus durch und geben den Fokus an das vorher fokussierte Element zurück; E2E prüft Strg+K → Esc, Hilfe → Esc/X und Team-Menü → Dialog → Abbrechen.
6. M5, m18–m20: Feldrahmen, Zustände von Segmented und Switch, Hervorhebung in Menüs und Befehlspalette sowie der Fokusrahmen der Reiter erreichen mindestens 3:1 in hell und dunkel; ein Unit-Test rechnet die Token-Paare aus styles.css nach, weil axe und Lighthouse WCAG 1.4.11 nicht prüfen.
7. m7–m12: Betreiberbereich mit neutralem Titel und echtem 404 auch für Anonyme, admin.* nur auf den Admin-Seiten; Tests für platform_admin ohne 2FA und für anonyme Aufrufe; Mandantentest workspace.onboarding prüft mailbox/agent/campaign für B; Abgleich x-workspace-id gegen ep_ws mit Neuladen bei Abweichung; Seitenleisten-Abfrage mit LIMIT je Agent in SQL; Sitzung und Caller je Anfrage cachen und E-046 korrigieren.
8. m13–m17, m21–m26: CardHeader bricht auf dem Telefon um; Abstände als Tokens im 4-px-Raster (oder Abweichung begründet in docs/ENTSCHEIDUNGEN.md); SuggestOrWrite ohne verwaistes label, explain an der Chip-Gruppe; Onboarding-Fortschritt mit Namen und Status für Screenreader; Lighthouse-Test vergleicht finalDisplayedUrl mit dem Pfad; Sonner mit theme und deutschem containerAriaLabel aus de.json; keine festen Farben, theme-color folgt der Wahl; shrink-0 am Schließen-Knopf; Zähler auch eingeklappt; ICU-Plural; 2FA-Hinweis im Team auch mobil.
9. m27–m34: „Hilfe“ im Profilmenü öffnet den Hilfe-Dialog; eigene Texte fürs Verlassen; Team-Dialog setzt Fehler zurück, lädt nach Verlassen oder Selbst-Herabstufung neu; Fehlertexte bekommen appError.params; jede Platzhalterseite mit nächstem Schritt; Ladezustand für Onboarding und Einladung; Einladungsseite unterscheidet „ungültig“ von technischem Fehler; eigene Fehlerseite für (public) in Sie-Form.
10. m35–m39: Fristen in Texten als Parameter aus defaults.ts (Benachrichtigungen, Kennzahlen, 72 Stunden) mit richtigem Kennzahlen-Titel; Zeitzone aus dem Arbeitsbereich; ungenutzte Schlüssel entfernen; docs/berichte/phase-01.md korrigieren (E-037 bis E-047 und neue Einträge, Aussagen in Zeile 9, 15, 17 und 30).

Arbeitsweise und Abschluss wie in Phase 1: selbstständig, Muss-Regeln einhalten, Test zuerst bei den Pflichtangaben, Oberflächen im Browser prüfen (Desktop, 360 px, Dunkelmodus, Tastatur). pnpm lint, pnpm typecheck, pnpm test, pnpm test:e2e und pnpm test:e2e:prod grün. Bericht docs/berichte/phase-01.md um eine Nachbesserungstabelle ergänzen (jeder Befund mit Nachweis), kurze Zusammenfassung auf Deutsch, danach erneute unabhängige Abnahme.
```
