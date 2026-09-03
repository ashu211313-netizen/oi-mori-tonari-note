export const VALID_ACQUISITION_METHODS = Object.freeze(["SHOP", "PURCHASE", "NPC", "EVENT", "EXCHANGE", "REWARD", "GIFT", "OTHER"]);

export function validateAcquisitionRecords(records, knownEntityIds) {
  const methods = new Set(VALID_ACQUISITION_METHODS);
  const errors = [];
  for (const record of records) {
    for (const method of record.acquisition ?? []) {
      if (!methods.has(method.methodType)) errors.push(`${record.id}: invalid acquisition method ${method.methodType}`);
      if (method.sourceEntityId && !knownEntityIds.has(method.sourceEntityId)) {
        errors.push(`${record.id}: dangling acquisition source ${method.sourceEntityId}`);
      }
      if (!method.details?.trim()) errors.push(`${record.id}: acquisition details are required`);
      if (!method.sourceType?.trim()) errors.push(`${record.id}: acquisition sourceType is required`);
      if (!method.evidenceKind?.trim()) errors.push(`${record.id}: acquisition evidenceKind is required`);
    }
  }
  return errors;
}
