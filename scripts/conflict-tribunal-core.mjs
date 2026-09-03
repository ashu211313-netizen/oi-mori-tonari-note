import { canonicalChanges, dataDiscrepancies, dataVersion } from "../src/data.js";
import { buildEvidenceSufficiencyReport } from "./evidence-sufficiency-core.mjs";

const escalationByConflict = {
  "WW-DISC-001": {
    web: "2008 Yahoo!知恵袋表はサケを川（上旬は河口）とし上旬=1-15日と説明するが、『図鑑参照』の転載表で独立観測ではない",
    webUrls: ["https://detail.chiebukuro.yahoo.co.jp/qa/question_detail/q1421417014"],
    unresolved: "河口→川の切替日を独立JP資料または実機で再現できない"
  },
  "WW-DISC-002": {
    web: "2007 Wazap Q&Aはたいへんな/ゆうめいな名画の店別真贋を主張するが、user answers間でも判定方法が一致せず攻略本参照を含む",
    webUrls: ["https://wazap.com/question/%E5%8D%9A%E7%89%A9%E9%A4%A8%E3%81%AB%E5%AF%84%E8%B4%88%E3%81%99%E3%82%8B%E7%B5%B5%E7%94%BB%E3%81%AF%E3%81%A9%E3%81%86%E3%82%84%E3%81%A3%E3%81%A6%E5%85%A5%E6%89%8B%E3%81%99%E3%82%8B%E3%82%93%E3%81%A7%E3%81%99%E3%81%8B%EF%BC%9F/245708/"],
    unresolved: "JP版の2作品について店・商品枠・真贋・catalog/寄贈結果を連続記録できていない"
  },
  "WW-DISC-003": {
    web: "2006 Wazap等はヤママユガ1,200ベルを支持するが、既存JP表の200ベルと衝突し、投稿内に攻略本由来を示すlineage signalがある",
    webUrls: ["https://wazap.com/cheat/%E8%99%AB%E5%9B%B3%E9%91%91/245120/"],
    unresolved: "200/1,200を裁定する公式表、guidebook page、ADMJ data、JP実機売却表示がない"
  },
  "WW-DISC-004": {
    web: "2006 Wazapは6-9月を支持するが、別URLであっても共通攻略本/表コピーを排除できない",
    webUrls: ["https://wazap.com/cheat/%E8%99%AB%E5%9B%B3%E9%91%91/245120/"],
    unresolved: "9月spawnのJP実機再現またはADMJ spawn tableがない"
  },
  "WW-DISC-005": {
    web: "2006 Wazapはミツバチ3-8月を支持するが、独立観測方法がなく、3-9月claimを排除できない",
    webUrls: ["https://wazap.com/cheat/%E8%99%AB%E5%9B%B3%E9%91%91/245120/"],
    unresolved: "9月spawn有無のJP実機falsificationまたはADMJ spawn tableがない"
  },
  "WW-DISC-006": {
    web: "2008 Yahoo!知恵袋表はキングサーモンを川としてサケ表と併記し、現代play logは9月3日の川/河口捕獲だけで月内境界を証明しない",
    webUrls: ["https://detail.chiebukuro.yahoo.co.jp/qa/question_detail/q1421417014", "https://note.com/ama_tr_poke/n/n4504dbc46cc6"],
    unresolved: "月前半/後半の場所差をJP実機で境界日ごとに再現できていない"
  }
};

export function buildConflictTribunalReport() {
  const evidence = buildEvidenceSufficiencyReport();
  const conflictFields = evidence.fieldDispositions.filter((entry) => entry.evidenceSufficiencyClass === "D_CONFLICT");
  const tribunals = dataDiscrepancies.map((conflict) => {
    const research = escalationByConflict[conflict.id];
    const fields = conflictFields.filter((entry) => entry.discrepancyIds.includes(conflict.id));
    return {
      conflictId: conflict.id,
      entityId: conflict.entityId,
      affectedEntityIds: conflict.affectedEntityIds ?? [conflict.entityId],
      field: conflict.field,
      region: conflict.region,
      sourceClaimIds: conflict.sourceClaimIds,
      sourceA: { id: conflict.sourceAId, rawValue: conflict.sourceARawValue, normalizedValue: conflict.sourceANormalizedValue },
      sourceB: { id: conflict.sourceBId, rawValue: conflict.sourceBRawValue, normalizedValue: conflict.sourceBNormalizedValue },
      currentAdoptedValue: conflict.adoptedValue,
      currentConfidence: conflict.confidence,
      escalation: {
        web: { status: "COMPLETE_NO_RESOLUTION", finding: research.web, urls: research.webUrls },
        archive: { status: "ATTEMPTED_BLOCKED", finding: "Wayback CDX could not be retrieved in this host and indexed archive search returned no usable result; no archive evidence claimed" },
        bibliography: { status: "GUIDEBOOK_DERIVED_UNCONFIRMED", finding: "four JP guidebooks and ISBNs identified; relevant pages/editions/corrections not available for inspection" },
        gameData: { status: "NO_REPRODUCIBLE_ADMJ_FIELD_DATA", finding: "public ACWW save/modding research inspected but no JP price/spawn/art table with reproducible provenance found" },
        hardware: { status: "PLAN_GENERATED_NOT_RUN", plans: fields.map((entry) => entry.physicalHardwarePlan) }
      },
      fieldDispositions: fields.map((entry) => ({
        queueKey: entry.queueKey,
        evidenceSufficiencyClass: entry.evidenceSufficiencyClass,
        userRisk: entry.userRisk,
        releaseBlockerAfter: entry.releaseBlockerAfter,
        hardwarePlanId: entry.physicalHardwarePlan.planId
      })),
      decision: "RETAIN_CONFLICT",
      decisionReason: research.unresolved,
      canonicalChanged: false,
      dataVersionChanged: false,
      nextExactAction: fields.map((entry) => entry.nextExactAction),
      auditedAt: "2026-09-02"
    };
  });
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    dataVersion,
    summary: {
      registryBefore: dataDiscrepancies.length,
      registryAfter: tribunals.length,
      affectedFieldsBefore: conflictFields.length,
      affectedFieldsAfter: tribunals.flatMap((entry) => entry.fieldDispositions).length,
      resolved: tribunals.filter((entry) => entry.decision !== "RETAIN_CONFLICT").length,
      retained: tribunals.filter((entry) => entry.decision === "RETAIN_CONFLICT").length,
      canonicalChanges: canonicalChanges.length,
      releaseInterpretation: "CONFLICT_GATE_INCOMPLETE"
    },
    tribunals
  };
}
