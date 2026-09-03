import { allEntities, searchableText, toHiragana } from "./data.js";
import { allExpansionEntities, expansionSearchableText } from "./expansion-data.js";

export const universalTypeLabels = Object.freeze({
  fish: "サカナ", bug: "ムシ", fossil: "化石", art: "名画", item: "アイテム",
  resident: "住民", gyroid: "はにわ", npc: "NPC", facility: "施設", event: "イベント"
});

export const allSearchableEntities = Object.freeze([...allEntities, ...allExpansionEntities]);
const expansionIds = new Set(allExpansionEntities.map((entity) => entity.id));

export function isExpansionSearchEntity(entity) {
  return expansionIds.has(entity.id);
}

export function universalSearchableText(entity) {
  const base = isExpansionSearchEntity(entity) ? expansionSearchableText(entity) : searchableText(entity);
  return `${base} ${toHiragana(universalTypeLabels[entity.type] ?? entity.type)}`;
}

export function searchUniversal(value, type = "all", limit = 60) {
  const normalized = toHiragana(value).trim();
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  return allSearchableEntities
    .filter((entity) => type === "all" || entity.type === type)
    .filter((entity) => {
      const haystack = universalSearchableText(entity);
      return tokens.every((token) => haystack.includes(token));
    })
    .map((entity) => {
      const name = toHiragana(entity.japaneseName);
      const englishName = toHiragana(entity.englishName ?? "");
      const score = name === normalized || englishName === normalized ? 1000
        : name.startsWith(normalized) || englishName.startsWith(normalized) ? 500
          : tokens.reduce((total, token) => total + (name.includes(token) ? 20 : 1), 0);
      return { entity, score };
    })
    .sort((a, b) => b.score - a.score || a.entity.id.localeCompare(b.entity.id))
    .map(({ entity }) => entity)
    .slice(0, limit);
}
