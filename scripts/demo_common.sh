#!/usr/bin/env bash

section() {
  local title="${1:-}"
  printf '\n========== %s ==========\n' "$title"
}

run() {
  echo "+ $*"
  "$@"
}

clip_json() {
  local limit="${1:-1200}"
  head -c "$limit"
  echo
}

pause_enter() {
  local prompt="${1:-Press Enter to continue...}"
  printf "%s" "$prompt"
  read -r _
}

pause_seconds() {
  local seconds="${1:-6}"
  sleep "$seconds"
}

wait_ready() {
  local base_url="${1:?base_url is required}"
  local tries="${2:-50}"
  local sleep_s="${3:-0.2}"
  local primary_path="${4:-/health/ready}"
  local fallback_path="${5:-/api/v1/health/ready}"
  local i

  for ((i = 1; i <= tries; i++)); do
    if curl -fsS "${base_url}${primary_path}" >/dev/null 2>&1; then
      return 0
    fi
    if curl -fsS "${base_url}${fallback_path}" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$sleep_s"
  done

  echo "Readiness check failed: ${base_url}${primary_path} (fallback ${fallback_path})" >&2
  return 1
}

cleanup_pid() {
  local pid="${1:-}"
  if [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1; then
    kill "$pid" >/dev/null 2>&1 || true
    wait "$pid" 2>/dev/null || true
  fi
}
