import {
  allEntities,
  artList,
  bugList,
  dataDiscrepancies,
  dataVersion,
  fishList,
  fossilList,
  getProvenanceCoverage,
  museumCategories,
  sources
} from "./data.js";
import { getSmartRecommendations } from "./recommendations.js";
import { getEffectiveSellPrice } from "./pricing.js";
import { getEvidenceNoticeModel, matchesQuery, sanitizeCritterFilters } from "./ui-logic.js";
import {
  formatDateTime,
  formatDuration,
  getAvailabilityStatus,
  getAvailableUndonated,
  getGameDate,
  getHighestValueAvailable,
  getLeavingThisMonth,
  getNextAvailableTime,
  getRemainingAvailability,
  isPotentiallyAvailableNow
} from "./availability.js";
import {
  exportState,
  importStateFile,
  loadState,
  MAX_CALCULATOR_QUANTITY,
  normalizeQuantity,
  saveState
} from "./storage.js";

const app = /** @type {HTMLElement} */ (document.querySelector("#app"));
let state = loadState();
let route = "home";
let critterType = "fish";
let query = "";
let activeFilters = new Set();
let calculatorQuery = "";
let museumType = null;
let calendarMonth = null;
let universalQuery = "";
let universalType = "all";
let collectionQuery = "";
let collectionType = "item";
let collectionFilter = "all";
let collectionCategory = "all";
let detailReturnRoute = "search";
let recentSearches = [];
let noticeMessage = "";
let noticeTone = "success";
let selectedEntityId = null;
let expansionReady = false;
let expansionLoadError = null;
let expansionLoadPromise = null;
/** @type {readonly any[]} */
let expansionSources = [];
/** @type {readonly any[]} */
let eventList = [];
/** @type {readonly any[]} */
let facilityList = [];
/** @type {readonly any[]} */
let gyroidList = [];
/** @type {readonly any[]} */
let itemList = [];
/** @type {readonly any[]} */
let npcList = [];
/** @type {readonly any[]} */
let residentList = [];
/** @type {readonly any[]} */
let residentUncertainties = [];
/** @type {any} */
let expansionCounts = { item: 0, resident: 0, gyroid: 0, npc: 0, facility: 0, total: 0, acquisitionCoveredItems: 0, unresolvedResidents: 0 };
/** @type {readonly any[]} */
let allSearchableEntities = [...allEntities];
/** @type {(entity: any) => boolean} */
let isExpansionSearchEntity = () => false;
/** @type {(value: string, type?: string, limit?: number) => readonly any[]} */
let searchUniversal = () => [];
/** @type {(events: readonly any[], month: number) => readonly any[]} */
let eventsForMonth = () => [];
/** @type {(events: readonly any[], date: Date) => readonly any[]} */
let eventsForDate = () => [];
/** @type {(residents: readonly any[], month: number) => readonly any[]} */
let residentBirthdaysForMonth = () => [];

const yen = (value) => `${Number(value).toLocaleString("ja-JP")}ベル`;
const currentDate = () => getGameDate(state);
const availabilityContext = () => ({ weather: state.weather });
const isDonated = (entity) => Boolean(state.donated[entity.id]);
const isCaught = (entity) => Boolean(state.caught[entity.id] || state.acquired[entity.id]);
const save = () => saveState(state);
const provenanceCoverage = getProvenanceCoverage();
let allSources = [...sources];
const typeLabels = {
  fish: "サカナ", bug: "ムシ", fossil: "化石", art: "名画", item: "アイテム",
  resident: "住民", gyroid: "はにわ", npc: "NPC", facility: "施設", event: "イベント"
};

function expansionFallback(title = "追加データを準備しています") {
  if (!expansionLoadError) return `<div class="empty-state"><span class="loading-dot" aria-hidden="true"></span><strong>${escapeHtml(title)}</strong><p>少しだけお待ちください。</p></div>`;
  return `<div class="empty-state is-error"><span aria-hidden="true">!</span><strong>追加データを読み込めませんでした</strong><p>通信は不要です。ページを再読み込みするか、もう一度お試しください。</p><button class="primary-button" data-action="retryExpansion">もう一度読み込む</button></div>`;
}

function requestExpansionData() {
  if (expansionLoadPromise) return expansionLoadPromise;
  expansionLoadPromise = Promise.all([import("./expansion-data.js"), import("./universal-search.js"), import("./calendar-content.js")])
    .then(([expansion, universal, calendar]) => {
      expansionSources = expansion.expansionSources;
      eventList = expansion.eventList;
      facilityList = expansion.facilityList;
      gyroidList = expansion.gyroidList;
      itemList = expansion.itemList;
      npcList = expansion.npcList;
      residentList = expansion.residentList;
      residentUncertainties = expansion.residentUncertainties;
      expansionCounts = expansion.expansionCounts;
      allSearchableEntities = universal.allSearchableEntities;
      isExpansionSearchEntity = universal.isExpansionSearchEntity;
      searchUniversal = universal.searchUniversal;
      eventsForMonth = calendar.eventsForMonth;
      eventsForDate = calendar.eventsForDate;
      residentBirthdaysForMonth = calendar.residentBirthdaysForMonth;
      allSources = [...sources, ...expansionSources];
      expansionReady = true;
      if (["home", "search", "collection", "detail", "calendar", "more"].includes(route)) render();
    })
    .catch((error) => {
      expansionLoadError = String(error?.message ?? error);
      if (["home", "search", "collection", "detail", "calendar", "more"].includes(route)) render();
    });
  return expansionLoadPromise;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.warn("Service Worker registration failed; offline mode is unavailable.", error);
  });
}

function setRoute(next) {
  route = next;
  if (["home", "search", "collection", "detail", "calendar", "more"].includes(next)) void requestExpansionData();
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  render();
}

function setNotice(message, tone = "success") {
  noticeMessage = message;
  noticeTone = tone;
  render();
}

function rememberSearch(value) {
  const normalized = value.trim();
  if (!normalized) return;
  recentSearches = [normalized, ...recentSearches.filter((entry) => entry !== normalized)].slice(0, 5);
}

function updateState(mutator) {
  state = { ...state };
  mutator(state);
  save();
  render();
}

function applyCritterFilters(items) {
  const now = currentDate();
  return items
    .filter((entity) => matchesQuery(entity, query))
    .filter((entity) => !activeFilters.has("now") || isPotentiallyAvailableNow(entity, now, availabilityContext()))
    .filter((entity) => !activeFilters.has("undonated") || !isDonated(entity))
    .filter((entity) => !activeFilters.has("uncollected") || !isCaught(entity))
    .filter((entity) => !activeFilters.has("freshwater") || entity.waterType === "淡水")
    .filter((entity) => !activeFilters.has("sea") || entity.waterType === "海水")
    .filter((entity) => !activeFilters.has("high") || entity.sellPrice >= 3000)
    .filter((entity) => {
      const locations = ["川", "池", "ため池", "滝", "河口", "海", "木", "花", "地面", "ヤシの木", "水辺"];
      const selected = locations.filter((location) => activeFilters.has(location));
      return selected.length === 0 || selected.some((location) => entity.location?.includes(location));
    })
    .slice()
    .sort((a, b) => activeFilters.has("cheap") ? a.sellPrice - b.sellPrice : b.sellPrice - a.sellPrice);
}

function progressFor(type) {
  const items = allEntities.filter((entity) => entity.type === type);
  const donated = items.filter(isDonated).length;
  return { donated, total: items.length, percent: items.length ? Math.round((donated / items.length) * 100) : 0 };
}

function allProgress() {
  const donated = allEntities.filter(isDonated).length;
  return Math.round((donated / allEntities.length) * 100);
}

function statusPill(entity) {
  if (!entity.availabilityRules) return `<span class="pill">収集品</span>`;
  const now = currentDate();
  const context = availabilityContext();
  const status = getAvailabilityStatus(entity, now, context);
  if (status === "available") {
    const remain = getRemainingAvailability(entity, now, context);
    return `<span class="pill is-live">出現中${remain === null ? "" : ` ${formatDuration(remain)}`}</span>`;
  }
  if (status === "conditional") return `<span class="pill is-conditional">条件付き：出現条件を確認</span>`;
  return `<span class="pill">今は出ない</span>`;
}

function sourceDetails(entity) {
  const sourceLabels = (entity.sourceReferences ?? []).map((reference) =>
    allSources.find((source) => source.id === reference.sourceId)?.label ?? reference.sourceId
  );
  const statusLabels = {
    CONFLICT: "情報差分あり",
    CORROBORATED: "地域未確定資料で補強",
    SINGLE_SOURCE: "単一資料・要追加確認",
    REGION_SPECIFIC: "地域限定資料",
    UNVERIFIED: "フィールド照合未完了",
    MULTI_SOURCE_VERIFIED: "JP独立2資料で検証",
    OFFICIAL_VERIFIED: "公式資料で検証"
  };
  const provenance = Object.entries(entity.fieldProvenance ?? {}).map(([field, record]) =>
    `${field}: ${statusLabels[record.status] ?? record.status} (confidence ${record.confidence})`
  );
  return `
    <details class="source-details">
      <summary>出典・データ状態</summary>
      <p>${sourceLabels.map(escapeHtml).join(" / ") || "出典未登録"}</p>
      ${provenance.length ? `<p>${provenance.map(escapeHtml).join(" / ")}</p>` : ""}
      ${entity.authenticity ? `<p>${escapeHtml(entity.authenticity)}</p>` : ""}
    </details>
  `;
}

function evidenceNotice(entity) {
  const records = Object.values(entity.fieldProvenance ?? {});
  const notice = getEvidenceNoticeModel(records);
  if (!notice) return "";
  const ids = notice.discrepancyIds.length ? `（${notice.discrepancyIds.map(escapeHtml).join(" / ")}）` : "";
  return `<p class="evidence-notice ${notice.level === "conflict" ? "is-conflict" : ""}" role="note">${escapeHtml(notice.message)}${ids}</p>`;
}

function domainClass(entity) {
  return `domain-${entity.type ?? "item"}`;
}

function fallbackMark(type) {
  const marks = {
    fish: '<path d="M12 31c11-12 25-12 34 0-9 12-23 12-34 0Zm34 0 9-8v16Z"/><circle cx="34" cy="28" r="2"/>',
    bug: '<path d="M32 18c-7 0-11 6-11 13s4 15 11 15 11-8 11-15-4-13-11-13Zm0 0V9M20 22l-8-7m32 7 8-7M20 38l-9 5m33-5 9 5"/>',
    fossil: '<path d="M14 39c7-17 15-25 29-25 8 0 12 5 12 11 0 9-9 14-18 14H24l-5 8-5-8Zm25-17a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/>',
    art: '<rect x="13" y="12" width="38" height="40" rx="5"/><path d="m20 43 8-10 6 6 7-11 5 15"/>',
    item: '<path d="M18 24h28l4 27H14l4-27Zm8 0c0-9 12-9 12 0"/>',
    resident: '<path d="M17 31 32 17l15 14v20H17V31Zm10 20V39h10v12"/><path d="m20 20 2-9 8 5m14 4-2-9-8 5"/>',
    gyroid: '<path d="M21 17c0-8 22-8 22 0v29c0 7-22 7-22 0V17Zm0 8-8 7 8 6m22-13 8 7-8 6"/><circle cx="28" cy="27" r="2"/><circle cx="36" cy="27" r="2"/><path d="M28 37h8"/>',
    npc: '<path d="M12 15h40v28H29l-10 8 2-8h-9V15Z"/><circle cx="24" cy="29" r="2"/><circle cx="32" cy="29" r="2"/><circle cx="40" cy="29" r="2"/>',
    facility: '<path d="m10 25 22-13 22 13v27H10V25Zm9 0h26M25 52V36h14v16"/>',
    event: '<rect x="12" y="16" width="40" height="36" rx="6"/><path d="M20 10v12m24-12v12M12 28h40M23 38h18"/>'
  };
  return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">${marks[type] ?? marks.item}</svg>`;
}

function imagePlaceholder(entity, hidden = false) {
  return `<div class="entity-image-placeholder ${domainClass(entity)}" role="img" aria-label="${escapeHtml(entity.japaneseName)}の画像は未登録" ${hidden ? "hidden" : ""}>
    <span class="fallback-orb">${fallbackMark(entity.type)}</span><small>画像未登録</small>
  </div>`;
}

function entityImage(entity) {
  const image = entity.image;
  if (image?.status !== "available" || !image.localPath) return imagePlaceholder(entity);
  return `<div class="entity-image-frame">
    <img class="entity-image" data-entity-image src="${escapeHtml(image.localPath)}" alt="${escapeHtml(image.alt)}" loading="lazy" decoding="async" width="96" height="96">
    ${imagePlaceholder(entity, true)}
  </div>`;
}

function isExpansionEntity(entity) {
  return isExpansionSearchEntity(entity);
}

function expansionCollectionButtons(entity) {
  const favorite = `<button class="mini ${state.favorites[entity.id] ? "on" : ""}" aria-pressed="${Boolean(state.favorites[entity.id])}" data-action="toggle" data-key="favorites" data-id="${entity.id}">お気に入り</button>`;
  if (entity.type === "item") {
    return `<div class="quick-actions" aria-label="${escapeHtml(entity.japaneseName)}の状態">
      <button class="mini ${state.itemAcquired[entity.id] ? "on" : ""}" aria-pressed="${Boolean(state.itemAcquired[entity.id])}" data-action="toggle" data-key="itemAcquired" data-id="${entity.id}">入手済み</button>
      <button class="mini ${state.itemCataloged[entity.id] ? "on" : ""}" aria-pressed="${Boolean(state.itemCataloged[entity.id])}" data-action="toggle" data-key="itemCataloged" data-id="${entity.id}">カタログ済み</button>
      ${favorite}
    </div>`;
  }
  if (entity.type === "gyroid") {
    return `<div class="quick-actions" aria-label="${escapeHtml(entity.japaneseName)}の状態">
      <button class="mini ${state.gyroidCollected[entity.id] ? "on" : ""}" aria-pressed="${Boolean(state.gyroidCollected[entity.id])}" data-action="toggle" data-key="gyroidCollected" data-id="${entity.id}">収集済み</button>
      ${favorite}
    </div>`;
  }
  return `<div class="quick-actions" aria-label="${escapeHtml(entity.japaneseName)}の状態">${favorite}</div>`;
}

function universalMeta(entity) {
  const byType = {
    item: [entity.category, entity.acquisition?.[0]?.details, Number.isFinite(entity.buyPrice) ? `買値 ${yen(entity.buyPrice)}` : entity.buyPriceRaw, Number.isFinite(entity.sellPrice) ? `売値 ${yen(entity.sellPrice)}` : entity.sellPriceRaw],
    resident: [entity.species, entity.gender, entity.birthday, entity.personality],
    gyroid: [entity.group, Number.isFinite(entity.sellPrice) ? `売値 ${yen(entity.sellPrice)}` : null, entity.color, entity.mood],
    npc: [entity.role, entity.schedule, entity.location, entity.rewards?.[0]],
    facility: [entity.operatingHours, ...(entity.services ?? []).slice(0, 3)],
    event: [entity.dateText, entity.description, entity.rewardText]
  };
  return (byType[entity.type] ?? [entity.category, entity.group]).filter(Boolean).slice(0, 4);
}

function calendarEventCard(entity) {
  return `<article class="entity-card compact calendar-entry ${domainClass(entity)}" data-domain="${entity.type}" data-id="${entity.id}">
    <div class="entity-head">${entityImage(entity)}<div class="entity-summary"><p class="eyebrow">イベント</p><h3>${escapeHtml(entity.japaneseName)}</h3></div>
      <button class="detail-button" data-action="openDetail" data-id="${entity.id}">詳細</button></div>
    <div class="meta-grid"><span>${escapeHtml(entity.dateText)}</span><span>${escapeHtml(entity.description)}</span>${entity.rewardText ? `<span>${escapeHtml(entity.rewardText)}</span>` : `<span>報酬は資料に記載なし</span>`}${entity.location ? `<span>${escapeHtml(entity.location)}</span>` : ""}</div>
    ${evidenceNotice(entity)}
    ${sourceDetails(entity)}
  </article>`;
}

function birthdayCard(resident) {
  return `<article class="entity-card compact calendar-entry ${domainClass(resident)}" data-domain="${resident.type}" data-id="${resident.id}">
    <div class="entity-head">${entityImage(resident)}<div class="entity-summary"><p class="eyebrow">住民の誕生日</p><h3>${escapeHtml(resident.japaneseName)}</h3><p class="sub">${escapeHtml(resident.englishName)}</p></div>
      <button class="detail-button" data-action="openDetail" data-id="${resident.id}">詳細</button></div>
    <div class="meta-grid"><span>${escapeHtml(resident.birthdayText)}</span><span>${escapeHtml(resident.personality)}</span><span>${escapeHtml(resident.species)}</span></div>
  </article>`;
}

function universalCard(entity) {
  const isExpansion = isExpansionEntity(entity);
  return `<article class="entity-card universal-card ${domainClass(entity)}" data-domain="${entity.type}" data-id="${entity.id}">
    <div class="entity-head">
      ${entityImage(entity)}
      <div class="entity-summary">
        <p class="eyebrow">${escapeHtml(typeLabels[entity.type] ?? entity.type)}${entity.category ? ` / ${escapeHtml(entity.category)}` : ""}</p>
        <h3>${escapeHtml(entity.japaneseName)}</h3>
        <p class="sub">${escapeHtml(entity.englishName ?? "")}</p>
      </div>
      <button class="detail-button" data-action="openDetail" data-id="${entity.id}">詳細</button>
    </div>
    <div class="meta-grid">${universalMeta(entity).map((value) => `<span>${escapeHtml(value)}</span>`).join("")}</div>
    ${evidenceNotice(entity)}
    ${isExpansion ? expansionCollectionButtons(entity) : ""}
  </article>`;
}

function collectionButtons(entity) {
  const primaryKey = entity.type === "fish" || entity.type === "bug" ? "caught" : "acquired";
  const primaryLabel = entity.type === "fossil" ? "発見/入手" : entity.type === "art" ? "入手" : "捕獲";
  const extra = entity.type === "fossil"
    ? `<button class="mini ${state.identified[entity.id] ? "on" : ""}" aria-pressed="${Boolean(state.identified[entity.id])}" data-action="toggle" data-key="identified" data-id="${entity.id}">鑑定</button>`
    : entity.type === "art"
      ? `<button class="mini ${state.genuine[entity.id] ? "on" : ""}" aria-pressed="${Boolean(state.genuine[entity.id])}" data-action="toggleExclusive" data-key="genuine" data-opposite="forged" data-id="${entity.id}">本物</button>
         <button class="mini ${state.forged[entity.id] ? "on danger" : ""}" aria-pressed="${Boolean(state.forged[entity.id])}" data-action="toggleExclusive" data-key="forged" data-opposite="genuine" data-id="${entity.id}">偽物</button>`
    : "";
  const donationDisabled = entity.type === "art" && Boolean(state.forged[entity.id]);
  return `
    <div class="quick-actions" aria-label="${entity.japaneseName}の状態">
      <button class="mini ${state[primaryKey][entity.id] ? "on" : ""}" aria-pressed="${Boolean(state[primaryKey][entity.id])}" data-action="toggle" data-key="${primaryKey}" data-id="${entity.id}">${primaryLabel}</button>
      ${extra}
      <button class="mini ${state.donated[entity.id] ? "on" : ""}" aria-pressed="${Boolean(state.donated[entity.id])}" data-action="toggle" data-key="donated" data-id="${entity.id}" ${donationDisabled ? 'disabled title="偽物は寄贈できません"' : ""}>寄贈</button>
      <button class="mini ${state.favorites[entity.id] ? "on" : ""}" aria-pressed="${Boolean(state.favorites[entity.id])}" data-action="toggle" data-key="favorites" data-id="${entity.id}">狙う</button>
    </div>
  `;
}

function entityCard(entity, options = {}) {
  const now = currentDate();
  const context = availabilityContext();
  const availabilityStatus = entity.availabilityRules ? getAvailabilityStatus(entity, now, context) : null;
  const next = entity.availabilityRules && availabilityStatus === "unavailable"
    ? getNextAvailableTime(entity, now, context)
    : null;
  const forged = entity.type === "art" && Boolean(state.forged[entity.id]);
  const sellWarn = forged
    ? `<strong class="warn">偽物：寄贈不可</strong>`
    : !isDonated(entity) ? `<strong class="warn">未寄贈</strong>` : `<strong class="ok">売却OK</strong>`;
  const availabilityMessage = next
    ? `次回 ${formatDateTime(next)}`
    : availabilityStatus === "available"
      ? "今すぐ狙える"
      : availabilityStatus === "conditional"
        ? "天候や捕獲条件を確認すると確定判定"
        : entity.fakeExists ? "購入後に真贋確認" : "";
  return `
    <article class="entity-card ${domainClass(entity)} ${options.compact ? "compact" : ""}" data-domain="${entity.type}" data-id="${entity.id}">
      <div class="entity-head">
        ${entityImage(entity)}
        <div class="entity-summary">
          <p class="eyebrow">${entity.category}${entity.waterType ? ` / ${entity.waterType}` : ""}</p>
          <h3>${entity.japaneseName}</h3>
          <p class="sub">${entity.englishName}</p>
        </div>
        <div class="price">${yen(getEffectiveSellPrice(entity, state))}</div>
      </div>
      <div class="meta-grid">
        <span>${entity.location ?? entity.fossilGroup ?? entity.acquisition}</span>
        <span>${entity.shadowSize ? `魚影 ${entity.shadowSize}` : entity.part ? `${entity.fossilGroup} ${entity.part}` : entity.monthText ?? "名画"}</span>
        <span>${entity.timeText ?? entity.authenticity?.slice(0, 18) ?? ""}</span>
        ${statusPill(entity)}
      </div>
      <div class="donation-line">${sellWarn}<span>${availabilityMessage}</span></div>
      ${evidenceNotice(entity)}
      ${entity.notes ? `<p class="note">${escapeHtml(entity.notes)}</p>` : ""}
      ${sourceDetails(entity)}
      ${collectionButtons(entity)}
    </article>
  `;
}

function renderHeader() {
  const date = currentDate();
  const clockLabel = `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const season = ["冬", "冬", "春", "春", "春", "夏", "夏", "夏", "秋", "秋", "秋", "冬"][date.getMonth()];
  app.dataset.season = season;
  return `
    <header class="app-header">
      <div class="brand-lockup">
        <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M24 42C9 34 8 17 16 9c6-6 17-5 22-2 2 12-1 29-14 35Z"/><path d="M18 33c5-8 10-13 18-19M23 26l-8-1m14-5 1 8"/></svg></span>
        <div>
          <p class="eyebrow">Nintendo DS 日本版・個人用</p>
          <h1>おい森 となりノート</h1>
        </div>
      </div>
      <button class="clock-card" data-route="more" aria-label="ゲーム内時間 ${clockLabel}。ゲーム内日時を変更">
        <span>ゲーム内時間</span>
        <strong>${clockLabel}</strong>
        <small>${season}の村 · 設定</small>
      </button>
    </header>
  `;
}

function renderHome() {
  const now = currentDate();
  const critters = [...fishList, ...bugList];
  const context = availabilityContext();
  const smart = getSmartRecommendations(critters, state, now, 5, context);
  const undonatedNow = getAvailableUndonated(critters, state, now, context, { includeConditional: true }).slice(0, 4);
  const month = now.getMonth() + 1;
  const leaving = critters
    .filter((entity) => !isDonated(entity))
    .filter((entity) => getLeavingThisMonth(entity, month))
    .slice()
    .sort((a, b) => b.sellPrice - a.sellPrice)
    .slice(0, 4);
  const high = getHighestValueAvailable(critters, now, 4, context, { includeConditional: true });
  const todayEvents = expansionReady ? eventsForDate(eventList, now) : [];
  const todayBirthdays = expansionReady
    ? residentBirthdaysForMonth(residentList, month).filter((resident) => resident.birthdayDay === now.getDate())
    : [];
  const greeting = now.getHours() < 5 ? "夜ふかしの村時間です" : now.getHours() < 11 ? "おはよう、今日もゆっくり" : now.getHours() < 17 ? "今日の村を見にいこう" : "こんばんは、ひと息つこう";
  const longDate = new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "long" }).format(now);
  const weatherLabels = { unknown: "天候 未設定", dry: "晴れ・くもり", rain: "雨", snow: "雪" };
  return `
    <main class="page home-page">
      <section class="hero-panel home-hero">
        <div>
          <p class="eyebrow">${escapeHtml(longDate)} · ${escapeHtml(weatherLabels[state.weather])}</p>
          <h2>${escapeHtml(greeting)}</h2>
          <p>未寄贈を見つけて、イベントを確認して、集めたものを残しておけます。</p>
        </div>
        <div class="progress-ring" role="progressbar" aria-label="博物館全体の寄贈進捗" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${allProgress()}" style="--progress:${allProgress() * 3.6}deg">
          <strong>${allProgress()}%</strong>
          <span>博物館</span>
        </div>
      </section>
      <form class="home-search" data-form="homeSearch" role="search">
        <span class="search-mark" aria-hidden="true">⌕</span>
        <label><span class="sr-only">すべてのデータを検索</span><input value="${escapeHtml(universalQuery)}" data-input="homeUniversalQuery" placeholder="サカナ、住民、家具、イベントを検索" autocomplete="off" /></label>
        <button type="submit">探す</button>
      </form>
      <section class="quick-grid" aria-label="よく使う機能">
        <button data-route="critters" data-critter="fish"><span aria-hidden="true">〜</span>釣り・虫取り</button>
        <button data-route="sell"><span aria-hidden="true">♢</span>これ売っていい？</button>
        <button data-route="museum"><span aria-hidden="true">⌂</span>博物館</button>
        <button data-route="collection"><span aria-hidden="true">✓</span>コレクション</button>
        <button data-route="calendar"><span aria-hidden="true">□</span>イベント・誕生日</button>
        <button data-route="more"><span aria-hidden="true">⚙</span>時計・バックアップ</button>
      </section>
      <div class="home-dashboard">
        <section class="list-section today-section">
          <div class="section-title"><div><p class="eyebrow">TODAY</p><h2>今日の村メモ</h2><p>ゲーム内時計に合わせた予定</p></div><button class="text-button" data-route="calendar">月を見る</button></div>
          <div class="card-list">${expansionReady
            ? todayEvents.map(calendarEventCard).join("") + todayBirthdays.map(birthdayCard).join("") || `<div class="empty-state"><span aria-hidden="true">☘</span><strong>今日はのんびりな日</strong><p>予定はありません。未寄贈の生きものを見てみましょう。</p></div>`
            : expansionFallback("今日の予定を読み込んでいます")}</div>
        </section>
        ${smartSection(smart)}
      </div>
      ${listSection("未寄贈チャンス", "現在捕れる未寄贈のサカナ・ムシ", undonatedNow)}
      ${listSection("今月で終了", "逃すとしばらく待つ可能性がある未寄贈", leaving)}
      ${listSection("高額狙い", "今捕れる売値TOP5", high)}
    </main>
  `;
}

function listSection(title, subtitle, items) {
  return `
    <section class="list-section">
      <div class="section-title">
        <div>
          <h2>${title}</h2>
          <p>${subtitle}</p>
        </div>
      </div>
      <div class="card-list">
        ${items.length ? items.map((entity) => entityCard(entity, { compact: true })).join("") : `<p class="empty">今は該当なし。ゲーム内時間を変えると候補が変わります。</p>`}
      </div>
    </section>
  `;
}

function smartSection(items) {
  return `
    <section class="list-section smart-section">
      <div class="section-title">
        <div>
          <h2>今やるならこれ</h2>
          <p>未寄贈・終了間近・高額・レア度から自動で優先度を計算</p>
        </div>
      </div>
      <div class="smart-list">
        ${items.length ? items.map(({ entity, reasons }, index) => `
          <article class="smart-card">
            <strong>${index + 1}. ${entity.japaneseName}</strong>
            <span>${reasons.join(" / ")}</span>
            <button data-route="${entity.type === "fish" || entity.type === "bug" ? "critters" : "sell"}" ${entity.type === "bug" ? 'data-critter="bug"' : entity.type === "fish" ? 'data-critter="fish"' : ""}>見る</button>
          </article>
        `).join("") : `<p class="empty">今の時間で強いおすすめはありません。</p>`}
      </div>
    </section>
  `;
}

function renderCritters() {
  const items = critterType === "fish" ? fishList : bugList;
  const filtered = applyCritterFilters(items);
  const filterButtons = critterType === "fish"
    ? ["now", "undonated", "uncollected", "high", "freshwater", "sea", "川", "池", "ため池", "滝", "河口", "海"]
    : ["now", "undonated", "uncollected", "high", "木", "花", "地面", "ヤシの木", "水辺"];
  const labels = { now: "今出る", undonated: "未寄贈", uncollected: "未捕獲", high: "3000ベル以上", freshwater: "淡水", sea: "海水" };
  return `
    <main class="page">
      <section class="page-heading"><div><p class="eyebrow">CRITTER GUIDE</p><h2>サカナとムシ</h2><p>ゲーム内の月・時刻・天候に合わせて、今会えるものを絞り込めます。</p></div><span aria-hidden="true">〜</span></section>
      <div class="segmented">
        <button class="${critterType === "fish" ? "active" : ""}" aria-pressed="${critterType === "fish"}" data-critter="fish">サカナ</button>
        <button class="${critterType === "bug" ? "active" : ""}" aria-pressed="${critterType === "bug"}" data-critter="bug">ムシ</button>
      </div>
      <label class="search">
        <span>検索</span>
        <input value="${escapeHtml(query)}" data-input="query" placeholder="サメ、たい、海、5000 など" />
      </label>
      <div class="filter-row">
        ${filterButtons.map((key) => `<button class="chip ${activeFilters.has(key) ? "on" : ""}" aria-pressed="${activeFilters.has(key)}" data-filter="${key}">${labels[key] ?? key}</button>`).join("")}
      </div>
      <p class="result-count">${filtered.length}件 / ${items.length}件</p>
      <div class="card-list">${filtered.map((entity) => entityCard(entity)).join("")}</div>
    </main>
  `;
}

function renderSellCheck() {
  const matches = allEntities.filter((entity) => matchesQuery(entity, query)).slice(0, 30);
  return `
    <main class="page">
      <section class="sell-hero">
        <p class="eyebrow">最重要</p>
        <h2>これ売っていい？</h2>
        <p>名前・価格・場所で検索。未寄贈なら大きく警告します。</p>
      </section>
      <label class="search">
        <span>検索</span>
        <input value="${escapeHtml(query)}" data-input="query" placeholder="ティラノ、サメ、カブト、490 など" autofocus />
      </label>
      <div class="card-list">${matches.map((entity) => entityCard(entity)).join("")}</div>
      <section class="calculator">
        <div class="section-title"><h2>ベル計算機</h2></div>
        <label class="search"><span>追加</span><input value="${escapeHtml(calculatorQuery)}" data-input="calculatorQuery" placeholder="アジ、タイ、サメ..." /></label>
        <div class="suggestions">
          ${allEntities.filter((entity) => matchesQuery(entity, calculatorQuery)).slice(0, 8).map((entity) => `<button data-action="addCalc" data-id="${entity.id}">${entity.japaneseName} ${yen(getEffectiveSellPrice(entity, state))}</button>`).join("")}
        </div>
        ${renderCalculator()}
      </section>
    </main>
  `;
}

function renderCalculator() {
  const rows = state.calculator
    .map((row) => ({ ...row, entity: allEntities.find((entity) => entity.id === row.id) }))
    .filter((row) => row.entity);
  const total = rows.reduce((sum, row) => sum + getEffectiveSellPrice(row.entity, state) * row.quantity, 0);
  const hasUndonated = rows.some((row) => !isDonated(row.entity));
  return `
    <div class="calc-list">
      ${rows.length ? rows.map((row, index) => `
        <div class="calc-row">
          <span>${row.entity.japaneseName}</span>
          <input type="number" min="1" max="${MAX_CALCULATOR_QUANTITY}" aria-label="${row.entity.japaneseName}の数量" value="${row.quantity}" data-action="calcQty" data-index="${index}" />
          <strong>${yen(getEffectiveSellPrice(row.entity, state) * row.quantity)}</strong>
          <button data-action="removeCalc" data-index="${index}">削除</button>
        </div>
      `).join("") : `<p class="empty">売りたいものを追加すると合計を出せます。</p>`}
      <div class="calc-total">
        <span>合計</span>
        <strong>${yen(total)}</strong>
      </div>
      ${hasUndonated ? `<p class="warn-box">未寄贈のものが混ざっています。先に博物館を確認してください。</p>` : ""}
    </div>
  `;
}

function renderMuseum() {
  const selectedCategory = museumType ? museumCategories.find((category) => category.type === museumType) : null;
  const selectedItems = selectedCategory ? allEntities.filter((entity) => entity.type === selectedCategory.type) : [];
  return `
    <main class="page">
      <section class="museum-top">
        <div class="progress-ring big" role="progressbar" aria-label="博物館全体の寄贈進捗" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${allProgress()}" style="--progress:${allProgress() * 3.6}deg">
          <strong>${allProgress()}%</strong>
          <span>全体</span>
        </div>
        <div>
          <h2>博物館</h2>
          <p>捕獲・入手と寄贈は別管理。化石は鑑定状態も保存します。</p>
        </div>
      </section>
      <div class="museum-grid">
        ${museumCategories.map((category) => {
          const progress = progressFor(category.type);
          return `<button class="museum-card ${museumType === category.type ? "active" : ""}" aria-pressed="${museumType === category.type}" data-filter-museum="${category.type}">
            <span>${category.label}</span>
            <strong>${progress.donated} / ${progress.total}</strong>
            <small>${progress.percent}%</small>
          </button>`;
        }).join("")}
      </div>
      ${selectedCategory ? listSection(`${selectedCategory.label} 全件`, "カードから収集・鑑定・真贋・寄贈を更新できます", selectedItems) : ""}
      ${renderFossilGroups()}
      ${listSection("未寄贈 + 今入手可能", "今から博物館を進める候補（天候未設定の条件付き候補を含む）", getAvailableUndonated([...fishList, ...bugList], state, currentDate(), availabilityContext(), { includeConditional: true }).slice(0, 12))}
    </main>
  `;
}

function renderFossilGroups() {
  const groups = fossilList
    .filter((item) => !item.standalone)
    .reduce((bucket, item) => {
      bucket[item.fossilGroup] = [...(bucket[item.fossilGroup] ?? []), item];
      return bucket;
    }, {});
  return `
    <section class="list-section">
      <div class="section-title"><h2>恐竜別 化石進捗</h2></div>
      <div class="fossil-groups">
        ${Object.entries(groups).map(([group, items]) => `
          <article>
            <h3>${group}</h3>
            ${items.map((item) => `<span class="${isDonated(item) ? "done" : ""}">${item.part}</span>`).join("")}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderCalendar() {
  const now = currentDate();
  const month = calendarMonth ?? now.getMonth() + 1;
  const monthItems = [...fishList, ...bugList].filter((entity) =>
    entity.availabilityRules.some((rule) => {
      if (rule.startMonth <= rule.endMonth) return month >= rule.startMonth && month <= rule.endMonth;
      return month >= rule.startMonth || month <= rule.endMonth;
    })
  );
  const monthEvents = expansionReady ? eventsForMonth(eventList, month) : [];
  const birthdays = expansionReady ? residentBirthdaysForMonth(residentList, month) : [];
  return `
    <main class="page">
      <section class="page-heading"><div><p class="eyebrow">VILLAGE CALENDAR</p><h2>村のこよみ</h2><p>イベント、住民の誕生日、今月のサカナとムシをひと続きで確認できます。</p></div><span aria-hidden="true">□</span></section>
      <section class="calendar-grid">
        ${Array.from({ length: 12 }, (_, index) => {
          const m = index + 1;
          return `<button class="${m === month ? "active" : ""}" aria-pressed="${m === month}" data-action="setMonth" data-month="${m}">${m}月</button>`;
        }).join("")}
      </section>
      <section class="list-section">
        <div class="section-title"><div><h2>${month}月のイベント</h2><p>開催日・時間・内容・報酬を原文根拠とともに表示</p></div></div>
        <div class="card-list">${expansionReady
          ? monthEvents.map(calendarEventCard).join("") || `<p class="empty">この月に該当するイベントはありません。</p>`
          : expansionFallback("イベントを読み込んでいます")}</div>
      </section>
      <section class="list-section">
        <div class="section-title"><div><h2>${month}月の住民誕生日</h2><p>実装済み148住民の誕生日</p></div></div>
        <div class="card-list">${expansionReady
          ? birthdays.map(birthdayCard).join("") || `<p class="empty">この月の誕生日recordはありません。</p>`
          : expansionFallback("住民の誕生日を読み込んでいます")}</div>
      </section>
      ${listSection(`${month}月に出る`, "出現するサカナ・ムシ", monthItems)}
    </main>
  `;
}

function renderUniversalSearch() {
  if (!expansionReady) {
    return `<main class="page"><section class="page-intro search-hero"><div><p class="eyebrow">UNIVERSAL SEARCH</p><h2>知りたいことを、すぐ見つける。</h2></div></section>${expansionFallback("横断検索を読み込んでいます")}</main>`;
  }
  const filters = ["all", "fish", "bug", "fossil", "art", "item", "resident", "gyroid", "npc", "facility", "event"];
  const matches = universalQuery.trim()
    ? searchUniversal(universalQuery, universalType, 60)
    : [];
  return `
    <main class="page search-page">
      <section class="page-intro search-hero">
        <div><p class="eyebrow">全 ${allSearchableEntities.length.toLocaleString("ja-JP")}件</p>
        <h2>知りたいことを、すぐ見つける。</h2>
        <p>名前だけでなく、場所・月・入手方法・性格・イベント内容からも探せます。</p></div>
        <span class="intro-motif" aria-hidden="true">${fallbackMark("resident")}</span>
      </section>
      <label class="search search-prominent">
        <span>すべてのデータを検索</span>
        <input value="${escapeHtml(universalQuery)}" data-input="universalQuery" placeholder="つねきち、アジア、9月28日、はにわ…" autocomplete="off" autofocus />
      </label>
      <div class="filter-row" aria-label="検索対象">
        ${filters.map((type) => `<button class="chip ${universalType === type ? "on" : ""}" aria-pressed="${universalType === type}" data-action="setSearchType" data-type="${type}">${type === "all" ? "すべて" : typeLabels[type]}</button>`).join("")}
      </div>
      ${recentSearches.length ? `<section class="recent-searches" aria-label="最近の検索"><span>最近</span>${recentSearches.map((entry) => `<button class="chip" data-action="recentSearch" data-query="${escapeHtml(entry)}">${escapeHtml(entry)}</button>`).join("")}</section>` : ""}
      <p class="result-count">${universalQuery.trim() ? `<strong>${matches.length}件</strong>表示（最大60件）` : "キーワードを入力するか、種類から見てみましょう"}</p>
      ${!universalQuery.trim() ? `<section class="domain-overview" aria-label="実装済みデータ件数">
        ${[["item", itemList.length], ["resident", residentList.length], ["gyroid", gyroidList.length], ["npc", npcList.length], ["facility", facilityList.length], ["event", eventList.length]].map(([type, count]) => `<button class="domain-tile domain-${type}" data-action="browseDomain" data-type="${type}"><span aria-hidden="true">${fallbackMark(type)}</span><strong>${typeLabels[type]}</strong><small>${Number(count).toLocaleString("ja-JP")}件</small></button>`).join("")}
      </section>
      <p class="evidence-notice">住民は確認済み148件を実装。表記が一致しない2件（${residentUncertainties.map((entry) => `${entry.sourceName}/${entry.modernCandidate}`).join("、")}）は推測で追加していません。</p>` : ""}
      <div class="card-list">${matches.length ? matches.map(universalCard).join("") : universalQuery.trim() ? `<div class="empty-state"><span aria-hidden="true">⌕</span><strong>「${escapeHtml(universalQuery)}」は見つかりませんでした</strong><p>ひらがな・カタカナを変えるか、対象の種類を「すべて」に戻してみてください。</p></div>` : ""}</div>
    </main>
  `;
}

function hasCollectionState(entity) {
  if (entity.type === "item") return Boolean(state.itemAcquired[entity.id]);
  if (entity.type === "gyroid") return Boolean(state.gyroidCollected[entity.id]);
  if (entity.type === "fish" || entity.type === "bug") return Boolean(state.caught[entity.id]);
  if (entity.type === "fossil" || entity.type === "art") return Boolean(state.acquired[entity.id]);
  return Boolean(state.favorites[entity.id]);
}

function matchesCollectionFilter(entity) {
  if (collectionFilter === "favorite") return Boolean(state.favorites[entity.id]);
  if (collectionFilter === "collected") return hasCollectionState(entity);
  if (collectionFilter === "missing") return !hasCollectionState(entity);
  if (collectionFilter === "cataloged") return entity.type === "item" && Boolean(state.itemCataloged[entity.id]);
  if (collectionFilter === "acquisition-known") return entity.type === "item" && entity.acquisition?.length > 0;
  if (collectionFilter === "acquisition-unknown") return entity.type === "item" && entity.acquisition?.length === 0;
  if (collectionFilter === "event-limited") {
    return entity.type === "item" && (
      /キャンペーン|イベント|配信/.test(`${entity.group ?? ""} ${entity.category ?? ""}`)
      || entity.acquisition?.some((method) => /EVENT|DISTRIBUTION/.test(`${method.methodType} ${method.sourceType}`))
    );
  }
  if (collectionFilter === "price-known") return Number.isFinite(entity.buyPrice) || Number.isFinite(entity.sellPrice);
  return true;
}

function collectionProgressCard(label, current, total, accent) {
  const percent = total ? Math.round((current / total) * 100) : 0;
  return `<article class="collection-stat ${accent}"><span>${escapeHtml(label)}</span><strong>${current.toLocaleString("ja-JP")} / ${total.toLocaleString("ja-JP")}</strong><div class="progress-track" aria-hidden="true"><i style="--value:${percent}%"></i></div><small>${percent}%</small></article>`;
}

function renderCollection() {
  if (!expansionReady) return `<main class="page">${expansionFallback("コレクションを読み込んでいます")}</main>`;
  const typeOptions = ["all", "item", "resident", "gyroid", "fish", "bug", "fossil", "art", "npc", "facility", "event"];
  const stateOptions = [
    ["all", "すべて"], ["collected", "集めた"], ["missing", "まだ"], ["favorite", "お気に入り"],
    ["cataloged", "カタログ済み"], ["acquisition-known", "入手方法あり"], ["acquisition-unknown", "入手方法未確認"],
    ["event-limited", "イベント限定"], ["price-known", "価格あり"]
  ].filter(([key]) => !["cataloged", "acquisition-known", "acquisition-unknown", "event-limited"].includes(key) || collectionType === "item");
  const categoryOptions = collectionType === "item"
    ? [...new Set(itemList.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"))
    : [];
  const queryMatches = collectionQuery.trim()
    ? searchUniversal(collectionQuery, collectionType, allSearchableEntities.length)
    : allSearchableEntities.filter((entity) => collectionType === "all" || entity.type === collectionType);
  const filtered = queryMatches
    .filter((entity) => collectionCategory === "all" || entity.category === collectionCategory)
    .filter(matchesCollectionFilter);
  const shown = filtered.slice(0, 80);
  const acquiredItems = itemList.filter((item) => state.itemAcquired[item.id]).length;
  const catalogedItems = itemList.filter((item) => state.itemCataloged[item.id]).length;
  const collectedGyroids = gyroidList.filter((item) => state.gyroidCollected[item.id]).length;
  const favorites = allSearchableEntities.filter((item) => state.favorites[item.id]).length;
  return `<main class="page collection-page">
    <section class="page-intro collection-intro">
      <div><p class="eyebrow">MY COLLECTION</p><h2>集めたものを、ひとつのノートに。</h2><p>入手・カタログ・寄贈・お気に入りを、種類ごとに見渡せます。</p></div>
      <span class="intro-motif" aria-hidden="true">${fallbackMark("item")}</span>
    </section>
    <section class="collection-stats" aria-label="コレクション進捗">
      ${collectionProgressCard("アイテム入手", acquiredItems, itemList.length, "domain-item")}
      ${collectionProgressCard("カタログ", catalogedItems, itemList.length, "domain-facility")}
      ${collectionProgressCard("はにわ", collectedGyroids, gyroidList.length, "domain-gyroid")}
      ${collectionProgressCard("お気に入り", favorites, allSearchableEntities.length, "domain-resident")}
    </section>
    <label class="search search-prominent"><span>コレクション内を検索</span><input value="${escapeHtml(collectionQuery)}" data-input="collectionQuery" placeholder="名前・カテゴリ・入手方法" autocomplete="off" /></label>
    <div class="filter-row domain-filters" aria-label="種類">
      ${typeOptions.map((type) => `<button class="chip ${collectionType === type ? "on" : ""}" aria-pressed="${collectionType === type}" data-action="setCollectionType" data-type="${type}">${type === "all" ? "すべて" : typeLabels[type]}</button>`).join("")}
    </div>
    ${categoryOptions.length ? `<div class="filter-row category-filters" aria-label="アイテムカテゴリ"><button class="chip ${collectionCategory === "all" ? "on" : ""}" aria-pressed="${collectionCategory === "all"}" data-action="setCollectionCategory" data-category="all">全カテゴリ</button>${categoryOptions.map((category) => `<button class="chip ${collectionCategory === category ? "on" : ""}" aria-pressed="${collectionCategory === category}" data-action="setCollectionCategory" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("")}</div>` : ""}
    <div class="filter-row state-filters" aria-label="収集状態">
      ${stateOptions.map(([key, label]) => `<button class="chip ${collectionFilter === key ? "on" : ""}" aria-pressed="${collectionFilter === key}" data-action="setCollectionFilter" data-filter="${key}">${label}</button>`).join("")}
    </div>
    <div class="results-heading"><p class="result-count"><strong>${filtered.length.toLocaleString("ja-JP")}件</strong>${filtered.length > shown.length ? ` · 先頭${shown.length}件を表示` : ""}</p><button class="text-button" data-action="resetCollectionFilters">条件をリセット</button></div>
    <div class="card-list">${shown.length ? shown.map((entity) => isExpansionEntity(entity) ? universalCard(entity) : entityCard(entity)).join("") : `<div class="empty-state"><span aria-hidden="true">⌕</span><strong>この条件では見つかりませんでした</strong><p>種類や収集状態を変えてみてください。</p></div>`}</div>
  </main>`;
}

function detailRows(entity) {
  const rows = [
    ["分類", typeLabels[entity.type]], ["カテゴリ", entity.category], ["グループ", entity.group], ["英語名", entity.englishName],
    ["誕生日", entity.birthday], ["性格", entity.personality], ["好きな服", entity.preferredStyle],
    ["苦手な服", entity.dislikedStyle], ["種族", entity.species], ["性別", entity.gender], ["口ぐせ（英語版資料）", entity.catchphrase], ["配信状態", entity.distributionStatus],
    ["役割", entity.role], ["訪問・出現", entity.schedule], ["場所", entity.location], ["営業時間", entity.operatingHours],
    ["開催日", entity.dateText], ["内容", entity.description], ["報酬", entity.rewardText],
    ["買値", Number.isFinite(entity.buyPrice) ? yen(entity.buyPrice) : null],
    ["売値", Number.isFinite(entity.sellPrice) ? yen(entity.sellPrice) : null],
    ["色", entity.color], ["雰囲気", entity.mood], ["イメージ", entity.style], ["備考", entity.notes]
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");
  return `<dl class="detail-grid">${rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>`;
}

function acquisitionQuality(entity) {
  if (entity.type !== "item") return null;
  if (!entity.acquisition?.length) return { label: "入手方法 未確認", tone: "unknown" };
  if (entity.acquisition.every((method) => method.evidenceKind === "EXPLICIT_BUY_PRICE_COLUMN")) {
    return { label: "買値のみ確認", tone: "conditional" };
  }
  return { label: "入手方法あり", tone: "confirmed" };
}

function friendlyMethod(method) {
  const labels = { SHOP: "お店", PURCHASE: "購入", NPC: "来訪者（NPC）", EVENT: "イベント", EXCHANGE: "交換", REWARD: "ごほうび", GIFT: "プレゼント", OTHER: "そのほか" };
  return labels[method.methodType] ?? method.methodType;
}

function renderStructuredTable(table) {
  if (!table?.rows?.length) return "";
  return `<div class="data-table-wrap"><table><caption>${escapeHtml(table.heading ?? "一覧")}</caption>${table.columns?.length ? `<thead><tr>${table.columns.map((cell) => `<th scope="col">${escapeHtml(cell)}</th>`).join("")}</tr></thead>` : ""}<tbody>${table.rows.map((row) => `<tr>${row.map((cell, index) => `<${index === 0 ? "th scope=\"row\"" : "td"}>${escapeHtml(cell || "—")}</${index === 0 ? "th" : "td"}>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function detailStatus(entity) {
  const records = Object.values(entity.fieldProvenance ?? {});
  if (records.some((record) => record.status === "CONFLICT")) return { label: "情報差分あり", tone: "conflict" };
  if (records.some((record) => record.status === "SINGLE_SOURCE")) return { label: "出典1系統", tone: "conditional" };
  return { label: "確認済み", tone: "confirmed" };
}

function renderDetail() {
  if (!expansionReady) return `<main class="page">${expansionFallback("詳細データを読み込んでいます")}</main>`;
  const entity = allSearchableEntities.find((record) => record.id === selectedEntityId);
  if (!entity) {
    return `<main class="page"><button class="back-button" data-action="backFromDetail">← 戻る</button><div class="empty-state"><span aria-hidden="true">⌕</span><strong>情報を見つけられませんでした</strong><p>一覧へ戻って、もう一度選んでください。</p></div></main>`;
  }
  if (!isExpansionEntity(entity)) {
    return `<main class="page detail-page"><button class="back-button" data-action="backFromDetail">← ${detailReturnRoute === "search" ? "検索結果" : "前の画面"}へ戻る</button><section class="detail-shell ${domainClass(entity)}">${entityCard(entity)}</section></main>`;
  }
  const sourceLinks = (entity.sourceReferences ?? []).map((reference) => allSources.find((source) => source.id === reference.sourceId)).filter(Boolean);
  const status = detailStatus(entity);
  const quality = acquisitionQuality(entity);
  const eventRewardGap = entity.type === "event" && !entity.rewardText;
  const detailTables = [...(entity.structuredTables ?? [])];
  return `<main class="page detail-page">
    <button class="back-button" data-action="backFromDetail">← ${detailReturnRoute === "search" ? "検索結果" : detailReturnRoute === "collection" ? "コレクション" : "前の画面"}へ戻る</button>
    <article class="detail-panel ${domainClass(entity)}" data-domain="${entity.type}" data-id="${entity.id}">
      <div class="detail-title detail-hero">
        ${entityImage(entity)}
        <div class="detail-heading"><p class="eyebrow">${escapeHtml(typeLabels[entity.type])}${entity.category ? ` · ${escapeHtml(entity.category)}` : ""}</p><h2>${escapeHtml(entity.japaneseName)}</h2>${entity.englishName ? `<p class="sub">${escapeHtml(entity.englishName)}</p>` : ""}<div class="status-row"><span class="status-badge is-${status.tone}">${status.label}</span>${quality ? `<span class="status-badge is-${quality.tone}">${quality.label}</span>` : ""}</div></div>
        <div class="detail-state">${expansionCollectionButtons(entity)}</div>
      </div>
      ${evidenceNotice(entity)}
      <section class="detail-section primary-answers"><div class="section-title"><div><p class="eyebrow">QUICK ANSWERS</p><h3>まず知りたいこと</h3></div></div>${detailRows(entity)}</section>
      ${entity.acquisition?.length ? `<section class="detail-section"><h3>入手方法</h3><ul class="answer-list">${entity.acquisition.map((method) => `<li><span class="answer-icon" aria-hidden="true">→</span><div><strong>${escapeHtml(friendlyMethod(method))}</strong><p>${escapeHtml(method.details)}</p>${method.sourceType === "RETAIL_OR_CATALOG_UNSPECIFIED" ? "<small>販売場所は未特定です。買値欄だけを根拠にしています。</small>" : ""}</div></li>`).join("")}</ul>${entity.catalogOrderable === false ? `<p class="inline-note">カタログ注文不可</p>` : ""}</section>` : entity.type === "item" ? `<p class="evidence-notice">入手先は現在の資料では確定できません。未確認のまま安全に表示しています。</p>` : ""}
      ${entity.services?.length ? `<section class="detail-section"><h3>${entity.type === "npc" ? "してくれること" : "できること"}</h3><ul class="answer-list compact-list">${entity.services.map((service) => `<li><span class="answer-icon" aria-hidden="true">✓</span><span>${escapeHtml(service)}</span></li>`).join("")}</ul></section>` : ""}
      ${entity.requirements?.length ? `<section class="detail-section"><h3>条件</h3><ul>${entity.requirements.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul></section>` : entity.type === "facility" ? `<p class="inline-note">この資料には追加条件の記載がありません。</p>` : ""}
      ${entity.appearanceConditions?.length ? `<section class="detail-section"><h3>出現条件</h3><ul>${entity.appearanceConditions.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul></section>` : entity.type === "npc" ? `<p class="inline-note">この資料には訪問日以外の追加条件が記載されていません。</p>` : ""}
      ${entity.rewards?.length ? `<section class="detail-section"><h3>報酬・特典</h3><ul>${entity.rewards.map((entry) => `<li>${escapeHtml(entry.heading ?? entry)}</li>`).join("")}</ul></section>` : entity.type === "npc" ? `<p class="inline-note">この資料にはアイテム報酬の記載がありません。</p>` : ""}
      ${eventRewardGap ? `<p class="inline-note">このイベントは、確認中の資料に報酬欄の記載がありません。</p>` : ""}
      ${detailTables.length ? `<section class="detail-section tables-section"><h3>一覧・段階</h3>${detailTables.map(renderStructuredTable).join("")}</section>` : ""}
      ${entity.details?.length ? `<details class="research-accordion"><summary>もっと詳しく</summary><div>${entity.details.map((detail) => `<section class="detail-section"><h4>${escapeHtml(detail.heading)}</h4>${detail.summary ? `<p>${escapeHtml(detail.summary)}</p>` : ""}</section>`).join("")}</div></details>` : ""}
      ${entity.dataDiscrepancies?.length ? `<section class="conflict-panel"><h3>出典による差分</h3>${entity.dataDiscrepancies.map((entry) => `<p><strong>${escapeHtml(entry.field)}</strong>：${escapeHtml(entry.userFacingImpact)}。現在は「${escapeHtml(entry.adoptedValue)}」を表示し、未解決として保持しています。</p>`).join("")}</section>` : ""}
      <details class="source-panel"><summary>出典・調査情報</summary><p>${escapeHtml(entity.verification.status)} / region ${escapeHtml(entity.verification.region)} / ID ${escapeHtml(entity.id)}</p>
        <ul>${sourceLinks.map((source) => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a><br><small>lineage: ${escapeHtml(source.lineageId)}</small></li>`).join("")}</ul>
      </details>
    </article>
  </main>`;
}

function renderMore() {
  const modeLabel = state.clockMode === "real" ? "現在時刻" : state.clockMode === "offset" ? "差分で追従" : "手動固定";
  const expansionConflictCount = eventList.reduce((total, event) => total + (event.dataDiscrepancies?.length ?? 0), 0);
  return `
    <main class="page settings-page">
      <section class="page-intro settings-intro"><div><p class="eyebrow">SETTINGS & BACKUP</p><h2>村時間とデータを整える。</h2><p>ふだん触る設定だけを、ここにまとめています。</p></div><span class="intro-motif" aria-hidden="true">${fallbackMark("facility")}</span></section>
      <div class="settings-grid">
      <section class="settings settings-card">
        <h2>ゲーム内時計</h2>
        <p>現在モード：${modeLabel}</p>
        <div class="segmented">
          <button class="${state.clockMode === "real" ? "active" : ""}" aria-pressed="${state.clockMode === "real"}" data-action="clockMode" data-mode="real">現在時刻</button>
          <button class="${state.clockMode === "custom" ? "active" : ""}" aria-pressed="${state.clockMode === "custom"}" data-action="clockMode" data-mode="custom">ゲーム日時</button>
          <button class="${state.clockMode === "offset" ? "active" : ""}" aria-pressed="${state.clockMode === "offset"}" data-action="startOffset">差分で追従</button>
        </div>
        <label class="search">
          <span>ゲーム内日時</span>
          <input type="datetime-local" value="${state.customDateTime}" data-input="customDateTime" />
        </label>
        <p>「差分で追従」は、上のゲーム内日時を起点にして現実時間と同じだけ進めます。</p>
      </section>
      <section class="settings settings-card">
        <h2>ゲーム内の天候</h2>
        <p>雨・雪などが出現条件の生き物を誤判定しないために使います。分からない場合は「不明」のままで安全側に判定します。</p>
        <div class="segmented weather-segmented">
          <button class="${state.weather === "unknown" ? "active" : ""}" aria-pressed="${state.weather === "unknown"}" data-action="weather" data-weather="unknown">不明</button>
          <button class="${state.weather === "dry" ? "active" : ""}" aria-pressed="${state.weather === "dry"}" data-action="weather" data-weather="dry">雨・雪以外</button>
          <button class="${state.weather === "rain" ? "active" : ""}" aria-pressed="${state.weather === "rain"}" data-action="weather" data-weather="rain">雨</button>
          <button class="${state.weather === "snow" ? "active" : ""}" aria-pressed="${state.weather === "snow"}" data-action="weather" data-weather="snow">雪</button>
        </div>
      </section>
      <section class="settings settings-card backup-card">
        <h2>バックアップ</h2>
        <p>大切な収集記録をJSONファイルに保存できます。読み込みに失敗しても、現在のデータは上書きされません。</p>
        <div class="button-row">
          <button class="primary-button" data-action="export">バックアップを書き出す</button>
          <label class="file-button">バックアップを読み込む<input type="file" accept="application/json" data-input="import" /></label>
        </div>
        <p class="privacy-note"><span aria-hidden="true">⌂</span> 保存データはこの端末のブラウザ内だけに保存され、外部へ送信しません。</p>
      </section>
      </div>
      <section class="settings settings-card audit-card">
        <h2>データ監査</h2>
        <div class="audit-grid">
          <span>魚 ${fishList.length}</span><span>虫 ${bugList.length}</span><span>化石 ${fossilList.length}</span><span>名画 ${artList.length}</span>
          <span>アイテム ${itemList.length}</span><span>住民 ${residentList.length}</span><span>はにわ ${gyroidList.length}</span><span>NPC ${npcList.length}</span><span>施設 ${facilityList.length}</span><span>イベント ${eventList.length}</span>
        </div>
        <p>拡張records ${expansionCounts.total}件。根拠付き入手情報 ${expansionCounts.acquisitionCoveredItems}件（うち販売場所未特定 ${expansionCounts.purchasePlaceUnspecifiedItems ?? 0}件）。入手情報なし ${expansionCounts.acquisitionUnknownItems ?? 0}件。住民の表記不一致 ${expansionCounts.unresolvedResidents}件はUNKNOWNのまま除外。</p>
        <p>Data Version ${dataVersion}。critical field claim ${provenanceCoverage.withExtractedClaims}/${provenanceCoverage.totalCriticalFieldInstances}、JP独立2資料検証 ${provenanceCoverage.withJpIndependentVerification}/${provenanceCoverage.totalCriticalFieldInstances}。</p>
        <p>Coreは${dataDiscrepancies.length}件の構造化CONFLICT（影響${provenanceCoverage.conflicts}フィールド）を保持。拡張イベントの資料差分は${expansionConflictCount}件です。未解決値を確認済みとして扱いません。</p>
        <details>
          <summary>主要ソース</summary>
          <ul>${sources.map((source) => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a></li>`).join("")}</ul>
        </details>
      </section>
    </main>
  `;
}

function renderNav() {
  const tabs = [
    ["home", "ホーム", "⌂"],
    ["search", "検索", "⌕"],
    ["critters", "いきもの", "〜"],
    ["museum", "博物館", "♢"],
    ["sell", "売却", "¢"],
    ["calendar", "月", "□"]
  ];
  const activeRoute = route === "detail" ? detailReturnRoute : route;
  return `<nav class="bottom-nav" aria-label="主要メニュー">${tabs.map(([id, label, icon]) => `<button class="${activeRoute === id ? "active" : ""}" ${activeRoute === id ? 'aria-current="page"' : ""} data-route="${id}"><span aria-hidden="true">${icon}</span><small>${label}</small></button>`).join("")}</nav>`;
}

function captureInputFocus() {
  const active = document.activeElement;
  if (!(active instanceof HTMLInputElement) || !app.contains(active) || active.type === "file") return null;
  const selector = active.dataset.input
    ? `input[data-input="${active.dataset.input}"]`
    : active.dataset.action
      ? `input[data-action="${active.dataset.action}"][data-index="${active.dataset.index ?? ""}"]`
      : null;
  if (!selector) return null;
  return { selector, start: active.selectionStart, end: active.selectionEnd };
}

function restoreInputFocus(snapshot) {
  if (!snapshot) return;
  const input = app.querySelector(snapshot.selector);
  if (!(input instanceof HTMLInputElement)) return;
  input.focus({ preventScroll: true });
  if (snapshot.start === null || snapshot.end === null) return;
  try {
    input.setSelectionRange(snapshot.start, snapshot.end);
  } catch {
    // datetime-local and number inputs do not expose text selection.
  }
}

function render() {
  const focusSnapshot = captureInputFocus();
  const page = {
    home: renderHome,
    search: renderUniversalSearch,
    collection: renderCollection,
    detail: renderDetail,
    critters: renderCritters,
    museum: renderMuseum,
    sell: renderSellCheck,
    calendar: renderCalendar,
    more: renderMore
  }[route]();
  app.dataset.route = route;
  app.innerHTML = `${renderHeader()}${noticeMessage ? `<div class="app-notice is-${noticeTone}" role="status"><span>${escapeHtml(noticeMessage)}</span><button data-action="dismissNotice" aria-label="お知らせを閉じる">×</button></div>` : ""}${page}${renderNav()}`;
  restoreInputFocus(focusSnapshot);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

app.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const button = target?.closest("button");
  if (!(button instanceof HTMLButtonElement)) return;
  if (button.dataset.route) setRoute(button.dataset.route);
  if (button.dataset.action === "openDetail") {
    detailReturnRoute = route === "detail" ? detailReturnRoute : route;
    if (route === "search") rememberSearch(universalQuery);
    if (route === "collection") rememberSearch(collectionQuery);
    selectedEntityId = button.dataset.id;
    setRoute("detail");
  }
  if (button.dataset.action === "backToSearch") setRoute("search");
  if (button.dataset.action === "backFromDetail") setRoute(detailReturnRoute);
  if (button.dataset.action === "dismissNotice") {
    noticeMessage = "";
    render();
  }
  if (button.dataset.action === "retryExpansion") {
    expansionLoadError = null;
    expansionLoadPromise = null;
    void requestExpansionData();
    render();
  }
  if (button.dataset.action === "setSearchType") {
    universalType = button.dataset.type ?? "all";
    render();
  }
  if (button.dataset.action === "recentSearch") {
    universalQuery = button.dataset.query ?? "";
    render();
  }
  if (button.dataset.action === "browseDomain") {
    collectionType = button.dataset.type ?? "all";
    collectionFilter = "all";
    collectionCategory = "all";
    setRoute("collection");
  }
  if (button.dataset.action === "setCollectionType") {
    collectionType = button.dataset.type ?? "all";
    collectionFilter = "all";
    collectionCategory = "all";
    render();
  }
  if (button.dataset.action === "setCollectionCategory") {
    collectionCategory = button.dataset.category ?? "all";
    render();
  }
  if (button.dataset.action === "setCollectionFilter") {
    collectionFilter = button.dataset.filter ?? "all";
    render();
  }
  if (button.dataset.action === "resetCollectionFilters") {
    collectionQuery = "";
    collectionFilter = "all";
    collectionCategory = "all";
    render();
  }
  if (button.dataset.critter) {
    const nextType = button.dataset.critter;
    activeFilters = sanitizeCritterFilters(activeFilters, nextType);
    critterType = nextType;
    route = "critters";
    render();
  }
  if (button.dataset.filterMuseum) {
    museumType = museumType === button.dataset.filterMuseum ? null : button.dataset.filterMuseum;
    render();
  }
  if (button.dataset.filter) {
    activeFilters.has(button.dataset.filter) ? activeFilters.delete(button.dataset.filter) : activeFilters.add(button.dataset.filter);
    render();
  }
  if (button.dataset.action === "toggle") {
    const key = button.dataset.key;
    const id = button.dataset.id;
    updateState((draft) => {
      const next = !draft[key][id];
      draft[key] = { ...draft[key], [id]: next };
      if (key === "donated" && next) {
        if (id.startsWith("fish-") || id.startsWith("bug-")) draft.caught = { ...draft.caught, [id]: true };
        if (id.startsWith("fossil-")) {
          draft.acquired = { ...draft.acquired, [id]: true };
          draft.identified = { ...draft.identified, [id]: true };
        }
        if (id.startsWith("art-")) {
          draft.acquired = { ...draft.acquired, [id]: true };
          draft.genuine = { ...draft.genuine, [id]: true };
          draft.forged = { ...draft.forged, [id]: false };
        }
      }
      if (!next && ["caught", "acquired", "identified"].includes(key)) {
        draft.donated = { ...draft.donated, [id]: false };
      }
      if (!next && key === "acquired" && id.startsWith("art-")) {
        draft.genuine = { ...draft.genuine, [id]: false };
        draft.forged = { ...draft.forged, [id]: false };
      }
    });
  }
  if (button.dataset.action === "toggleExclusive") {
    const key = button.dataset.key;
    const opposite = button.dataset.opposite;
    const id = button.dataset.id;
    updateState((draft) => {
      const next = !draft[key][id];
      draft[key] = { ...draft[key], [id]: next };
      if (next) draft[opposite] = { ...draft[opposite], [id]: false };
      if (key === "genuine" && next) {
        draft.acquired = { ...draft.acquired, [id]: true };
      }
      if (key === "genuine" && !next) {
        draft.donated = { ...draft.donated, [id]: false };
      }
      if (key === "forged" && next) {
        draft.acquired = { ...draft.acquired, [id]: true };
        draft.donated = { ...draft.donated, [id]: false };
      }
    });
  }
  if (button.dataset.action === "clockMode") {
    updateState((draft) => { draft.clockMode = button.dataset.mode; });
  }
  if (button.dataset.action === "weather") {
    updateState((draft) => { draft.weather = button.dataset.weather; });
  }
  if (button.dataset.action === "startOffset") {
    const baseGame = state.customDateTime || toLocalInputValue(new Date());
    updateState((draft) => {
      draft.clockMode = "offset";
      draft.customDateTime = baseGame;
      draft.offsetBaseReal = new Date().toISOString();
      draft.offsetBaseGame = new Date(baseGame).toISOString();
    });
  }
  if (button.dataset.action === "export") {
    exportState(state);
    setNotice("バックアップを書き出しました。安全な場所に保管してください。");
  }
  if (button.dataset.action === "addCalc") {
    updateState((draft) => {
      const existing = draft.calculator.find((row) => row.id === button.dataset.id);
      draft.calculator = existing
        ? draft.calculator.map((row) => row.id === button.dataset.id ? { ...row, quantity: row.quantity + 1 } : row)
        : [...draft.calculator, { id: button.dataset.id, quantity: 1 }];
    });
  }
  if (button.dataset.action === "removeCalc") {
    updateState((draft) => {
      draft.calculator = draft.calculator.filter((_, index) => index !== Number(button.dataset.index));
    });
  }
  if (button.dataset.action === "setMonth") {
    calendarMonth = Number(button.dataset.month);
    render();
  }
});

app.addEventListener("input", (event) => {
  const input = event.target instanceof HTMLInputElement ? event.target : null;
  if (!input) return;
  if (input.dataset.input === "query") {
    query = input.value;
    render();
  }
  if (input.dataset.input === "universalQuery") {
    universalQuery = input.value;
    render();
  }
  if (input.dataset.input === "homeUniversalQuery") {
    universalQuery = input.value;
  }
  if (input.dataset.input === "collectionQuery") {
    collectionQuery = input.value;
    render();
  }
  if (input.dataset.input === "calculatorQuery") {
    calculatorQuery = input.value;
    render();
  }
  if (input.dataset.input === "customDateTime") {
    updateState((draft) => {
      draft.clockMode = "custom";
      draft.customDateTime = input.value;
    });
  }
  if (input.dataset.action === "calcQty") {
    updateState((draft) => {
      draft.calculator = draft.calculator.map((row, index) =>
        index === Number(input.dataset.index) ? { ...row, quantity: normalizeQuantity(input.value) } : row
      );
    });
  }
});

app.addEventListener("change", async (event) => {
  const input = event.target instanceof HTMLInputElement ? event.target : null;
  if (!input) return;
  if (input.dataset.input === "import" && input.files?.[0]) {
    try {
      state = await importStateFile(input.files[0]);
      save();
      setNotice("バックアップを読み込みました。コレクションと設定を復元しています。", "success");
      render();
    } catch {
      setNotice("このバックアップは読み込めませんでした。ファイル形式とバージョンを確認してください。", "error");
    }
  }
});

app.addEventListener("submit", (event) => {
  const form = event.target instanceof HTMLFormElement ? event.target : null;
  if (!form || form.dataset.form !== "homeSearch") return;
  event.preventDefault();
  const input = form.querySelector('[data-input="homeUniversalQuery"]');
  universalQuery = input instanceof HTMLInputElement ? input.value : universalQuery;
  rememberSearch(universalQuery);
  setRoute("search");
});

app.addEventListener("keydown", (event) => {
  const input = event.target instanceof HTMLInputElement ? event.target : null;
  if (event.key === "Enter" && input?.dataset.input === "universalQuery") {
    rememberSearch(input.value);
  }
});

app.addEventListener("error", (event) => {
  const image = event.target instanceof HTMLImageElement && event.target.matches("[data-entity-image]")
    ? event.target
    : null;
  if (!image) return;
  image.hidden = true;
  const fallback = image.parentElement?.querySelector(".entity-image-placeholder");
  if (fallback instanceof HTMLElement) fallback.hidden = false;
}, true);

function toLocalInputValue(date) {
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

render();
if ("requestIdleCallback" in window) {
  window.requestIdleCallback(() => void requestExpansionData(), { timeout: 1000 });
} else {
  setTimeout(() => void requestExpansionData(), 0);
}
