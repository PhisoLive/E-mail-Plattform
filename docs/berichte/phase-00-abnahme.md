# Unabhängige Abnahme Phase 0 – Fundament

Stand: 24.10.2026 · Branch `claude/amazing-carson-fippeq` · geprüfter Commit `396f067` (Code-Stand `ff0b23c` plus Bericht-Entwurf)
Grundlage: `CLAUDE.md`, `docs/KONZEPT.md` Kapitel 16, 18, 19, 20 (Phase 0) und 22, `docs/ENTSCHEIDUNGEN.md`, `docs/berichte/phase-00.md`.
Vorgehen: Alle Tests selbst ausgeführt, Code gelesen, Oberfläche im Browser (Playwright, Desktop, 360 px, Dunkelmodus) angesehen. Am Code wurde nichts geändert.

## Abgenommen: nein

Begründung in einem Satz: Lokal ist alles grün, aber der Produktions-Build der Web-App, gegen den die CI die E2E-Tests fährt, ist zweifach kaputt (Build bricht mit `NODE_ENV=development` ab, und selbst ein erfolgreicher Build blockiert per CSP sämtliches JavaScript auf Anmelde- und Registrierungsseite). Das Kriterium „CI ist grün“ ist damit nicht erreichbar, und die App wäre in Produktion nicht benutzbar.

## Eigene Prüfläufe

| Befehl | Exit-Code | Ergebnis |
| --- | --- | --- |
| `pnpm lint` | 0 | 192 Dateien, 0 Fehler, 10 Warnungen (u. a. `noUndeclaredEnvVars`, unbenutzte Unterdrückung in `apps/web/components/two-factor-setup.tsx:121`, `useOptionalChain` in `apps/web/lib/auth-client.ts:39`) |
| `pnpm typecheck` | 0 | 10/10 Pakete (aus dem Turbo-Cache) plus Wurzel-`tsc` |
| `pnpm exec turbo run typecheck --force` und `pnpm exec tsc -p tsconfig.json` | 0 / 0 | ohne Cache: 10/10 Pakete grün, Wurzel grün |
| `pnpm test` | 0 | 19 Testdateien, 69 Tests grün (Test-Stack `emailplattform-test`, alle fünf Container „healthy“) |
| `pnpm test:e2e` (lokal, `next dev`) | 0 | 5 Tests grün: Registrieren → Anmelden → 2FA → Arbeitsbereich → Mitglied einladen; Magic Link; falsches Passwort; Health-Endpunkte; Magic Link umgeht 2FA nicht |
| `CI=true E2E_WEB_MODE=production pnpm test:e2e` (so wie die CI) | 1 | `next build` bricht ab: „Error occurred prerendering page "/_global-error" … TypeError: Cannot read properties of null (reading 'useContext')“, Warnung „non-standard NODE_ENV“; Web-Server startet nicht |
| `CI=true E2E_WEB_MODE=production NODE_ENV=production pnpm test:e2e` (Gegenprobe) | 1 | Build gelingt; `/`, `/login`, `/login/zwei-faktor`, `/registrieren` werden statisch vorgerendert („○“). Ergebnis „4 failed, 1 passed (12.4m)“: alle vier Oberflächen-Tests laufen in den Timeout (90 s, auch im Wiederholungslauf), nur der Health-Test ist grün; Screenshot zeigt eine leere `<main>` |
| `curl -D - http://127.0.0.1:4400/login` (Produktions-Build aus der Gegenprobe) | – | Kopfzeile `script-src 'self' 'nonce-…' 'strict-dynamic'`, aber 0 `nonce=`-Attribute im HTML → der Browser führt kein Skript aus |
| `curl` auf `http://127.0.0.1:4300/api/health`, `:4301/health`, `:4302/health` | – | jeweils HTTP 200, `{"status":"ok","checks":{"database":"ok","valkey":"ok"}}`, Worker zusätzlich `maintenance running` |
| `drizzle-kit generate` gegen eine Kopie von `packages/db/drizzle` (im Scratch-Verzeichnis) | 0 | „No schema changes, nothing to migrate“ – Schema und Migrationen stimmen überein |
| `diff <(sed -n '1517,1575p' docs/KONZEPT.md) CLAUDE.md` | 0 | `CLAUDE.md` ist wortgleich mit dem Codeblock aus Kapitel 22 |
| `/proc/net/tcp` (lauschende Sockets) | – | 4300–4302 und alle 544xx/554xx-Ports nur auf 127.0.0.1 |

## Abnahmekriterien aus Kapitel 20

| Kriterium | Ergebnis | Eigener Nachweis |
| --- | --- | --- |
| `pnpm dev` startet alles mit einem Befehl | erfüllt | `scripts/dev.ts` erzeugt `.env` (`ensureDevEnv`), verweigert alles außer `MAIL_SEND_MODE=sandbox`, startet `emailplattform-dev` mit `docker compose up -d --wait` (Portprüfung über `assertPortsFree`, wenn der Stack noch nicht läuft), migriert, seedet, prüft die App-Ports 4300–4302 und startet Web, Edge und Worker über Turbo. `infra/compose/dev.yml`: Postgres, Valkey (AOF, `noeviction`), GreenMail, Mailpit, Rspamd, alle Ports `127.0.0.1:…`, Healthchecks, Ressourcenlimits, JSON-Logs. Die laufenden Dev-Apps antworten auf allen drei Health-Endpunkten mit 200. Einschränkung: Ein Neustart von `pnpm dev` war mir untersagt; die laufende Instanz wurde um 18:56 gestartet, `scripts/dev.ts` ist seit 18:44 unverändert. |
| Registrieren, Anmelden, 2FA, Arbeitsbereich anlegen und Mitglied einladen als E2E-Test | lokal erfüllt, im Produktions-Build nicht | `e2e/phase-0-auth.spec.ts:17` deckt den ganzen Ablauf über die echte Oberfläche ab (Bestätigungs- und Einladungsmail aus Mailpit, TOTP berechnet, Anmeldung mit Code, Einladung annehmen, Mitglied erscheint in der Liste). Lokal grün (`next dev`). Gegen den Produktions-Build scheitert derselbe Test (Befunde B1, B2). |
| CI ist grün | nicht erfüllt (Prognose) | `.github/workflows/ci.yml`: Job `check` (lint, typecheck, test) läuft plausibel durch. Job `e2e` setzt `CI=true`, dadurch baut `apps/web/scripts/e2e-serve.mjs:7` den Produktions-Build – und der scheitert nachweislich (B1), danach an der CSP (B2). Den echten CI-Lauf prüft der Orchestrator. |
| Gerüst für Mandantentests steht | erfüllt, mit Lücken | `apps/web/server/trpc/tenant-isolation.int.test.ts`: je Prozedur ein Angriff von Arbeitsbereich B auf A (13 Fälle für alle 13 Prozeduren von `appRouter`), dazu „covers every procedure of the app router“ (Vergleich mit `appRouter._def.procedures`), Ablehnung ohne Sitzung/Arbeitsbereich, 2FA-Pflicht, frische Anmeldung. Läuft grün. Lücken siehe M1 (Zugriffe außerhalb von `withWorkspace`/`systemContext` erkennt kein Test). |

## Umfang Phase 0 – Einzelprüfung

| Punkt | Ergebnis | Nachweis |
| --- | --- | --- |
| Monorepo (pnpm, Turborepo, TypeScript strict, Biome) | ja | `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json` (`strict`, `noUncheckedIndexedAccess`), `biome.json` (`noExplicitAny: error`); lint und typecheck grün |
| Docker Compose Entwicklung (Postgres, Valkey, GreenMail, Mailpit, Rspamd) | ja | `infra/compose/dev.yml`; `docker ps`: alle zehn Container (dev und test) „healthy“, nur 127.0.0.1 |
| `packages/config` mit Zod | ja | `packages/config/src/env.ts` (Schemas je App, `checkSendModeSafety`), `defaults.ts`; `.env.example` enthält jede Variable des Schemas (Abgleich per Skript: keine fehlt) |
| `packages/db` mit Drizzle, Migrationen, Seed | ja | 65 Tabellen in `drizzle/0001_initial_schema.sql`, 43 zusammengesetzte Fremdschlüssel `(workspace_id, …)`, UUIDv7 per `uuidv7()`; kein Schema-Drift; `seed applied` in jedem E2E-Lauf |
| Better Auth (E-Mail + Passwort, Magic Link, 2FA) | ja | `apps/web/server/auth.ts`: Passwort ≥ 10, E-Mail-Bestätigung Pflicht, Magic Link 5 min ohne Registrierung, TOTP, Ratenlimits je IP und Konto (E-024); E2E deckt alle drei Wege ab |
| Arbeitsbereiche, Rollen, Einladungen | ja | `packages/core/src/services/{workspaces,members,invitations}.ts`, Rechte-Matrix `permissions.ts`, Einladungstoken nur als SHA-256; Oberfläche für Einladungen vorhanden, Rollenwechsel/Entfernen nur als Prozedur (Oberfläche folgt mit Phase 1 „Team“) |
| Audit-Log-Grundgerüst | ja, mit Lücke | `packages/core/src/audit.ts`, Tabelle `audit_logs`; acht Aktionen (Arbeitsbereich, Rollen, Einladungen, Vertrauensstufe). Anmeldungen und 2FA-Änderungen fehlen (m4) |
| Health-Endpunkte | ja | siehe Prüfläufe |
| GitHub Actions | Datei ja, grün nein | `.github/workflows/ci.yml` (siehe B1, B2, m6) |
| `CLAUDE.md` und `docs/ENTSCHEIDUNGEN.md` | ja | `CLAUDE.md` wortgleich (diff leer); E-001 bis E-025 mit Datum, was, warum |
| Schalter `MAIL_SEND_MODE` | ja, mit Schwäche | Standard `sandbox`; `live` nur mit `APP_ENV=production`, `allowlist` nur mit Liste, Entwicklung/Test erzwingen `sandbox`; `packages/mail/src/send-guard.ts` vor jedem Systemmail-Versand; Schwäche siehe m1 |

## Muss-Regeln – gezielte Suche

- **Mandantentrennung**: tRPC-Schicht sauber (Mitgliedschaft je Anfrage, alle Dienstabfragen filtern nach `scope.workspaceId`, zusammengesetzte Fremdschlüssel). Verstoß gegen Regel 4 außerhalb der tRPC-Schicht: M1.
- **Versand-Schutzschalter**: vorhanden und getestet; Sandbox-Prüfung nur über den Hostnamen (m1).
- **Sperrliste**: Tabellen `suppressions` und `global_suppressions` (nur Hash) vorhanden; es gibt noch keinen Versandweg, der sie umgehen könnte. Kein Befund.
- **Verschlüsselung**: `packages/crypto` (AES-256-GCM mit AAD, Umschlag-Verschlüsselung, Sealed Box) korrekt; aber der Web-Prozess bekommt `MASTER_KEY` und `SEALED_BOX_SECRET_KEY` in die Umgebung (M2).
- **Agenten-Sicherheit**: noch kein Agenten-Code (Phase 7). Kein Befund.
- **Texte nur in `messages/de.json`**: Web-App sauber (alle Texte, Fehlercodes und Systemmails über `next-intl` aus `de.json`, alle 30 Fehlercodes haben einen Text). Ausnahme im Edge-Dienst (m3).
- **Logs**: pino schwärzt Felder; aber die Anfrage-Protokolle des Next-Servers enthalten Tokens und E-Mail-Adressen (m2).

## Oberfläche

Playwright gegen die laufende Dev-App (http://127.0.0.1:4300), Wegwerf-Konto `abnahme-…@beispiel.test`: Start-, Anmelde- und Registrierungsseite bei 1280 px, 360 px und im Dunkelmodus ohne horizontales Scrollen und ohne Konsolenfehler; Registrieren → Bestätigungslink aus Mailpit → `/willkommen` → Arbeitsbereich anlegen → Umleitung auf `/einstellungen/profil` mit 2FA-Hinweis funktioniert bei 360 px. Hinweise ohne Befund für Phase 0 (gehören zu Phase 1): Der Dunkelmodus ist noch nicht umgesetzt (helle Seite bei `prefers-color-scheme: dark`); bei 360 px kürzt die Kopfzeile den Arbeitsbereichsnamen auf einen Buchstaben.

## Befunde

### Blocker

**B1 – CI-E2E: `next build` scheitert, weil `scripts/e2e.ts` `NODE_ENV=development` setzt**
`scripts/e2e.ts:23` (`NODE_ENV: process.env.NODE_ENV ?? "development"`) zusammen mit `apps/web/scripts/e2e-serve.mjs:7-10` (bei `CI` gesetzt: `next build` + `next start`). GitHub Actions setzt kein `NODE_ENV`, also baut Next mit `development` und bricht beim Vorrendern von `/_global-error` ab („Cannot read properties of null (reading 'useContext')“). Nachweis: `CI=true E2E_WEB_MODE=production pnpm test:e2e` → Exit 1. Der lokale grüne Lauf nutzt `next dev` (E-022) und hat den CI-Pfad nie geprüft.

**B2 – Produktions-Build: CSP mit Nonce blockiert alles JavaScript auf statisch vorgerenderten Seiten**
`apps/web/proxy.ts:33-38` setzt `script-src 'self' 'nonce-…' 'strict-dynamic'` (und in Produktion `style-src 'self' 'nonce-…'`), aber `/`, `/login`, `/login/zwei-faktor` und `/registrieren` werden statisch vorgerendert und tragen kein Nonce. Mit `'strict-dynamic'` ignoriert der Browser `'self'` und führt kein Skript aus; die Formulare in `<Suspense>` erscheinen nie. Nachweis: Gegenprobe mit `NODE_ENV=production` → Build grün, `curl` zeigt CSP-Nonce in der Kopfzeile und 0 `nonce=`-Attribute im HTML, alle Oberflächen-Tests laufen in den Timeout, Screenshot `test-results/…-chromium/test-failed-1.png` zeigt die leere Registrierungsseite, und der Playwright-Trace enthält Konsolenfehler des Browsers wie „Loading the script 'http://127.0.0.1:4400/_next/static/chunks/….js' violates the following Content Security Policy directive: "script-src 'self' 'nonce-…' 'strict-dynamic'"“ (13 Verstöße allein im ersten Test). Folge: In Staging und Produktion kann sich niemand registrieren oder anmelden, und die CI kann nicht grün werden.

### Schwer

**M1 – Mandantentrennung (CLAUDE.md Regel 4, Kapitel 16): Datenbankzugriffe außerhalb von `withWorkspace` und `systemContext`, nicht dokumentiert und von keinem Test erkannt**
- `apps/worker/src/queues/maintenance.ts:17-36`: Der Löschjob löscht arbeitsbereichsübergreifend direkt über `ctx.deps.db` aus der Mandantentabelle `invitations` – ohne `systemContext`.
- `packages/core/src/services/workspaces.ts:118` (`getMembershipRole`) und `packages/core/src/services/accounts.ts:11` greifen direkt auf `deps.db` zu.
- `packages/core/src/scope.ts:61` (`withUser`) schreibt in `createWorkspace` (`workspaces.ts:45`) und `acceptInvitation` (`invitations.ts:213`) in Mandantentabellen (`workspace_members`, `sender_profiles`, `audit_logs`, `invitations`) – eine dritte, im Konzept nicht vorgesehene Zugriffsart ohne Eintrag in `docs/ENTSCHEIDUNGEN.md`.
- Der Import-Wächter `packages/core/src/system/system-imports.test.ts:16-18` prüft nur `packages/` und `apps/` und erkennt nur genau `@ep/core/system` und relative `…/system`-Pfade. `@ep/core/system/index` (über den Export `"./*"` auflösbar), `@ep/core/system/operations` und `../system/operations` rutschen durch (per Regex-Probe geprüft); `scripts/ops.ts:8` importiert `@ep/core/system/operations` unbemerkt. Rohe `deps.db`-Zugriffe prüft kein Test.
- `withSystem` (`packages/core/src/system/index.ts:20`) nutzt keine eigene Datenbankrolle, obwohl Kapitel 16 das verlangt („Er nutzt eine eigene Datenbankrolle“) – ebenfalls nicht dokumentiert.

**M2 – Verschlüsselung (Kapitel 16 Muss: „die Web-App bekommt den Hauptschlüssel gar nicht“): Web-Prozess erhält `MASTER_KEY` und `SEALED_BOX_SECRET_KEY`**
`scripts/dev.ts:14` lädt die gesamte `.env` und gibt sie in `scripts/dev.ts:40` (`env: process.env`) an alle drei Apps weiter; `scripts/e2e.ts:32-42` setzt beide Schlüssel für alle Playwright-Web-Server. Nachweis: `/proc/<pid>/environ` des laufenden `next-server` enthält `MASTER_KEY` und `SEALED_BOX_SECRET_KEY`. Der Kommentar `apps/web/server/env.ts:6` („The web app never receives MASTER_KEY“) stimmt damit nicht. Das Zod-Schema liest die Werte zwar nicht, die Trennung ist aber nicht hergestellt und nicht getestet – vor Phase 3 (Sealed Box, Staging) muss sie stehen.

### Leicht

**m1 – Versand-Schutzschalter prüft im Sandbox-Modus nur den Hostnamen**
`packages/mail/src/send-guard.ts:44-48` lässt jeden Server durch, dessen Host in `SANDBOX_MAIL_HOSTS` steht; Standard ist `127.0.0.1,localhost,greenmail,mailpit` (`packages/config/src/env.ts:47`), und `checkSendModeSafety` prüft die Liste nicht. Jeder SMTP-Dienst auf 127.0.0.1 (lokaler MTA, SSH-Tunnel) oder ein in die Liste geschriebener echter Host gilt als „Sandbox“ – das Konzept verlangt „nur an GreenMail und Mailpit“. Auf diesem Server lauscht derzeit kein SMTP-Dienst auf 25/465/587, daher leicht.

**m2 – Tokens und E-Mail-Adressen im Anfrage-Protokoll**
Next protokolliert vollständige URLs, z. B. `GET /api/auth/verify-email?token=eyJ…` (das JWT enthält die E-Mail-Adresse im Klartext) und `GET /api/auth/magic-link/verify?token=…` (E2E-Log). Verstößt gegen „Keine Passwörter, Tokens … in Logs; E-Mail-Adressen nur als Hash“. Betrifft `next dev` (Entwicklung, lokale E2E); in `apps/web/next.config.ts` fehlt eine Einstellung wie `logging.incomingRequests`.

**m3 – Fest eingebauter deutscher Text im Edge-Dienst**
`apps/edge/src/app.ts:27`: `c.text("Nicht gefunden", 404)`. Oberflächentexte gehören ausschließlich nach `apps/web/messages/de.json`; der Edge-Dienst bekommt in Phase 4 öffentliche Seiten (Abmeldung) und braucht dafür ohnehin den Zugriff auf `de.json`.

**m4 – Anmeldungen und 2FA-Änderungen werden nicht auditiert**
Kapitel 16: „`audit_logs` für Anmeldungen, Rollenänderungen …“. `apps/web/server/auth.ts:124-139` hat nur einen `before`-Hook für das Ratenlimit; es gibt keine Audit-Einträge für Anmeldung, Magic-Link-Anmeldung, 2FA aktivieren/deaktivieren.

**m5 – E2E-Test hält nicht, was sein Name sagt**
`e2e/phase-0-auth.spec.ts:93-99` („Falsches Passwort und unbestätigte Adresse werden abgewiesen“) prüft nur eine unbekannte Adresse. Weder das falsche Passwort eines existierenden Kontos noch die Anmeldung mit unbestätigter Adresse wird getestet; der Bericht `phase-00.md` führt den Test trotzdem als Nachweis.

**m6 – `pnpm audit` in der CI ohne Wirkung**
`.github/workflows/ci.yml:35-36`: `continue-on-error: true` – bekannte Sicherheitslücken in Abhängigkeiten lassen die CI nie rot werden (Kapitel 16: „`pnpm audit` in der CI“).

**m7 – Schutz „letzter Inhaber“ ist nicht nebenläufigkeitssicher**
`packages/core/src/services/members.ts:54-61`, `:83`, `:111`: `ownerCount` zählt ohne Sperre; nur die Zielzeile wird mit `FOR UPDATE` gesperrt. Entfernen bzw. degradieren sich zwei Inhaber gleichzeitig gegenseitig, sehen beide Transaktionen zwei Inhaber – danach hat der Arbeitsbereich keinen.

## Was ich nicht prüfen konnte

- Den echten GitHub-Actions-Lauf (prüft der Orchestrator).
- Einen Kaltstart von `pnpm dev` (laut Auftrag untersagt; geprüft wurden Code, Compose-Datei und die laufende Instanz).

## /goal zur Nachbesserung

```text
/goal Bessere Phase 0 „Fundament“ der E-Mail-Plattform nach der Abnahme nach.

Lies zuerst: CLAUDE.md, docs/ENTSCHEIDUNGEN.md, docs/berichte/phase-00-abnahme.md und Kapitel 16, 18, 19 und Phase 0 in Kapitel 20 von docs/KONZEPT.md.

Ziel: Alle Befunde aus phase-00-abnahme.md sind behoben; die CI (Workflow „CI“) ist auf dem Branch grün.

Pflicht:
1. B1: scripts/e2e.ts darf NODE_ENV nicht auf development setzen, wenn die Web-App als Produktions-Build läuft (next build/start mit NODE_ENV=production). Prüfe lokal genau den CI-Pfad: CI=true E2E_WEB_MODE=production pnpm test:e2e muss grün sein.
2. B2: Die nonce-basierte CSP muss im Produktions-Build funktionieren. Entweder alle Seiten dynamisch rendern (Nonce aus x-nonce im Root-Layout lesen bzw. Seiten erzwingen dynamisch) oder für statische Seiten eine gleichwertige CSP ohne 'strict-dynamic'-Bruch wählen; Entscheidung in docs/ENTSCHEIDUNGEN.md. Ein E2E-Test prüft, dass auf /login und /registrieren keine CSP-Verletzung auftritt (Konsole/securitypolicyviolation).
3. M1: Löschjob über systemContext (Modul auf die Positivliste), keine rohen deps.db-Zugriffe außerhalb von packages/core/src/scope.ts und packages/core/src/system; withUser und getMembershipRole entweder in withWorkspace/systemContext überführen oder als begründete Ausnahme in docs/ENTSCHEIDUNGEN.md eintragen. Den Import-Wächter erweitern (auch scripts/, @ep/core/system/*, relative system/*-Pfade) und einen Test ergänzen, der rohe deps.db-Zugriffe außerhalb der erlaubten Module findet. Eigene Datenbankrolle für systemContext anlegen oder die Verschiebung dokumentieren.
4. M2: pnpm dev und pnpm test:e2e geben jeder App nur ihre eigenen Variablen; die Web-App erhält weder MASTER_KEY noch SEALED_BOX_SECRET_KEY. Ein Test beweist das (z. B. Start-Prüfung in apps/web, die bei vorhandenem MASTER_KEY abbricht).
5. m1–m7: Sandbox-Prüfung an Host und Port von GreenMail/Mailpit binden und SANDBOX_MAIL_HOSTS in checkSendModeSafety validieren; Next-Anfrage-Protokoll ohne Tokens/E-Mail-Adressen; Edge-Texte aus de.json; Audit-Einträge für Anmeldung und 2FA-Änderungen; E2E-Test für falsches Passwort eines bestehenden Kontos und unbestätigte Adresse; pnpm audit in der CI blockierend (Ausnahmen begründet); letzter Inhaber nebenläufigkeitssicher (Inhaber-Zeilen sperren) mit Test.

Arbeitsweise und Abschluss wie in Phase 0: selbstständig, Muss-Regeln einhalten, pnpm lint, pnpm typecheck, pnpm test, pnpm test:e2e und der CI-Pfad grün; Bericht docs/berichte/phase-00.md aktualisieren (jeder Befund mit Nachweis), kurze Zusammenfassung auf Deutsch, danach erneute unabhängige Abnahme.
```
