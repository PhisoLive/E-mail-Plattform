# Prüfbericht Phase 0 – Fundament

Stand: 24.10.2026 · Branch `claude/amazing-carson-fippeq`

## Erledigte Punkte (Umfang laut Kapitel 20)

| Umfang | Umsetzung |
| --- | --- |
| Monorepo (pnpm, Turborepo, TypeScript strict, Biome) | `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`), `biome.json`; Node 24.22.1 projektbezogen über pnpm (E-001), TypeScript 7 (E-002) |
| Docker Compose für die Entwicklung (Postgres, Valkey, GreenMail, Mailpit, Rspamd) | `infra/compose/dev.yml` (Postgres 18.6, Valkey 8.1 mit AOF + `noeviction`, GreenMail 2.1.14, Mailpit 1.32, Rspamd 4.2.3), alle Ports nur an 127.0.0.1, Healthchecks; Test-Stack `infra/compose/test.yml` |
| `packages/config` mit Zod | `packages/config/src/env.ts` (alle Variablen, Schutzregeln für `MAIL_SEND_MODE`), `defaults.ts` mit allen Startwerten aus Anhang A, Kapitel 12, 15, 16, 17 |
| `packages/db` mit Drizzle, Migrationen und Seed | komplettes Datenmodell aus Kapitel 4 (65 Tabellen, Bereiche A–H, zusammengesetzte Fremdschlüssel, UUIDv7, Enums, Pflicht-Indizes inkl. deutscher Volltextsuche), `drizzle/0000_extensions.sql` + `0001_initial_schema.sql`, `src/seed.ts` |
| Better Auth (E-Mail + Passwort, Magic Link, 2FA) | `apps/web/server/auth.ts`: Passwort ≥ 10 Zeichen, E-Mail-Bestätigung Pflicht, Magic Link (5 min, keine Registrierung), TOTP-2FA, Passkey-Plugin, HIBP-Prüfung per Schalter, Ratenlimits je IP und Konto, Sitzungen 30 Tage in Postgres |
| Arbeitsbereiche, Rollen, Einladungen | `packages/core/src/services/{workspaces,members,invitations}.ts`, Rechte-Matrix `permissions.ts` (Kapitel 16), Einladungstoken nur als SHA-256, 2FA-Pflicht für Inhaber und Admins, frische Anmeldung (15 min) für Team-Änderungen |
| Audit-Log-Grundgerüst | `packages/core/src/audit.ts`, Tabelle `audit_logs` (nur anhängen); Einträge für Arbeitsbereich, Rollen, Einladungen, Vertrauensstufe |
| Health-Endpunkte | Web `/api/health`, Edge `/health`, Worker `/health` (Datenbank + Valkey, Worker zusätzlich Warteschlangen) |
| GitHub Actions | `.github/workflows/ci.yml`: Biome, Typprüfung, Unit + Integration (Compose-Test-Stack), `pnpm audit`, E2E gegen Produktions-Build |
| `CLAUDE.md` und `docs/ENTSCHEIDUNGEN.md` | `CLAUDE.md` wortgleich aus Kapitel 22; Entscheidungen E-001 bis E-025 |
| Schalter `MAIL_SEND_MODE` | `packages/mail/src/send-guard.ts` (sandbox: nur GreenMail/Mailpit-Hosts; allowlist: nur `MAIL_ALLOWLIST`; live: nur `APP_ENV=production`), Start verweigert unsichere Kombinationen (`checkSendModeSafety`) |

Zusätzlich gebaut (Grundlage für spätere Phasen): `packages/crypto` (AES-256-GCM, Umschlag-Verschlüsselung, Sealed Box), Statusmaschinen + `transition()` (Kapitel 4), `systemContext` mit Import-Wächter, BullMQ-Worker mit allen Warteschlangen-Namen und Zeitplänen, Löschjob-Grundgerüst, Logger mit Schwärzung, `pnpm ops:rebuild-queues`, `pnpm ops:set-trust`.

## Abnahmekriterien mit Nachweis

| Kriterium | Ergebnis | Nachweis |
| --- | --- | --- |
| `pnpm dev` startet alles mit einem Befehl | erfüllt | `pnpm dev` erzeugt bei Bedarf `.env`, startet `emailplattform-dev` (Compose), migriert, seedet und startet Web (4300), Edge (4301) und Worker (4302). Prüfung: `curl http://127.0.0.1:4300/api/health`, `…:4301/health`, `…:4302/health` → jeweils `{"status":"ok"}` |
| Registrieren, Anmelden, 2FA, Arbeitsbereich anlegen und Mitglied einladen als E2E-Test | erfüllt | `e2e/phase-0-auth.spec.ts` › „Registrieren → Anmelden → 2FA → Arbeitsbereich → Mitglied einladen“ (Mails aus Mailpit, TOTP-Code berechnet); dazu „Anmeldung per Magic Link“, „Magic Link umgeht die Zwei-Faktor-Anmeldung nicht“, „Falsches Passwort … abgewiesen“, „Health-Endpunkte“ – `pnpm test:e2e` → 5 passed |
| CI ist grün | siehe unten | GitHub Actions, Workflow `CI` auf `claude/amazing-carson-fippeq` |
| Gerüst für Mandantentests steht | erfüllt | `apps/web/server/trpc/tenant-isolation.int.test.ts`: je tRPC-Prozedur ein Angriff aus Arbeitsbereich B auf A; der Test „covers every procedure of the app router“ schlägt fehl, sobald eine neue Prozedur ohne Fall dazukommt. Dazu `packages/core/src/state/transition.int.test.ts` („cannot reach rows of another workspace“) und `packages/core/src/system/system-imports.test.ts` |

Prüfbefehle (letzter Lauf): `pnpm lint` → Exit 0, `pnpm typecheck` → Exit 0 (10 Pakete + Skripte), `pnpm test` → 69 Tests grün, `pnpm test:e2e` → 5 Tests grün.

## Offene Punkte

- **Testcontainers** sind durch einen Compose-Test-Stack ersetzt (E-003).
- **Staging, Produktion, Dockerfiles der Apps** folgen mit Phase 3 (Kapitel 18: Staging dort gefordert).
- **Passkeys** brauchen eine echte Domain (E-023) – offen, braucht: Arbeitsdomain aus Kapitel 23.
- **Have-I-Been-Pwned-Prüfung** ist in Entwicklung und Test aus (E-016); in Staging einschalten.
- **Systemmail-Dienst** (z. B. SES) – offen, braucht: Zugang aus Kapitel 23 „Vor Phase 4“; bis dahin Mailpit.

## Abweichungen

Alle Abweichungen stehen mit Begründung in `docs/ENTSCHEIDUNGEN.md` (E-001 bis E-025). Die wichtigsten: Compose statt Testcontainers (E-003), eigene Arbeitsbereichs-Tabellen statt Better-Auth-Organisationen (E-005), zusätzliche Tabellen `entity_events` und `platform_secrets` (E-006, E-007), Magic Link nur ohne 2FA (E-018), Zugangsprüfung je Seite (E-019).
