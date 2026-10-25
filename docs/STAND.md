# Stand

*Wird nach jedem größeren Schritt aktualisiert, damit die Arbeit nach einer Unterbrechung sofort weitergeht.*

**Auftrag**: Phasen 0 bis 8 nach `docs/KONZEPT.md` selbstständig bauen (Start-/goal vom 24.10.2026). Zwischen den Phasen keine Abnahme abwarten; Folge-/goal nur ganz am Ende.

**Aktuelle Phase**: 2 – Kontakte

## Phase 0 – Fundament (abgeschlossen)

- Bericht `docs/berichte/phase-00.md`; unabhängige Abnahme `phase-00-abnahme.md` (nein → nachgebessert), Nachabnahme `phase-00-nachabnahme.md` (ja, mit Auflage N1–N4 → alle sieben Befunde N1–N7 behoben, Commit 4d2fd68).

## Phase 1 – Design-System und App-Schale (abgeschlossen)

- Bericht `docs/berichte/phase-01.md`; unabhängige Abnahme `phase-01-abnahme.md` (nein: M1–M5, 39 leichte Befunde) → behoben; Nachabnahme `phase-01-nachabnahme.md` (ja mit Auflagen: N1–N4, Reste) → behoben; Prüfung aus fünf Blickwinkeln und abschließende Prüfung mit 38 Agenten → alle bestätigten Befunde behoben.
- Letzter Lauf: lint, typecheck (ohne Cache), test (238), test:e2e (19), test:e2e:prod (19) grün. Entscheidungen E-037 bis E-057.
- Nächster Schritt: Phase 2 – Kontakte (Kapitel 20 lesen, in Schritte teilen).

## Offene Punkte

- Keine Zugänge aus Kapitel 23 vorhanden (Testpostfächer, S3, Anthropic, Prüfpostfächer, Entra-App) – Attrappen nach Kapitel 19.
- Deployment: Reverse Proxy entfernt `x-middleware-rewrite` und `x-nextjs-rewritten-path` (E-048).
- Rechtstexte der Website brauchen Betreiberangaben und Prüfung durch eine Kanzlei.

## Wichtige Befehle

- `pnpm dev` – alles starten (Compose dev + Apps)
- `pnpm test` – Unit + Integration (startet den Test-Stack automatisch)
- `pnpm test:e2e` – Playwright gegen `next dev`; `pnpm test:e2e:prod` gegen den Produktions-Build
- Docker-Daemon starten, falls nicht aktiv: `dockerd` (in dieser Cloud-Umgebung nötig)
