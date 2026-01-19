import { GroundResponse } from "../api/contract";

export type Decision = GroundResponse["decision"];

export type MetricsSnapshot = {
  cge_version: "v1.0";
  started_at: string;
  total_requests: number;
  decisions: { PROCEED: number; ASK_CLARIFY: number; REFUSE: number; ESCALATE: number };
  debug: { enabled: number; disabled: number };
  rates: {
    refusal_rate: number;
    escalation_rate: number;
    clarify_rate: number;
    proceed_rate: number;
    debug_enabled_rate: number;
  };
};

const startedAtTimestamp = new Date().toISOString();

const state = {
  totalRequests: 0,
  decisions: {
    PROCEED: 0,
    ASK_CLARIFY: 0,
    REFUSE: 0,
    ESCALATE: 0,
  } as Record<Decision, number>,
  debug: {
    enabled: 0,
    disabled: 0,
  },
};

const round4 = (value: number): number => Number.parseFloat(value.toFixed(4));

export function record(decision: Decision, opts: { debug: boolean }): void {
  state.totalRequests += 1;
  state.decisions[decision] += 1;

  if (opts.debug) {
    state.debug.enabled += 1;
  } else {
    state.debug.disabled += 1;
  }
}

export function snapshot(): MetricsSnapshot {
  const total = state.totalRequests;
  const safeRate = (count: number): number => {
    if (total === 0) return 0;
    return round4(count / total);
  };

  return {
    cge_version: "v1.0",
    started_at: startedAtTimestamp,
    total_requests: total,
    decisions: { ...state.decisions },
    debug: { ...state.debug },
    rates: {
      refusal_rate: safeRate(state.decisions.REFUSE),
      escalation_rate: safeRate(state.decisions.ESCALATE),
      clarify_rate: safeRate(state.decisions.ASK_CLARIFY),
      proceed_rate: safeRate(state.decisions.PROCEED),
      debug_enabled_rate: safeRate(state.debug.enabled),
    },
  };
}

export function reset(): void {
  state.totalRequests = 0;
  state.decisions.PROCEED = 0;
  state.decisions.ASK_CLARIFY = 0;
  state.decisions.REFUSE = 0;
  state.decisions.ESCALATE = 0;
  state.debug.enabled = 0;
  state.debug.disabled = 0;
}

export function startedAt(): string {
  return startedAtTimestamp;
}
