export type AuthConfig = {
  enabled: boolean;
};

function parseAuthEnabled(raw: string | undefined): boolean {
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return false;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return false;
}

export function loadAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  return { enabled: parseAuthEnabled(env.EDGE_AUTH_ENABLED) };
}
