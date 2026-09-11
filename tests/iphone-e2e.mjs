import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, firefox, webkit } from "playwright";
import { close, createStaticServer, listen } from "../scripts/static-server.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browserTypeName = process.env.WW_BROWSER_TYPE ?? "chromium";
const browserType = { chromium, firefox, webkit }[browserTypeName];
const defaultExecutables = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
];
const executablePath = process.env.WW_BROWSER_EXECUTABLE
  || defaultExecutables.find((candidate) => existsSync(candidate));
const STORAGE_KEY = "wildWorldCompanionState.v1";
const STORAGE_LOCK_NAME = `${STORAGE_KEY}.write`;
const PRIMARY_ITEM_ID = "item-kagu01-001";
const PRIMARY_ITEM_NAME = "アジアなベッド";
const SECONDARY_ITEM_ID = "item-kagu01-002";
const SECONDARY_ITEM_NAME = "アジアなタンス";
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 430, height: 932 },
  { width: 375, height: 812 },
  { width: 428, height: 926 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 }
];

if (!browserType) throw new Error(`Unsupported WW_BROWSER_TYPE: ${browserTypeName}`);

let server;
let baseUrl;
let browser;

before(async () => {
  server = createStaticServer(root);
  baseUrl = await listen(server);
  browser = await browserType.launch({
    headless: process.env.WW_HEADFUL !== "1",
    timeout: 30_000,
    ...(browserTypeName === "chromium" && executablePath ? { executablePath } : {})
  });
  console.log(`iPhone E2E browser: ${browserTypeName} ${await browser.version()} (${browserTypeName === "chromium" ? executablePath ?? "Playwright managed" : "Playwright managed"})`);
});

after(async () => {
  await browser?.close();
  if (server) await close(server);
});

function deterministicState() {
  return {
    schemaVersion: 3,
    clockMode: "custom",
    customDateTime: "2026-08-08T19:30",
    profileName: "iPhone QA村",
    weather: "dry",
    caught: { "fish-carp": true },
    donated: {},
    favorites: {},
    itemAcquired: {},
    itemCataloged: {},
    gyroidCollected: {},
    notes: {},
    calculator: []
  };
}

async function newContext(viewport, state = deterministicState()) {
  const mobile = viewport.width <= 430;
  const context = await browser.newContext({
    acceptDownloads: true,
    colorScheme: "light",
    deviceScaleFactor: mobile ? 3 : 1,
    hasTouch: mobile,
    isMobile: mobile,
    locale: "ja-JP",
    reducedMotion: "reduce",
    serviceWorkers: "allow",
    timezoneId: "Asia/Tokyo",
    viewport
  });
  await context.addInitScript(({ key, seed }) => {
    try {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(seed));
    } catch {
      // about:blank has an opaque origin before the actual app navigation.
    }
  }, { key: STORAGE_KEY, seed: state });
  return context;
}

function monitorPage(page, { expectedConsoleError = () => false } = {}) {
  const severeLogs = [];
  const expectedConsoleErrors = [];
  const failedResponses = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const entry = `console: ${message.text()}`;
    if (expectedConsoleError(entry)) expectedConsoleErrors.push(entry);
    else severeLogs.push(entry);
  });
  page.on("pageerror", (error) => severeLogs.push(`pageerror: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  return { severeLogs, expectedConsoleErrors, failedResponses };
}

async function openApp(t, viewport = { width: 390, height: 844 }, state = deterministicState()) {
  const context = await newContext(viewport, state);
  t.after(() => context.close());
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  const monitor = monitorPage(page);
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "おい森 となりノート" }).waitFor();
  await page.locator('#app[data-expansion-ready="true"]').waitFor();
  return { context, page, ...monitor };
}

async function waitForExpansion(page) {
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await page.getByLabel("すべてのデータを検索").waitFor();
  await page.locator('button[data-action="browseDomain"][data-type="item"]').waitFor();
}

async function routeHome(page) {
  const button = page.locator('.bottom-nav button[data-route="home"]');
  await button.click();
  await page.locator('#app[data-route="home"]').waitFor();
}

async function routeCollection(page) {
  await routeHome(page);
  await page.locator('.quick-grid button[data-route="collection"]').click();
  await page.getByRole("heading", { name: "集めたものを、ひとつのノートに。" }).waitFor();
}

async function routeMore(page) {
  await page.getByRole("button", { name: /ゲーム内時間.*ゲーム内日時を変更/ }).click();
  await page.locator('#app[data-route="more"]').waitFor();
  await page.getByRole("heading", { name: "村時間とデータを整える。" }).waitFor();
}

async function settleLayout(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function reloadApp(page) {
  const previousTimeOrigin = await page.evaluate(() => performance.timeOrigin);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
  } catch (error) {
    const knownManagedWebKitError = browserTypeName === "webkit" && /WebKit encountered an internal error/.test(String(error));
    if (!knownManagedWebKitError) throw error;
    await page.waitForFunction((origin) => performance.timeOrigin !== origin, previousTimeOrigin);
    await page.getByRole("heading", { name: "おい森 となりノート" }).waitFor();
  }
}

async function assertLayoutContract(page, label) {
  await settleLayout(page);
  const originalScrollY = await page.evaluate(() => scrollY);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForFunction(() => {
    const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    return Math.abs(scrollY - maximum) <= 2;
  });
  await settleLayout(page);
  const result = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const describe = (element) => ({
      element: element.tagName.toLowerCase(),
      label: element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 80) || element.getAttribute("placeholder") || "",
      selectorHint: element.getAttribute("data-action") || element.getAttribute("data-route") || element.getAttribute("data-input") || "",
      width: Number(element.getBoundingClientRect().width.toFixed(2)),
      height: Number(element.getBoundingClientRect().height.toFixed(2))
    });
    const controls = [...document.querySelectorAll('button, summary, .file-button, input:not([type="file"]), select, textarea')]
      .filter(visible);
    const undersized = controls
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      })
      .map(describe);
    const undersizedFonts = [...document.querySelectorAll('input:not([type="file"]), select, textarea')]
      .filter(visible)
      .map((element) => ({ ...describe(element), fontSize: Number.parseFloat(getComputedStyle(element).fontSize) }))
      .filter((entry) => entry.fontSize < 16);
    const nav = document.querySelector(".bottom-nav");
    const navRect = nav?.getBoundingClientRect();
    const main = document.querySelector("main");
    const lastMainChild = main
      ? [...main.children].filter(visible).at(-1)
      : null;
    const lastRect = lastMainChild?.getBoundingClientRect();
    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      undersized,
      undersizedFonts,
      nav: navRect ? {
        top: navRect.top,
        right: navRect.right,
        bottom: navRect.bottom,
        left: navRect.left,
        width: navRect.width,
        height: navRect.height,
        display: getComputedStyle(nav).display,
        visibility: getComputedStyle(nav).visibility
      } : null,
      lastMainChildBottom: lastRect?.bottom ?? null,
      innerHeight,
      innerWidth
    };
  });
  await page.evaluate((top) => scrollTo(0, top), originalScrollY);
  await settleLayout(page);
  assert.ok(result.scrollWidth - result.clientWidth <= 1, `${label}: horizontal overflow ${JSON.stringify(result)}`);
  assert.deepEqual(result.undersizedFonts, [], `${label}: input zoom risk`);
  assert.deepEqual(result.undersized, [], `${label}: touch targets below 44 CSS px`);
  assert.ok(result.nav, `${label}: bottom navigation missing`);
  assert.equal(result.nav.display === "none" || result.nav.visibility === "hidden", false, `${label}: bottom navigation hidden without keyboard`);
  assert.ok(result.nav.left >= -1 && result.nav.right <= result.innerWidth + 1, `${label}: navigation escapes viewport: ${JSON.stringify(result.nav)}`);
  assert.ok(result.nav.bottom <= result.innerHeight + 1, `${label}: navigation extends below viewport: ${JSON.stringify(result.nav)}`);
  if (result.lastMainChildBottom !== null) {
    assert.ok(result.lastMainChildBottom <= result.nav.top + 1, `${label}: final content is covered by bottom navigation ${JSON.stringify(result)}`);
  }
}

async function assertNoRuntimeFailures(severeLogs, failedResponses, label) {
  assert.deepEqual(severeLogs, [], `${label}: ${severeLogs.join("\n")}`);
  assert.deepEqual(failedResponses, [], `${label}: ${failedResponses.join("\n")}`);
}

for (const viewport of VIEWPORTS) {
  test(`iPhone layout contract holds at ${viewport.width}x${viewport.height}`, { timeout: 120_000 }, async (t) => {
    const { page, severeLogs, failedResponses } = await openApp(t, viewport);
    const prefix = `${viewport.width}x${viewport.height}`;

    await assertLayoutContract(page, `${prefix} home`);

    await waitForExpansion(page);
    const search = page.getByLabel("すべてのデータを検索");
    await search.fill(PRIMARY_ITEM_NAME);
    await page.locator(`article[data-id="${PRIMARY_ITEM_ID}"]`).waitFor();
    await assertLayoutContract(page, `${prefix} search`);
    await page.locator(`article[data-id="${PRIMARY_ITEM_ID}"]`).getByRole("button", { name: "詳細" }).click();
    await page.locator(`#app[data-route="detail"] article[data-id="${PRIMARY_ITEM_ID}"]`).waitFor();
    await assertLayoutContract(page, `${prefix} item detail`);

    await page.locator('.bottom-nav button[data-route="critters"]').click();
    await page.getByRole("heading", { name: "サカナとムシ" }).waitFor();
    await assertLayoutContract(page, `${prefix} critters`);

    await page.locator('.bottom-nav button[data-route="museum"]').click();
    await page.getByRole("heading", { name: "博物館", exact: true }).waitFor();
    await assertLayoutContract(page, `${prefix} museum`);

    await page.locator('.bottom-nav button[data-route="sell"]').click();
    await page.getByRole("heading", { name: "これ売っていい？" }).waitFor();
    await assertLayoutContract(page, `${prefix} sell`);

    await page.locator('.bottom-nav button[data-route="calendar"]').click();
    await page.getByRole("heading", { name: "村のこよみ" }).waitFor();
    await assertLayoutContract(page, `${prefix} calendar`);

    await routeCollection(page);
    await assertLayoutContract(page, `${prefix} collection`);

    await routeMore(page);
    await assertLayoutContract(page, `${prefix} settings and backup`);
    await assertNoRuntimeFailures(severeLogs, failedResponses, prefix);
  });
}

for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
  test(`primary iPhone flow remains coherent at ${viewport.width}x${viewport.height}`, { timeout: 90_000 }, async (t) => {
    const { page, severeLogs, failedResponses } = await openApp(t, viewport);
    await waitForExpansion(page);
    const initialNav = await page.locator(".bottom-nav").boundingBox();
    const search = page.getByLabel("すべてのデータを検索");
    await search.fill(PRIMARY_ITEM_NAME);
    const item = page.locator(`article[data-id="${PRIMARY_ITEM_ID}"]`);
    await item.waitFor();
    await item.getByRole("button", { name: "詳細" }).click();
    assert.equal(await page.getByRole("heading", { name: PRIMARY_ITEM_NAME }).isVisible(), true);
    await page.getByRole("button", { name: /検索結果.*戻る/ }).click();
    assert.equal(await page.getByLabel("すべてのデータを検索").inputValue(), PRIMARY_ITEM_NAME);

    await routeCollection(page);
    await page.getByLabel("コレクション内を検索").fill(PRIMARY_ITEM_NAME);
    await page.locator(`article[data-id="${PRIMARY_ITEM_ID}"]`).waitFor();
    await page.locator('.bottom-nav button[data-route="calendar"]').click();
    assert.equal(await page.getByRole("heading", { name: "村のこよみ" }).isVisible(), true);
    await routeMore(page);
    assert.equal(await page.getByRole("button", { name: /バックアップを書き出す/ }).isVisible(), true);

    const finalNav = await page.locator(".bottom-nav").boundingBox();
    assert.ok(initialNav && finalNav);
    assert.ok(Math.abs(initialNav.height - finalNav.height) <= 1, `navigation height jumped: ${JSON.stringify({ initialNav, finalNav })}`);
    assert.ok(Math.abs(initialNav.y - finalNav.y) <= 1, `navigation position jumped: ${JSON.stringify({ initialNav, finalNav })}`);
    await assertNoRuntimeFailures(severeLogs, failedResponses, `${viewport.width}x${viewport.height} primary flow`);
  });
}

test("Japanese IME composition keeps the input DOM stable and commits exactly once", { timeout: 45_000 }, async (t) => {
  const { page, severeLogs, failedResponses } = await openApp(t);
  await waitForExpansion(page);
  const result = await page.evaluate(async (itemId) => {
    const app = document.querySelector("#app");
    const input = document.querySelector('input[data-input="universalQuery"]');
    if (!(app instanceof HTMLElement) || !(input instanceof HTMLInputElement)) throw new Error("search input unavailable");
    input.focus();
    const beforeRender = Number(app.dataset.renderCount);
    input.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "ア" }));
    input.value = "ア";
    input.dispatchEvent(new InputEvent("input", { bubbles: true, data: "ア", inputType: "insertCompositionText", isComposing: true }));
    input.value = "アジアな";
    input.dispatchEvent(new InputEvent("input", { bubbles: true, data: "ジアな", inputType: "insertCompositionText", isComposing: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter", isComposing: true }));
    await Promise.resolve();
    const during = {
      sameNode: input === document.querySelector('input[data-input="universalQuery"]'),
      focused: document.activeElement === input,
      renderDelta: Number(app.dataset.renderCount) - beforeRender,
      hasRecentSearch: Boolean(document.querySelector(".recent-searches"))
    };

    input.value = "アジアなベッド";
    input.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "アジアなベッド" }));
    const committedInput = document.querySelector('input[data-input="universalQuery"]');
    if (!(committedInput instanceof HTMLInputElement)) throw new Error("committed input unavailable");
    committedInput.dispatchEvent(new InputEvent("input", { bubbles: true, data: null, inputType: "insertText", isComposing: false }));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return {
      during,
      finalValue: committedInput.value,
      finalFocused: document.activeElement === committedInput,
      renderDelta: Number(app.dataset.renderCount) - beforeRender,
      resultVisible: Boolean(document.querySelector(`article[data-id="${itemId}"]`))
    };
  }, PRIMARY_ITEM_ID);
  assert.deepEqual(result.during, { sameNode: true, focused: true, renderDelta: 0, hasRecentSearch: false });
  assert.equal(result.finalValue, PRIMARY_ITEM_NAME);
  assert.equal(result.finalFocused, true);
  assert.equal(result.renderDelta, 1, JSON.stringify(result));
  assert.equal(result.resultVisible, true);
  await assertNoRuntimeFailures(severeLogs, failedResponses, "Japanese IME");
});

test("search and collection detail back restore query, filters, and scroll", { timeout: 75_000 }, async (t) => {
  const { page, severeLogs, failedResponses } = await openApp(t);
  await waitForExpansion(page);

  await page.locator('button[data-action="setSearchType"][data-type="item"]').click();
  await page.getByLabel("すべてのデータを検索").fill(PRIMARY_ITEM_NAME);
  const searchCard = page.locator(`article[data-id="${PRIMARY_ITEM_ID}"]`);
  await searchCard.waitFor();
  await searchCard.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await settleLayout(page);
  const searchDetailButton = searchCard.getByRole("button", { name: "詳細" });
  const searchBefore = await searchDetailButton.evaluate((button) => {
    const rect = button.getBoundingClientRect();
    const card = button.closest("article");
    const snapshot = {
      scrollY,
      top: card?.getBoundingClientRect().top,
      tappable: rect.top >= 0 && rect.bottom <= innerHeight && button.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2))
    };
    button.click();
    return snapshot;
  });
  assert.equal(searchBefore.tappable, true, "search detail button must be visible and tappable before preserving context");
  await page.getByRole("button", { name: /検索結果.*戻る/ }).click();
  await settleLayout(page);
  const searchAfter = await page.evaluate((id) => ({
    scrollY,
    top: document.querySelector(`article[data-id="${id}"]`)?.getBoundingClientRect().top,
    scrollHeight: document.documentElement.scrollHeight,
    mainHeight: document.querySelector("main")?.getBoundingClientRect().height,
    bodyClasses: document.documentElement.className,
    status: document.querySelector(".status-stack")?.textContent
  }), PRIMARY_ITEM_ID);
  assert.equal(await page.getByLabel("すべてのデータを検索").inputValue(), PRIMARY_ITEM_NAME);
  assert.equal(await page.locator('button[data-action="setSearchType"][data-type="item"]').getAttribute("aria-pressed"), "true");
  assert.ok(Math.abs(searchAfter.scrollY - searchBefore.scrollY) <= 2, JSON.stringify({ searchBefore, searchAfter }));
  assert.ok(Math.abs((searchAfter.top ?? 0) - (searchBefore.top ?? 0)) <= 2, JSON.stringify({ searchBefore, searchAfter }));

  await routeCollection(page);
  await page.locator('button[data-action="setCollectionType"][data-type="item"]').click();
  await page.locator('button[data-action="setCollectionCategory"][data-category="家具・シリーズ"]').click();
  await page.locator('button[data-action="setCollectionFilter"][data-filter="missing"]').click();
  await page.getByLabel("コレクション内を検索").fill(PRIMARY_ITEM_NAME);
  const collectionCard = page.locator(`article[data-id="${PRIMARY_ITEM_ID}"]`);
  await collectionCard.waitFor();
  await collectionCard.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await settleLayout(page);
  const collectionDetailButton = collectionCard.getByRole("button", { name: "詳細" });
  const collectionBefore = await collectionDetailButton.evaluate((button) => {
    const rect = button.getBoundingClientRect();
    const card = button.closest("article");
    const snapshot = {
      scrollY,
      top: card?.getBoundingClientRect().top,
      tappable: rect.top >= 0 && rect.bottom <= innerHeight && button.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2))
    };
    button.click();
    return snapshot;
  });
  assert.equal(collectionBefore.tappable, true, "collection detail button must be visible and tappable before preserving context");
  await page.getByRole("button", { name: /コレクション.*戻る/ }).click();
  await settleLayout(page);
  const restoredCollectionCard = page.locator(`article[data-id="${PRIMARY_ITEM_ID}"]`);
  const collectionAfter = { scrollY: await page.evaluate(() => scrollY), top: (await restoredCollectionCard.boundingBox())?.y };
  assert.equal(await page.getByLabel("コレクション内を検索").inputValue(), PRIMARY_ITEM_NAME);
  assert.equal(await page.locator('button[data-action="setCollectionType"][data-type="item"]').getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator('button[data-action="setCollectionCategory"][data-category="家具・シリーズ"]').getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator('button[data-action="setCollectionFilter"][data-filter="missing"]').getAttribute("aria-pressed"), "true");
  assert.ok(Math.abs(collectionAfter.scrollY - collectionBefore.scrollY) <= 2, JSON.stringify({ collectionBefore, collectionAfter }));
  assert.ok(Math.abs((collectionAfter.top ?? 0) - (collectionBefore.top ?? 0)) <= 2, JSON.stringify({ collectionBefore, collectionAfter }));
  await assertNoRuntimeFailures(severeLogs, failedResponses, "detail back context");
});

test("visibility, pageshow, focus, and online storm coalesces into one recovery", { timeout: 45_000 }, async (t) => {
  const { page, severeLogs, failedResponses } = await openApp(t);
  await waitForExpansion(page);
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await page.getByLabel("すべてのデータを検索").fill("の");
  await page.waitForFunction(() => document.documentElement.scrollHeight - innerHeight > 1_500);
  await settleLayout(page);
  await page.evaluate(() => scrollTo(0, 500));
  await page.waitForFunction(() => scrollY > 300);
  await settleLayout(page);
  const before = await page.evaluate(() => ({
    recoveryCount: Number(document.querySelector("#app")?.dataset.recoveryCount),
    lastRecoveryReasons: document.querySelector("#app")?.dataset.lastRecoveryReasons,
    renderCount: Number(document.querySelector("#app")?.dataset.renderCount),
    scrollY,
    saved: localStorage.getItem("wildWorldCompanionState.v1")
  }));
  assert.equal(Number.isFinite(before.recoveryCount), true, JSON.stringify(before));
  await page.evaluate(() => {
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("online"));
  });
  await page.waitForFunction((count) => Number(document.querySelector("#app")?.dataset.recoveryCount) === count + 1, before.recoveryCount);
  await page.waitForTimeout(650);
  const afterResult = await page.evaluate(() => ({
    recoveryCount: Number(document.querySelector("#app")?.dataset.recoveryCount),
    lastRecoveryReasons: document.querySelector("#app")?.dataset.lastRecoveryReasons,
    renderCount: Number(document.querySelector("#app")?.dataset.renderCount),
    scrollY,
    saved: localStorage.getItem("wildWorldCompanionState.v1"),
    headers: document.querySelectorAll(".app-header").length,
    mains: document.querySelectorAll("main").length,
    navs: document.querySelectorAll(".bottom-nav").length
  }));
  assert.equal(afterResult.recoveryCount, before.recoveryCount + 1, JSON.stringify({ before, afterResult }));
  assert.equal(afterResult.saved, before.saved);
  assert.ok(Math.abs(afterResult.scrollY - before.scrollY) <= 2, JSON.stringify({ before, afterResult }));
  assert.deepEqual({ headers: afterResult.headers, mains: afterResult.mains, navs: afterResult.navs }, { headers: 1, mains: 1, navs: 1 });
  assert.ok(afterResult.renderCount - before.renderCount <= 1, JSON.stringify({ before, afterResult }));
  const visibleAnchorBeforeNotice = await page.evaluate(() => {
    const candidate = [...document.querySelectorAll("main article[data-id]")]
      .map((element) => ({ id: element.getAttribute("data-id"), rect: element.getBoundingClientRect() }))
      .find(({ rect }) => rect.bottom > 0 && rect.top < innerHeight);
    return candidate ? { id: candidate.id, top: candidate.rect.top } : null;
  });
  assert.ok(visibleAnchorBeforeNotice, "resume fixture has no visible content anchor");
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await page.locator(".status-stack .is-offline").waitFor();
  await settleLayout(page);
  const visibleAnchorAfterNotice = await page.evaluate((id) => {
    const rect = document.querySelector(`main article[data-id="${CSS.escape(id)}"]`)?.getBoundingClientRect();
    return rect ? { id, top: rect.top } : null;
  }, visibleAnchorBeforeNotice.id);
  assert.equal(visibleAnchorAfterNotice?.id, visibleAnchorBeforeNotice.id);
  assert.ok(Math.abs((visibleAnchorAfterNotice?.top ?? 0) - visibleAnchorBeforeNotice.top) <= 2, JSON.stringify({ before, visibleAnchorBeforeNotice, visibleAnchorAfterNotice }));
  await assertNoRuntimeFailures(severeLogs, failedResponses, "resume event storm");
});

test("offline operations survive online recovery without reload or state loss", { timeout: 75_000 }, async (t) => {
  let isolatedServer = createStaticServer(root);
  const isolatedUrl = await listen(isolatedServer);
  const isolatedPort = Number(new URL(isolatedUrl).port);
  const context = await newContext({ width: 390, height: 844 });
  t.after(async () => {
    await context.close();
    if (isolatedServer) await close(isolatedServer);
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  let originUnavailable = false;
  const expectedWebKitOfflineError = "console: Failed to load resource: Could not connect to server";
  const { severeLogs, expectedConsoleErrors, failedResponses } = monitorPage(page, {
    expectedConsoleError: (entry) => browserTypeName === "webkit" && originUnavailable && entry === expectedWebKitOfflineError
  });
  await page.goto(isolatedUrl, { waitUntil: "domcontentloaded" });
  await page.locator('#app[data-expansion-ready="true"]').waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await reloadApp(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await assertNoRuntimeFailures(severeLogs, failedResponses, "offline setup");
  originUnavailable = true;
  await close(isolatedServer);
  isolatedServer = null;
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "おい森 となりノート" }).waitFor();
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await page.waitForFunction(() => document.querySelector("#app")?.dataset.online === "false");
  await waitForExpansion(page);
  await page.getByLabel("すべてのデータを検索").fill(PRIMARY_ITEM_NAME);
  const item = page.locator(`article[data-id="${PRIMARY_ITEM_ID}"]`);
  await item.getByRole("button", { name: "入手済み" }).click();
  await routeMore(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /バックアップを書き出す/ }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "wild-world-companion-backup.json");
  await page.evaluate(() => { window.__iphoneOnlineRecoveryDocument = {}; });
  const beforeRecovery = await page.evaluate(() => Number(document.querySelector("#app")?.dataset.recoveryCount));
  isolatedServer = createStaticServer(root);
  await listen(isolatedServer, "127.0.0.1", isolatedPort);
  originUnavailable = false;
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.waitForFunction((count) => Number(document.querySelector("#app")?.dataset.recoveryCount) >= count + 1, beforeRecovery);
  assert.equal(await page.evaluate(() => Boolean(window.__iphoneOnlineRecoveryDocument)), true, "online recovery reloaded the document");
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  assert.equal(saved.itemAcquired[PRIMARY_ITEM_ID], true);
  await page.reload({ waitUntil: "domcontentloaded" });
  const reloaded = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  assert.equal(reloaded.itemAcquired[PRIMARY_ITEM_ID], true);
  assert.ok(expectedConsoleErrors.length <= 1, `unexpected repeated WebKit offline errors: ${expectedConsoleErrors.join("\n")}`);
  await assertNoRuntimeFailures(severeLogs, failedResponses, "offline to online recovery");
});

async function downloadText(download) {
  const stream = await download.createReadStream();
  assert.ok(stream, "download stream unavailable");
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

test("backup download and import round trip while invalid imports leave state byte-identical", { timeout: 75_000 }, async (t) => {
  const { page, severeLogs, failedResponses } = await openApp(t);
  await routeMore(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /バックアップを書き出す/ }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "wild-world-companion-backup.json");
  const exported = JSON.parse(await downloadText(download));
  assert.equal(exported.schemaVersion, 3);
  assert.equal(exported.profileName, "iPhone QA村");

  const imported = {
    schemaVersion: 3,
    profileName: "移行済み村",
    weather: "rain",
    favorites: { "resident-004": true },
    itemAcquired: { [PRIMARY_ITEM_ID]: true },
    itemCataloged: { [PRIMARY_ITEM_ID]: true },
    notes: { [PRIMARY_ITEM_ID]: "PCからiPhoneへ" }
  };
  await page.locator('input[data-input="import"]').setInputFiles({
    name: "iphone-valid-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(imported))
  });
  await page.getByRole("status").filter({ hasText: "バックアップを読み込みました" }).waitFor();
  await page.reload({ waitUntil: "domcontentloaded" });
  let saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  assert.equal(saved.schemaVersion, 3);
  assert.equal(saved.profileName, "移行済み村");
  assert.equal(saved.itemAcquired[PRIMARY_ITEM_ID], true);
  assert.equal(saved.itemCataloged[PRIMARY_ITEM_ID], true);
  assert.equal(saved.notes[PRIMARY_ITEM_ID], "PCからiPhoneへ");

  await routeMore(page);
  const beforeInvalid = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  await page.locator('input[data-input="import"]').setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{not-json")
  });
  await page.getByRole("status").filter({ hasText: "このバックアップは読み込めませんでした" }).waitFor();
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), beforeInvalid);

  await page.locator('input[data-input="import"]').setInputFiles({
    name: "future.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ schemaVersion: 999, profileName: "overwrite attempt" }))
  });
  await page.getByRole("status").filter({ hasText: "このバックアップは読み込めませんでした" }).waitFor();
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), beforeInvalid);
  await page.reload({ waitUntil: "domcontentloaded" });
  saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  assert.equal(saved.profileName, "移行済み村");
  assert.equal(saved.itemAcquired[PRIMARY_ITEM_ID], true);
  await assertNoRuntimeFailures(severeLogs, failedResponses, "backup round trip");
});

test("two open pages serialize simultaneous disjoint collection writes", { timeout: 75_000 }, async (t) => {
  const context = await newContext({ width: 390, height: 844 });
  t.after(() => context.close());
  const pageA = await context.newPage();
  const pageB = await context.newPage();
  const lockHolder = await context.newPage();
  pageA.setDefaultTimeout(15_000);
  pageB.setDefaultTimeout(15_000);
  lockHolder.setDefaultTimeout(15_000);
  const monitorA = monitorPage(pageA);
  const monitorB = monitorPage(pageB);
  await Promise.all([
    pageA.goto(baseUrl, { waitUntil: "domcontentloaded" }),
    pageB.goto(baseUrl, { waitUntil: "domcontentloaded" }),
    lockHolder.goto(baseUrl, { waitUntil: "domcontentloaded" })
  ]);
  await Promise.all([waitForExpansion(pageA), waitForExpansion(pageB)]);
  await Promise.all([
    pageA.getByLabel("すべてのデータを検索").fill(PRIMARY_ITEM_NAME),
    pageB.getByLabel("すべてのデータを検索").fill(SECONDARY_ITEM_NAME)
  ]);
  const buttonA = pageA.locator(`article[data-id="${PRIMARY_ITEM_ID}"]`).getByRole("button", { name: "入手済み" });
  const buttonB = pageB.locator(`article[data-id="${SECONDARY_ITEM_ID}"]`).getByRole("button", { name: "入手済み" });

  await lockHolder.evaluate((lockName) => {
    if (!navigator.locks) throw new Error("Web Locks API is unavailable");
    window.__wwStorageLockHeld = false;
    window.__wwReleaseStorageLock = null;
    void navigator.locks.request(lockName, { mode: "exclusive" }, async () => {
      window.__wwStorageLockHeld = true;
      await new Promise((resolve) => { window.__wwReleaseStorageLock = resolve; });
    });
  }, STORAGE_LOCK_NAME);
  await lockHolder.waitForFunction(() => window.__wwStorageLockHeld === true);

  try {
    await Promise.all([buttonA.click(), buttonB.click()]);
    await lockHolder.waitForFunction(async (lockName) => {
      const snapshot = await navigator.locks.query();
      return snapshot.pending.filter((lock) => lock.name === lockName).length === 2;
    }, STORAGE_LOCK_NAME);
  } finally {
    await lockHolder.evaluate(() => window.__wwReleaseStorageLock?.());
  }

  await pageA.waitForFunction(({ key, firstId, secondId }) => {
    const saved = JSON.parse(localStorage.getItem(key));
    return saved.itemAcquired[firstId] === true && saved.itemAcquired[secondId] === true;
  }, { key: STORAGE_KEY, firstId: PRIMARY_ITEM_ID, secondId: SECONDARY_ITEM_ID });
  await Promise.all([
    pageA.waitForFunction((id) => document.querySelector(`article[data-id="${id}"] button[data-key="itemAcquired"]`)?.getAttribute("aria-pressed") === "true", PRIMARY_ITEM_ID),
    pageB.waitForFunction((id) => document.querySelector(`article[data-id="${id}"] button[data-key="itemAcquired"]`)?.getAttribute("aria-pressed") === "true", SECONDARY_ITEM_ID)
  ]);

  const savedByPage = await Promise.all([pageA, pageB].map((page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY)));
  for (const saved of savedByPage) {
    assert.equal(saved.schemaVersion, 3);
    assert.equal(saved.itemAcquired[PRIMARY_ITEM_ID], true);
    assert.equal(saved.itemAcquired[SECONDARY_ITEM_ID], true);
  }

  const renderCountBeforeRapidToggle = Number(await pageB.locator("#app").getAttribute("data-render-count"));
  await pageB.evaluate((id) => {
    const button = document.querySelector(`article[data-id="${id}"] button[data-key="itemAcquired"]`);
    if (!(button instanceof HTMLButtonElement)) throw new Error("rapid-toggle target is unavailable");
    button.click();
    button.click();
  }, SECONDARY_ITEM_ID);
  await pageB.waitForFunction(({ id, minimumRenderCount, key }) => {
    const saved = JSON.parse(localStorage.getItem(key));
    const button = document.querySelector(`article[data-id="${id}"] button[data-key="itemAcquired"]`);
    const renderCount = Number(document.querySelector("#app")?.getAttribute("data-render-count"));
    return renderCount >= minimumRenderCount
      && saved.itemAcquired[id] === true
      && button?.getAttribute("aria-pressed") === "true";
  }, { id: SECONDARY_ITEM_ID, minimumRenderCount: renderCountBeforeRapidToggle + 2, key: STORAGE_KEY });

  await Promise.all([
    pageA.reload({ waitUntil: "domcontentloaded" }),
    pageB.reload({ waitUntil: "domcontentloaded" })
  ]);
  await Promise.all([
    pageA.locator('#app[data-expansion-ready="true"]').waitFor(),
    pageB.locator('#app[data-expansion-ready="true"]').waitFor()
  ]);
  const savedAfterReload = await pageA.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  assert.equal(savedAfterReload.schemaVersion, 3);
  assert.equal(savedAfterReload.itemAcquired[PRIMARY_ITEM_ID], true);
  assert.equal(savedAfterReload.itemAcquired[SECONDARY_ITEM_ID], true);
  assert.equal(await pageA.locator(`article[data-id="${PRIMARY_ITEM_ID}"] button[data-key="itemAcquired"]`).getAttribute("aria-pressed"), "true");
  assert.equal(await pageB.locator(`article[data-id="${SECONDARY_ITEM_ID}"] button[data-key="itemAcquired"]`).getAttribute("aria-pressed"), "true");
  await assertNoRuntimeFailures(monitorA.severeLogs, monitorA.failedResponses, "storage sync page A");
  await assertNoRuntimeFailures(monitorB.severeLogs, monitorB.failedResponses, "storage sync page B");
});

test("shrinking the visual viewport for the keyboard hides navigation and keeps search visible", { timeout: 45_000 }, async (t) => {
  const { page, severeLogs, failedResponses } = await openApp(t, { width: 390, height: 844 });
  await waitForExpansion(page);
  const input = page.getByLabel("すべてのデータを検索");
  await input.focus();
  await page.setViewportSize({ width: 390, height: 500 });
  await page.waitForFunction(() => document.documentElement.classList.contains("keyboard-open") || document.body.classList.contains("keyboard-open"));
  const compressed = await page.evaluate(() => {
    const nav = document.querySelector(".bottom-nav");
    const search = document.querySelector('input[data-input="universalQuery"]');
    if (!(nav instanceof HTMLElement) || !(search instanceof HTMLInputElement)) throw new Error("keyboard layout controls missing");
    const navStyle = getComputedStyle(nav);
    const navRect = nav.getBoundingClientRect();
    const searchRect = search.getBoundingClientRect();
    const viewportHeight = visualViewport?.height ?? innerHeight;
    return {
      keyboardClass: document.documentElement.classList.contains("keyboard-open") || document.body.classList.contains("keyboard-open"),
      navSuppressed: navStyle.display === "none" || navStyle.visibility === "hidden" || Number(navStyle.opacity) === 0 || navRect.top >= viewportHeight,
      navPointerEvents: navStyle.pointerEvents,
      inputTop: searchRect.top,
      inputBottom: searchRect.bottom,
      viewportHeight,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
  assert.equal(compressed.keyboardClass, true, JSON.stringify(compressed));
  assert.equal(compressed.navSuppressed, true, JSON.stringify(compressed));
  assert.equal(compressed.navPointerEvents, "none", JSON.stringify(compressed));
  assert.ok(compressed.inputTop >= -1 && compressed.inputBottom <= compressed.viewportHeight + 1, JSON.stringify(compressed));
  assert.ok(compressed.overflow <= 1, JSON.stringify(compressed));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => !document.documentElement.classList.contains("keyboard-open") && !document.body.classList.contains("keyboard-open"));
  assert.equal(await page.getByRole("navigation", { name: "主要メニュー" }).isVisible(), true);
  await assertNoRuntimeFailures(severeLogs, failedResponses, "keyboard viewport");
});

test("simulated iPhone safe areas contain header, notices, content, and bottom navigation", { timeout: 45_000 }, async (t) => {
  const { page, severeLogs, failedResponses } = await openApp(t, { width: 390, height: 844 });
  await page.addStyleTag({ content: `:root {
    --safe-area-top: 47px !important;
    --safe-area-right: 11px !important;
    --safe-area-bottom: 34px !important;
    --safe-area-left: 9px !important;
  }` });
  await routeMore(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /バックアップを書き出す/ }).click();
  await downloadPromise;
  await page.locator(".status-stack").waitFor();
  await page.evaluate(() => scrollTo(0, 0));
  await settleLayout(page);
  const geometry = await page.evaluate(() => {
    const rect = (selector) => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      return box ? { top: box.top, right: box.right, bottom: box.bottom, left: box.left } : null;
    };
    return {
      brand: rect(".brand-lockup"),
      firstPageChild: rect("main.page > :first-child"),
      notice: rect(".status-stack"),
      nav: rect(".bottom-nav"),
      width: innerWidth,
      height: innerHeight
    };
  });
  assert.ok(geometry.brand && geometry.brand.top >= 47, JSON.stringify(geometry));
  assert.ok(geometry.firstPageChild && geometry.firstPageChild.left >= 9 && geometry.firstPageChild.right <= geometry.width - 11, JSON.stringify(geometry));
  assert.ok(geometry.notice && geometry.notice.top >= 47 && geometry.notice.left >= 9 && geometry.notice.right <= geometry.width - 11, JSON.stringify(geometry));
  assert.ok(geometry.nav && geometry.nav.left >= 9 && geometry.nav.right <= geometry.width - 11, JSON.stringify(geometry));
  assert.ok(geometry.nav.bottom <= geometry.height - 34 + 1, JSON.stringify(geometry));
  await assertNoRuntimeFailures(severeLogs, failedResponses, "safe-area geometry");
});

test("a failed lazy module recovers with one guarded reload and restores the UI session", { timeout: 60_000 }, async (t) => {
  const context = await browser.newContext({
    locale: "ja-JP",
    reducedMotion: "reduce",
    serviceWorkers: "block",
    timezoneId: "Asia/Tokyo",
    viewport: { width: 390, height: 844 }
  });
  t.after(() => context.close());
  await context.addInitScript(({ key, seed }) => {
    localStorage.setItem(key, JSON.stringify(seed));
  }, { key: STORAGE_KEY, seed: deterministicState() });
  let blocked = false;
  await context.route("**/src/expansion-data.js", async (route) => {
    if (!blocked) {
      blocked = true;
      await route.abort("internetdisconnected");
      return;
    }
    await route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  const monitor = monitorPage(page);
  let reloads = 0;
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame() && frame.url().startsWith(baseUrl)) reloads += 1;
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "おい森 となりノート" }).waitFor();
  await page.getByText("追加データを読み込めませんでした").first().waitFor();
  await page.locator('input[data-input="homeUniversalQuery"]').fill(PRIMARY_ITEM_NAME);
  const navigation = page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await navigation;
  await page.locator('#app[data-expansion-ready="true"]').waitFor();
  assert.equal(await page.locator('input[data-input="homeUniversalQuery"]').inputValue(), PRIMARY_ITEM_NAME);
  await page.waitForTimeout(750);
  assert.equal(reloads, 2, `expected initial navigation plus one recovery reload, got ${reloads}`);
  const unexpectedErrors = monitor.severeLogs.filter((entry) => !/expansion-data|INTERNET_DISCONNECTED|Failed to load resource/i.test(entry));
  assert.deepEqual(unexpectedErrors, [], unexpectedErrors.join("\n"));
  assert.deepEqual(monitor.failedResponses, []);
});

test("QuotaExceeded keeps both memory and persisted collection state unchanged", { timeout: 45_000 }, async (t) => {
  const { page, severeLogs, failedResponses } = await openApp(t);
  await waitForExpansion(page);
  await page.getByLabel("すべてのデータを検索").fill(PRIMARY_ITEM_NAME);
  const before = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem;
    let rejected = false;
    Storage.prototype.setItem = function patchedSetItem(name, value) {
      if (!rejected && name === key) {
        rejected = true;
        Storage.prototype.setItem = original;
        throw new DOMException("quota full", "QuotaExceededError");
      }
      return original.call(this, name, value);
    };
  }, STORAGE_KEY);
  await page.locator(`article[data-id="${PRIMARY_ITEM_ID}"]`).getByRole("button", { name: "入手済み" }).click();
  await page.getByRole("status").filter({ hasText: "端末への保存に失敗しました" }).waitFor();
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), before);
  assert.equal(await page.locator(`article[data-id="${PRIMARY_ITEM_ID}"] button[data-key="itemAcquired"]`).getAttribute("aria-pressed"), "false");
  await page.reload({ waitUntil: "domcontentloaded" });
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), before);
  await assertNoRuntimeFailures(severeLogs, failedResponses, "quota failure atomicity");
});

test("controller changes reload once, retain UI context, and reject a reload loop", { timeout: 60_000 }, async (t) => {
  const { page, severeLogs, failedResponses } = await openApp(t);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.locator('#app[data-expansion-ready="true"]').waitFor();
  await page.waitForFunction(() => navigator.serviceWorker.getRegistration().then((registration) => Boolean(registration && !registration.installing)));
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await page.getByLabel("すべてのデータを検索").fill("の");
  await page.waitForFunction(() => document.documentElement.scrollHeight - innerHeight > 1_500);
  await settleLayout(page);
  await page.evaluate(() => scrollTo(0, Math.min(1_200, document.documentElement.scrollHeight - innerHeight)));
  await page.waitForFunction(() => scrollY > 500);
  await settleLayout(page);
  const viewportBeforeUpdate = await page.evaluate(() => {
    const candidate = [...document.querySelectorAll("main article[data-id]")]
      .map((element) => ({ id: element.getAttribute("data-id"), rect: element.getBoundingClientRect() }))
      .find(({ rect }) => rect.bottom > 0 && rect.top < innerHeight);
    return candidate ? { id: candidate.id, top: candidate.rect.top, scrollY } : null;
  });
  assert.ok(viewportBeforeUpdate && viewportBeforeUpdate.scrollY > 500, JSON.stringify(viewportBeforeUpdate));
  let controlledReloads = 0;
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame() && frame.url().startsWith(baseUrl)) controlledReloads += 1;
  });
  const navigation = page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await page.evaluate(() => navigator.serviceWorker.dispatchEvent(new Event("controllerchange")));
  await navigation;
  await page.locator('#app[data-expansion-ready="true"]').waitFor();
  assert.equal(controlledReloads, 1);
  assert.equal(await page.locator("#app").getAttribute("data-route"), "search");
  assert.equal(await page.getByLabel("すべてのデータを検索").inputValue(), "の");
  await page.waitForFunction((expected) => {
    const element = document.querySelector(`main article[data-id="${CSS.escape(expected.id)}"]`);
    if (!element) return false;
    return Math.abs(element.getBoundingClientRect().top - expected.top) <= 2 && scrollY > 500;
  }, viewportBeforeUpdate);
  await page.evaluate(() => {
    window.__controllerLoopGuardDocument = {};
    navigator.serviceWorker.dispatchEvent(new Event("controllerchange"));
  });
  await page.waitForTimeout(750);
  assert.equal(controlledReloads, 1, "controllerchange reload guard allowed a loop");
  assert.equal(await page.evaluate(() => Boolean(window.__controllerLoopGuardDocument)), true);
  await assertNoRuntimeFailures(severeLogs, failedResponses, "controllerchange guard");
});
