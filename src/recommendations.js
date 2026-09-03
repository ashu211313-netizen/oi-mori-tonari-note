import {
  getAvailabilityStatus,
  getLeavingThisMonth,
  getLeavingToday,
  getRemainingAvailability
} from "./availability.js";

const rarityScore = {
  "超レア": 20,
  "レア": 14,
  "ややレア": 8,
  "普通": 2
};

export function getSmartRecommendations(entities, state, date, limit = 8, context = {}) {
  const month = date.getMonth() + 1;
  return entities
    .map((entity) => {
      const donated = Boolean(state.donated?.[entity.id]);
      const availabilityStatus = getAvailabilityStatus(entity, date, context);
      const availableNow = availabilityStatus === "available";
      const conditionalNow = availabilityStatus === "conditional";
      const leavingToday = getLeavingToday(entity, date);
      const leavingThisMonth = getLeavingThisMonth(entity, month);
      const valueScore = Math.min(30, Math.floor((entity.sellPrice ?? 0) / 500));
      const score =
        (!donated ? 60 : 0)
        + (leavingToday ? 55 : 0)
        + (leavingThisMonth ? 35 : 0)
        + (availableNow ? 25 : conditionalNow ? 12 : 0)
        + valueScore
        + (rarityScore[entity.rarity] ?? 0);
      const reasons = [];
      if (!donated) reasons.push("未寄贈");
      if (availableNow) reasons.push("今出現中");
      else if (conditionalNow) reasons.push("天候条件あり");
      if (leavingToday) reasons.push("今日で終了");
      else if (leavingThisMonth) reasons.push("今月で終了");
      if ((entity.sellPrice ?? 0) >= 5000) reasons.push(`${entity.sellPrice.toLocaleString("ja-JP")}ベル`);
      if (entity.rarity && entity.rarity !== "普通") reasons.push(entity.rarity);
      const remaining = availableNow ? getRemainingAvailability(entity, date, context) : null;
      return { entity, score, reasons, remaining, availabilityStatus };
    })
    .filter((item) => item.availabilityStatus !== "unavailable" && item.score > 0)
    .sort((a, b) =>
      b.score - a.score
      || (b.entity.sellPrice ?? 0) - (a.entity.sellPrice ?? 0)
      || a.entity.id.localeCompare(b.entity.id)
    )
    .slice(0, limit);
}
