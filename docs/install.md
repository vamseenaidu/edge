# EDGE Installation Guide

This guide explains how to install and run EDGE from this repository in three modes: local development, Docker Compose, and Kubernetes. It is written to be executable from the repository as it exists today.

## 1. System Overview

EDGE in this repository is packaged as five operator-visible components:

| Component | Role |
|---|---|
| EDGE Runtime | Deterministic decision engine exposed by the root service on port `3000`. |
| EDGE Gateway | Enterprise API ingress on port `3001` for health, jobs, policies, auth, tenant propagation, and enforcement surfaces. |
| Policy Store | Persistent storage contract for versioned rulepacks and policy definitions, mounted at `/data/policies`. |
| Audit Store | Persistent storage contract for decision artifacts and trace logs, mounted at `/data/audit`. |
| EDGE Workbench | Operator UI for policy management, runs, and traces. |

Notes:
- The Docker Compose and Kubernetes bundles do not use an external database.
- In the current repository, the gateway policy lifecycle implementation is in-memory, but the deployment packages still provision the `policy-store` and `audit-store` mounts so the storage contract is explicit.

## 2. System Requirements

Minimum requirements:

- Git
- Node.js 20+
- pnpm 10+ recommended
- Docker 24+
- Docker Compose v2
- Kubernetes 1.27+ for cluster deployment
- 4 GB RAM minimum
- 10 GB free disk space recommended for images, node modules, and local artifacts

## 3. Repository Setup

Clone the repository and install dependencies from the repository root:

```bash
git clone <repo>
cd cge-api
pnpm install
```

Verify the root service build completes:

```bash
pnpm build
```

If you also plan to run the Workbench locally, install its dependencies separately:

```bash
cd apps/web
pnpm install
cd ../..
```

## 4. Local Development Install

Use local development when you want to run the repo directly without Docker.

### Quick start: gateway plus Workbench

This is the simplest operator workflow and matches the default Workbench developer port.

Start the gateway in one terminal from the repository root:

```bash
EDGE_HOST=0.0.0.0 \
EDGE_PORT=3001 \
EDGE_AUTH_ENABLED=0 \
EDGE_READY=1 \
pnpm exec ts-node --transpile-only --project tsconfig.json edge/api/index.ts
```

Start the Workbench in a second terminal:

```bash
cd apps/web
pnpm install
NEXT_PUBLIC_EDGE_API_BASE=http://localhost:3001 pnpm dev
```

Access the UI:

```text
http://localhost:3000
```

Gateway endpoint:

```text
http://localhost:3001
```

Verify the gateway:

```bash
curl http://localhost:3001/api/v1/health/live
```

Expected response example:

```json
{"kind":"edge.ok","api_version":"v1","data":{"status":"live"}}
```

### Full local topology: runtime plus gateway plus Workbench

To mirror the Docker Compose architecture more closely, run the standalone runtime on `3000` and the gateway on `3001`.

Start the runtime in a separate terminal from the repository root:

```bash
HOST=0.0.0.0 PORT=3000 pnpm dev
```

If you also run the Workbench at the same time, move the Workbench off the default Next.js port because `3000` is already used by the runtime:

```bash
cd apps/web
PORT=3002 NEXT_PUBLIC_EDGE_API_BASE=http://localhost:3001 pnpm dev
```

In that full local topology, the endpoints are:

- Runtime: `http://localhost:3000`
- Gateway: `http://localhost:3001`
- Workbench: `http://localhost:3002`

## 5. Docker Deployment

The repository includes a Docker Compose bundle under `deploy/`.

Change into the deployment directory and create the local environment file:

```bash
cd deploy
cp .env.example .env
docker compose up
```

What this starts:

- Containers: `edge-runtime`, `edge-gateway`, `edge-workbench`
- Named volumes: `policy-store`, `audit-store`

Default service endpoints from the checked-in `.env.example`:

- Runtime: `http://localhost:3000`
- Gateway: `http://localhost:3001`
- Workbench: `http://localhost:3002`

If you change `EDGE_WORKBENCH_PORT=80` in `deploy/.env`, the Workbench will be reachable at `http://localhost`.

Verify running containers:

```bash
docker ps
```

Health check:

```bash
curl http://localhost:3001/api/v1/health/live
```

Workbench access:

```text
http://localhost:3002
```

## 6. Kubernetes Deployment

The Kubernetes bundle is plain YAML under `deploy/helm/` and consists of these files:

- `policy-store.yaml`
- `edge-runtime.yaml`
- `edge-workbench.yaml`

Apply the manifests from the repository root:

```bash
kubectl apply -f deploy/helm/policy-store.yaml
kubectl apply -f deploy/helm/edge-runtime.yaml
kubectl apply -f deploy/helm/edge-workbench.yaml
```

Verify the workloads:

```bash
kubectl get pods
```

Verify the services:

```bash
kubectl get svc
```

The bundle creates these Kubernetes objects:

- PVCs: `policy-store`, `audit-store`
- Deployment: `edge-runtime` with `runtime` and `gateway` containers
- Services: `edge-runtime-service`, `edge-gateway-service`
- Deployment: `edge-workbench`
- Service: `edge-workbench-service`
- Ingress example: `edge-workbench-ingress`

Workbench access:

```text
http://edge.local
```

Notes:
- `edge.local` requires a working Ingress controller and host resolution for `edge.local` in DNS or `/etc/hosts`.
- The Kubernetes Workbench manifest points the UI to `http://edge-gateway-service:3001`.

## 7. Environment Variables

The deployment packages and runtime surfaces use these environment variables.

| Name | Purpose | Default value |
|---|---|---|
| `EDGE_RUNTIME_PORT` | Packaging-level port used for the standalone runtime service in Docker Compose and Kubernetes. | `3000` |
| `EDGE_GATEWAY_PORT` | Packaging-level port used for the gateway service in Docker Compose and Kubernetes. | `3001` |
| `EDGE_HOST` | Bind address for the gateway process. | `0.0.0.0` |
| `EDGE_PORT` | Listen port for the gateway process. | Code default `3000`; set to `3001` in the packaged Docker and Kubernetes deployments. |
| `EDGE_AUTH_ENABLED` | Enables gateway auth checks. If set to `1`, additional auth configuration is required. | `0` |
| `EDGE_READY` | Readiness gate for the gateway health endpoint. Set to `0` to force readiness failures. | `1` in packaged deployments |
| `NODE_ENV` | Node runtime mode. | `production` in packaged deployments |
| `CGE_LOG_DIR` | Filesystem location for runtime log and audit artifacts. | Code fallback `runs`; set to `/data/audit` in packaged deployments |
| `NEXT_PUBLIC_EDGE_API_BASE` | Base URL used by the Workbench client for API requests. | Local/dev fallback `http://localhost:3000`; set to `http://localhost:3001` for local Docker builds and `http://edge-gateway-service:3001` in Kubernetes |

## 8. Network Ports

| Port | Service | Description |
|---|---|---|
| `3000` | EDGE Runtime | Standalone deterministic runtime service exposed by the root application. |
| `3001` | EDGE Gateway | Enterprise API ingress for `/api/v1/*` health, jobs, policies, and control endpoints. |
| `80` | EDGE Workbench | Container and Ingress port used by the static Workbench image. |
| `3002` | EDGE Workbench (Docker default) | Default host port mapped to Workbench in `deploy/.env.example`. |

## 9. Storage Volumes

Persistent storage is mounted at these paths in the deployment packages:

| Volume | Mount path | Purpose |
|---|---|---|
| `policy-store` | `/data/policies` | Policy definitions and rulepacks |
| `audit-store` | `/data/audit` | Decision artifacts and audit traces |

Storage mapping by deployment mode:

- Docker Compose: named volumes `edge-policy-store` and `edge-audit-store`
- Kubernetes: PVCs `policy-store` and `audit-store`

Operational note:
- `CGE_LOG_DIR` is set to `/data/audit` in the packaged deployments.
- The policy mount is provisioned consistently even though the current gateway policy lifecycle implementation is in-memory.

## 10. Health Checks

Gateway health endpoints:

| Endpoint | Meaning |
|---|---|
| `/api/v1/health/live` | Liveness check |
| `/api/v1/health/ready` | Readiness check |

Runtime health endpoints:

| Endpoint | Meaning |
|---|---|
| `/health` | Runtime liveness/readiness convenience endpoint |
| `/healthz` | Runtime health endpoint used by the root service |

Example gateway check:

```bash
curl http://localhost:3001/api/v1/health/live
```

Expected response example:

```json
{"kind":"edge.ok","api_version":"v1","data":{"status":"live"}}
```

## 11. Example Request

The enterprise API in this repository currently exposes `POST /api/v1/jobs` as the minimal working write path. A `/api/v1/run` endpoint is not present in the checked-in gateway routes.

Create a minimal job request:

```bash
curl -X POST http://localhost:3001/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{"kind":"eval_run","payload":{"example":"value"}}'
```

Expected response example:

```json
{"kind":"edge.ok","api_version":"v1","data":{"job_id":"<job-id>","status":"queued"}}
```

If you are validating the standalone runtime directly instead of the gateway, use the root runtime API:

```bash
curl -X POST http://localhost:3000/v1/ground \
  -H "Content-Type: application/json" \
  -d '{"query":"52M chest pain with sweating","domain":"medicine"}'
```

## 12. Troubleshooting

### Runtime does not start

Common causes:
- Port `3000` is already in use.
- Dependencies were not installed.
- The TypeScript build has not completed and you are using `pnpm start`.

Checks:

```bash
lsof -i :3000
pnpm install
pnpm build
```

Recovery:
- Free port `3000` or start the runtime on a different `PORT`.
- Reinstall dependencies from the repository root.
- Use `pnpm dev` for the root runtime during development.

### Docker containers exit immediately

Common causes:
- `docker compose up` was run from the wrong directory.
- The `.env` file was not created from `deploy/.env.example`.
- An image build failed before the container started.

Checks:

```bash
cd deploy
docker compose ps
docker logs edge-runtime
docker logs edge-gateway
docker logs edge-workbench
```

Recovery:
- Run Compose from `deploy/` or use `docker compose -f deploy/docker-compose.yml ...` from the repository root.
- Recreate `deploy/.env` from `.env.example`.
- Rebuild the stack with `docker compose up --build`.

### Kubernetes pods remain unready

Common causes:
- The PVCs are not bound.
- The cluster cannot pull the `edge-runtime`, `edge-gateway`, or `edge-workbench` images.
- The Ingress controller is missing or the service DNS name is unresolved.
- The gateway readiness probe fails because `EDGE_READY=0`.

Checks:

```bash
kubectl get pods
kubectl get pvc
kubectl describe pod <pod>
kubectl logs <pod>
```

Recovery:
- Confirm `policy-store` and `audit-store` PVCs are `Bound`.
- Push or preload the images into the cluster runtime.
- Check probe paths and ports: runtime `/health`, gateway `/api/v1/health/ready`, Workbench `/`.
- Ensure the cluster has a default storage class named `default` or adjust the manifest.

### Workbench cannot reach API

Common causes:
- `NEXT_PUBLIC_EDGE_API_BASE` points to the wrong host or port.
- The browser cannot resolve `edge.local`.
- Local development is using the Workbench on `3000` while the runtime also occupies `3000`.

Checks:

```bash
curl http://localhost:3001/api/v1/health/live
kubectl get svc
kubectl get ingress
```

Recovery:
- For local development, set `NEXT_PUBLIC_EDGE_API_BASE=http://localhost:3001`.
- For Kubernetes, confirm the Workbench manifest uses `http://edge-gateway-service:3001`.
- If you run the standalone runtime locally, move the Workbench to another port such as `3002`.

## 13. Uninstall

Stop and remove the Docker Compose deployment:

```bash
cd deploy
docker compose down
```

Remove the Kubernetes deployment:

```bash
kubectl delete -f deploy/helm/
```
