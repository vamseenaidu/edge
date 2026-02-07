#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${SCRIPT_DIR}/demo_common.sh"

cd "${ROOT_DIR}"

PORT="${PORT:-3000}"
EDGE_AUTH_ENABLED="${EDGE_AUTH_ENABLED:-0}"
BASE_URL="http://localhost:${PORT}"
JOB_FILE="/tmp/edge_job.json"
SERVER_LOG="/tmp/edge_demo_server.log"
SERVER_PID=""

cleanup() {
  cleanup_pid "${SERVER_PID:-}"
}
trap cleanup EXIT

section "EDGE Terminal Demo Harness"
echo "Repo root: ${ROOT_DIR}"
echo "Base URL: ${BASE_URL}"
echo "EDGE_AUTH_ENABLED: ${EDGE_AUTH_ENABLED}"

section "Start API Server"
echo "+ PORT=${PORT} EDGE_AUTH_ENABLED=${EDGE_AUTH_ENABLED} pnpm exec ts-node edge/api/index.ts >${SERVER_LOG} 2>&1 &"
PORT="${PORT}" EDGE_AUTH_ENABLED="${EDGE_AUTH_ENABLED}" pnpm exec ts-node edge/api/index.ts >"${SERVER_LOG}" 2>&1 &
SERVER_PID=$!
echo "Server PID: ${SERVER_PID}"
echo "Server log: ${SERVER_LOG}"

section "Wait For Readiness"
run wait_ready "${BASE_URL}" 50 0.2 "/health/ready" "/api/v1/health/ready"
echo "Ready: ${BASE_URL}/health/ready (fallback: ${BASE_URL}/api/v1/health/ready)"

section "Determinism Regression Suite"
run pnpm exec ts-node --transpile-only --project tsconfig.json edge/api/__tests__/determinism_regression.test.ts

section "Policies: List"
run curl -sS "${BASE_URL}/api/v1/policies" | clip_json 1200

section "Policy: edge-clinical.v1.0.0"
run curl -sS "${BASE_URL}/api/v1/policies/edge-clinical.v1.0.0" | clip_json 1200

section "Create Job"
echo "+ curl -sS -X POST ${BASE_URL}/api/v1/jobs -H content-type: application/json -d {\"kind\":\"eval_run\",\"payload\":{\"case\":\"demo\"}}"
curl -sS -X POST "${BASE_URL}/api/v1/jobs" \
  -H "content-type: application/json" \
  -d '{"kind":"eval_run","payload":{"case":"demo"}}' \
  | tee "${JOB_FILE}" | clip_json 1200

section "Extract Job ID"
JOB_ID="$(
python3 - <<'PY'
import json
print(json.load(open("/tmp/edge_job.json"))["data"]["job_id"])
PY
)"
echo "JOB_ID=${JOB_ID}"

section "Fetch Job"
run curl -sS "${BASE_URL}/api/v1/jobs/${JOB_ID}" | clip_json 1200

section "Replay Job"
run curl -sS "${BASE_URL}/api/v1/jobs/${JOB_ID}/replay" | clip_json 1200

section "Demo complete"
