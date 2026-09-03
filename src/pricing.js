import { normalizeQuantity } from "./storage.js";

export function getEffectiveSellPrice(entity, state = {}) {
  if (entity?.type === "art" && state.forged?.[entity.id]) {
    return entity.forgedSellPrice ?? entity.sellPrice ?? 0;
  }
  return entity?.sellPrice ?? 0;
}

export function calculateSellTotal(rows, entities, state = {}) {
  const byId = new Map(entities.map((entity) => [entity.id, entity]));
  return rows.reduce((sum, row) => {
    const entity = byId.get(row.id);
    if (!entity) return sum;
    const quantity = normalizeQuantity(row.quantity);
    return sum + getEffectiveSellPrice(entity, state) * quantity;
  }, 0);
}
