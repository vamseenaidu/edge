# EDGE Terminal Demo

Run from repo root:
`bash scripts/demo_edge.sh`

Override defaults if needed:
`PORT=3000 EDGE_AUTH_ENABLED=0 bash scripts/demo_edge.sh`

The harness starts the server, waits for readiness, runs determinism checks,
then exercises policy and job endpoints (including replay) with clipped output.
You only need one terminal; a second terminal is optional for watching logs.
