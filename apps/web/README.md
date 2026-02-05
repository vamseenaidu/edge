# EDGE Workbench (Static Export)

## Build
- `pnpm install` (once)
- `pnpm run dist`

## Output
- Static artifact: `apps/web/out/`

## Hosting
- Serve `out/` with any static server (nginx, S3, GitHub Pages, or similar)

## On-Prem Note
- No telemetry
- No external calls
- Mock data only (for now)

## Limitations
- Mock-only UI; API wiring and live data will be added later.
