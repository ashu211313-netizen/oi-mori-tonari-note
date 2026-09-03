import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browserType = process.env.WW_BROWSER_TYPE ?? "chromium";
const device = process.env.WW_DEVICE ?? "desktop";
const requestedLabel = process.env.WW_E2E_LABEL ?? `${browserType}-${device}`;
const label = requestedLabel.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
const startedAt = new Date();
const testArgs = ["--test"];
if (process.env.WW_TEST_NAME_PATTERN) testArgs.push("--test-name-pattern", process.env.WW_TEST_NAME_PATTERN);
testArgs.push("tests/e2e.mjs");
const run = spawnSync(process.execPath, testArgs, {
  cwd: root,
  env: process.env,
  encoding: "utf8",
  timeout: 240_000,
  windowsHide: process.env.WW_HEADFUL !== "1"
});
const combined = `${run.stdout ?? ""}${run.stderr ?? ""}`;
const browserLine = /E2E browser: ([^\r\n]+)/.exec(combined)?.[1] ?? null;
const number = (pattern) => Number(pattern.exec(combined)?.[1] ?? 0);
const report = {
  generatedAt: new Date().toISOString(),
  label,
  requested: {
    browserType,
    executable: process.env.WW_BROWSER_EXECUTABLE ?? null,
    device,
    headful: process.env.WW_HEADFUL === "1",
    testNamePattern: process.env.WW_TEST_NAME_PATTERN ?? null
  },
  observed: browserLine,
  result: run.status === 0 ? "PASS" : run.error?.code === "ETIMEDOUT" ? "TIMEOUT" : "FAIL",
  tests: number(/ℹ tests (\d+)/),
  pass: number(/ℹ pass (\d+)/),
  fail: number(/ℹ fail (\d+)/),
  exitCode: run.status,
  durationMs: Date.now() - startedAt.getTime(),
  interpretation: device === "desktop"
    ? "Browser-engine E2E; actual browser status is identified by observed executable/version."
    : "Playwright device descriptor only; not a physical-device PASS.",
  stdout: run.stdout ?? "",
  stderr: run.stderr ?? "",
  spawnError: run.error ? String(run.error.message ?? run.error) : null
};
const output = path.join(root, "artifacts", "qa", `e2e-${label}.json`);
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(combined);
console.log(JSON.stringify({ output: path.relative(root, output), ...report, stdout: undefined, stderr: undefined }, null, 2));
if (run.status !== 0) process.exitCode = run.status ?? 1;
