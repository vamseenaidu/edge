import express from "express";
import path from "path";
import routes from "./api/routes";

export const app = express();

// Small hygiene: don’t leak framework details.
app.disable("x-powered-by");

app.use(express.json({ limit: "256kb" }));

// Serve the YC demo UI from /public. Use an absolute path so prod (dist/) works too.
const publicDir = path.resolve(process.cwd(), "public");
const demoPagePath = path.join(publicDir, "demo.html");
app.use(express.static(publicDir));

const cgeVersion = (process.env.CGE_VERSION ?? "v1.0") as "v1.0";
const healthPayload = { ok: true, service: "cge-api", version: cgeVersion };
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json(healthPayload);
};

app.get("/healthz", healthHandler);
app.get("/health", healthHandler);
app.get("/demo", (_req, res) => {
  res.sendFile(demoPagePath);
});

app.use("/v1", routes);

if (require.main === module) {
  const portEnv = process.env.PORT;
  const port = portEnv ? Number(portEnv) : 3000;
  const host = process.env.HOST ?? "0.0.0.0";

  app.listen(port, host, () => {
    // Keep startup deterministic and quiet for tests.
  });
}
