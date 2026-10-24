# Stand

*Wird nach jedem größeren Schritt aktualisiert, damit die Arbeit nach einer Unterbrechung sofort weitergeht.*

**Auftrag**: Phasen 0 bis 8 nach `docs/KONZEPT.md` selbstständig bauen (Start-/goal vom 24.10.2026). Zwischen den Phasen keine Abnahme abwarten; Folge-/goal nur ganz am Ende.

**Aktuelle Phase**: 0 – Fundament

## Erledigt in Phase 0

- Repository, `docs/KONZEPT.md` (unverändert), `CLAUDE.md` (wortgleich aus Kapitel 22), Ideenpapier als `docs/IDEENPAPIER.md`.
- Werkzeuge: pnpm 10.28 + Turborepo, Node 24.22.1 projektbezogen, TypeScript 7, Biome 2.6, Vitest 5.
- `packages/config`: Zod-Umgebungsvariablen, `defaults.ts` mit allen Startwerten aus Anhang A, Schutzregeln für `MAIL_SEND_MODE`.
- Compose-Stacks `infra/compose/dev.yml` und `test.yml` (Postgres 18.6, Valkey 8.1, GreenMail 2.1.14, Mailpit 1.32, Rspamd 4.2.3), nur 127.0.0.1, Portprüfung.
- `packages/db`: komplettes Datenmodell aus Kapitel 4 (65 Tabellen) mit zusammengesetzten Fremdschlüsseln, Migrationen, Seed.
- `packages/core`: `withWorkspace`, `withUser`, `systemContext` (mit Import-Prüfung), Rechte-Matrix, Audit-Log, Statusmaschinen + `transition()`, Dienste für Arbeitsbereiche, Mitglieder, Einladungen, Logger mit Schwärzung.
- `packages/crypto`: AES-256-GCM, Umschlag-Verschlüsselung, Sealed Box.
- `packages/mail`: Versand-Schutzschalter, Systemmails.
- `apps/edge` (Hono, /health), `apps/worker` (BullMQ, /health, Löschjob-Grundgerüst).

## Nächster Schritt

- `apps/web`: Next.js 16 + Better Auth (Passwort, Magic Link, 2FA) + tRPC + next-intl; Seiten Registrieren, Anmelden, 2FA, Arbeitsbereich anlegen, Team einladen.
- Mandantentest-Gerüst für tRPC-Prozeduren, E2E-Tests, `pnpm dev`, GitHub Actions, Bericht Phase 0.

## Offene Punkte

- Keine Zugänge aus Kapitel 23 vorhanden (Testpostfächer, S3, Anthropic, Prüfpostfächer, Entra-App) – Attrappen nach Kapitel 19.

## Wichtige Befehle

- `pnpm dev` – alles starten (Compose dev + Apps)
- `pnpm test` – Unit + Integration (startet den Test-Stack automatisch)
- `pnpm test:e2e` – Playwright
- Docker-Daemon starten, falls nicht aktiv: `dockerd` (in dieser Cloud-Umgebung nötig)
