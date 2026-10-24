# Nachabnahme Phase 0 – Fundament

Stand: 24.10.2026, 20:10 UTC · Branch `claude/amazing-carson-fippeq` · geprüfter Commit `04f8348` (Code-Stand `a817bc8`), Arbeitsbaum sauber
Grundlage: `CLAUDE.md`, `docs/KONZEPT.md` Kapitel 16, 18 und Phase 0 in Kapitel 20, `docs/ENTSCHEIDUNGEN.md` (E-001 bis E-033), `docs/berichte/phase-00.md` (Abschnitt „Nachbesserung nach der unabhängigen Abnahme“), `docs/berichte/phase-00-abnahme.md`.
Vorgehen: Jeden Befund im Code nachgelesen und mit eigenen Läufen, `curl`, Datenbankabfragen und kleinen Proben nachgeprüft. Am Code habe ich nichts geändert, den laufenden `pnpm dev` habe ich weder gestartet noch gestoppt. Phase 1 (Design-System, App-Schale, Seitenleiste, Dunkelmodus) habe ich nicht erwartet und nicht bewertet.

## Abgenommen: ja

Begründung: Alle vier Abnahmekriterien sind erfüllt. Ich habe sie selbst nachgeprüft, und die CI auf `04f8348` ist grün. Die Blocker B1 und B2 und die schweren Befunde M1 und M2 sind behoben. Offen bleiben nur leichte Punkte: m1, m2 und m4 sind nur teilweise behoben, dazu kommen sieben neue leichte Befunde (N1–N7). Keiner davon ist ein Blocker oder ein schwerer Verstoß gegen eine Muss-Regel. **Auflage:** N1 (unzuverlässiger E2E-Test) und die Reste N2–N4 vor dem Abschluss von Phase 1 beheben, weil sonst `pnpm test:e2e` zufällig rot wird.

## Eigene Prüfläufe

| Befehl | Exit-Code | Ergebnis |
| --- | --- | --- |
| `pnpm lint` | 0 | 201 Dateien, keine Fehler, **keine Warnungen** mehr (vorher 10) |
| `pnpm typecheck` | 0 | 10/10 Pakete (9 aus dem Cache) plus Wurzel-`tsc` |
| `pnpm exec turbo run typecheck --force && pnpm exec tsc -p tsconfig.json` | 0 | ohne Cache: 10/10 Pakete, Wurzel grün |
| `pnpm test` | 0 | 21 Testdateien, 83 Tests grün (Test-Stack `emailplattform-test`) |
| `pnpm test:e2e` (lokal, `next dev`) | 0 | 7 passed (55,1 s) |
| `pnpm test:e2e:prod` (Produktions-Build wie die CI) | 0 | `next build` gelingt, **alle Routen „ƒ (Dynamic)“**, 7 passed (32,7 s) |
| `CI=true pnpm test:e2e` (genau der CI-Pfad, mit `retries: 1`) | 0 | 6 passed, **1 flaky**: „Magic Link umgeht die Zwei-Faktor-Anmeldung nicht“ scheitert im ersten Versuch mit `page.goto: net::ERR_ABORTED at …/einstellungen/profil` und ist erst im Wiederholungslauf grün (→ N1) |
| `pnpm test:e2e:prod` (zweiter Lauf, danach Abfrage `audit_logs`) | 0 | 7 passed; Audit-Aktionen: `auth.sign_in` 4, `auth.sign_in_magic_link` 1, `auth.sign_in_two_factor` 1, `auth.two_factor_enabled` 2, `workspace.created` 2, `invitation.created` 1, `invitation.accepted` 1 |
| `pnpm test:e2e:prod --grep "Magic Link umgeht" --repeat-each 10` | 1 | **2 failed, 8 passed**, beide Male `ERR_ABORTED` beim `page.goto("/einstellungen/profil")` (→ N1) |
| `pnpm test:e2e:prod --grep CSP --repeat-each 4`, dabei `curl -D - http://127.0.0.1:4400/login` und `/registrieren` | 0 | 4 passed; Kopfzeile `script-src 'self' 'nonce-NDc3…' 'strict-dynamic'; style-src 'self' 'unsafe-inline'`, im HTML 18 `<script>`-Tags und 20 `nonce=`-Attribute, alle mit demselben Nonce wie in der Kopfzeile (vorher 0) |
| Danach `psql` auf `emailplattform_e2e` (nur der CSP-Lauf) | – | 4 Nutzer, 4 Sitzungen (automatische Anmeldung nach der E-Mail-Bestätigung), **0 Audit-Einträge** (→ N4) |
| `pnpm audit --prod --audit-level high` | 0 | 1 Lücke, Schweregrad moderate, also unter der Schwelle |
| `drizzle-kit generate` gegen eine Kopie von `packages/db/drizzle` (Scratch-Verzeichnis) | 0 | „No schema changes, nothing to migrate“ (inkl. `0002_review_fixes`, `0003_db_roles`) |
| `curl` auf `http://127.0.0.1:4300/api/health`, `:4301/health`, `:4302/health` (19:57 und 20:09 UTC) | – | jeweils HTTP 200, `{"status":"ok","checks":{"database":"ok","valkey":"ok"}}`, Worker zusätzlich `maintenance running` |
| `/proc/<pid>/environ` der laufenden Dev-Prozesse (gestartet 19:52 aus `scripts/dev.ts`, Stand 19:42) | – | `next-server` (PID 19591) und alle `next dev`-Prozesse (19530, 19531, 19554): **kein `MASTER_KEY`, kein `SEALED_BOX_SECRET_KEY`** (0 Treffer), `BETTER_AUTH_SECRET` vorhanden. Edge (19529): keiner der drei Schlüssel. Worker (19540): `MASTER_KEY` und `SEALED_BOX_SECRET_KEY`, kein `BETTER_AUTH_SECRET` |
| Rollen in der Dev- und E2E-Datenbank | – | `ep_app` und `ep_system` vorhanden (NOLOGIN, nicht Superuser), Mitglied: Login-Rolle `emailplattform`; Dev: 4 Migrationen angewendet |
| GitHub Actions, Lauf `40127525310` auf `04f8348` | success | Job `check` (lint, typecheck, 83 Tests, `pnpm audit` blockierend) und Job `e2e` (Produktions-Build, 7 passed, ohne Wiederholung) grün |
| Probe `scratchpad/nach/sandbox-probe.ts` (`loadEnv` + `checkSendAllowed`, `APP_ENV=development`) | – | `SANDBOX_MAIL_ENDPOINTS=smtp.gmail.com:587`, `127.0.0.1:25` und `mail.gmx.net:465` werden akzeptiert, eine Mail an `echte.person@gmail.com` gilt im Sandbox-Modus als erlaubt (→ N2) |
| `curl 'http://127.0.0.1:4300/login?next=%2Feinladung%2FNACHABNAHMEtoken…'` und `/registrieren?next=…` | 200 | Beide Zeilen stehen samt Token im Anfrage-Protokoll des Dev-Servers; `/einladung/<token>` direkt wird korrekt ausgelassen (→ N3) |

## Befunde der ersten Abnahme

| Befund | behoben | Eigener Nachweis |
| --- | --- | --- |
| **B1** `next build` scheitert (`NODE_ENV=development`) | **ja** | `scripts/e2e.ts` setzt kein `NODE_ENV` mehr. `pnpm test:e2e:prod` und `CI=true pnpm test:e2e` bauen fehlerfrei (Exit 0), die CI auch. Das neue Skript `test:e2e:prod` (`package.json:30`) erlaubt die Prüfung des Produktions-Builds vor dem Phasenabschluss. |
| **B2** Nonce-CSP blockiert JS auf statischen Seiten | **ja** | `apps/web/app/layout.tsx:32` (`await headers()`) rendert alle Seiten dynamisch (Build-Ausgabe: nur „ƒ“). `curl` zeigt dasselbe Nonce in Kopfzeile und Skript-Tags. E2E `e2e/phase-0-auth.spec.ts:148` (Konsole und `pageerror`) ist im Produktions-Build viermal hintereinander grün, und alle Oberflächen-Tests laufen im Produktions-Build durch. Die Lockerung `style-src 'unsafe-inline'` steht begründet in E-026. |
| **M1** DB-Zugriffe außerhalb von `withWorkspace`/`systemContext`, lückenhafter Wächter, keine eigene DB-Rolle | **ja** (Rest: N5) | Löschjob in `packages/core/src/system/retention.ts` über `withSystem`, `apps/worker/src/queues/maintenance.ts` steht auf der Positivliste. Auth-Abfragen liegen in `packages/core/src/system/accounts.ts`. `getMembershipRole` (`workspaces.ts:113`) läuft über `withUser`, das als begründete Ausnahme in E-027 steht. `accounts.ts` aus `services/` ist entfernt. Der Wächter `system-imports.test.ts` durchsucht jetzt `packages`, `apps`, `scripts` und `e2e`, erkennt `@ep/core/system/*`, relative `…/system/*`-Pfade und `import()`, und ein zweiter Test findet rohe `deps.db`/`createDatabase`-Zugriffe. Meine eigene Suche nach `\bdb\b` findet außerhalb der erlaubten Module nichts. Die Rollen `ep_app`/`ep_system` sind in `0003_db_roles.sql` angelegt, `withSystem` wechselt in `ep_system` (`system/index.ts:24`), `withWorkspace` in `ep_app` (`scope.ts:48`). Abweichung: `withUser` wechselt entgegen E-028 nicht in `ep_app` (N5). |
| **M2** Web-Prozess erhält `MASTER_KEY` und `SEALED_BOX_SECRET_KEY` | **ja** (Rest: N6) | `/proc/<pid>/environ` (siehe oben) ist sauber. `scripts/dev.ts` und `scripts/run-app.ts` (Playwright-Webserver) geben jeder App `envForApp(app, …)`. `loadEnv(…, "web"/"edge"/"worker")` verweigert verbotene Geheimnisse (`packages/config/src/env.ts:178-187`), getestet in `env.test.ts:63-95`. Weil `/api/health` über `runtime()` → `webEnv()` läuft, würde der E2E-Start ohne Filter scheitern. Einschränkung: Es ist eine Sperrliste, keine Positivliste je App (N6). |
| **m1** Sandbox nur über den Hostnamen | **teilweise** | Behoben: Die Prüfung läuft gegen exakte `host:port`-Paare (`send-guard.ts:61-66`). Der Transport wird aus geprüften Einzelwerten gebaut, Query-Parameter in der SMTP-URL sind verboten (`system-mailer.ts:33-46`), Empfänger werden wie von Nodemailer zerlegt. Ein beliebiger Dienst auf `127.0.0.1:25` gilt nicht mehr als Sandbox, solange er nicht in der Liste steht. Offen: `checkSendModeSafety` prüft nur das Format, nicht ob die Einträge GreenMail/Mailpit sind. Ein echter Host in `SANDBOX_MAIL_ENDPOINTS` gilt weiter als „Sandbox“ – genau der zweite Teil des ursprünglichen Befunds (N2). |
| **m2** Tokens und Adressen im Anfrage-Protokoll | **teilweise** | `apps/web/next.config.ts:38-40` blendet `/api/auth/`, `/einladung/` und `token=` aus. Mein lokaler E2E-Lauf enthält keine Tokens mehr. Offen: Das Einladungstoken landet über den Parameter `next` von `/login` und `/registrieren` weiter im Protokoll (N3). |
| **m3** Deutscher Text im Edge-Dienst | **ja** | `apps/edge/src/app.ts:28`: `c.body(null, 404)`. Die Suche nach Umlauten und deutschen Wörtern in `apps/edge`, `apps/worker`, `packages/core`, `packages/mail` und `packages/ui` findet nur Kommentare, die Slug-Ersetzungstabelle und Tests. |
| **m4** Anmeldungen/2FA nicht auditiert | **teilweise** | Der After-Hook (`apps/web/server/auth.ts:182-210`) schreibt Anmeldung, Magic Link, Anmeldung mit 2FA, 2FA aktiviert/deaktiviert und Passwortwechsel über `systemContext`. In der E2E-Datenbank sind die Einträge nachweisbar, und der Haupttest prüft sie. Offen: Die automatische Anmeldung nach der Bestätigungsmail (und künftig per Passkey) erzeugt Sitzungen ohne Audit-Eintrag (N4). |
| **m5** E2E-Test hielt nicht, was sein Name sagt | **ja** | `e2e/phase-0-auth.spec.ts:104-139` prüft eine unbekannte Adresse, ein falsches Passwort für ein bestätigtes Konto („Invalid password“ im Server-Log) und eine unbestätigte Adresse („Bitte bestätige zuerst …“). |
| **m6** `pnpm audit` ohne Wirkung | **ja** | `.github/workflows/ci.yml:36` ohne `continue-on-error`. Lokal und in der CI Exit 0 (1× moderate, unter `high`). |
| **m7** Letzter Inhaber nicht nebenläufigkeitssicher | **ja** | `members.ts:59-69` sperrt alle Inhaber-Zeilen in fester Reihenfolge (`FOR UPDATE`), bevor gezählt wird. Unter READ COMMITTED sieht die zweite Transaktion den Stand nach der ersten. `members.int.test.ts` „last owner protection under concurrency“ (Entfernen und Herabstufen gleichzeitig) ist grün. |

## Nachbesserungstabelle aus `phase-00.md` – zusätzliche Zeilen

| Zeile | bestätigt | Eigener Nachweis |
| --- | --- | --- |
| B1, B2, M1, M2, m1–m7 | siehe oben | – |
| Offene Weiterleitung über `next` | ja | `apps/web/lib/safe-next.ts` lehnt `//`, Backslash, Steuerzeichen und fremde Herkunft ab. Alle drei Formulare (`auth-forms.tsx:37/142/196`) nutzen `safeNext`, Test `safe-next.test.ts` ist grün. |
| Admins und Inhaber-Einladungen; 50 Einladungen je Tag | ja | `invitations.ts:39` und `:76-78` (Ersetzen) sowie `:179` (Zurückziehen) prüfen `canManageRole`, `:55-61` begrenzt über `defaults.invitation.maxPerWorkspacePerDay` (E-030). Tests „invitation protections“ sind grün. Anzeigenamen bereinigt `sanitizeDisplayName` (`email-texts.ts:15`, Länge aus `defaults.auth.nameMaxLength`). |
| Fehlercodes ohne Text | ja | Skriptprüfung: alle 30 Codes aus `errors.ts` haben `errors.<CODE>` in `de.json`, alle Schlüssel aus `authErrorKey` (inkl. HTTP 429) existieren. |
| Abgelaufene Links ohne Hinweis | ja | E2E „Abgelaufene oder ungültige Anmeldelinks zeigen einen Hinweis“ ist grün (dev und prod). |
| Englische 404-/Fehlerseiten | ja | `not-found.tsx`, `error.tsx`, `global-error.tsx` holen ihre Texte aus `de.json`. Der E2E-CSP-Test sieht „Seite nicht gefunden“. |
| Lade-/Fehlerzustand offener Einladungen | ja | `team-settings.tsx:141-148` und `:172-176` (Ladezustand je Zeile beim Zurückziehen) |
| `<button>` in `<a>` | ja | `apps/web/app/page.tsx:18-21` nutzt `buttonClasses()` an `Link` |
| Mindestlänge und Produktname fest im Code | ja | `auth-forms.tsx:276` (`minPasswordLength` aus `defaults`), `auth.ts:55` (`appTranslator("name")`) |
| Fristen/Limits fest im Code | ja, mit kleiner Ausnahme | `auth.ts` nimmt alle Werte aus `defaults.auth.*`, `trpc/init.ts:98` `freshLoginMinutes`, Warteschlangen aus `defaults.queues`. Gefunden habe ich noch die Cookie-Laufzeit von 365 Tagen (N7). |
| `PASSWORD_BREACH_CHECK=off` außerhalb Entwicklung | ja | `env.ts:195-201`; `.env.example:27` steht auf `on`, `AUTH_RATE_LIMIT=off` nur mit `APP_ENV=test` (`env.ts:202-206`) |
| Nicht deklarierte Umgebungsvariablen | ja | `pnpm lint` ohne Warnung, `toolingEnvSchema` (`env.ts:217`), `turbo.json` `globalPassThroughEnv` |
| Datenmodell (FKs, Enum, NULLS NOT DISTINCT, `priority`, `bigint`) | ja | `0002_review_fixes.sql` enthält alle genannten Änderungen, kein Schema-Drift. E-031 und E-033 sind eingetragen. |

## Abnahmekriterien aus Kapitel 20

| Kriterium | Ergebnis | Eigener Nachweis |
| --- | --- | --- |
| `pnpm dev` startet alles mit einem Befehl | erfüllt | `scripts/dev.ts`: `.env` erzeugen, Sandbox erzwingen, Compose `emailplattform-dev` (nur 127.0.0.1), migrieren, seeden, Ports prüfen, dann Web, Edge und Worker mit gefilterter Umgebung starten; endet eine App, werden alle gestoppt. Die laufende Instanz (gestartet 19:52 aus dem aktuellen Skript) antwortet auf allen drei Health-Endpunkten mit 200, die Dev-Datenbank hat alle 4 Migrationen und beide Rollen. Ein Kaltstart war mir laut Auftrag untersagt. |
| Registrieren, Anmelden, 2FA, Arbeitsbereich, Mitglied einladen als E2E-Test | erfüllt | `e2e/phase-0-auth.spec.ts:19` (Bestätigungs- und Einladungsmail aus Mailpit, TOTP, Anmeldung mit Code, Audit-Einträge, Einladung annehmen, Mitglied in der Liste) ist in jedem meiner sechs vollständigen Läufe grün, in `next dev`, im Produktions-Build und in der CI. |
| CI ist grün | erfüllt | Lauf `40127525310` auf `04f8348`: `check` und `e2e` grün, E2E ohne Wiederholung 7/7. Lokal ist der CI-Pfad grün (Exit 0), stützt sich aber in einem Lauf auf die Wiederholung (N1). |
| Gerüst für Mandantentests steht | erfüllt | `apps/web/server/trpc/tenant-isolation.int.test.ts` (17 Tests, je Prozedur ein Angriff von B auf A, Vollständigkeitsprüfung gegen `appRouter._def.procedures`), `transition.int.test.ts`, dazu die zwei Wächter in `system-imports.test.ts`. Alle grün. |

## Muss-Regeln – gezielte Suche

- **Mandantentrennung:** Kein roher Datenbankzugriff außerhalb von `scope.ts`, `system/`, `health.ts`, `runtime.ts`, `packages/db`, `packages/testing` und `apps/web/server/auth.ts` (Better Auth, E-005). `systemContext` importieren nur `system/`, `services/invitations.ts` (E-014), `server/auth.ts`, `queues/maintenance.ts` und `scripts/ops.ts`. Alle Dienstabfragen filtern nach `scope.workspaceId`, `/api/workspace/select` prüft die Mitgliedschaft. Jeder Admin-Eingriff (`setTrustLevel`) schreibt ein Audit. Abweichung zur Dokumentation: N5.
- **Versand-Schutzschalter:** `MAIL_SEND_MODE` ist standardmäßig `sandbox`, `live` gibt es nur mit `APP_ENV=production`, Entwicklung und Test erzwingen `sandbox`, und `scripts/dev.ts` verweigert alles andere. Der einzige Mailweg ist `createSystemMailer` mit `assertSendAllowed`. Ich habe weder einen anderen `createTransport` noch `sendMail` gefunden. Schwäche: N2.
- **Verschlüsselung und Trennung der Geheimnisse:** Der Web-Prozess hat nachweislich weder Hauptschlüssel noch Sealed-Box-Geheimschlüssel und verweigert den Dienst, wenn sie vorhanden sind. Im Repository liegen keine Geheimnisse (nur `.env.example` und Test-Konstanten in `packages/testing`). Schwäche: N6.
- **Texte nur in `apps/web/messages/de.json`:** Keine Oberflächentexte im Code von Web, Edge, Worker, Core, Mail oder UI. Systemmails, Fehler- und 404-Seiten holen ihre Texte aus `de.json`. API-Antworten wie `new Response("Forbidden", …)` sind keine Oberflächentexte.
- **Startwerte nur aus `packages/config/defaults.ts`:** Auth-Fristen, Ratenlimits, Einladungen, Löschfristen, Warteschlangen und Shutdown kommen aus `defaults`. Ausnahme: N7.
- **Logs:** Der Request-Log-Filter ist lückenhaft (N3). Better-Auth-Warnungen enthalten keine Adressen.

## Neue bzw. verbleibende Befunde

Alle Befunde sind leicht. Es gibt keine Blocker und keine schweren Befunde.

**N1 – E2E-Test „Magic Link umgeht die Zwei-Faktor-Anmeldung nicht“ ist unzuverlässig (Wettlauf bei der Navigation)**
`e2e/phase-0-auth.spec.ts:176-177`: Direkt nach dem Klick auf „Arbeitsbereich anlegen“ ruft `enableTwoFactor` (`e2e/helpers.ts:58`) `page.goto("/einstellungen/profil")` auf. Gleichzeitig navigiert die App selbst per `window.location.assign("/start")` (`apps/web/components/create-workspace-form.tsx:24`), und beide Navigationen kollidieren. Nachweis: `--repeat-each 10` → 2 von 10 Durchläufen scheitern mit `net::ERR_ABORTED`; im CI-Pfad (`CI=true pnpm test:e2e`) war der Test einmal „flaky“. Lokal gilt `retries: 0`, also wird `pnpm test:e2e`/`test:e2e:prod` zufällig rot, und die Fertig-Definition („test:e2e grün“) ist nicht verlässlich reproduzierbar. Im Haupttest steht nach `createWorkspace` ein `expect`, der auf die Umleitung wartet; hier fehlt er.

**N2 – Rest von m1: `SANDBOX_MAIL_ENDPOINTS` wird nur auf das Format geprüft**
`packages/config/src/env.ts:127-133` verlangt nur `host:port`, `packages/mail/src/send-guard.ts:61-66` vergleicht nur mit dieser Liste. Probe: Mit `APP_ENV=development`, `MAIL_SEND_MODE=sandbox` und `SANDBOX_MAIL_ENDPOINTS=smtp.gmail.com:587` lädt die Umgebung ohne Fehler, und `checkSendAllowed` erlaubt eine Mail an `echte.person@gmail.com`. Konzept Kapitel 18: „Ohne ausdrückliches `MAIL_SEND_MODE=live` verlässt keine Mail das System“, Entwicklung „nur an GreenMail und Mailpit“. Dafür muss jemand die Variable falsch setzen; die erzeugten Werte (`scripts/setup-env.ts`, `scripts/e2e.ts`, `.env.example`) sind korrekt. Vorschlag: In Entwicklung und Test nur Loopback- bzw. Compose-Dienstnamen zulassen, in Staging und Produktion `sandbox` mit externen Hosts ablehnen.

**N3 – Rest von m2: Einladungstoken im Anfrage-Protokoll über `next`**
`apps/web/app/(auth)/einladung/[token]/page.tsx:50` und `:56` verlinken auf `/login?next=%2Feinladung%2F<token>` bzw. `/registrieren?next=…`. Die Muster in `apps/web/next.config.ts:39` (`/\/einladung\//`, `/[?&]token=/`) erfassen die URL-kodierte Form nicht. Nachweis: Beide Anfragen stehen samt Token im Protokoll des laufenden Dev-Servers. Verstößt gegen „Keine … Tokens … in Logs“. Das Risiko ist gering, weil die Annahme zusätzlich die bestätigte, passende E-Mail-Adresse verlangt, und der Fall betrifft nur `next dev`.

**N4 – Rest von m4: Nicht jede Anmeldung wird auditiert**
`apps/web/server/auth.ts:32-46` (`auditAction`) kennt weder `/verify-email` noch die Passkey-Anmeldung, obwohl `autoSignInAfterVerification: true` (`auth.ts:138`) dabei eine Sitzung anlegt. Nachweis: Nach dem CSP-Lauf enthielt die E2E-Datenbank 4 Sitzungen und 0 Audit-Einträge. Auch das Zurücksetzen des Passworts wird nicht protokolliert: `auth.password_reset` ist in `packages/core/src/system/accounts.ts:30` deklariert, wird aber nie geschrieben. Kapitel 16: „`audit_logs` für Anmeldungen …“. Die 2FA-Deaktivierung ist protokolliert, aber durch keinen Test abgedeckt.

**N5 – `withUser` nutzt die Datenbankrolle `ep_app` nicht, entgegen E-028**
`docs/ENTSCHEIDUNGEN.md` E-028: „`withWorkspace`/`withUser` wechseln per `SET LOCAL ROLE` in `ep_app`“. `packages/core/src/scope.ts:62-72` (`withUser`) führt die Transaktion aber mit der Login-Rolle aus (in Entwicklung und Test Superuser); nur `withWorkspace` (`scope.ts:48`) wechselt die Rolle. Darüber laufen auch Schreibzugriffe auf Mandantentabellen (`createWorkspace`, `acceptInvitation`). Heute ohne Wirkung, weil beide Rollen dieselben Rechte haben; mit RLS in Phase 14 liefe dieser Weg aber an der zweiten Schicht vorbei. Code oder Entscheidung angleichen.

**N6 – Umgebungstrennung als Sperrliste statt „jede App nur ihre eigenen Variablen“**
`packages/config/src/env.ts:154-170` (`forbiddenSecrets`, `envForApp`) entfernt nur `MASTER_KEY`, `SEALED_BOX_SECRET_KEY` und `BETTER_AUTH_SECRET`. Variablen, die nur der Worker braucht (`ANTHROPIC_API_KEY`, `S3_SECRET_ACCESS_KEY`, `S3_ACCESS_KEY_ID`, …, nur in `workerEnvSchema` deklariert), bekämen Web und Edge, sobald sie in `.env` stehen. Heute steht keiner dieser Werte in `.env`. Der /goal der ersten Abnahme verlangte „jeder App nur ihre eigenen Variablen“, und CLAUDE.md Regel 3 sagt: „Nur der Worker … spricht mit … der KI“. Vor Phase 3 bzw. 7 auf eine Positivliste je App (Schlüssel aus dem jeweiligen Zod-Schema plus Laufzeitvariablen) umstellen.

**N7 – Feste Frist im Code: Laufzeit des Arbeitsbereichs-Cookies**
`apps/web/app/api/workspace/select/route.ts:31`: `Max-Age=${60 * 60 * 24 * 365}`. CLAUDE.md: „Startwerte (Limits, Fristen, Schwellen) nur aus packages/config/defaults.ts“. Das hat kaum Folgen für die Sicherheit (das Cookie trägt nur die ID, die Mitgliedschaft wird je Anfrage geprüft), ist aber eine Regelabweichung.

## Hinweise ohne Befund

- `docs/berichte/phase-00.md:18` und `:76` nennen noch „E-001 bis E-025“; aktuell sind es E-001 bis E-033.
- Commit `a817bc8` ändert auch `docs/berichte/phase-00-abnahme.md` (Nachtrag zu `4bebb87` und Punkt 1 des /goal). Der Inhalt ist in der Ich-Form der ersten Prüferin bzw. des ersten Prüfers geschrieben und passt zu deren Gegenprobe; inhaltlich habe ich keinen Widerspruch gefunden.
- Der Wächter für rohe Datenbankzugriffe (`system-imports.test.ts:36-37`) erkennt keine Destrukturierung wie `const { db } = ctx.deps`. Das ist für einen Leitplanken-Test vertretbar und im Code derzeit nicht vorhanden.
- Die Web-App prüft verbotene Geheimnisse erst beim ersten Zugriff auf `webEnv()` (über `/api/health`, Auth, tRPC), nicht beim Prozessstart. Der Kommentar „Startup fails“ in `apps/web/server/env.ts:7` ist damit etwas zu stark formuliert; im Ergebnis bleibt die App unbenutzbar und der E2E-Start scheitert.
- Nur Phase-1-Themen (Dunkelmodus, Kopfzeile bei 360 px) habe ich gemäß Auftrag nicht bewertet.

## Empfehlung für den Anfang von Phase 1

N1 zuerst beheben (im Test nach `createWorkspace` auf die Umleitung warten, z. B. `await expect(page.getByText("Als Inhaber oder Admin brauchst du …")).toBeVisible()`), danach N2–N4. N5–N7 können mit den betroffenen späteren Phasen gehen (N6 spätestens vor Phase 3).
