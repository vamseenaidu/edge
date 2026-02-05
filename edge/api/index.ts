import { loadRuntimeConfig } from "./runtime/configService";
import { startServer, stopServer } from "./runtime/serverLifecycle";

function main(): void {
  let config;
  try {
    config = loadRuntimeConfig();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Runtime configuration failed";
    // eslint-disable-next-line no-console
    console.error(`EDGE_RUNTIME_CONFIG_ERROR: ${message}`);
    process.exit(1);
    return;
  }

  const logger = (message: string) => {
    // eslint-disable-next-line no-console
    console.log(message);
  };

  const { server } = startServer({
    config,
    logger,
    hooks: {
      onStart: ({ host, port }) => {
        // eslint-disable-next-line no-console
        console.log(`✓ EDGE API listening on ${host}:${port}`);
      },
    },
  });

  const shutdown = (signal: string) => {
    const shutdownLogger = (msg: string) => {
      if (msg.startsWith("EDGE_SHUTDOWN")) {
        logger(`${msg} signal=${signal}`);
      }
    };
    stopServer(server, {
      timeoutMs: config.shutdownTimeoutMs,
      logger: shutdownLogger,
    }).catch(() => undefined);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main();
