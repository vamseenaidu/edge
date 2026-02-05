# Config Matrix

| Env Var | Default | Allowed Values | Meaning | Safe for Prod |
|---|---|---|---|---|
| EDGE_HOST | `127.0.0.1` | host/IP | Bind address for API server | Yes |
| EDGE_PORT | `3000` | number | API listen port | Yes |
| EDGE_SHUTDOWN_TIMEOUT_MS | `5000` | number | Graceful shutdown timeout | Yes |
| EDGE_READY | unset | `0`/`1` | Readiness gate (operational control) | Yes |
| EDGE_AUTH_ENABLED | `0` | `0`/`1` | Enable auth surface | Yes (if configured) |
| EDGE_AUTH_MODE | unset | `dev_allow_anon` or `prod_enforce` | Explicit auth mode when enabled | Yes (required if enabled) |
| EDGE_ALLOW_INSECURE_AUTH | `0` | `0`/`1` | Bypass auth mode guard (dev only) | No |
| Header: `x-edge-tenant-id` | unset | non-empty string | Tenant propagation header | Yes |
| Header: `x-edge-role` | unset | `platform_admin`, `policy_author`, `auditor`, `operator` | RBAC role header | Yes |
| Jobs: `idempotency_key` | unset | string | Job idempotency key field (request JSON) | Yes |
| Tool governance | default deny | n/a | Tools are denied unless explicitly allowed by policy | Yes |
| Tool audit events | n/a | n/a | Inspect tool audit events in audit envelopes / run trace | Yes |
| UI role selector | `auditor` | role enum | Client-side gating only; not a security boundary | No (UI only) |

Notes:
- When `EDGE_AUTH_ENABLED=1`, `EDGE_AUTH_MODE` must be set to `dev_allow_anon` or `prod_enforce`.
- Tenant and role headers are optional unless enforced by your gateway.
