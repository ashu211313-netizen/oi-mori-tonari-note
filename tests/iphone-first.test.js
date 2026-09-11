import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(path.join(root, relative), "utf8");

test("iPhone install shell has an exact 180px apple touch icon", () => {
  const html = read("index.html");
  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/);
  assert.match(html, /rel="apple-touch-icon" sizes="180x180" href="\.\/icon-180\.png"/);
  const png = readFileSync(path.join(root, "icon-180.png"));
  assert.equal(png.readUInt32BE(16), 180);
  assert.equal(png.readUInt32BE(20), 180);
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.theme_color, "#f5eedb");
  assert.equal(manifest.background_color, "#f5eedb");
});

test("iPhone layout contract covers dynamic viewport, all safe areas, keyboard and input zoom", () => {
  const css = read("src/styles.css");
  for (const side of ["top", "right", "bottom", "left"]) {
    assert.match(css, new RegExp(`env\\(safe-area-inset-${side}\\)`), `missing safe-area ${side}`);
  }
  assert.match(css, /min-height:\s*100svh/);
  assert.match(css, /min-height:\s*100dvh/);
  assert.match(css, /input[\s\S]*select[\s\S]*textarea[\s\S]*font-size:\s*16px/);
  assert.match(css, /\.keyboard-open\s+\.bottom-nav/);
  assert.match(css, /--visual-viewport-height/);
});

test("resume coordinator coalesces event storms and keeps recovery single-flight", async () => {
  const { createResumeCoordinator } = await import("../src/lifecycle.js");
  const calls = [];
  let releaseFirst;
  const firstBlock = new Promise((resolve) => { releaseFirst = resolve; });
  const coordinator = createResumeCoordinator(async (reasons) => {
    calls.push(reasons);
    if (calls.length === 1) await firstBlock;
  }, { delay: 10 });

  coordinator.schedule("visibilitychange");
  coordinator.schedule("pageshow");
  coordinator.schedule("focus");
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(calls.length, 1);
  assert.deepEqual(new Set(calls[0]), new Set(["visibilitychange", "pageshow", "focus"]));

  coordinator.schedule("online");
  coordinator.schedule("focus");
  releaseFirst();
  await coordinator.whenIdle();
  assert.equal(calls.length, 2);
  assert.deepEqual(new Set(calls[1]), new Set(["online", "focus"]));
  coordinator.dispose();
});

test("app handles Japanese composition and iPhone lifecycle without per-event reloads", () => {
  const app = read("src/app.js");
  assert.match(app, /compositionstart/);
  assert.match(app, /compositionend/);
  assert.match(app, /isComposing/);
  for (const event of ["visibilitychange", "pageshow", "focus", "online", "offline"]) {
    // The escaped quotes are part of the generated regular-expression source.
    // eslint-disable-next-line no-useless-escape
    assert.match(app, new RegExp(`addEventListener\\(\"${event}\"`), `missing ${event}`);
  }
  assert.match(app, /createResumeCoordinator/);
  assert.match(app, /controllerchange/);
  assert.match(app, /SKIP_WAITING/);
  assert.match(app, /updateViaCache:\s*"none"/);
  assert.match(app, /sessionStorage/);
});

test("service worker update waits for an explicit handoff and protects the current client", () => {
  const sw = read("sw.js");
  assert.match(sw, /wild-world-companion-v15/);
  assert.match(sw, /addEventListener\("message"/);
  assert.match(sw, /SKIP_WAITING/);
  const installBody = /addEventListener\("install",[\s\S]*?\n\}\);/.exec(sw)?.[0] ?? "";
  assert.equal(installBody.includes("skipWaiting"), false);
});

test("pull requests and Pages deployment run the iPhone-first browser gate", () => {
  const ci = read(".github/workflows/ci.yml");
  const pages = read(".github/workflows/pages.yml");
  assert.match(ci, /pnpm run test:iphone/);
  assert.match(ci, /pnpm run capture:iphone/);
  assert.match(ci, /WW_BROWSER_TYPE:\s*webkit/);
  assert.match(ci, /WW_SCREENSHOT_BROWSER:\s*webkit/);
  assert.match(pages, /pnpm run test:iphone/);
  assert.match(pages, /WW_BROWSER_TYPE:\s*webkit/);
  assert.match(pages, /pnpm run test:e2e/);
  assert.match(pages, /pnpm run test:pages/);
});

test("live offline verification proves the network boundary without trusting reload navigator.onLine", () => {
  const verifier = read("scripts/verify-live-pages.mjs");
  assert.match(verifier, /#app\[data-online="false"\][\s\S]*__offline-network-probe-/);
  assert.match(verifier, /if \(!networkProbe\.blocked\) throw new Error/);
  assert.match(verifier, /serviceWorkerReloadRendered:\s*true/);
  assert.match(verifier, /savedStatePreserved:\s*true/);
  assert.match(verifier, /offline reload lost Service Worker control/);
});

test("public HTTPS verification models GitHub Pages host controls without hiding their limits", () => {
  const verifier = read("scripts/verify-public-https.mjs");
  assert.match(verifier, /hostname\.endsWith\("\.github\.io"\)/);
  assert.match(verifier, /GitHub Pages HSTS plus repository-controlled self-only document CSP/);
  assert.match(verifier, /maxAge > 600/);
  assert.match(verifier, /updateViaCache=none and explicit update\(\)/);
  assert.match(verifier, /cannot provide frame-ancestors, X-Content-Type-Options, or Permissions-Policy/);
});
