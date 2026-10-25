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
| Einstellungen (Profil, Team, Absenderprofil) | Profil: Name, Darstellung, Passwort ändern, 2FA. Team: Mitglieder mit Rolle ändern und entfernen (Bestätigungsdialog), Einladungen. Absender: Pflichtangaben je Rechtsform und Land (14 Rechtsformen, eigene Listen und Bezeichnungen für DE/AT/CH, Sitz, Rechtsformzusatz, Komplementär der GmbH & Co. KG), Vorschau der Signaturzeilen, Speichern nur vollständig (E-038, E-049, E-053); die übrigen sechs Bereiche als Platzhalter |
| Deutsche Texte in `messages/de.json` | alle Texte der neuen Seiten; Schlüssel sind typgeprüft (`global.d.ts`), Fristen in Texten kommen als Parameter aus `defaults.ts` |
| Leer-, Lade- und Fehlerzustände | `EmptyState`/`ErrorState`/`LoadingState` in `packages/ui`; `loading.tsx` (Skelett) für App, Onboarding, Anmeldung und Empfängerseiten, `error.tsx` und `not-found.tsx` innerhalb der Schale, eigene Fehlerseite der Empfängerseiten in Sie-Form; jede Platzhalterseite und jeder leere Block hat einen nächsten Schritt; Detailseiten zeigen „Nicht gefunden“ ohne zu verraten, ob es das Objekt anderswo gibt |
| Onboarding-Gerüst | `/willkommen` in eigener Schale: Arbeitsbereich → (2FA für Inhaber) → Postfach → Absender → Agent → erster Auftrag; Fortschritt aus den Daten (E-040) |

Zusätzlich: alle Routen aus Kapitel 13 inklusive Website, Betreiberbereich (E-041), öffentliche Seiten `/u/[token]` und `/c/[token]` (E-042), „Passwort vergessen“ (E-043), Vorlagengalerie und Einstieg in den Assistenten (E-045), Nachschlage-Dienst für Detailseiten (E-039), Seitenleisten-Daten (`shellService`).

## Abnahmekriterien mit Nachweis

| Kriterium | Ergebnis | Nachweis |
| --- | --- | --- |
| Alle Routen aus Kapitel 13 existieren (Platzhalter erlaubt) | erfüllt | `e2e/phase-1-shell.spec.ts` › „Alle Routen aus Kapitel 13 existieren, mit deutschen Texten und ohne Barrieren“: 33 App-Routen (inkl. aller Detailrouten mit echten Objekten und der neun Einstellungsbereiche) und 12 öffentliche Routen, je HTTP-Status < 400, sichtbare Überschrift, keine fehlenden Texte; „Detailseiten zeigen nur Objekte des eigenen Arbeitsbereichs“ (Reiter des Auftrags, „Nicht gefunden“ für fremde/unbekannte IDs); „Betreiberbereich nur für platform_admin“ |
| Lighthouse-Barrierefreiheit mindestens 95 | erfüllt | `e2e/phase-1-lighthouse.spec.ts`: 15 Seiten (Website, Anmeldung, App, Einstellungen, Onboarding), je Desktop und 360 px, angemeldet als Inhaber. Letzter Lauf (Produktions-Build): alle 30 Messungen 100; Werte in `test-results/lighthouse-accessibility.json`. Zusätzlich axe (WCAG 2.0–2.2 A/AA) auf jeder Route, im Dunkelmodus, in der Befehlspalette, eingeklappt und bei 360 px |
| Sauber ab 360 px | erfüllt | `e2e/phase-1-shell.spec.ts` › „Sauber ab 360 px: kein seitliches Scrollen, Navigation als Schublade“: alle 45 Routen bei 360 × 740 ohne horizontales Scrollen, Navigation als Schublade (öffnen, navigieren, schließen), axe bei 360 px |
| Das Absenderprofil speichert die Pflichtangaben | erfüllt | `e2e/phase-1-shell.spec.ts` › „Absenderprofil speichert die Pflichtangaben je Rechtsform“ (GmbH: fehlende Felder werden benannt, fehlender Rechtsformzusatz wird gemeldet, nach dem Ausfüllen gespeichert, nach dem Neuladen vorhanden, Kontrolle in der Datenbank inklusive Sitz, Anzeige auf der Abmeldeseite, Rechtsformen und Bezeichnungen der Schweiz); `packages/core/src/sender/legal-forms.test.ts` (33 Tests: Pflichtfelder je Rechtsform und Land, Komplementär und Aufsichtsrat der Gesellschafterin, 43 echte Schreibweisen des Rechtsformzusatzes, Hinweis statt Fehler, KG/OHG mit Kapitalgesellschaft, KGaA, Registerpaar, ZVR-Zahl, verworfene Altfelder, gespeicherte Profile, DE/AT/CH-Formate, Normalisierung, Pflichtangaben-Zeilen); `packages/core/src/services/sender-profile.int.test.ts` (8 Tests: Speichern, Ablehnen unvollständiger Profile, Rechte, Mandantentrennung, Audit ohne Werte, GmbH & Co. KG, Bearbeitungsrecht aus derselben Antwort) |

Weitere Nachweise: Mandantentests für jede neue tRPC-Prozedur (`senderProfile.get`, `senderProfile.update`, `workspace.onboarding`, `workspace.shell`, `lookup.get` in `apps/web/server/trpc/tenant-isolation.int.test.ts`, der Abdeckungstest erzwingt sie), Dienste `onboarding.int.test.ts`, `lookup.int.test.ts`, `shell.int.test.ts`, `scope.int.test.ts`; Komponenten `suggest-or-write.test.tsx`, `command.test.tsx`; E2E „Seitenleiste …“, „Befehlspalette mit Strg+K …“, „Dunkelmodus …“, „Team: Rolle ändern und Mitglied entfernen“, „Neuer Auftrag: Vorschlag wählen oder selbst schreiben“.

Prüfbefehle, letzter Lauf auf dem Code-Stand nach allen Nachbesserungen (`ea40f9a`, danach nur dieser Bericht): `pnpm lint` → Exit 0 (345 Dateien, keine Befunde), `TURBO_FORCE=true pnpm typecheck` → Exit 0 (10 Pakete ohne Cache, dazu Skripte und E2E), `pnpm test` → Exit 0 (39 Dateien, 238 Tests), `pnpm test:e2e` (`next dev`) → Exit 0 (19 Tests, 13,7 min), `pnpm test:e2e:prod` (Produktions-Build wie die CI) → Exit 0 (19 Tests, 7,8 min; Lighthouse alle 30 Messungen ≥ 95). Erster Lauf vor der Übernahme (`cc958b5`): 316 Dateien, 30 Testdateien mit 129 Tests, je 18 E2E-Tests.

## Nachbesserung nach der unabhängigen Abnahme

Die unabhängige Abnahme (`docs/berichte/phase-01-abnahme.md`; fünf Prüfer: Abnahmekriterien, Mandantentrennung, Texte und Startwerte, Oberfläche und Barrierefreiheit, Muss-Regeln; 70 Agenten mit Gegenprüfung; Stand `cc958b5`) urteilte **„abgenommen: nein“**: drei Kriterien erfüllt, das vierte („das Absenderprofil speichert die Pflichtangaben“) nicht (M1–M3), dazu zwei schwere Verstöße gegen WCAG 2.2 AA (M4, M5) und 39 leichte Befunde, kein Blocker. Alle Befunde sind behoben:

| Befund | Behebung | Nachweis |
| --- | --- | --- |
| GmbH & Co. KG ohne Angaben der Komplementär-GmbH (major) | Felder für Firma, Sitz, Registergericht und -nummer der Gesellschafterin, Spalte `general_partner` (E-049) | `legal-forms.test.ts`, `sender-profile.int.test.ts` |
| Ausgeblendete Felder einer früheren Rechtsform wurden gespeichert oder blockierten unsichtbar (major) | `validateSenderProfile` verwirft nicht angebotene Felder (E-049) | `legal-forms.test.ts` › „ignores fields the chosen legal form does not offer“ |
| Aufsichtsratsvorsitz auch für Schweizer AG/Genossenschaft und eG ohne Aufsichtsrat Pflicht (major) | Regeln je Land (E-053): Pflicht nur für die deutsche AG, sonst freiwillig oder entfällt; Verwaltungsrat/Verwaltung in der Schweiz | `legal-forms.test.ts` |
| Rechtsform und Sitz fehlten in den Pflichtangaben, Sitz = Ort der Anschrift | Rechtsformzusatz im Namen wird erkannt; fehlt er, zeigt das Formular einen Hinweis und die Pflichtangaben nennen die Rechtsform in einer eigenen Zeile; eigenes Feld „Sitz“ (Migration `0006`, keine Übernahme aus der Anschrift) (E-053) | `legal-forms.test.ts`, E2E „Absenderprofil …“ (Hinweis und Zeile „Rechtsform: …“ ohne Zusatz, Sitz „Grünwald“ in Vorschau, Datenbank und Abmeldeseite) |
| „Andere Rechtsform“ ohne Register; Österreich/Schweiz nur teilweise angepasst | Register, Sitz, Vertretung freiwillig für „Andere“; Rechtsformen und Bezeichnungen je Land, Vereinsregister und ZVR-Zahl (E-053) | `legal-forms.test.ts`, E2E (Schweiz: keine UG, „Handelsregisteramt“) |
| Leerzustände ohne nächsten Schritt (major) | Jede Platzhalterseite und jeder leere Block der Startseite hat einen Knopf zum nächsten Schritt | E2E „Alle Routen …“ |
| Fokus landete nach Esc auf `<body>` (major) | `useFocusReturn` für Befehlspalette, Dialoge und Schublade: aus Menüs zurück zum Auslöser, Dialoge mit Auslöser behalten das Verhalten von Radix (auch in Safari, wo ein Klick den Knopf nicht fokussiert), aus der Schublade zurück zum Menü-Knopf; nach dem Entfernen eines Mitglieds in die Liste; beim Wechsel zwischen App und Betreiberbereich an den Inhaltsanfang (E-051, E-048) | `command.test.tsx`, `dialog.test.tsx`, E2E „Befehlspalette …“ (Strg+K → Esc, Hilfe → Esc und Schließen), „Team …“ (Abbrechen, Entfernen) |
| Feldränder 1,7:1 statt 3:1 (major); Schalter, Segmentschalter und Menü-Hervorhebung zu schwach | Token `--ep-border-control`, Akzent-Strich in Menüs und Palette (E-051) | `contrast.test.ts` rechnet 66 Token-Paare hell und dunkel nach (Text ≥ 4,5:1, Bedienelemente, Fokus und Hervorhebung ≥ 3:1); E2E „Dunkelmodus …“ misst den Feldrand im Browser |
| Betreiberbereich erkennbar (Titel, HTTP 200, Login-Weiterleitung, Texte im Browser) | Eigene Routengruppe mit echtem 404; ohne Sitzung schreibt der Proxy auf eine unbekannte Route um (auch der Routenbaum verrät nichts); Texte nur für Admins, die globale Fehlerseite bekommt nur ihre drei Texte (E-048) | E2E „Betreiberbereich nur für platform_admin“ (anonym: Status, Titel, Payload; Skripte von `/login` und `/u/…` ohne Texte des Bereichs; Mitglied), „… verlangt die Zwei-Faktor-Anmeldung“; `global-error-texts.test.ts` |
| Mandantentest für `workspace.onboarding` prüfte nichts | Arbeitsbereich A mit Objekten, B ohne – B sieht keinen erledigten Schritt | `tenant-isolation.int.test.ts`, `onboarding.int.test.ts` |
| Seite und Formular konnten verschiedene Arbeitsbereiche verwenden | Rechte aus derselben Antwort wie die Daten (E-052); Team nimmt die eigene Rolle aus der Mitgliederliste | `sender-profile.int.test.ts` › „tells the form whether …“ |
| Formular verlor Eingaben bei jedem Neuladen der Abfrage | Editor wird nur nach eigenem Speichern neu aufgebaut | Code `sender-profile-form.tsx` |
| Formulare sendeten vor der Hydration nativ per GET | `method="post"` überall, Absendeknöpfe bis zur Hydration gesperrt (E-054) | `forms.test.ts`, `button.test.tsx` |
| Vier Sitzungsabfragen je Seitenaufruf, `emailVerified` aus dem Cache | `currentSession` je Anfrage gemerkt, Server-Caller übernehmen die Sitzung (E-046 ergänzt) | Code `server/session.ts`, `server/caller.ts` |
| Seitenleisten-Abfrage ohne Grenze | `row_number` ≤ 3 in SQL | `shell.int.test.ts` |
| Startwerte fest in Texten und Code (Viertelstunde, 100 Empfänger, 3 MB, Kennzahl-Fristen, Zeitzone, Zielmindestlänge, Namenslänge, Ansprache) | Alles als Parameter aus `defaults.ts` (`metrics`, `campaign.goalMinLength`, `workspace.nameMinLength/MaxLength`, `defaultFormality`) | Code, `de.json` |
| Texte: fehlende Plurale, Fehlertexte ohne Werte, englisches Label der Hinweise, feste Tastennamen, „Hilfe“ öffnete die Palette, falscher Text beim Verlassen, Fachbegriffe, ungenutzte Schlüssel | ICU-Plurale, `useErrorMessage` füllt Parameter, Texte aus `de.json`, Hilfe-Dialog, eigener Verlassen-Dialog, Erklärung statt Fachwort, Schlüssel entfernt | E2E „Team …“, „Alle Routen …“ |
| Ganzer Textkatalog an jeden Besucher | Nur die Namensräume der Client-Komponenten (`clientNamespaces`) | Code `i18n/client-messages.ts` |
| Kein Ladezustand außerhalb der Schale; Einladung: jeder Fehler „gibt es nicht“; Empfängerseiten mit App-Fehlerseite | `loading.tsx` für Onboarding, Anmeldung und öffentliche Seiten; Einladung unterscheidet unbekannt/abgelaufen mit Überschrift und Ausweg; eigene Fehlerseite in Sie-Form | E2E „Alle Routen …“ |
| Oberfläche: Karte bei 360 px, Abstände außerhalb des 4-px-Rasters, `SuggestOrWrite` ohne Feld, Onboarding-Fortschritt auf dem Handy, Fokusrahmen der Reiter, Pfeil im Select und `theme-color`, Hinweise ohne Dunkelmodus, Schließen-Knopf gestaucht, „2FA fehlt“ auf dem Handy, Posteingangs-Zähler eingeklappt | Kopf der Karte untereinander, Token `--spacing` (E-050), Gruppe mit Beschriftung und Erklärung, Schrittnamen für Screenreader, Rahmen nach innen, Symbol in Token-Farbe und Farbe aus `--ep-bg` (Test), sonner mit Darstellung, `shrink-0`, Symbol mit Beschriftung, Punkt mit Beschriftung | `suggest-or-write.test.tsx`, `theme-colors.test.ts`, E2E „Sauber ab 360 px …“, „Seitenleiste …“ |
| Lighthouse prüfte nicht, welche Seite gemessen wurde; Bericht nannte E-037 bis E-046 | Test vergleicht die gemessene URL; Spanne korrigiert | `phase-1-lighthouse.spec.ts` |

## Nachbesserung nach der Nachabnahme

Die Nachabnahme (`docs/berichte/phase-01-nachabnahme.md`, Stand `04e4414`) urteilte „ja mit Auflagen“; parallel prüften fünf Agenten den Diff aus je einem Blickwinkel (Rechtsformen, Oberfläche, Server und Sicherheit, Texte, Tests). Behoben:

| Befund | Behebung | Nachweis |
| --- | --- | --- |
| N1 (major): harte Prüfung des Rechtsformzusatzes lehnte echte Registernamen ab und entwertete gespeicherte Profile | Zusatz nur noch als Hinweis mit eigener Zeile „Rechtsform: …“; Muster für PartGmbB/PartmbB/Part mbB, „u.“/„+“/„Cie.“ & Co. KG, gUG, e.G., e. Gen., m.b.H./GesmbH, S.A., S.à r.l., Sagl, cooperativa, Kollektiv- und Kommanditgesellschaft; Vollständigkeit nur nach Pflichtfeldern; Links werden nach der Normalisierung gemessen (E-053) | `legal-forms.test.ts` (43 echte Schreibweisen, Hinweis statt Fehler, gespeicherte Profile bleiben vollständig, normalisierter Link speichert erneut) |
| KG/OHG mit haftender Kapitalgesellschaft ohne Angaben der Gesellschafterin | Fehler „wähle GmbH & Co. KG oder ähnliche“, Bezeichnung der Rechtsform erweitert (UG, AG, SE & Co. KG) | `legal-forms.test.ts` |
| Aufsichtsrat der Gesellschafterin und bei „Andere“ (SE, KGaA) nicht erfassbar | freiwilliges Feld, eigene Zeile in den Pflichtangaben | `legal-forms.test.ts`, `sender-profile.int.test.ts` |
| Freiwilliges Register halb ausgefüllt verschwand; österreichischer Verein ohne Bezeichnung der ZVR-Zahl | Register ganz oder gar nicht; „ZVR-Zahl: …“, Vereinsbehörde freiwillig | `legal-forms.test.ts` |
| Sitz aus der Anschrift vorbelegt; § 125a HGB seit dem MoPeG aufgehoben; Texte nur deutsch | keine Vorbelegung; § 125 HGB; Registerhinweis und Felder der Gesellschafterin je Land, e.U.-Bezeichnung korrigiert | Migration `0006`, `de.json` |
| N2: Fehlertexte abweichend von Anhang D, Ersatzwerte verdeckten fehlende Angaben | Wortlaut von Anhang D mit `{anzahl}`, Pflichtwerte als Typ `ErrorParams`, keine Ersatzwerte (E-055) | `error-messages.test.ts` |
| N3: E-048 beschrieb 404 für Admins ohne 2FA | E-048 korrigiert (Weiterleitung zur 2FA-Einrichtung) | `docs/ENTSCHEIDUNGEN.md` |
| N4: Bericht mit alten Zahlen, nicht committet | Zahlen aus dem letzten Lauf unter „Prüfbefehle“ (oben), Bericht und STAND im Commit | – |
| Ganzer Textkatalog über `global-error.tsx` an jeden Besucher (major, Prüfung Server) | eigene kleine Textdatei, Test hält sie gleich mit `de.json` | `global-error-texts.test.ts`, E2E prüft die Skripte anonymer Seiten |
| Fokus in Safari, aus der Schublade, nach dem Entfernen, beim Wechsel in den Betreiberbereich (Prüfung Oberfläche) | siehe Fokus-Zeile oben; Hinweise (sonner) im Wurzellayout | `dialog.test.tsx` (Safari, Herkunft entfernt), E2E „Team …“ (Abbrechen, Entfernen); Wechsel der Routengruppe: Code `app-shell.tsx`, ohne eigenen Test |
| Reste: `/admin` im Code anonymer Seiten; Arbeitsbereich-Wechsel in einem anderen Tab; Zeitzone fest | Logo als eigenes Modul (Website und Anmeldung laden die Schale nicht mehr); andere Tabs melden den Wechsel und bieten „Neu laden“ an, der eigene Tab nicht; Datumsangaben auf Seiten des Arbeitsbereichs und in der Einladungsmail in dessen Zeitzone (E-056) | E2E „Betreiberbereich …“ (Skripte anonymer Seiten), `workspace-provider.test.tsx` (anderer und eigener Tab), `app-paths.test.ts`, `invitations.int.test.ts` |

## Abschließende unabhängige Prüfung

Eine letzte Prüfung (38 Agenten, Stand `d2faa06`) ordnete alle früheren Befunde – erste Abnahme M1–M5 und m1–m39, Nachabnahme N1–N4 und Reste, die Prüfung aus fünf Blickwinkeln – dem Code zu: 82 behoben, 7 teilweise, 1 offen (die Zahlen in diesem Bericht), dazu neue leichte Befunde und eine adversariale Suche nach Regressionen; jeder offene Punkt wurde einzeln gegengeprüft (28 bestätigt, 5 widerlegt). Behoben:

| Befund | Behebung | Nachweis |
| --- | --- | --- |
| KG/OHG mit österreichisch, ausgeschrieben oder ausländisch bezeichneter Gesellschafterin („Ges.m.b.H. & Co KG“, „Aktiengesellschaft & Co. KG“, „S.à r.l. & Co. KG“); „… GmbH & Co. KG“ unter GmbH, AG, „Andere“ gespeichert; KGaA als KG | ein gemeinsames Muster für Kapitalgesellschaften (auch im Hinweis zur Gesellschafterin); jede andere Rechtsform mit „… & Co. KG/OHG“-Firma muss „GmbH & Co. KG oder ähnliche“ wählen, eine KGaA „Andere Rechtsform“; neutrale Zeile „Rechtsform: Personengesellschaft mit einer Kapitalgesellschaft …“ | `legal-forms.test.ts` |
| Beispiel „HRB“ auch für HRA-Formen, eG und PartG | Beispiele je Rechtsform (HRA, GnR, PR), für die Gesellschafterin HRB | `de.json`, Formular |
| Links vor der Normalisierung gemessen | Länge nach der Normalisierung | `legal-forms.test.ts` |
| Fokus: nach dem Speichern des Absenderprofils, Knöpfe beim Laden gesperrt, nach eigener Herabstufung, Gruppenwechsel nur über den Pfad erkannt | Fokus auf „Speichern“, Knöpfe beim Laden mit `aria-disabled` (bleiben fokussierbar, Klick und Absenden werden ignoriert), Fokus in die Mitgliederliste, Neuaufbau der Schale über die Komponenteninstanz erkannt | `button.test.tsx`, Code |
| Fehlgeschlagenes Neuladen im Hintergrund ersetzte das Formular | Formular bleibt, Hinweis darüber | Code `sender-profile-form.tsx` |
| „ohne Zwei-Faktor“ auf dem Handy nur als Symbol | Text immer sichtbar | E2E „Sauber ab 360 px …“ |
| Hinweis „anderer Tab“ im eigenen Tab | Tab-Kennung in der Nachricht | `workspace-provider.test.tsx` |
| Einladungsmail mit Datum in fester Zeitzone; Zeitzone kostete jede Seite eine Datenbankabfrage | Zeitzone des Arbeitsbereichs in der Mail; Nachschlagen nur auf Seiten des Arbeitsbereichs, bei Fehler Standard (E-056) | `invitations.int.test.ts`, `app-paths.test.ts` |
| `/admin` per Prefetch-Anfrage nicht umgeschrieben; Umschreibung an Antwort-Headern erkennbar | eigener Matcher für `/admin`; Header-Entfernung als Deployment-Punkt dokumentiert (E-048) | E2E „Betreiberbereich …“ (mit Prefetch-Headern) |
| Grenzen der Seitenleiste fest im Code | `defaults.shell.sidebarAgents`, `sidebarConversations` | `shell.int.test.ts` |
| Onboarding-Layout blockierte „Neuer Arbeitsbereich“ ohne 2FA | 2FA vor jedem weiteren Schritt, Seite und Layout gleich (E-057) | Code |

## Offene Punkte

- **Inhalte der Platzhalterseiten** folgen mit den Fachphasen (Kontakte Phase 2, Postfächer Phase 3, Nachrichten/Einzelmail Phase 4, Aufträge Phase 5, Posteingang Phase 6, Agenten und Chat Phase 7, Betreiberbereich Phase 11).
- **`/u/[token]` und `/c/[token]`** zieht Phase 4 in den Edge-Dienst um (E-042).
- **Rechtstexte** (Impressum, Datenschutz, AGB, AVV) – offen, braucht: Betreiberangaben und die Prüfung durch eine Kanzlei (Kapitel 17 und 23).
- **Sprachnachricht** im Chat ist als Knopf vorbereitet; Aufnahme und Transkription kommen mit Phase 7.
- Der Lighthouse-Test dauert rund 7 Minuten (30 Messungen); bei Bedarf lässt er sich in der CI auf einen nächtlichen Lauf verlegen.
- **Reverse Proxy der Produktion** entfernt die Antwort-Header `x-middleware-rewrite` und `x-nextjs-rewritten-path` (E-048) – mit dem Deployment.
- **E2E nur in Chromium**: Das Fokusverhalten von Safari (kein Fokus auf geklickten Knöpfen) ist per Komponententest abgedeckt (`dialog.test.tsx`), nicht im echten Browser.

## Abweichungen

Alle Abweichungen und Ergänzungen stehen mit Begründung in `docs/ENTSCHEIDUNGEN.md` (E-037 bis E-057; E-046, E-047, E-048, E-053 und E-056 nach den Abnahmen ergänzt).
