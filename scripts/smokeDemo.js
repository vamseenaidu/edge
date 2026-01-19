"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const demoRunner_1 = require("./demoRunner");
async function main() {
    const outDir = node_path_1.default.join("runs", "demo");
    await promises_1.default.rm(outDir, { recursive: true, force: true });
    const { summaryPath, summary } = await (0, demoRunner_1.runDemo)({
        preset: "leadership",
        outDir,
        debug: false,
        silent: true,
    });
    const stat = await promises_1.default.stat(summaryPath).catch(() => null);
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
