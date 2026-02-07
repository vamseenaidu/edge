#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${SCRIPT_DIR}/demo_common.sh"

cd "${ROOT_DIR}"

PORT="${PORT:-3000}"
EDGE_AUTH_ENABLED="${EDGE_AUTH_ENABLED:-0}"
DEMO_AUTO="${DEMO_AUTO:-0}"
BASE_URL="http://localhost:${PORT}"
JOB_FILE="/tmp/edge_job.json"
JOB_STATUS_FILE="/tmp/edge_job_status.json"
REPLAY_FILE="/tmp/edge_replay.json"
SERVER_LOG="/tmp/edge_demo_server.log"
SERVER_PID=""
SERVER_SIGNAL_PID=""

cleanup() {
  cleanup_pid "${SERVER_PID:-}"
}
trap cleanup EXIT

pause_checkpoint() {
  if [[ "${DEMO_AUTO}" == "1" ]]; then
    echo "Auto-advancing in 6 seconds..."
    pause_seconds 6
  else
    pause_enter "Press Enter to continue... "
  fi
}

resolve_server_signal_pid() {
  local wrapper_pid="${1:?wrapper pid is required}"
  local node_pid=""
  local i

  for ((i = 1; i <= 30; i++)); do
    node_pid="$(
      ps -axo pid=,ppid=,comm= | awk -v p="${wrapper_pid}" '$2==p && $3 ~ /node/ {print $1; exit}'
    )"
    if [[ -n "${node_pid}" ]]; then
      echo "${node_pid}"
      return 0
    fi
    sleep 0.1
  done

  echo "${wrapper_pid}"
}

section "EDGE Terminal Demo Harness"
echo "Repo root: ${ROOT_DIR}"
echo "Base URL: ${BASE_URL}"
echo "EDGE_AUTH_ENABLED: ${EDGE_AUTH_ENABLED}"
echo "DEMO_AUTO: ${DEMO_AUTO}"

section "Start API Server"
echo "+ PORT=${PORT} EDGE_AUTH_ENABLED=${EDGE_AUTH_ENABLED} EDGE_DEMO_PROCESS_HOOK=1 pnpm exec ts-node -r ./scripts/demo_process_jobs.ts edge/api/index.ts >${SERVER_LOG} 2>&1 &"
PORT="${PORT}" EDGE_AUTH_ENABLED="${EDGE_AUTH_ENABLED}" EDGE_DEMO_PROCESS_HOOK=1 pnpm exec ts-node -r ./scripts/demo_process_jobs.ts edge/api/index.ts >"${SERVER_LOG}" 2>&1 &
SERVER_PID=$!
SERVER_SIGNAL_PID="$(resolve_server_signal_pid "${SERVER_PID}")"
echo "Server PID: ${SERVER_PID}"
echo "Server signal PID: ${SERVER_SIGNAL_PID}"
echo "Server log: ${SERVER_LOG}"
pause_checkpoint

section "Wait For Readiness"
run wait_ready "${BASE_URL}" 50 0.2 "/health/ready" "/api/v1/health/ready"
SERVER_SIGNAL_PID="$(resolve_server_signal_pid "${SERVER_PID}")"
echo "Ready: ${BASE_URL}/health/ready (fallback: ${BASE_URL}/api/v1/health/ready)"
echo "Resolved server signal PID: ${SERVER_SIGNAL_PID}"
pause_checkpoint

section "Determinism Regression Suite"
run pnpm exec ts-node --transpile-only --project tsconfig.json edge/api/__tests__/determinism_regression.test.ts
pause_checkpoint

section "Policies: List"
run curl -sS "${BASE_URL}/api/v1/policies" | clip_json 1200
pause_checkpoint

section "Policy: edge-clinical.v1.0.0"
run curl -sS "${BASE_URL}/api/v1/policies/edge-clinical.v1.0.0" | clip_json 1200
pause_checkpoint

section "Create Job"
echo "+ curl -sS -X POST ${BASE_URL}/api/v1/jobs -H content-type: application/json -d {\"kind\":\"eval_run\",\"payload\":{\"case\":\"demo\"}}"
curl -sS -X POST "${BASE_URL}/api/v1/jobs" \
  -H "content-type: application/json" \
  -d '{"kind":"eval_run","payload":{"case":"demo"}}' \
  | tee "${JOB_FILE}" | clip_json 1200
pause_checkpoint

section "Extract Job ID"
JOB_ID="$(
python3 - <<'PY'
import json
print(json.load(open("/tmp/edge_job.json"))["data"]["job_id"])
PY
)"
echo "JOB_ID=${JOB_ID}"

section "Process Queued Jobs"
run env JOB_ID="${JOB_ID}" SERVER_PID="${SERVER_SIGNAL_PID}" BASE_URL="${BASE_URL}" pnpm exec ts-node --transpile-only --project tsconfig.json scripts/demo_process_jobs.ts

section "Fetch Job"
echo "+ curl -sS ${BASE_URL}/api/v1/jobs/${JOB_ID}"
curl -sS "${BASE_URL}/api/v1/jobs/${JOB_ID}" | tee "${JOB_STATUS_FILE}" | clip_json 1200
JOB_STATUS="$(
python3 - <<'PY'
import json
print(json.load(open("/tmp/edge_job_status.json"))["data"]["job"]["status"])
PY
)"
echo "JOB_STATUS=${JOB_STATUS}"
if [[ "${JOB_STATUS}" != "completed" ]]; then
  echo "Expected completed job before replay, got: ${JOB_STATUS}" >&2
  exit 1
fi
pause_checkpoint

section "Replay Job"
echo "+ curl -sS ${BASE_URL}/api/v1/jobs/${JOB_ID}/replay"
curl -sS "${BASE_URL}/api/v1/jobs/${JOB_ID}/replay" | tee "${REPLAY_FILE}" | clip_json 1200
REPLAY_KIND="$(
python3 - <<'PY'
import json
print(json.load(open("/tmp/edge_replay.json"))["kind"])
PY
)"
if [[ "${REPLAY_KIND}" != "edge.ok" ]]; then
  echo "Replay failed: expected kind=edge.ok, got ${REPLAY_KIND}" >&2
  exit 1
fi
pause_checkpoint

section "Demo complete"
