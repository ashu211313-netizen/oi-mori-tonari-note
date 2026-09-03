import { toHiragana } from "./data.js";
import { resolveEntityImage } from "./images.js";
import {
  generatedExpansionSources,
  generatedEvents,
  generatedFacilities,
  generatedGyroids,
  generatedItems,
  generatedNpcs,
  generatedResidents,
  generatedResidentUncertainties
} from "./generated/expansion-records.js";

function inflateRecord(raw) {
  const { _s, _b, _c, _d, ...facts } = raw;
  const sourceIds = _s.map((index) => generatedExpansionSources[index].id);
  const status = _b ? "CORROBORATED" : "SINGLE_SOURCE";
  const confidence = _b ? 0.7 : 0.55;
  const lowConfidenceFields = new Set(_d);
  const fields = [...new Set(_c.map(([field]) => field))];
  const claimsFor = (field) => _c.filter(([claimField]) => claimField === field);
  const record = {
    ...facts,
    englishName: facts.englishName ?? "",
    verification: { status, region: "JP", confidence },
    sourceReferences: sourceIds.map((sourceId) => ({
      sourceId,
      relation: facts.dataDiscrepancies?.some((entry) => entry.sourceAId === sourceId || entry.sourceBId === sourceId)
        ? "supports_or_disputes"
        : "supports"
    })),
    sourceClaims: _c.map(([field, rawValue, sourceIndex, normalizedValue, region]) => ({
      sourceId: generatedExpansionSources[sourceIndex ?? _s[0]].id,
      region: region ?? "JP",
      field,
      rawValue,
      normalizedValue: normalizedValue ?? (Object.hasOwn(facts, field) ? facts[field] : rawValue),
      claimType: "EXPLICIT_PAGE_CONTENT"
    })),
    fieldProvenance: Object.fromEntries(fields.map((field) => {
      const fieldClaims = claimsFor(field);
      const fieldSourceIds = [...new Set(fieldClaims.map(([, , sourceIndex]) => generatedExpansionSources[sourceIndex ?? _s[0]].id))];
      const regions = [...new Set(fieldClaims.map(([, , , , region]) => region ?? "JP"))];
      const fieldDiscrepancies = (facts.dataDiscrepancies ?? []).filter((entry) => entry.field === field);
      return [field, {
        status: fieldDiscrepancies.length ? "CONFLICT" : field === "japaneseName" ? status : fieldSourceIds.length > 1 ? "CORROBORATED" : "SINGLE_SOURCE",
        confidence: lowConfidenceFields.has(field) ? "D" : field === "japaneseName" && _b ? "B" : "C",
        region: regions.length === 1 ? regions[0] : "MIXED_WW",
        sourceIds: field === "japaneseName" ? sourceIds : fieldSourceIds,
        sourceIndependence: (field === "japaneseName" && _b) || fieldSourceIds.length > 1 ? "different_upstreams_unverified" : "single_lineage",
        ...(fieldDiscrepancies.length ? { discrepancyIds: fieldDiscrepancies.map((entry) => entry.id) } : {})
      }];
    }))
  };
  return Object.freeze({ ...record, image: resolveEntityImage(record) });
}

export const expansionSources = Object.freeze(generatedExpansionSources);
export const eventList = Object.freeze(generatedEvents.map(inflateRecord));
export const facilityList = Object.freeze(generatedFacilities.map(inflateRecord));
export const npcList = Object.freeze(generatedNpcs.map(inflateRecord));
export const residentList = Object.freeze(generatedResidents.map(inflateRecord));
export const gyroidList = Object.freeze(generatedGyroids.map(inflateRecord));
export const itemList = Object.freeze(generatedItems.map(inflateRecord));
export const residentUncertainties = Object.freeze(generatedResidentUncertainties);

export const allExpansionEntities = Object.freeze([
  ...itemList,
  ...residentList,
  ...gyroidList,
  ...npcList,
  ...facilityList,
  ...eventList
]);

export const expansionCounts = Object.freeze({
  item: itemList.length,
  resident: residentList.length,
  gyroid: gyroidList.length,
  npc: npcList.length,
  facility: facilityList.length,
  event: eventList.length,
  total: allExpansionEntities.length,
  acquisitionCoveredItems: itemList.filter((item) => item.acquisition.length > 0).length,
  acquisitionUnknownItems: itemList.filter((item) => item.acquisition.length === 0).length,
  purchasePlaceUnspecifiedItems: itemList.filter((item) => item.acquisition.some((method) => method.sourceType === "RETAIL_OR_CATALOG_UNSPECIFIED")).length,
  unresolvedResidents: residentUncertainties.length
});

export function expansionSearchableText(entity) {
  const startTimeAlias = entity.timeRule?.start
    ? `${Number(entity.timeRule.start.split(":")[0])}時${entity.timeRule.start.endsWith(":00") ? "" : entity.timeRule.start.slice(3)}`
    : null;
  return toHiragana([
    entity.japaneseName,
    entity.englishName,
    entity.type,
    entity.category,
    entity.group,
    entity.buyPrice,
    entity.sellPrice,
    entity.color,
    entity.mood,
    entity.style,
    entity.birthday,
    entity.personality,
    entity.species,
    entity.role,
    entity.schedule,
    entity.operatingHours,
    entity.dateText,
    entity.description,
    entity.location,
    entity.rewardText,
    entity.catchphrase,
    startTimeAlias,
    ...(entity.services ?? []),
    ...(entity.rewards ?? []),
    ...(entity.requirements ?? []),
    ...(entity.rewardItemNames ?? []),
    ...(entity.acquisition ?? []).flatMap((method) => [method.methodType, method.sourceType, method.details])
  ].filter((value) => value !== null && value !== undefined && value !== "").join(" "));
}

export function matchesExpansionQuery(entity, value) {
  const needle = toHiragana(value).trim().replace(/\s+/g, " ");
  return !needle || expansionSearchableText(entity).includes(needle);
}
