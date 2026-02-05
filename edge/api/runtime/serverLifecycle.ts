import http from "node:http";
import type { Express } from "express";
import { createServer, CreateServerOptions } from "./serverFactory";
import { loadRuntimeConfig, RuntimeConfig, RuntimeConfigLoadOptions } from "./configService";

export type StartServerHooks = {
  onStart?: (info: { host: string; port: number }) => void;
  onShutdown?: (info: { reason: "closed" | "timeout"; error?: Error }) => void;
};

export type StartServerOptions = {
  config?: RuntimeConfig;
  configLoad?: RuntimeConfigLoadOptions;
  app?: Express;
  createServerOptions?: CreateServerOptions;
  listen?: (app: Express, config: RuntimeConfig, onListening: () => void) => http.Server;
  logger?: (message: string) => void;
  hooks?: StartServerHooks;
};

export type StartedServer = {
  app: Express;
  server: http.Server;
  config: RuntimeConfig;
  stop: () => Promise<void>;
};

export type StopServerOptions = {
  timeoutMs?: number;
  logger?: (message: string) => void;
  onShutdown?: (info: { reason: "closed" | "timeout"; error?: Error }) => void;
};

export function startServer(options: StartServerOptions = {}): StartedServer {
  const config = options.config ?? loadRuntimeConfig(options.configLoad);
  const app = options.app ?? createServer(options.createServerOptions);
  const listen =
    options.listen ??
    ((instance: Express, cfg: RuntimeConfig, onListening: () => void) =>
      instance.listen(cfg.port, cfg.host, onListening));

  const server = listen(app, config, () => {
    options.hooks?.onStart?.({ host: config.host, port: config.port });
  });

  const stop = () => {
    const stopOptions: StopServerOptions = { timeoutMs: config.shutdownTimeoutMs };
    if (options.logger) stopOptions.logger = options.logger;
    if (options.hooks?.onShutdown) stopOptions.onShutdown = options.hooks.onShutdown;
    return stopServer(server, stopOptions);
  };

  return { app, server, config, stop };
}

export function stopServer(server: http.Server, options: StopServerOptions = {}): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  return new Promise((resolve) => {
    let settled = false;
    const finish = (reason: "closed" | "timeout", error?: Error) => {
      if (settled) return;
      settled = true;
      if (options.onShutdown) {
        const payload = error ? { reason, error } : { reason };
        options.onShutdown(payload);
      }
      resolve();
    };

    const timer = setTimeout(() => {
      if (settled) return;
      options.logger?.("EDGE_SHUTDOWN_TIMEOUT");
      finish("timeout");
    }, timeoutMs);

    options.logger?.("EDGE_SHUTDOWN_START");
    server.close((err) => {
      clearTimeout(timer);
      if (err) {
        options.logger?.(`EDGE_SHUTDOWN_ERROR ${err.message}`);
      } else {
        options.logger?.("EDGE_SHUTDOWN_COMPLETE");
      }
      finish("closed", err ?? undefined);
    });
  });
}
