# Security Notes (v1.0)

## Data Received
- `/v1/ground` accepts: `query` (string), `domain` (string), `debug` (boolean).
- No external identifiers are required by the API.

## Data Stored Locally
- Request logs (if enabled) are written to `runs/requests.v1.jsonl`.
- Demo and impact artifacts are written under `runs/demo/`.

## What Is Logged
- `query_sha256` (SHA-256 hash of the raw query).
- `query_preview` (truncated, whitespace-normalized preview).
- Decision and metadata (version, evidence tiers, uncertainty).
- `audit_included` and `audit_fingerprint` (if debug audit is present).

## What Is NOT Logged
- Full request bodies.
- Model outputs (EDGE never generates content).
- Any external identifiers or secrets.

## Debug vs Production Logging
- `debug=true` includes an audit object in the API response.
- Logs do not store the full audit payload; only the fingerprint and a boolean flag.
- `debug=false` avoids audit data entirely.

## Logging Controls
- `CGE_DISABLE_LOG=1` disables request logging entirely.
- `CGE_LOG_DIR` and `CGE_LOG_FILE` can override log location and filename.

## External Systems
- No external databases or SaaS dependencies.
- All artifacts are local-only unless you explicitly move them.

## On-Prem Posture
- All state is local to the filesystem.
- No outbound network calls are required for core operation.
