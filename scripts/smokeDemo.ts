import fs from "node:fs/promises";
import path from "node:path";
import { runDemo } from "./demoRunner";

async function main() {
  const outDir = path.join("runs", "demo");

  await fs.rm(outDir, { recursive: true, force: true });

  const { summaryPath, summary } = await runDemo({
    preset: "leadership",
    outDir,
    debug: false,
    silent: true,
  });

  const stat = await fs.stat(summaryPath).catch(() => null);
  if (!stat || !stat.isFile()) {
    throw new Error(`demo summary not found at ${summaryPath}`);
  }

  if (summary.counts.total !== 5) {
    throw new Error(`demo counts.total expected 5 but got ${summary.counts.total}`);
  }

  console.log(`demo smoke ok: ${summaryPath}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
