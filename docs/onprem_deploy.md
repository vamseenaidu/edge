# On-Prem Deployment Guide

## Supported Modes
- Single host (systemd or direct process)
- Docker (single container)
- Reverse proxy (nginx/HAProxy in front of EDGE)

## Minimal Start Commands
### Single host (direct)
```bash
pnpm install
pnpm exec ts-node --transpile-only --project tsconfig.json edge/api/index.ts
```

### Docker (example)
```bash
docker run --rm -p 3000:3000 \
  -e EDGE_HOST=0.0.0.0 \
  -e EDGE_PORT=3000 \
  edge-api:latest
```

### Reverse proxy (example)
- Run EDGE on `127.0.0.1:3000`
- Proxy `/api/` to EDGE

## Environment Examples
```bash
export EDGE_HOST=0.0.0.0
export EDGE_PORT=3000
export EDGE_SHUTDOWN_TIMEOUT_MS=5000
export EDGE_AUTH_ENABLED=0
# If auth enabled, must set explicitly:
# export EDGE_AUTH_MODE=prod_enforce
```

## Health Checks
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

## Log Expectations
- Startup banner with host/port
- Shutdown logs with signal context
- Errors are emitted as structured envelopes

## Static UI Deployment
- Build and host the Workbench UI using `apps/web/README.md`.
