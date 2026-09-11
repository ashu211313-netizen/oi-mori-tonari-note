import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit } from "playwright";
import { close, createStaticServer, listen } from "./static-server.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(repositoryRoot, "artifacts", "qa", "iphone-first");
const storageKey = "wildWorldCompanionState.v1";
const primaryItemId = "item-kagu01-001";
const viewportTargets = [
  { slug: "390x844", width: 390, height: 844 },
  { slug: "430x932", width: 430, height: 932 }
];
const browserTarget = (process.env.WW_SCREENSHOT_BROWSER ?? process.env.WW_BROWSER_TYPE ?? "chrome").toLowerCase();
const chromeCandidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
];

const screenDefinitions = [
  { number: 1, slug: "home", label: "Home", expectedRoute: "home" },
  { number: 2, slug: "search", label: "Search", expectedRoute: "search" },
  { number: 3, slug: "fish-detail", label: "Fish detail", expectedRoute: "detail", entityId: "fish-shark" },
  { number: 4, slug: "item-detail", label: "Item detail", expectedRoute: "detail", entityId: primaryItemId },
  { number: 5, slug: "resident-detail", label: "Resident detail", expectedRoute: "detail", entityId: "resident-004" },
  { number: 6, slug: "npc-detail", label: "NPC detail", expectedRoute: "detail", entityId: "npc-tsunekichi" },
  { number: 7, slug: "facility-detail", label: "Facility detail", expectedRoute: "detail", entityId: "facility-cutcherry" },
  { number: 8, slug: "event-detail", label: "Event detail", expectedRoute: "detail", entityId: "event-summer-fireworks" },
  { number: 9, slug: "museum", label: "Museum", expectedRoute: "museum" },
  { number: 10, slug: "collection", label: "Collection", expectedRoute: "collection" },
  { number: 11, slug: "calendar", label: "Calendar", expectedRoute: "calendar" },
  { number: 12, slug: "settings", label: "Settings", expectedRoute: "more" },
  { number: 13, slug: "backup", label: "Backup", expectedRoute: "more" }
];

function deterministicState() {
  return {
    schemaVersion: 3,
    clockMode: "custom",
    customDateTime: "2026-08-08T19:30",
    offsetBaseReal: "",
    offsetBaseGame: "",
    profileName: "iPhone QA村",
    weather: "dry",
    caught: { "fish-carp": true, "fish-shark": true, "bug-cicada": true },
    acquired: { "fossil-ammonite": true },
    genuine: {},
    forged: {},
    identified: { "fossil-ammonite": true },
    donated: { "fish-carp": true },
    favorites: { "resident-004": true, "npc-tsunekichi": true },
    itemAcquired: { [primaryItemId]: true },
    itemCataloged: { [primaryItemId]: true },
    gyroidCollected: { "gyroid-001": true },
    notes: { [primaryItemId]: "iPhone QA用の決定的な保存状態" },
    calculator: []
  };
}

function selectBrowser() {
  if (browserTarget === "webkit") {
    return { type: webkit, label: "managed WebKit", launchOptions: {} };
  }
  if (!["chrome", "chromium"].includes(browserTarget)) {
    throw new Error(`Unsupported screenshot browser: ${browserTarget}. Use chrome, chromium, or webkit.`);
  }
  const executablePath = process.env.WW_BROWSER_EXECUTABLE
    || chromeCandidates.find((candidate) => existsSync(candidate));
  return {
    type: chromium,
    label: executablePath ? "Google Chrome" : "managed Chromium",
    launchOptions: executablePath ? { executablePath } : {}
  };
}

function monitorPage(page) {
  const failures = [];
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(`http ${response.status()}: ${response.url()}`);
  });
  return failures;
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts?.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function createPage(browser, baseUrl, viewport) {
  const context = await browser.newContext({
    acceptDownloads: true,
    colorScheme: "light",
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
    locale: "ja-JP",
    reducedMotion: "reduce",
    // Screenshot output must not depend on a worker left behind by a prior
    // context. Service-worker lifecycle is exercised by the dedicated PWA QA.
    serviceWorkers: "block",
    timezoneId: "Asia/Tokyo",
    viewport: { width: viewport.width, height: viewport.height }
  });
  await context.addInitScript(({ key, seed }) => {
    localStorage.setItem(key, JSON.stringify(seed));
    sessionStorage.clear();
  }, { key: storageKey, seed: deterministicState() });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  const failures = monitorPage(page);
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.getByRole("heading", { name: "おい森 となりノート" }).waitFor();
  await page.locator('#app[data-expansion-ready="true"]').waitFor();
  await page.addStyleTag({
    content: "*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important;scroll-behavior:auto!important}"
  });
  await settle(page);
  return { context, page, failures };
}

async function goToRoute(page, route) {
  if (route === "collection") {
    await goToRoute(page, "home");
    await page.locator('.quick-grid button[data-route="collection"]').click();
  } else if (route === "more") {
    await page.locator(".clock-card").click();
  } else {
    const button = page.locator(`.bottom-nav button[data-route="${route}"]`);
    await button.waitFor();
    await button.click();
  }
  await page.locator(`#app[data-route="${route}"]`).waitFor();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "auto" }));
  await settle(page);
}

async function openEntityDetail(page, query, entityId) {
  await goToRoute(page, "search");
  const input = page.getByLabel("すべてのデータを検索");
  await input.fill(query);
  const card = page.locator(`article[data-id="${entityId}"]`);
  await card.waitFor();
  await card.getByRole("button", { name: "詳細" }).click();
  await page.locator(`#app[data-route="detail"] article[data-id="${entityId}"]`).waitFor();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "auto" }));
  await settle(page);
}

function pngDimensions(buffer) {
  const signature = "89504e470d0a1a0a";
  assert.equal(buffer.subarray(0, 8).toString("hex"), signature, "capture is not a PNG file");
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "IHDR", "PNG does not begin with an IHDR chunk");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function capture(page, viewport, definition, manifestEntries) {
  const actualRoute = await page.locator("#app").getAttribute("data-route");
  assert.equal(actualRoute, definition.expectedRoute, `${definition.label}: unexpected route`);
  if (definition.entityId) {
    await page.locator(`article[data-id="${definition.entityId}"]`).waitFor();
  }
  const filename = `${String(definition.number).padStart(2, "0")}-${definition.slug}.png`;
  assert.match(filename, /^\d{2}-[a-z0-9-]+\.png$/, `${definition.label}: unsafe filename`);
  const directory = path.join(outputRoot, viewport.slug);
  await mkdir(directory, { recursive: true });
  const absolutePath = path.join(directory, filename);
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    fullPage: false,
    path: absolutePath,
    scale: "css"
  });
  const buffer = await readFile(absolutePath);
  const dimensions = pngDimensions(buffer);
  assert.deepEqual(dimensions, { width: viewport.width, height: viewport.height }, `${definition.label}: PNG dimensions differ from the CSS viewport`);
  manifestEntries.push({
    label: definition.label,
    filename,
    file: path.relative(repositoryRoot, absolutePath).replaceAll(path.sep, "/"),
    viewport: { width: viewport.width, height: viewport.height },
    png: dimensions,
    expectedRoute: definition.expectedRoute,
    actualRoute,
    ...(definition.entityId ? { entityId: definition.entityId } : {}),
    sha256: createHash("sha256").update(buffer).digest("hex")
  });
}

async function captureViewport(browser, baseUrl, viewport, manifestEntries) {
  const { context, page, failures } = await createPage(browser, baseUrl, viewport);
  try {
    await capture(page, viewport, screenDefinitions[0], manifestEntries);

    await goToRoute(page, "search");
    await page.getByLabel("すべてのデータを検索").fill("アジア");
    await page.locator(`article[data-id="${primaryItemId}"]`).waitFor();
    await settle(page);
    await capture(page, viewport, screenDefinitions[1], manifestEntries);

    const details = [
      ["サメ", "fish-shark"],
      ["アジアなベッド", primaryItemId],
      ["アイダホ", "resident-004"],
      ["合言葉", "npc-tsunekichi"],
      ["村メロ", "facility-cutcherry"],
      ["夏 花火 19時", "event-summer-fireworks"]
    ];
    for (let index = 0; index < details.length; index += 1) {
      const [query, entityId] = details[index];
      await openEntityDetail(page, query, entityId);
      await capture(page, viewport, screenDefinitions[index + 2], manifestEntries);
    }

    await goToRoute(page, "museum");
    await page.getByRole("heading", { name: "博物館", exact: true }).waitFor();
    await capture(page, viewport, screenDefinitions[8], manifestEntries);

    await goToRoute(page, "collection");
    await page.getByRole("heading", { name: "集めたものを、ひとつのノートに。" }).waitFor();
    await capture(page, viewport, screenDefinitions[9], manifestEntries);

    await goToRoute(page, "calendar");
    await page.getByRole("heading", { name: "村のこよみ" }).waitFor();
    await capture(page, viewport, screenDefinitions[10], manifestEntries);

    await goToRoute(page, "more");
    await page.getByRole("heading", { name: "村時間とデータを整える。" }).waitFor();
    await capture(page, viewport, screenDefinitions[11], manifestEntries);

    const backup = page.locator(".backup-card");
    await backup.scrollIntoViewIfNeeded();
    await settle(page);
    await capture(page, viewport, screenDefinitions[12], manifestEntries);

    assert.deepEqual(failures, [], `${viewport.slug} runtime failures:\n${failures.join("\n")}`);
  } finally {
    await context.close();
  }
}

async function captureKeyboardSpace(browser, baseUrl, manifestEntries) {
  const initialViewport = { slug: "390x844", width: 390, height: 844 };
  const keyboardViewport = { slug: "390x500", width: 390, height: 500 };
  const { context, page, failures } = await createPage(browser, baseUrl, initialViewport);
  try {
    await goToRoute(page, "search");
    const input = page.getByLabel("すべてのデータを検索");
    await input.fill("アジアな");
    await input.focus();
    await page.setViewportSize({ width: keyboardViewport.width, height: keyboardViewport.height });
    await page.waitForFunction(() => document.documentElement.classList.contains("keyboard-open"));
    await settle(page);
    const definition = {
      number: 14,
      slug: "keyboard-space",
      label: "Search with keyboard space",
      expectedRoute: "search"
    };
    await capture(page, keyboardViewport, definition, manifestEntries);
    assert.deepEqual(failures, [], `390x500 keyboard runtime failures:\n${failures.join("\n")}`);
  } finally {
    await context.close();
  }
}

async function listPngFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listPngFiles(target));
    else if (entry.isFile() && entry.name.endsWith(".png")) files.push(path.relative(repositoryRoot, target).replaceAll(path.sep, "/"));
  }
  return files.sort();
}

async function main() {
  const artifactsRoot = path.join(repositoryRoot, "artifacts") + path.sep;
  assert.ok(outputRoot.startsWith(artifactsRoot), `Refusing to replace an output outside artifacts: ${outputRoot}`);
  await rm(outputRoot, { force: true, recursive: true });
  await mkdir(outputRoot, { recursive: true });

  const selection = selectBrowser();
  const server = createStaticServer(repositoryRoot);
  let browser;
  try {
    const baseUrl = await listen(server);
    browser = await selection.type.launch({
      headless: process.env.WW_HEADFUL !== "1",
      timeout: 30_000,
      ...selection.launchOptions
    });
    const browserVersion = await browser.version();
    const captures = [];
    for (const viewport of viewportTargets) {
      await captureViewport(browser, baseUrl, viewport, captures);
    }
    await captureKeyboardSpace(browser, baseUrl, captures);

    assert.equal(captures.length, 27, "expected 26 primary screenshots plus one keyboard-space screenshot");
    const actualPngFiles = await listPngFiles(outputRoot);
    const declaredPngFiles = captures.map((entry) => entry.file).sort();
    assert.deepEqual(actualPngFiles, declaredPngFiles, "manifest capture list differs from PNG files on disk");
    assert.equal(new Set(captures.map((entry) => entry.file)).size, captures.length, "duplicate capture filename");

    const manifest = {
      schemaVersion: 1,
      result: "PASS",
      generatedAt: new Date().toISOString(),
      browser: {
        requested: browserTarget,
        engine: browserTarget === "webkit" ? "webkit" : "chromium",
        product: selection.label,
        version: browserVersion,
        headless: process.env.WW_HEADFUL !== "1"
      },
      deterministicFixture: {
        locale: "ja-JP",
        timezone: "Asia/Tokyo",
        reducedMotion: "reduce",
        colorScheme: "light",
        deviceScaleFactor: 3,
        screenshotScale: "css",
        serviceWorkers: "block (covered by dedicated PWA QA)",
        gameDateTime: deterministicState().customDateTime,
        stateSchemaVersion: deterministicState().schemaVersion
      },
      expectedCaptureCount: 27,
      captureCount: captures.length,
      primaryViewports: viewportTargets.map(({ width, height }) => ({ width, height })),
      captures
    };
    const manifestPath = path.join(outputRoot, "manifest.json");
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    const persistedManifest = JSON.parse(await readFile(manifestPath, "utf8"));
    assert.equal(persistedManifest.result, "PASS");
    assert.equal(persistedManifest.captureCount, 27);
    assert.equal(persistedManifest.captures.length, 27);
    console.log(`iPhone screenshot audit PASS: ${captures.length} PNG files (${selection.label} ${browserVersion})`);
    console.log(`Manifest: ${path.relative(repositoryRoot, manifestPath)}`);
  } finally {
    await browser?.close();
    await close(server);
  }
}

await main();
