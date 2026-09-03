import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outputPath = path.join(root, "src/generated/expansion-records.js");
const reportPath = path.join(root, "artifacts/data-audit/expansion-extraction-report.json");
const BASE = "https://www.oi-mori.com";
const MODERN_LIST_URL = "https://animalcrossing.soopoolleaf.com/ja/acna/g/acww/";
const NOOKIPEDIA_WW_URL = "https://nookipedia.com/wiki/Villager/Wild_World";
const EVENT_URL = `${BASE}/nds/calendar/event.html`;
const CAMPAIGN_URL = "https://wikiwiki.jp/ds-doubutu/%E5%85%AC%E5%BC%8F%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88";
const SUPPLEMENTAL_EVENT_URL = "https://www.super-famicom.jp/etc00/doubutu/oideyo/ds_event.html";
const EXTRACTION_DATE = "2026-09-03";

const facilityPages = [
  ["home", "自宅"], ["cutcherry", "役場"], ["store", "たぬきちの店"], ["tailor", "仕立屋"],
  ["museum", "博物館"], ["observatory", "天文台"], ["cafe", "喫茶店"], ["checkpoint", "関所"]
];

const npcPages = [
  ["ayashiineko", "あやしいネコ"], ["untenshu", "運転手"], ["kaburiba", "カブリバ"],
  ["grace", "グレース"], ["shisho", "ししょー"], ["johnny", "ジョニー"], ["seiichi", "セイイチ"],
  ["tsunekichi", "つねきち"], ["totakeke", "とたけけ"], ["hakkeme", "ハッケミィ"],
  ["perio", "ぺりお"], ["honma", "ホンマさん"], ["maigo", "まいごちゃんとお母さん"],
  ["yukidaruma", "ゆきだるま"], ["rakosuke", "ラコスケ"], ["resetsan", "リセットさん"],
  ["rolan", "ローラン"]
];

const residentPages = ["01_num", "02_a", "03_ka", "04_sa", "05_ta", "06_na", "07_ha", "08_ma", "09_ya", "10_ra"];
const itemPages = [
  ["kagu01", "家具・シリーズ"], ["kagu02", "家具・テーマ"], ["kagu03", "家具・セット"],
  ["kagu04", "家具・その他"], ["kabegami", "かべがみ"], ["jutan", "じゅうたん"],
  ["fuku", "服"], ["umbrella", "かさ"], ["boushi", "ぼうし"],
  ["kaburimono", "かぶりもの"], ["accessary", "アクセサリー"],
  ["fruit", "くだもの・カブ・どんぐり"], ["flower", "花"], ["shell", "貝がら"],
  ["letter", "びんせん"], ["original", "たぬきちの店限定"], ["eventitem", "イベント・特殊アイテム"]
];

const monkeyNames = new Set(["エイプリル", "エテキチ", "さるお", "サルモンティ", "チッチ", "モンこ"]);
const unresolvedResidentNames = new Set(["カルビ", "モモコ"]);
const marioCampaignNames = new Set([
  "スター", "どかん", "ノコノコのこうら", "ハテナブロック", "スーパーマリオのゆか", "コイン", "ファイアバー",
  "はた", "スーパーマリオのかべ", "レンガブロック", "キノコ", "キラーほうだい", "ファイアフラワー", "1UPキノコ"
]);
const specialCampaignNames = new Set(["ピクミン", "ブルーファルコン"]);
const sourceArtifacts = [];

function decodeEntities(value) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function cleanText(value) {
  return decodeEntities(value.replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]*>/g, " "))
    .replace(/[\u00a0\s]+/g, " ")
    .trim();
}

function parseRows(html) {
  return Array.from(html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi), (row) =>
    Array.from(row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi), (cell) => cleanText(cell[1]))
  ).filter((row) => row.length);
}

function contentBlock(html) {
  return html.match(/<div class="contents">([\s\S]*?)<\/div>\s*<!-- contents end -->/i)?.[1] ?? "";
}

function contentSections(html) {
  const block = contentBlock(html);
  return Array.from(block.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>([\s\S]*?)(?=<h4|$)/gi), (match) => ({
    heading: cleanText(match[1]),
    summary: cleanText(match[2].replace(/<table[\s\S]*?<\/table>/gi, "")).slice(0, 280)
  })).filter((section) => section.heading);
}

function tableGroups(html) {
  const block = contentBlock(html);
  const tables = [];
  for (const match of block.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)) {
    const prefix = block.slice(0, match.index);
    const headings = Array.from(prefix.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/gi));
    tables.push({
      group: headings.length ? cleanText(headings.at(-1)[1]) : "未分類",
      rows: parseRows(match[1])
    });
  }
  return tables;
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

async function fetchSource(url, sourceId) {
  const response = await fetch(url, { headers: { "user-agent": "WildWorldCompanionEvidenceExtractor/1.0" } });
  if (!response.ok) throw new Error(`${sourceId}: HTTP ${response.status}`);
  const html = await response.text();
  sourceArtifacts.push({ sourceId, url, sha256: sha256(html), bytes: Buffer.byteLength(html), retrievedOn: EXTRACTION_DATE });
  return html;
}

function sourceDefinition(id, label, url, lineageId, sourceType = "japanese_strategy_site", region = "JP") {
  const artifact = sourceArtifacts.find((entry) => entry.sourceId === id);
  return {
    id, label, url, region, language: region === "JP" ? "ja" : "en", sourceType, lineageId,
    independenceGroup: lineageId,
    independenceStatus: "single_lineage_not_independently_verified",
    retrievedOn: EXTRACTION_DATE,
    contentSha256: artifact?.sha256 ?? null
  };
}

function provenance(sourceIds, status = "SINGLE_SOURCE", confidence = "C") {
  return { status, confidence, region: "JP", sourceIds, sourceIndependence: status === "CORROBORATED" ? "different_upstreams_unverified" : "single_lineage" };
}

function claim(sourceId, field, rawValue, normalizedValue = rawValue, region = "JP") {
  return { sourceId, region, field, rawValue, normalizedValue, claimType: "EXPLICIT_PAGE_CONTENT" };
}

function baseRecord(id, type, japaneseName, sourceIds, status = "SINGLE_SOURCE") {
  return {
    id, type, japaneseName, englishName: "",
    verification: { status, region: "JP", confidence: status === "CORROBORATED" ? 0.7 : 0.55 },
    sourceReferences: sourceIds.map((sourceId) => ({ sourceId, relation: "supports" })),
    sourceClaims: [claim(sourceIds[0], "japaneseName", japaneseName)],
    fieldProvenance: { japaneseName: provenance(sourceIds, status, status === "CORROBORATED" ? "B" : "C") }
  };
}

function numericValue(raw) {
  if (!raw || raw === "－" || raw === "-" || raw === "非売品") return null;
  const digits = raw.replace(/[,，\sベル]/g, "");
  return /^\d+$/.test(digits) ? Number(digits) : null;
}

function acquisitionFromNote(note, context = {}) {
  if (!note || /^[－-]+$/.test(note)) return [];
  const rules = [
    [/イナリ|つねきち/, "NPC", "npc-tsunekichi", "REDD"], [/ローラン/, "NPC", "npc-rolan", "SAHARAH"],
    [/ゆきだるま/, "NPC", "npc-yukidaruma", "SNOWMAN"], [/グレース/, "NPC", "npc-grace", "GRACIE"],
    [/セイイチ/, "NPC", "npc-seiichi", "WENDELL"], [/ジョニー|宇宙船/, "NPC", "npc-johnny", "GULLIVER"],
    [/ラコスケ/, "NPC", "npc-rakosuke", "PASCAL"], [/カブリバ/, "NPC", "npc-kaburiba", "JOAN"],
    [/とたけけ/, "NPC", "npc-totakeke", "K_K_SLIDER"],
    [/コトブキ/, "REWARD", null, "MAYOR_TORTIMER"], [/たぬきち/, "SHOP", "facility-store", "NOOK_SHOP"],
    [/仕立屋/, "SHOP", "facility-tailor", "ABLE_SISTERS"],
    [/交換|物々/, "EXCHANGE", null, "EXCHANGE"], [/祭|大会|イベント|花火|カウントダウン|雪祭り|誕生日/, "EVENT", null, "EVENT"],
    [/もら|プレゼント|記念品|景品|届く|手紙/, "REWARD", null, "REWARD"],
    [/浜辺で拾|村になる|自然に生え|雑草の中|地面を掘|川・海で釣|花を放置|タンポポを放置|腐らす|タネ|交配|風船|落し物/, "OTHER", null, "WORLD_INTERACTION"]
  ];
  const matched = rules.find(([pattern]) => pattern.test(note));
  return [{
    methodType: matched?.[1] ?? "OTHER",
    sourceEntityId: matched?.[2] ?? null,
    sourceType: matched?.[3] ?? "EXPLICIT_SOURCE_NOTE",
    details: note,
    evidenceKind: context.evidenceKind ?? "EXPLICIT_ACQUISITION_TEXT",
    confidence: "C",
    verificationStatus: "SINGLE_SOURCE"
  }];
}

function purchaseFromBuyPrice(buyPrice, buyRaw) {
  if (!Number.isFinite(buyPrice)) return [];
  return [{
    methodType: "PURCHASE",
    sourceEntityId: null,
    sourceType: "RETAIL_OR_CATALOG_UNSPECIFIED",
    details: `買値 ${buyRaw}ベル（販売場所は出典表に記載なし）`,
    evidenceKind: "EXPLICIT_BUY_PRICE_COLUMN",
    confidence: "D",
    verificationStatus: "SINGLE_SOURCE"
  }];
}

function sentenceMatches(text, pattern) {
  return String(text ?? "").split(/[。！？]/).map((part) => part.trim()).filter((part) => part && pattern.test(part));
}

function locationFromSchedule(schedule) {
  return Array.from(String(schedule ?? "").matchAll(/[（(]([^）)]+)[）)]/g), (match) => match[1])
    .filter((value) => !/(AM|PM|一日中|1日中)/.test(value)).join(" / ") || null;
}

const facilities = [];
for (const [slug, name] of facilityPages) {
  const sourceId = `oi-mori-facility-${slug}`;
  const url = `${BASE}/nds/facility/${slug}.html`;
  const html = await fetchSource(url, sourceId);
  const sections = contentSections(html);
  const tables = tableGroups(html).filter((table) => table.rows.length > 0).map((table) => ({
    heading: table.group,
    columns: table.rows[0],
    rows: table.rows.slice(1).filter((row) => row.some(Boolean))
  }));
  const title = cleanText(html.match(/<h3 class="nds">([\s\S]*?)<\/h3>/i)?.[1] ?? name);
  const record = baseRecord(`facility-${slug}`, "facility", name, [sourceId]);
  record.sourceTitle = title;
  record.sourceQualityFlags = slug === "home" && /役場について/.test(title) ? ["SOURCE_TITLE_CONTENT_MISMATCH"] : [];
  record.operatingHours = title.match(/（([^）]*(?:営業|時間|AM|PM)[^）]*)）/)?.[1] ?? null;
  record.services = sections.map((section) => section.heading);
  record.details = sections;
  record.structuredTables = tables;
  record.upgrades = tables.filter((table) => /改築|お店がおおきくなる/.test(`${table.heading} ${table.columns.join(" ")}`));
  record.requirements = sections.flatMap((section) => sentenceMatches(section.summary, /必要|条件|一定|もらわないと|ならない/));
  record.rewards = tables.filter((table) => /もらえるアイテム/.test(table.columns.join(" ")));
  record.sourceClaims.push(claim(sourceId, "services", record.services));
  record.fieldProvenance.services = provenance([sourceId]);
  for (const [field, value] of Object.entries({ structuredTables: record.structuredTables, upgrades: record.upgrades, requirements: record.requirements, rewards: record.rewards })) {
    if (!value.length) continue;
    record.sourceClaims.push(claim(sourceId, field, value));
    record.fieldProvenance[field] = provenance([sourceId]);
  }
  if (record.operatingHours) {
    record.sourceClaims.push(claim(sourceId, "operatingHours", record.operatingHours));
    record.fieldProvenance.operatingHours = provenance([sourceId]);
  }
  facilities.push(record);
}

const npcs = [];
for (const [slug, name] of npcPages) {
  const sourceId = `oi-mori-npc-${slug}`;
  const url = `${BASE}/nds/guest/${slug}.html`;
  const html = await fetchSource(url, sourceId);
  const sections = contentSections(html);
  const record = baseRecord(`npc-${slug}`, "npc", name, [sourceId]);
  const visitSection = sections.find((section) => /訪問日|期間|出現/.test(section.heading));
  record.schedule = visitSection?.summary || null;
  record.role = sections.find((section) => section !== visitSection)?.heading ?? sections[0]?.heading ?? null;
  record.services = sections.map((section) => section.heading);
  record.details = sections;
  record.location = locationFromSchedule(record.schedule);
  record.appearanceConditions = [
    ...sentenceMatches(record.schedule, /※|場合|時|あと|後|終了|通信|セーブしない|打ち落と/),
    ...sections.flatMap((section) => sentenceMatches(section.summary, /必要|条件|場合|ないと|すると/))
  ].filter((value, index, values) => values.indexOf(value) === index);
  record.rewards = sections.flatMap((section) => sentenceMatches(section.summary, /もらえる|もらった|くれることも|お礼|報酬|プレゼント|記念品|グレース度/));
  if (record.schedule) {
    record.sourceClaims.push(claim(sourceId, "schedule", record.schedule));
    record.fieldProvenance.schedule = provenance([sourceId]);
  }
  if (record.role) {
    record.sourceClaims.push(claim(sourceId, "role", record.role));
    record.fieldProvenance.role = provenance([sourceId]);
  }
  for (const [field, value] of Object.entries({ location: record.location, appearanceConditions: record.appearanceConditions, rewards: record.rewards })) {
    if (value === null || (Array.isArray(value) && !value.length)) continue;
    record.sourceClaims.push(claim(sourceId, field, value));
    record.fieldProvenance[field] = provenance([sourceId]);
  }
  npcs.push(record);
}

const residentSourceRows = [];
for (const page of residentPages) {
  const sourceId = `oi-mori-residents-${page}`;
  const url = `${BASE}/nds/birthday/namelist${page}.html`;
  const html = await fetchSource(url, sourceId);
  for (const row of parseRows(contentBlock(html))) {
    if (row.length === 5 && row[0] !== "アイテム名") residentSourceRows.push({ sourceId, row });
  }
}

const modernHtml = await fetchSource(MODERN_LIST_URL, "soopoolleaf-acww-resident-index");
const modernPairs = Array.from(modernHtml.matchAll(/<a href="\/ja\/acna\/([^/]+)\/"[^>]*>[\s\S]*?<span style="display: block; font-size: 13px;">([^<]+)<\/span>/g), (match) => ({
  englishKey: decodeURIComponent(match[1]).toLowerCase().replace(/[^a-z0-9]+/g, ""),
  japaneseName: cleanText(match[2])
}));
const modernNames = new Set(modernPairs.map((entry) => entry.japaneseName));
const modernByJapanese = new Map(modernPairs.map((entry) => [entry.japaneseName, entry]));
const nookipediaHtml = await fetchSource(NOOKIPEDIA_WW_URL, "nookipedia-wild-world-residents");
const nookipediaRows = parseRows(nookipediaHtml).filter((row) => row.length === 7 && row[1] !== "Name");
const nookipediaByEnglish = new Map(nookipediaRows.map(([, englishName, species, gender, personality, birthday, catchphrase]) => [
  englishName.toLowerCase().replace(/[^a-z0-9]+/g, ""),
  { englishName, species, gender, personality, birthday, catchphrase }
]));
const speciesJapanese = {
  Alligator: "ワニ", Anteater: "アリクイ", Bear: "クマ", "Bear cub": "コグマ", Bird: "トリ", Bull: "オウシ",
  Cat: "ネコ", Chicken: "ニワトリ", Cow: "メウシ", Dog: "イヌ", Duck: "アヒル", Eagle: "ワシ", Elephant: "ゾウ",
  Frog: "カエル", Goat: "ヤギ", Gorilla: "ゴリラ", Hippo: "カバ", Horse: "ウマ", Kangaroo: "カンガルー", Koala: "コアラ",
  Lion: "ライオン", Monkey: "サル", Mouse: "ネズミ", Octopus: "タコ", Ostrich: "ダチョウ", Penguin: "ペンギン",
  Pig: "ブタ", Rabbit: "ウサギ", Rhinoceros: "サイ", Sheep: "ヒツジ", Squirrel: "リス", Tiger: "トラ", Wolf: "オオカミ"
};
const genderJapanese = { Female: "女", Male: "男" };
const personalityJapanese = { Peppy: "元気", Lazy: "ぼんやり", Normal: "普通", Snooty: "オトナ", Cranky: "コワイ", Jock: "ハキハキ" };
const residents = [];
const residentUncertainties = [];
for (const { sourceId, row } of residentSourceRows) {
  const [name, birthday, preferredStyle, dislikedStyle, personality] = row;
  if (unresolvedResidentNames.has(name)) {
    const modernCandidate = name === "カルビ" ? "カルピ" : "ももこ";
    residentUncertainties.push({
      sourceName: name, modernCandidate, disposition: "UNKNOWN",
      reason: "Two source lineages disagree on the Japanese display name; no canonical spelling was adopted."
    });
    continue;
  }
  const modern = modernByJapanese.get(name);
  if (!modern) continue;
  const wwIdentity = nookipediaByEnglish.get(modern.englishKey);
  if (!wwIdentity) continue;
  const id = `resident-${String(residents.length + 1).padStart(3, "0")}`;
  const sources = [sourceId, "soopoolleaf-acww-resident-index", "nookipedia-wild-world-residents"];
  const record = baseRecord(id, "resident", name, sources, "CORROBORATED");
  Object.assign(record, {
    englishName: wwIdentity.englishName,
    species: speciesJapanese[wwIdentity.species] ?? wwIdentity.species,
    gender: genderJapanese[wwIdentity.gender] ?? wwIdentity.gender,
    birthday, personality,
    preferredStyle, dislikedStyle, catchphrase: wwIdentity.catchphrase, distributionStatus: "standard_index"
  });
  for (const [field, value] of Object.entries({ birthday, personality, preferredStyle, dislikedStyle })) {
    record.sourceClaims.push(claim(sourceId, field, value));
    record.fieldProvenance[field] = provenance([sourceId]);
  }
  for (const [field, raw, normalized] of [
    ["englishName", wwIdentity.englishName, wwIdentity.englishName], ["species", wwIdentity.species, record.species],
    ["gender", wwIdentity.gender, record.gender], ["catchphrase", wwIdentity.catchphrase, wwIdentity.catchphrase]
  ]) {
    record.sourceClaims.push(claim("nookipedia-wild-world-residents", field, raw, normalized, "GLOBAL_WW"));
    record.fieldProvenance[field] = { ...provenance(["nookipedia-wild-world-residents"]), region: "GLOBAL_WW" };
  }
  record.sourceClaims.push(claim("soopoolleaf-acww-resident-index", "englishNameMapping", modern.englishKey, wwIdentity.englishName));
  record.fieldProvenance.englishNameMapping = provenance(["soopoolleaf-acww-resident-index"], "SINGLE_SOURCE", "C");
  residents.push(record);
}

for (const name of modernNames) {
  if (!monkeyNames.has(name)) continue;
  const modern = modernByJapanese.get(name);
  const wwIdentity = modern ? nookipediaByEnglish.get(modern.englishKey) : null;
  if (!modern || !wwIdentity) continue;
  const id = `resident-${String(residents.length + 1).padStart(3, "0")}`;
  const record = baseRecord(id, "resident", name, ["soopoolleaf-acww-resident-index", "nookipedia-wild-world-residents"]);
  Object.assign(record, {
    englishName: wwIdentity.englishName,
    species: speciesJapanese[wwIdentity.species] ?? wwIdentity.species,
    gender: genderJapanese[wwIdentity.gender] ?? wwIdentity.gender,
    birthday: wwIdentity.birthday,
    personality: personalityJapanese[wwIdentity.personality] ?? wwIdentity.personality,
    preferredStyle: null, dislikedStyle: null, catchphrase: wwIdentity.catchphrase,
    distributionStatus: "reported_distribution_unverified"
  });
  for (const [field, raw, normalized] of [
    ["englishName", wwIdentity.englishName, wwIdentity.englishName], ["species", wwIdentity.species, record.species],
    ["gender", wwIdentity.gender, record.gender], ["birthday", wwIdentity.birthday, record.birthday],
    ["personality", wwIdentity.personality, record.personality], ["catchphrase", wwIdentity.catchphrase, wwIdentity.catchphrase]
  ]) {
    record.sourceClaims.push(claim("nookipedia-wild-world-residents", field, raw, normalized, "GLOBAL_WW"));
    record.fieldProvenance[field] = { ...provenance(["nookipedia-wild-world-residents"], "SINGLE_SOURCE", "D"), region: "GLOBAL_WW" };
  }
  record.sourceClaims.push(claim("soopoolleaf-acww-resident-index", "englishNameMapping", modern.englishKey, wwIdentity.englishName));
  record.fieldProvenance.englishNameMapping = provenance(["soopoolleaf-acww-resident-index"], "SINGLE_SOURCE", "D");
  residents.push(record);
}

const gyroidSourceId = "oi-mori-item-haniwa";
const gyroidHtml = await fetchSource(`${BASE}/nds/item/haniwa.html`, gyroidSourceId);
const gyroidRows = tableGroups(gyroidHtml).flatMap((table) => table.rows
  .filter((row) => row.length === 4 && row[0] !== "アイテム名")
  .map((row) => ({ group: table.group, row })));
const gyroids = gyroidRows.map(({ group, row: [name, sellPriceRaw, color, mood] }, index) => {
  const record = baseRecord(`gyroid-${String(index + 1).padStart(3, "0")}`, "gyroid", name, [gyroidSourceId]);
  Object.assign(record, { group, sellPrice: numericValue(sellPriceRaw), color, mood });
  for (const [field, value] of Object.entries({ group, sellPrice: sellPriceRaw, color, mood })) {
    record.sourceClaims.push(claim(gyroidSourceId, field, value, field === "sellPrice" ? record.sellPrice : value));
    record.fieldProvenance[field] = provenance([gyroidSourceId]);
  }
  return record;
});

const campaignSourceId = "wikiwiki-ds-official-campaigns";
const campaignHtml = await fetchSource(CAMPAIGN_URL, campaignSourceId);
const campaignBody = cleanText(campaignHtml);
for (const campaignName of [...marioCampaignNames, ...specialCampaignNames]) {
  if (!campaignBody.includes(campaignName)) throw new Error(`${campaignSourceId}: missing campaign item ${campaignName}`);
}
if (!campaignBody.includes("カタログには載りません") || !campaignBody.includes("すれちがい通信")) {
  throw new Error(`${campaignSourceId}: campaign acquisition markers are missing`);
}

const items = [];
for (const [page, category] of itemPages) {
  const sourceId = `oi-mori-item-${page}`;
  const url = `${BASE}/nds/item/${page}.html`;
  const html = await fetchSource(url, sourceId);
  const seenRows = new Set();
  for (const table of tableGroups(html)) {
    const [header, ...rows] = table.rows;
    if (!header?.includes("アイテム名")) continue;
    for (const row of rows) {
      if (row.length !== header.length || !row[0] || row[0] === "アイテム名") continue;
      const signature = JSON.stringify([table.group, row]);
      if (seenRows.has(signature)) continue;
      seenRows.add(signature);
      const values = Object.fromEntries(header.map((key, index) => [key, row[index]]));
      const name = values["アイテム名"];
      const id = `item-${page}-${String(items.filter((item) => item.pageCode === page).length + 1).padStart(3, "0")}`;
      const record = baseRecord(id, "item", name, [sourceId]);
      const buyRaw = values["買値"] ?? null;
      const sellRaw = values["売値"] ?? null;
      const note = values["入手方法"] ?? values["備考欄"] ?? null;
      const buyPrice = numericValue(buyRaw);
      const isMarioCampaign = marioCampaignNames.has(name);
      const isSpecialCampaign = specialCampaignNames.has(name);
      const isCampaignItem = isMarioCampaign || isSpecialCampaign;
      let acquisition = acquisitionFromNote(note);
      if (page === "original") {
        acquisition = [{
          methodType: "SHOP", sourceEntityId: "facility-store", sourceType: "NOOK_SHOP",
          details: `たぬきちオリジナル商品${Number.isFinite(buyPrice) ? `・買値 ${buyRaw}ベル` : ""}`,
          evidenceKind: "PAGE_CATEGORY_AND_PRICE_COLUMN", confidence: "C", verificationStatus: "SINGLE_SOURCE"
        }];
      } else if (!acquisition.length && isCampaignItem) {
        acquisition = [{
          methodType: "EVENT", sourceEntityId: null, sourceType: "HISTORICAL_DS_DISTRIBUTION",
          details: isMarioCampaign
            ? "2005～2006年の『村長さんからのプレゼント』で、DSステーションとのすれちがい通信により配信（現在は終了）"
            : "第23回次世代ワールドホビーフェアおよび後年のDSステーションで配信（現在は終了）",
          evidenceKind: "EXPLICIT_HISTORICAL_DISTRIBUTION_TABLE", confidence: "C", verificationStatus: "SINGLE_SOURCE"
        }];
        record.sourceReferences.push({ sourceId: campaignSourceId, relation: "supports" });
      } else if (!acquisition.length) {
        acquisition = purchaseFromBuyPrice(buyPrice, buyRaw);
      }
      Object.assign(record, {
        pageCode: page, category, group: table.group, buyPrice, sellPrice: numericValue(sellRaw),
        buyPriceRaw: buyRaw, sellPriceRaw: sellRaw,
        color: values["色"] ?? null, mood: values["雰囲気"] ?? null, style: values["イメージ"] ?? null,
        luckyBonus: values.LB ?? null, notes: note && !/^[－-]+$/.test(note) ? note : null,
        catalogOrderable: isCampaignItem ? false : null, acquisition
      });
      for (const [field, raw, normalized] of [
        ["buyPrice", buyRaw, record.buyPrice], ["sellPrice", sellRaw, record.sellPrice], ["color", record.color, record.color],
        ["mood", record.mood, record.mood], ["style", record.style, record.style], ["notes", record.notes, record.notes]
      ]) {
        if (raw === null || raw === undefined || raw === "") continue;
        record.sourceClaims.push(claim(sourceId, field, raw, normalized));
        record.fieldProvenance[field] = provenance([sourceId]);
      }
      if (record.acquisition.length) {
        const acquisitionSourceId = isCampaignItem ? campaignSourceId : sourceId;
        const acquisitionRaw = isCampaignItem ? record.acquisition[0].details : note ?? buyRaw;
        record.sourceClaims.push(claim(acquisitionSourceId, "acquisition", acquisitionRaw, record.acquisition));
        const purchaseOnly = record.acquisition.every((entry) => entry.evidenceKind === "EXPLICIT_BUY_PRICE_COLUMN");
        record.fieldProvenance.acquisition = provenance([acquisitionSourceId], "SINGLE_SOURCE", purchaseOnly ? "D" : "C");
      }
      if (isCampaignItem) {
        record.sourceClaims.push(claim(campaignSourceId, "catalogOrderable", "カタログには載りません", false));
        record.fieldProvenance.catalogOrderable = provenance([campaignSourceId]);
      }
      items.push(record);
    }
  }
}

const eventSourceId = "oi-mori-calendar-events";
const eventHtml = await fetchSource(EVENT_URL, eventSourceId);
const supplementalEventSourceId = "jp-super-famicom-ww-events";
const supplementalEventHtml = await fetchSource(SUPPLEMENTAL_EVENT_URL, supplementalEventSourceId);
const supplementalEventBody = cleanText(supplementalEventHtml);
for (const marker of ["はなのトロフィー", "ムシとりのトロフィー", "池のほとり", "バースデーケーキ"]) {
  if (!supplementalEventBody.includes(marker)) throw new Error(`${supplementalEventSourceId}: missing event marker ${marker}`);
}
const eventRows = parseRows(contentBlock(eventHtml)).filter((row) => row.length === 4 && row[0] !== "イベント名");
const autumnRewardNames = [
  "さるのこしかけ", "きのこサイドテーブル", "きのこのランプ", "マッシュルームチェア", "きのこのたんす",
  "きのこクロゼット", "とうちゅうランプ", "きのこのテーブル", "きのこテレビ", "きのこのベッド",
  "きのこのもりのかべ", "きのこのもりのゆか"
];
const eventSupplements = {
  "春のガーデニング大会": {
    location: "自宅周辺", rewardText: "優勝すると、はなのトロフィーをもらえる", rewardItemNames: ["はなのトロフィー"]
  },
  "夏の花火大会": {
    rewardText: "村長さんから、おみくじ・せんこうはなび・ふきだしはなびをもらえる",
    rewardItemNames: ["せんこうはなび", "ふきだしはなび"]
  },
  "秋のどんぐり祭り": {
    location: "役場前", rewardText: "どんぐりを渡した数に応じて、きのこ家具・かべ・ゆかをもらえる",
    rewardItemNames: autumnRewardNames,
    rewardConflict: { sourceA: "各種どんぐり", sourceB: "どんぐりを渡した数に応じた、きのこ家具・かべ・ゆか全12種" }
  },
  "カウントダウン＆ニューイヤー・デイ": { location: "池のほとり" },
  "つり大会": {
    location: "役場前", rewardText: "優勝すると、つりのトロフィーをもらえる", rewardItemNames: ["つりのトロフィー"],
    timeConflict: { sourceA: "AM0:00～PM6:00", sourceB: "12:00～18:00" }
  },
  "ムシとり大会": {
    location: "役場前", rewardText: "優勝すると、ムシとりのトロフィーをもらえる", rewardItemNames: ["ムシとりのトロフィー"],
    timeConflict: { sourceA: "AM0:00～PM6:00", sourceB: "12:00～18:00" }
  },
  "あなたの誕生日": { rewardText: "最も仲の良い住人が、バースデーケーキを持ってお祝いしてくれる", rewardItemNames: ["バースデーケーキ"] }
};
const eventSpecs = {
  "春のガーデニング大会": {
    id: "spring-gardening-contest", dateRule: { kind: "NTH_WEEKDAY_SPAN", months: [4], nth: 2, startWeekday: 1, endWeekday: 0 },
    timeRule: { kind: "DAILY_HOURS_UNSPECIFIED", allDay: null }, rewardItemNames: []
  },
  "夏の花火大会": {
    id: "summer-fireworks", dateRule: { kind: "WEEKLY", months: [8], weekday: 6 },
    timeRule: { kind: "FIXED", start: "19:00", end: "24:00", allDay: false }, rewardItemNames: ["せんこうはなび", "ふきだしはなび"]
  },
  "秋のどんぐり祭り": {
    id: "autumn-acorn-festival", dateRule: { kind: "NTH_WEEKDAY_SPAN", months: [10], nth: 2, startWeekday: 1, endWeekday: 0 },
    timeRule: { kind: "DAILY_HOURS_UNSPECIFIED", allDay: null }, rewardItemNames: []
  },
  "冬の雪祭り": {
    id: "winter-snow-festival", dateRule: { kind: "NTH_WEEKDAY_SPAN", months: [2], nth: 2, startWeekday: 1, endWeekday: 0 },
    timeRule: { kind: "DAILY_HOURS_UNSPECIFIED", allDay: null }, rewardItemNames: []
  },
  "カウントダウン＆ニューイヤー・デイ": {
    id: "countdown-new-year", dateRule: { kind: "YEAR_BOUNDARY", months: [12, 1], start: { month: 12, day: 31 }, end: { month: 1, day: 1 } },
    timeRule: { kind: "START_TIME_END_UNSPECIFIED", start: "06:00", end: null, allDay: false }, rewardItemNames: ["クラッカー"]
  },
  "つり大会": {
    id: "fishing-tournament", dateRule: { kind: "NTH_WEEKDAY_BY_MONTH", months: [1, 2, 3, 4, 5, 10, 11, 12], weekday: 0, nthByMonth: { 1: 3, 2: 4, 3: 3, 4: 4, 5: 3, 10: 4, 11: 3, 12: 3 } },
    timeRule: { kind: "FIXED", start: "00:00", end: "18:00", allDay: false }, rewardItemNames: []
  },
  "ムシとり大会": {
    id: "bug-catching-tournament", dateRule: { kind: "NTH_WEEKDAY", months: [6, 7, 8, 9], nth: 3, weekday: 0 },
    timeRule: { kind: "FIXED", start: "00:00", end: "18:00", allDay: false }, rewardItemNames: []
  },
  "フリーマーケット": {
    id: "flea-market", dateRule: { kind: "NTH_WEEKDAY", months: [2, 3, 4, 5, 6, 7, 9, 10, 11, 12], nth: 1, weekday: 6 },
    timeRule: { kind: "ALL_DAY", allDay: true }, rewardItemNames: []
  },
  "ホメる日": {
    id: "compliment-day", dateRule: { kind: "NTH_WEEKDAY", months: [1, 3, 5, 7, 9, 11], nth: 4, weekday: 0 },
    timeRule: { kind: "ALL_DAY", allDay: true }, rewardItemNames: []
  },
  "うたの日": {
    id: "song-day", dateRule: { kind: "NTH_WEEKDAY", months: [1, 3, 5, 7, 9, 11], nth: 2, weekday: 6 },
    timeRule: { kind: "ALL_DAY", allDay: true }, rewardItemNames: []
  },
  "あなたの誕生日": {
    id: "player-birthday", dateRule: { kind: "PLAYER_CONFIGURED_BIRTHDAY", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    timeRule: { kind: "ALL_DAY", allDay: true }, rewardItemNames: []
  },
  "住人の誕生日": {
    id: "resident-birthdays", dateRule: { kind: "RESIDENT_BIRTHDAYS", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    timeRule: { kind: "ALL_DAY", allDay: true }, rewardItemNames: []
  }
};
const itemIdsByName = new Map(items.map((item) => [item.japaneseName, item.id]));
const events = eventRows.map(([rawName, dateText, description, rewardText]) => {
  const name = rawName.replace(/\s+/g, "");
  const spec = eventSpecs[name];
  if (!spec) throw new Error(`Unmapped event row: ${rawName}`);
  const record = baseRecord(`event-${spec.id}`, "event", name, [eventSourceId]);
  const supplement = eventSupplements[name];
  if (supplement) record.sourceReferences.push({ sourceId: supplementalEventSourceId, relation: "supports_or_disputes" });
  const rewardItemNames = [...new Set([...(spec.rewardItemNames ?? []), ...(supplement?.rewardItemNames ?? [])])];
  Object.assign(record, {
    dateText,
    dateRule: { ...spec.dateRule, raw: dateText },
    timeRule: { ...spec.timeRule, raw: dateText.match(/[（(]([^）)]*)[）)]/)?.[1] ?? dateText },
    description,
    location: supplement?.location ?? null,
    locationStatus: supplement?.location ? "KNOWN" : "UNKNOWN",
    conditions: [dateText],
    rewardText: (supplement?.rewardText ?? rewardText) || null,
    rewardStatus: (supplement?.rewardText ?? rewardText) ? "KNOWN" : "NOT_STATED_IN_PRIMARY_SOURCE",
    rewardItemNames,
    rewardItemIds: rewardItemNames.map((itemName) => itemIdsByName.get(itemName)).filter(Boolean),
    dataDiscrepancies: []
  });
  for (const [field, raw, normalized] of [
    ["dateRule", dateText, record.dateRule], ["timeRule", dateText, record.timeRule],
    ["description", description, description], ["conditions", dateText, record.conditions]
  ]) {
    if (raw === null || raw === undefined || raw === "" || (Array.isArray(normalized) && !normalized.length)) continue;
    record.sourceClaims.push(claim(eventSourceId, field, raw, normalized));
    record.fieldProvenance[field] = provenance([eventSourceId]);
  }
  if (rewardText) record.sourceClaims.push(claim(eventSourceId, "rewardText", rewardText, rewardText));
  if (supplement?.rewardText) {
    record.sourceClaims.push(claim(supplementalEventSourceId, "rewardText", supplement.rewardText, supplement.rewardText));
    record.fieldProvenance.rewardText = provenance([supplementalEventSourceId]);
  } else if (rewardText) {
    record.fieldProvenance.rewardText = provenance([eventSourceId]);
  }
  if (record.rewardItemIds.length) {
    const rewardClaimSourceId = supplement?.rewardItemNames?.length ? supplementalEventSourceId : eventSourceId;
    record.sourceClaims.push(claim(rewardClaimSourceId, "rewardItemIds", record.rewardItemNames, record.rewardItemIds));
    record.fieldProvenance.rewardItemIds = provenance([rewardClaimSourceId]);
  }
  if (record.location) {
    record.sourceClaims.push(claim(supplementalEventSourceId, "location", record.location));
    record.fieldProvenance.location = provenance([supplementalEventSourceId]);
  }
  if (supplement?.rewardConflict) {
    record.dataDiscrepancies.push({
      id: "WW-EXP-DISC-001", field: "rewardText", resolutionStatus: "provisionally_adopted",
      sourceAId: eventSourceId, sourceARawValue: supplement.rewardConflict.sourceA,
      sourceBId: supplementalEventSourceId, sourceBRawValue: supplement.rewardConflict.sourceB,
      adoptedValue: record.rewardText,
      adoptionReason: "より具体的な数量別報酬表を表示するが、一次表の『各種どんぐり』表記との不一致を保持",
      userFacingImpact: "どんぐり祭りの報酬説明は資料差分あり"
    });
    record.fieldProvenance.rewardText = {
      status: "CONFLICT", confidence: "D", region: "JP", sourceIds: [eventSourceId, supplementalEventSourceId],
      sourceIndependence: "different_upstreams_unverified", discrepancyIds: ["WW-EXP-DISC-001"]
    };
  }
  if (supplement?.timeConflict) {
    const id = name === "つり大会" ? "WW-EXP-DISC-002" : "WW-EXP-DISC-003";
    record.sourceClaims.push(claim(supplementalEventSourceId, "timeRule", supplement.timeConflict.sourceB, { ...record.timeRule, start: "12:00" }));
    record.dataDiscrepancies.push({
      id, field: "timeRule", resolutionStatus: "open",
      sourceAId: eventSourceId, sourceARawValue: supplement.timeConflict.sourceA,
      sourceBId: supplementalEventSourceId, sourceBRawValue: supplement.timeConflict.sourceB,
      adoptedValue: record.timeRule.raw,
      adoptionReason: "既存日本語イベント表の値を維持するが、別の日本語年中行事表との開始時刻差を未解決で保持",
      userFacingImpact: "大会の開始時刻は出典によって異なる"
    });
    record.fieldProvenance.timeRule = {
      status: "CONFLICT", confidence: "D", region: "JP", sourceIds: [eventSourceId, supplementalEventSourceId],
      sourceIndependence: "different_upstreams_unverified", discrepancyIds: [id]
    };
  }
  return record;
});

const oiSources = sourceArtifacts.filter((artifact) => artifact.sourceId.startsWith("oi-mori-")).map((artifact) =>
  sourceDefinition(artifact.sourceId, `どうぶつの森.com NDS: ${artifact.sourceId.replace(/^oi-mori-/, "")}`, artifact.url, "oi-mori-nds")
);
const sources = [
  ...oiSources,
  sourceDefinition(
    campaignSourceId,
    "どうぶつの森DS Wiki*: 公式イベント（歴史的配信記録）",
    CAMPAIGN_URL,
    "wikiwiki-ds-doubutu-community",
    "historical_japanese_community_campaign_archive"
  ),
  sourceDefinition(
    supplementalEventSourceId,
    "おいでよ どうぶつの森 どうぶつの森の年中行事",
    SUPPLEMENTAL_EVENT_URL,
    "super-famicom-jp-guide",
    "japanese_strategy_table"
  ),
  sourceDefinition(
    "soopoolleaf-acww-resident-index",
    "どうぶつの森主民百科: おいでよ どうぶつの森の住民リスト",
    MODERN_LIST_URL,
    "nookipedia-animalcrossingwiki-derived",
    "derived_multilingual_resident_database"
  ),
  sourceDefinition(
    "nookipedia-wild-world-residents",
    "Nookipedia: Villager/Wild World",
    NOOKIPEDIA_WW_URL,
    "nookipedia-wild-world-community",
    "explicit_wild_world_resident_roster",
    "GLOBAL_WW"
  )
];

const sourceIndex = new Map(sources.map((source, index) => [source.id, index]));
const payload = {
  generatedExpansionSources: sources,
  generatedFacilities: facilities.map(compactRecord),
  generatedNpcs: npcs.map(compactRecord),
  generatedResidents: residents.map(compactRecord),
  generatedGyroids: gyroids.map(compactRecord),
  generatedItems: items.map(compactRecord),
  generatedEvents: events.map(compactRecord),
  generatedResidentUncertainties: residentUncertainties
};

function compactRecord(record) {
  const { verification, sourceReferences, sourceClaims, fieldProvenance } = record;
  const facts = { ...record };
  delete facts.verification;
  delete facts.sourceReferences;
  delete facts.sourceClaims;
  delete facts.fieldProvenance;
  delete facts.pageCode;
  return {
    ...facts,
    _s: sourceReferences.map((reference) => sourceIndex.get(reference.sourceId)),
    _b: verification.status === "CORROBORATED" ? 1 : 0,
    _c: sourceClaims.map((entry) => [entry.field, entry.rawValue, sourceIndex.get(entry.sourceId), entry.normalizedValue, entry.region]),
    _d: Object.entries(fieldProvenance).filter(([, entry]) => entry.confidence === "D").map(([field]) => field)
  };
}

const output = `// Generated by scripts/research/extract-expansion-data.mjs on ${EXTRACTION_DATE}.\n// Compact source tuples are inflated by src/expansion-data.js; do not hand-edit.\n${Object.entries(payload).map(([name, value]) => `export const ${name}=${JSON.stringify(value)};`).join("\n")}\n`;
await mkdir(path.dirname(outputPath), { recursive: true });
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(outputPath, output, "utf8");

const acquisitionCovered = items.filter((item) => item.acquisition.length).length;
const report = {
  generatedOn: EXTRACTION_DATE,
  sourceScope: "Nintendo DS Japanese Wild World pages only for canonical expansion facts",
  sourceLineageWarning: "All oi-mori URLs are one source lineage and never count as independent corroboration.",
  counts: {
    npc: npcs.length, facility: facilities.length, gyroid: gyroids.length, resident: residents.length,
    item: items.length, event: events.length, acquisitionCoveredItems: acquisitionCovered,
    acquisitionUnknownItems: items.length - acquisitionCovered,
    purchasePlaceUnspecifiedItems: items.filter((item) => item.acquisition.some((entry) => entry.sourceType === "RETAIL_OR_CATALOG_UNSPECIFIED")).length,
    searchableExpansionRecords: npcs.length + facilities.length + gyroids.length + residents.length + items.length + events.length,
    unresolvedResidents: residentUncertainties.length
  },
  residentReconciliation: {
    oiMoriRawRows: residentSourceRows.length,
    exactCrossSourceMatches: residentSourceRows.filter(({ row }) => modernNames.has(row[0])).length,
    distributionMonkeyNamesConfirmedInAcwwIndex: residents.filter((resident) => resident.species === "サル").length,
    implemented: residents.length,
    unresolved: residentUncertainties
  },
  sourceArtifacts
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report.counts));
