import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, devices, firefox, webkit } from "playwright";
import { close, createStaticServer, listen } from "../scripts/static-server.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultExecutables = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
];
const executablePath = process.env.WW_BROWSER_EXECUTABLE
  || defaultExecutables.find((candidate) => existsSync(candidate));
const browserTypeName = process.env.WW_BROWSER_TYPE ?? "chromium";
const browserTypes = { chromium, firefox, webkit };
const browserType = browserTypes[browserTypeName];
const deviceName = process.env.WW_DEVICE;
const deviceDescriptors = {
  android: devices["Pixel 7"],
  ios: devices["iPhone 14"]
};
const deviceDescriptor = deviceName ? deviceDescriptors[deviceName] : null;

if (!browserType) throw new Error(`Unsupported WW_BROWSER_TYPE: ${browserTypeName}`);
if (deviceName && !deviceDescriptor) throw new Error(`Unsupported WW_DEVICE: ${deviceName}`);

let server;
let baseUrl;
let browser;

before(async () => {
  server = createStaticServer(root);
  baseUrl = await listen(server);
  browser = await browserType.launch({
    headless: process.env.WW_HEADFUL !== "1",
    timeout: 30_000,
    ...(browserTypeName === "chromium" ? { executablePath } : {})
  });
  console.log(`E2E browser: ${browserTypeName} ${await browser.version()} (${browserTypeName === "chromium" ? executablePath ?? "Playwright default" : "Playwright managed"}); device=${deviceName ?? "desktop/mobile viewport"}`);
});

after(async () => {
  await browser?.close();
  if (server) await close(server);
});

async function openApp(t, options = {}) {
  const context = await browser.newContext({
    ...(deviceDescriptor ?? {}),
    serviceWorkers: "allow",
    viewport: options.viewport ?? deviceDescriptor?.viewport ?? { width: 390, height: 844 }
  });
  t.after(() => context.close());
  const page = await context.newPage();
  const severeLogs = [];
  page.on("console", (message) => {
    if (message.type() === "error") severeLogs.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => severeLogs.push(`pageerror: ${error.message}`));
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  return { context, page, severeLogs };
}

test("boots without console errors and exposes the core shell", async (t) => {
  const { page, severeLogs } = await openApp(t);
  await assert.doesNotReject(page.getByRole("heading", { name: "おい森 となりノート" }).waitFor());
  assert.equal(await page.getByRole("navigation", { name: "主要メニュー" }).isVisible(), true);
  assert.equal(severeLogs.length, 0, severeLogs.join("\n"));
});

test("localhost is a secure PWA context with manifest and the current service worker cache", async (t) => {
  const { page, severeLogs } = await openApp(t);
  const result = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const manifestUrl = document.querySelector('link[rel="manifest"]')?.href;
    const manifestResponse = manifestUrl ? await fetch(manifestUrl) : null;
    return {
      isSecureContext: window.isSecureContext,
      manifestOk: manifestResponse?.ok ?? false,
      manifestContentType: manifestResponse?.headers.get("content-type") ?? "",
      scope: registration.scope,
      cacheNames: await caches.keys()
    };
  });
  assert.equal(result.isSecureContext, true);
  assert.equal(result.manifestOk, true);
  assert.match(result.manifestContentType, /application\/manifest\+json/);
  assert.match(result.scope, /^http:\/\/127\.0\.0\.1:\d+\/$/);
  assert.ok(result.cacheNames.includes("wild-world-companion-v13"), JSON.stringify(result.cacheNames));
  assert.equal(severeLogs.length, 0, severeLogs.join("\n"));
});

test("service worker update removes old app caches without touching saved state or unrelated caches", async (t) => {
  const { page, severeLogs } = await openApp(t);
  const result = await page.evaluate(async () => {
    const storageKey = "wildWorldCompanionState.v1";
    const saved = {
      schemaVersion: 3,
      caught: { "fish-shark": true },
      donated: { "fish-shark": true }
    };
    localStorage.setItem(storageKey, JSON.stringify(saved));
    await (await caches.open("wild-world-companion-v9")).put("./legacy-marker", new Response("legacy"));
    await (await caches.open("another-app-v1")).put("./other-marker", new Response("other"));

    const previous = await navigator.serviceWorker.ready;
    await previous.unregister();
    const registration = await navigator.serviceWorker.register(`./sw.js?update-test=${Date.now()}`);
    const worker = registration.installing ?? registration.waiting ?? registration.active;
    if (worker?.state !== "activated") {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("service worker activation timed out")), 10_000);
        worker?.addEventListener("statechange", () => {
          if (worker.state === "activated") {
            clearTimeout(timer);
            resolve();
          }
        });
      });
    }
    return {
      cacheNames: await caches.keys(),
      savedState: JSON.parse(localStorage.getItem(storageKey))
    };
  });
  assert.equal(result.cacheNames.includes("wild-world-companion-v9"), false);
  assert.equal(result.cacheNames.includes("wild-world-companion-v13"), true);
  assert.equal(result.cacheNames.includes("another-app-v1"), true);
  assert.equal(result.savedState.caught["fish-shark"], true);
  assert.equal(result.savedState.donated["fish-shark"], true);
  assert.equal(severeLogs.length, 0, severeLogs.join("\n"));
});

test("Japanese search retains focus across incremental input", async (t) => {
  const { page, severeLogs } = await openApp(t);
  await page.getByRole("button", { name: "いきもの" }).click();
  const input = page.getByLabel("検索");
  await input.pressSequentially("サメ");
  assert.equal(await input.inputValue(), "サメ");
  assert.match(await page.locator(".result-count").innerText(), /^[1-9]\d*件 \/ 56件$/);
  assert.equal(severeLogs.length, 0, severeLogs.join("\n"));
});

test("universal search crosses expansion domains and detail back preserves the query", async (t) => {
  const { page, severeLogs } = await openApp(t);
  await page.getByRole("button", { name: "検索", exact: true }).click();
  const input = page.getByLabel("すべてのデータを検索");
  for (const [query, expectedId] of [
    ["アジアなベッド", "item-kagu01-001"],
    ["アイダホ", "resident-004"],
    ["デカバチン", "gyroid-001"],
    ["合言葉", "npc-tsunekichi"],
    ["村メロ", "facility-cutcherry"]
  ]) {
    await input.fill(query);
    assert.equal(await page.locator(`article[data-id="${expectedId}"]`).isVisible(), true, query);
  }
  await input.fill("アジアなベッド");
  await page.locator('article[data-id="item-kagu01-001"]').getByRole("button", { name: "詳細" }).click();
  assert.equal(await page.getByRole("heading", { name: "アジアなベッド" }).isVisible(), true);
  assert.match(await page.locator(".detail-panel").innerText(), /入手方法[\s\S]*NPC[\s\S]*イナリ家具限定/);
  await page.getByRole("button", { name: "← 検索結果へ戻る" }).click();
  assert.equal(await page.getByLabel("すべてのデータを検索").inputValue(), "アジアなベッド");
  assert.equal(severeLogs.length, 0, severeLogs.join("\n"));
});

test("event detail and buy-price-only acquisition remain searchable and explicit", async (t) => {
  const { page, severeLogs } = await openApp(t);
  await page.getByRole("button", { name: "検索", exact: true }).click();
  const input = page.getByLabel("すべてのデータを検索");
  await input.fill("夏 花火 19時");
  const eventCard = page.locator('article[data-id="event-summer-fireworks"]');
  assert.equal(await eventCard.isVisible(), true);
  await eventCard.getByRole("button", { name: "詳細" }).click();
  assert.match(await page.locator(".detail-panel").innerText(), /開催日[\s\S]*8月の毎週土曜日[\s\S]*せんこうはなび/);
  await page.getByRole("button", { name: "← 検索結果へ戻る" }).click();
  await input.fill("てふてふのびんせん");
  const letterCard = page.locator('article[data-id="item-letter-001"]');
  await letterCard.getByRole("button", { name: "詳細" }).click();
  assert.match(await page.locator(".detail-panel").innerText(), /買値 160ベル（販売場所は出典表に記載なし）[\s\S]*販売場所は未特定/);
  assert.equal(severeLogs.length, 0, severeLogs.join("\n"));
});

test("item, gyroid, and resident collection state persists after reload", async (t) => {
  const { page, severeLogs } = await openApp(t);
  await page.getByRole("button", { name: "検索", exact: true }).click();
  const input = page.getByLabel("すべてのデータを検索");
  await input.fill("アジアなベッド");
  const item = page.locator('article[data-id="item-kagu01-001"]');
  await item.getByRole("button", { name: "入手済み" }).click();
  await item.getByRole("button", { name: "カタログ済み" }).click();
  await input.fill("デカバチン");
  await page.locator('article[data-id="gyroid-001"]').getByRole("button", { name: "収集済み" }).click();
  await input.fill("アイダホ");
  await page.locator('article[data-id="resident-004"]').getByRole("button", { name: "お気に入り" }).click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "検索", exact: true }).click();
  const restoredInput = page.getByLabel("すべてのデータを検索");
  await restoredInput.fill("アジアなベッド");
  assert.equal(await page.locator('article[data-id="item-kagu01-001"]').getByRole("button", { name: "入手済み" }).getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator('article[data-id="item-kagu01-001"]').getByRole("button", { name: "カタログ済み" }).getAttribute("aria-pressed"), "true");
  await restoredInput.fill("デカバチン");
  assert.equal(await page.locator('article[data-id="gyroid-001"]').getByRole("button", { name: "収集済み" }).getAttribute("aria-pressed"), "true");
  await restoredInput.fill("アイダホ");
  assert.equal(await page.locator('article[data-id="resident-004"]').getByRole("button", { name: "お気に入り" }).getAttribute("aria-pressed"), "true");
  assert.equal(severeLogs.length, 0, severeLogs.join("\n"));
});

test("expansion records use the accessible local-image fallback", async (t) => {
  const { page, severeLogs } = await openApp(t);
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await page.getByLabel("すべてのデータを検索").fill("デカバチン");
  const card = page.locator('article[data-id="gyroid-001"]');
  assert.equal(await card.getByRole("img", { name: "デカバチンはにわの画像は未登録" }).isVisible(), true);
  assert.equal(await card.locator("img[data-entity-image]").count(), 0);
  assert.equal(severeLogs.length, 0, severeLogs.join("\n"));
});

test("missing local images render stable accessible placeholders", async (t) => {
  const { page, severeLogs } = await openApp(t);
  await page.getByRole("button", { name: "いきもの" }).click();
  await page.getByLabel("検索").fill("サメ");
  const card = page.locator('article[data-id="fish-shark"]');
  const placeholder = card.getByRole("img", { name: "サメの画像は未登録" });
  assert.equal(await placeholder.isVisible(), true);
  assert.equal(await card.locator("img[data-entity-image]").count(), 0);
  const box = await placeholder.boundingBox();
  assert.ok(box && Math.abs(box.width - box.height) <= 1, JSON.stringify(box));
  assert.equal(severeLogs.length, 0, severeLogs.join("\n"));
});

test("conflicted fields remain visibly non-definitive in the working UI", async (t) => {
  const { page } = await openApp(t);
  await page.getByRole("button", { name: "いきもの" }).click();
  await page.getByRole("button", { name: "ムシ" }).click();
  await page.getByLabel("検索").fill("ヤママユガ");
  const notice = page.locator('article[data-id="bug-oak-silk-moth"] .evidence-notice.is-conflict');
  assert.match(await notice.innerText(), /未解決/);
  assert.match(await notice.innerText(), /確認済みとして扱わない/);
});

test("switching fish to bugs removes hidden fish-only filters", async (t) => {
  const { page } = await openApp(t);
  await page.getByRole("button", { name: "いきもの" }).click();
  await page.getByRole("button", { name: "淡水" }).click();
  await page.getByRole("button", { name: "ムシ" }).click();
  assert.notEqual(await page.locator(".result-count").innerText(), "0件 / 56件");
  assert.equal(await page.getByRole("button", { name: "淡水" }).count(), 0);
});

test("calendar browsing never mutates the persisted game clock", async (t) => {
  const { page } = await openApp(t);
  await page.getByRole("button", { name: /ゲーム内時間.*ゲーム内日時を変更/ }).click();
  await page.locator('[data-input="customDateTime"]').fill("2026-08-31T20:30");
  await page.getByRole("button", { name: "月", exact: true }).click();
  await page.getByRole("button", { name: "2月", exact: true }).click();
  assert.equal(await page.locator(".clock-card strong").innerText(), "8月31日 20:30");
  await page.reload({ waitUntil: "domcontentloaded" });
  assert.equal(await page.locator(".clock-card strong").innerText(), "8月31日 20:30");
});

test("calendar exposes source-backed events and resident birthdays", async (t) => {
  const { page, severeLogs } = await openApp(t);
  await page.getByRole("button", { name: "月", exact: true }).click();
  await page.getByRole("button", { name: "8月", exact: true }).click();
  await assert.doesNotReject(page.getByRole("heading", { name: "8月のイベント" }).waitFor());
  assert.match(await page.locator("main").innerText(), /夏の花火大会/);
  await page.getByRole("button", { name: "9月", exact: true }).click();
  assert.match(await page.locator("main").innerText(), /アイダホ[\s\S]*9月28日/);
  assert.equal(severeLogs.length, 0, severeLogs.join("\n"));
});

test("donation invariants persist after reload", async (t) => {
  const { page } = await openApp(t);
  await page.getByRole("button", { name: "いきもの" }).click();
  const shark = page.locator('article[data-id="fish-shark"]');
  await shark.getByRole("button", { name: "寄贈" }).click();
  assert.equal(await shark.getByRole("button", { name: "捕獲" }).getAttribute("aria-pressed"), "true");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "いきもの" }).click();
  const reloaded = page.locator('article[data-id="fish-shark"]');
  assert.equal(await reloaded.getByRole("button", { name: "寄贈" }).getAttribute("aria-pressed"), "true");
});

test("forged art cannot be donated and uses the 10-Bell calculator price", async (t) => {
  const { page } = await openApp(t);
  await page.getByRole("button", { name: "売却" }).click();
  await page.locator('[data-input="query"]').fill("すてきなめいが");
  const art = page.locator('article[data-id="art-dainty-painting"]');
  await art.getByRole("button", { name: "偽物" }).click();
  assert.equal(await art.getByRole("button", { name: "寄贈" }).isDisabled(), true);
  assert.equal(await art.locator(".price").innerText(), "10ベル");
  await page.locator('[data-input="calculatorQuery"]').fill("すてきなめいが");
  await page.locator('.suggestions button[data-id="art-dainty-painting"]').click();
  assert.equal(await page.locator(".calc-total strong").innerText(), "10ベル");
});

test("museum category cards drill down to the selected collection", async (t) => {
  const { page } = await openApp(t);
  await page.getByRole("button", { name: "博物館" }).first().click();
  await page.locator('button[data-filter-museum="fish"]').click();
  assert.equal(await page.getByRole("heading", { name: "サカナ 全件" }).isVisible(), true);
});

test("320px viewport has no critical axe violations, undersized controls, or overflow", async (t) => {
  const { page } = await openApp(t, { viewport: { width: 320, height: 568 } });
  await page.addScriptTag({ url: `${baseUrl}node_modules/axe-core/axe.min.js` });
  const axeResult = await page.evaluate(async () => globalThis.axe.run(document, {
    resultTypes: ["violations"],
    rules: { "color-contrast": { enabled: true } }
  }));
  const critical = axeResult.violations.filter((violation) => ["critical", "serious"].includes(violation.impact));
  const criticalDetails = critical.flatMap((violation) => violation.nodes.map((node) => ({
    id: violation.id,
    impact: violation.impact,
    target: node.target,
    html: node.html,
    failureSummary: node.failureSummary
  })));
  assert.deepEqual(criticalDetails, []);

  const sizes = await page.locator("button:visible, summary:visible, .file-button:visible").evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { label: element.textContent?.trim(), width: rect.width, height: rect.height };
    })
  );
  const undersized = sizes.filter((size) => size.width < 44 || size.height < 44);
  assert.deepEqual(undersized, []);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `horizontal overflow: ${overflow}px`);
});

test("universal search stays usable without horizontal overflow at 375, 390, and 430px", async (t) => {
  for (const width of [375, 390, 430]) {
    const { page, severeLogs } = await openApp(t, { viewport: { width, height: 844 } });
    await page.getByRole("button", { name: "検索", exact: true }).click();
    await page.getByLabel("すべてのデータを検索").fill("アジアなベッド");
    assert.equal(await page.locator('article[data-id="item-kagu01-001"]').isVisible(), true, `${width}px`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `${width}px horizontal overflow: ${overflow}px`);
    assert.equal(severeLogs.length, 0, `${width}px ${severeLogs.join("\n")}`);
  }
});

test("home search reaches historical campaign acquisition and marks it honestly", async (t) => {
  const { page, severeLogs } = await openApp(t);
  const input = page.getByPlaceholder("サカナ、住民、家具、イベントを検索");
  await input.fill("ハテナブロック");
  await input.press("Enter");
  const card = page.locator('article[data-id="item-kagu04-204"]');
  await assert.doesNotReject(card.waitFor());
  await card.getByRole("button", { name: "詳細" }).click();
  const detail = page.locator(".detail-panel");
  assert.match(await detail.innerText(), /歴史的な公式キャンペーン配布記録|DSステーション|すれちがい通信/);
  assert.match(await detail.innerText(), /カタログ注文不可/);
  assert.match(await detail.innerText(), /出典1系統/);
  assert.equal(severeLogs.length, 0, severeLogs.join("\n"));
});

test("collection filters and item state work as a real cross-domain collection", async (t) => {
  const { page, severeLogs } = await openApp(t);
  await page.getByRole("button", { name: "コレクション", exact: true }).click();
  await assert.doesNotReject(page.getByRole("heading", { name: "集めたものを、ひとつのノートに。" }).waitFor());
  await page.getByLabel("コレクション内を検索").fill("ブルーファルコン");
  const card = page.locator('article[data-id="item-kagu04-216"]');
  assert.equal(await card.isVisible(), true);
  await card.getByRole("button", { name: "入手済み" }).click();
  await page.getByRole("button", { name: "集めた", exact: true }).click();
  assert.equal(await card.isVisible(), true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "コレクション", exact: true }).click();
  await page.getByLabel("コレクション内を検索").fill("ブルーファルコン");
  assert.equal(await page.locator('article[data-id="item-kagu04-216"]').getByRole("button", { name: "入手済み" }).getAttribute("aria-pressed"), "true");
  assert.equal(severeLogs.length, 0, severeLogs.join("\n"));
});

test("event source differences are visible in search, detail, and active navigation", async (t) => {
  const { page, severeLogs } = await openApp(t);
  await page.getByRole("button", { name: "検索", exact: true }).click();
  assert.equal(await page.locator('.bottom-nav button[aria-current="page"]').innerText(), "⌕\n検索");
  await page.getByLabel("すべてのデータを検索").fill("つり大会");
  const card = page.locator('article[data-id="event-fishing-tournament"]');
  assert.match(await card.locator(".evidence-notice.is-conflict").innerText(), /WW-EXP-DISC-002/);
  await card.getByRole("button", { name: "詳細" }).click();
  assert.match(await page.locator(".conflict-panel").innerText(), /開始時刻は出典によって異なる/);
  assert.match(await page.locator(".detail-panel").innerText(), /役場前[\s\S]*つりのトロフィー/);
  assert.equal(await page.locator('.bottom-nav button[aria-current="page"]').innerText(), "⌕\n検索");
  assert.equal(severeLogs.length, 0, severeLogs.join("\n"));
});

test("service worker supports an offline reload after the first online load", async (t) => {
  const { page, severeLogs } = await openApp(t);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  // Stop the real origin instead of using Playwright's offline emulation. WebKit 26.5
  // reports an internal error for every offline-emulated navigation, even a plain
  // uncached fixture, while a stopped origin exercises the actual SW fallback.
  await close(server);
  server = undefined;
  await page.reload({ waitUntil: "domcontentloaded" });
  assert.equal(await page.getByRole("heading", { name: "おい森 となりノート" }).isVisible(), true);
  await page.getByRole("button", { name: "いきもの" }).click();
  await page.getByLabel("検索").fill("サメ");
  assert.match(await page.locator(".result-count").innerText(), /^[1-9]\d*件 \/ 56件$/);
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await page.getByLabel("すべてのデータを検索").fill("アジアなベッド");
  assert.equal(await page.locator('article[data-id="item-kagu01-001"]').isVisible(), true);
  assert.equal(severeLogs.length, 0, severeLogs.join("\n"));
});
