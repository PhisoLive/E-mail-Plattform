# Stand

*Wird nach jedem größeren Schritt aktualisiert, damit die Arbeit nach einer Unterbrechung sofort weitergeht.*

**Auftrag**: Phasen 0 bis 8 nach `docs/KONZEPT.md` selbstständig bauen (Start-/goal vom 24.10.2026). Zwischen den Phasen keine Abnahme abwarten; Folge-/goal nur ganz am Ende.

**Aktuelle Phase**: 1 – Design-System und App-Schale

## Phase 0 – Fundament (abgeschlossen)

- Bericht `docs/berichte/phase-00.md`; unabhängige Abnahme `phase-00-abnahme.md` (nein → nachgebessert), Nachabnahme `phase-00-nachabnahme.md` (ja, mit Auflage N1–N4 → alle sieben Befunde N1–N7 behoben, Commit 4d2fd68).

## Phase 1 – in Arbeit

- Arbeitsbaum: `ep-phase1` im Scratchpad, Zweig `phase1-wip` (wird nach Abschluss in `claude/amazing-carson-fippeq` übernommen).
- Fertig: Design-Tokens (warme Neutraltöne, Akzent Petrol, Hell/Dunkel per Cookie `ep_theme` + Systemeinstellung), Komponenten in `packages/ui` (Button, Eingaben, Karten, Badges/Ampel, Zustände, Dialog, Drawer, Menü, Tooltip, Reiter, Schalter, Segmente, Toaster, Befehlspalette, `SuggestOrWrite` mit Tests), App-Schale (einklappbare Seitenleiste, mobile Navigation, Befehlspalette Strg/⌘+K, Hilfe), Regeln für Pflichtangaben je Rechtsform (`packages/core/src/sender/legal-forms.ts` + Tests), Migration `0004_sender_profile_board.sql`.
- Nächster Schritt: Absenderprofil-Dienst + tRPC + Mandantentests, Einstellungsseiten, Startseite, alle Routen aus Kapitel 13, Onboarding-Gerüst, Passwort-vergessen-Seiten, Barrierefreiheits- und 360-px-E2E, Lighthouse-Skript, Abnahme.

## Offene Punkte

- Keine Zugänge aus Kapitel 23 vorhanden (Testpostfächer, S3, Anthropic, Prüfpostfächer, Entra-App) – Attrappen nach Kapitel 19.

## Wichtige Befehle

- `pnpm dev` – alles starten (Compose dev + Apps)
- `pnpm test` – Unit + Integration (startet den Test-Stack automatisch)
- `pnpm test:e2e` – Playwright gegen `next dev`; `pnpm test:e2e:prod` gegen den Produktions-Build
- Docker-Daemon starten, falls nicht aktiv: `dockerd` (in dieser Cloud-Umgebung nötig)
