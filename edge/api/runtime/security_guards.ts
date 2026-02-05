type Env = Record<string, string | undefined>;

const AUTH_MODES = new Set(["dev_allow_anon", "prod_enforce"]);

function isTruthy(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized !== "0" && normalized !== "false" && normalized !== "off" && normalized !== "no";
}

export function assertAuthConfigSafe(env: Env): void {
  if (!isTruthy(env.EDGE_AUTH_ENABLED)) return;
  if (env.EDGE_ALLOW_INSECURE_AUTH === "1") return;

  const mode = env.EDGE_AUTH_MODE;
  if (!mode || !AUTH_MODES.has(mode)) {
    throw new Error("EDGE_AUTH_MISCONFIG: EDGE_AUTH_MODE must be dev_allow_anon or prod_enforce");
  }
}
