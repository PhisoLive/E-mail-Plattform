# Stand

*Wird nach jedem größeren Schritt aktualisiert, damit die Arbeit nach einer Unterbrechung sofort weitergeht.*

**Auftrag**: Phasen 0 bis 8 nach `docs/KONZEPT.md` selbstständig bauen (Start-/goal vom 24.10.2026). Zwischen den Phasen keine Abnahme abwarten; Folge-/goal nur ganz am Ende.

**Aktuelle Phase**: 1 – Design-System und App-Schale

## Phase 0 – Fundament (abgeschlossen)

- Bericht `docs/berichte/phase-00.md`; unabhängige Abnahme `phase-00-abnahme.md` (nein → nachgebessert), Nachabnahme `phase-00-nachabnahme.md` (ja, mit Auflage N1–N4 → alle sieben Befunde N1–N7 behoben, Commit 4d2fd68).

## Phase 1 – in Arbeit

- Arbeitsbaum: `ep-phase1` im Scratchpad, Zweig `phase1-wip` (wird nach Abschluss in `claude/amazing-carson-fippeq` übernommen).
- Fertig: Design-System und Komponenten, App-Schale (Seitenleiste mit Agenten und Zähler, Schublade unter 1024 px, Befehlspalette, Hilfe), alle Routen aus Kapitel 13, Startseite, Einstellungen (Profil, Team mit Rollen/Entfernen, Absender mit Pflichtangaben je Rechtsform), Onboarding, Website, Betreiberbereich, öffentliche Seiten, „Passwort vergessen“, E2E mit axe und Lighthouse, Entscheidungen E-037 bis E-046.
- Nächster Schritt: kompletter Testlauf (lint, typecheck, test, test:e2e, test:e2e:prod), Bericht `docs/berichte/phase-01.md`, Übernahme in den Hauptzweig, unabhängige Abnahme, Befunde beheben.

## Offene Punkte

- Keine Zugänge aus Kapitel 23 vorhanden (Testpostfächer, S3, Anthropic, Prüfpostfächer, Entra-App) – Attrappen nach Kapitel 19.

## Wichtige Befehle

- `pnpm dev` – alles starten (Compose dev + Apps)
- `pnpm test` – Unit + Integration (startet den Test-Stack automatisch)
- `pnpm test:e2e` – Playwright gegen `next dev`; `pnpm test:e2e:prod` gegen den Produktions-Build
- Docker-Daemon starten, falls nicht aktiv: `dockerd` (in dieser Cloud-Umgebung nötig)
