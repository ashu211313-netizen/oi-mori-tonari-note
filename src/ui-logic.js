import { searchableText, toHiragana } from "./data.js";

const SHARED_FILTERS = new Set(["now", "undonated", "uncollected", "high", "cheap"]);
const FILTERS_BY_TYPE = {
  fish: new Set(["freshwater", "sea", "川", "池", "ため池", "滝", "河口", "海"]),
  bug: new Set(["木", "花", "地面", "ヤシの木", "水辺"])
};

export function normalizeQuery(value) {
  return toHiragana(value).trim().replace(/\s+/g, " ");
}

export function matchesQuery(entity, value) {
  const needle = normalizeQuery(value);
  return !needle || searchableText(entity).includes(needle);
}

export function sanitizeCritterFilters(filters, nextType) {
  const permitted = FILTERS_BY_TYPE[nextType] ?? new Set();
  return new Set([...filters].filter((filter) => SHARED_FILTERS.has(filter) || permitted.has(filter)));
}

export function getEvidenceNoticeModel(records) {
  const conflicts = records.filter((record) => record.status === "CONFLICT");
  if (conflicts.length) {
    return {
      level: "conflict",
      discrepancyIds: [...new Set(conflicts.flatMap((record) => record.discrepancyIds ?? []))],
      message: "未解決の情報差分があります。表示値は暫定で、確認済みとして扱わないでください。"
    };
  }
  if (records.some((record) => record.status === "SINGLE_SOURCE")) {
    return { level: "single-source", discrepancyIds: [], message: "単一資料・要追加確認を含みます。" };
  }
  if (records.some((record) => record.status === "CORROBORATED")) {
    return { level: "corroborated", discrepancyIds: [], message: "地域未確定資料で補強。JP独立2資料検証ではありません。" };
  }
  return null;
}
