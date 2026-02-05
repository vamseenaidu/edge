import fs from "node:fs";

export type RuntimeConfig = {
  host: string;
  port: number;
  shutdownTimeoutMs: number;
};

export type RuntimeConfigOverrides = Partial<RuntimeConfig>;

export type RuntimeConfigLoadOptions = {
  env?: NodeJS.ProcessEnv;
  overrides?: RuntimeConfigOverrides;
  configFilePath?: string;
  logger?: (message: string) => void;
};

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 3000;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const parsePort = (raw: unknown, source: string): number | undefined => {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > 65535) {
    throw new Error(`Invalid ${source} value; expected integer between 0 and 65535`);
  }
  return value;
};

const parseTimeoutMs = (raw: unknown, source: string): number | undefined => {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid ${source} value; expected integer >= 0`);
  }
  return value;
};

const parseHost = (raw: unknown): string | undefined => normalizeString(raw);

const readJsonConfig = (filePath: string): Record<string, unknown> => {
  let text: string;
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    throw new Error(`EDGE config file read failed: ${message}`);
  }

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("EDGE config file must be a JSON object");
    }
    return parsed;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    throw new Error(`EDGE config file parse failed: ${message}`);
  }
};

const coerceConfig = (raw: Record<string, unknown>, source: string): Partial<RuntimeConfig> => {
  const host = parseHost(raw.host);
  const port = parsePort(raw.port, `${source}.port`);
  const shutdownTimeoutMs = parseTimeoutMs(raw.shutdownTimeoutMs, `${source}.shutdownTimeoutMs`);
  return {
    ...(host ? { host } : {}),
    ...(port !== undefined ? { port } : {}),
    ...(shutdownTimeoutMs !== undefined ? { shutdownTimeoutMs } : {}),
  };
};

const readConfigFile = (filePath: string): Partial<RuntimeConfig> => {
  const raw = readJsonConfig(filePath);
  return coerceConfig(raw, "config file");
};

const readEnvConfig = (env: NodeJS.ProcessEnv): Partial<RuntimeConfig> => {
  const host = parseHost(env.EDGE_HOST ?? env.HOST);
  const port = parsePort(env.EDGE_PORT ?? env.PORT, "PORT");
  const shutdownTimeoutMs = parseTimeoutMs(env.EDGE_SHUTDOWN_TIMEOUT_MS, "EDGE_SHUTDOWN_TIMEOUT_MS");

  return {
    ...(host ? { host } : {}),
    ...(port !== undefined ? { port } : {}),
    ...(shutdownTimeoutMs !== undefined ? { shutdownTimeoutMs } : {}),
  };
};

export function resolveConfigFilePath(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return normalizeString(env.EDGE_RUNTIME_CONFIG_FILE ?? env.EDGE_CONFIG_FILE);
}

export function loadRuntimeConfig(options: RuntimeConfigLoadOptions = {}): RuntimeConfig {
  const env = options.env ?? process.env;
  const defaults: RuntimeConfig = {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    shutdownTimeoutMs: DEFAULT_SHUTDOWN_TIMEOUT_MS,
  };

  const configFilePath = options.configFilePath ?? resolveConfigFilePath(env);
  const fileConfig = configFilePath ? readConfigFile(configFilePath) : {};
  const envConfig = readEnvConfig(env);
  const overrides = options.overrides ?? {};

  const merged: RuntimeConfig = {
    ...defaults,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };

  if (!merged.host || typeof merged.host !== "string") {
    throw new Error("Invalid host value; expected non-empty string");
  }
  if (!Number.isInteger(merged.port) || merged.port < 0 || merged.port > 65535) {
    throw new Error("Invalid port value; expected integer between 0 and 65535");
  }
  if (!Number.isInteger(merged.shutdownTimeoutMs) || merged.shutdownTimeoutMs < 0) {
    throw new Error("Invalid shutdownTimeoutMs value; expected integer >= 0");
  }

  return merged;
}

export function getBindHost(env: NodeJS.ProcessEnv = process.env): string {
  return loadRuntimeConfig({ env }).host;
}

export function getDefaultRuntimeConfig(): RuntimeConfig {
  return {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    shutdownTimeoutMs: DEFAULT_SHUTDOWN_TIMEOUT_MS,
  };
}
