import { resolveEntityImage } from "./images.js";

const checkedAt = "2026-09-01";
const gameScope = "Animal Crossing: Wild World";

export const dataVersion = "2026.09.03.3";
export const canonicalChanges = [];

export const sourceIndependenceAudits = {
  "nookipedia-fish-ww": {
    independenceStatus: "possibly_dependent",
    independenceBasis: "Wild World専用本文は確認済み。Nookipedia内の他ページと同一運営・同一編集系統であり、外部JP表との共通上流資料も排除できない。",
    bodyAuditStatus: "READ"
  },
  "jp-fish-superfamicom": {
    independenceStatus: "possibly_dependent",
    independenceBasis: "日本語Wild World魚表の本文・見出し・行を確認済み。出典表示がなく、市販攻略本等の共通上流を排除できない。",
    bodyAuditStatus: "READ"
  },
  "nookipedia-bug-ww": {
    independenceStatus: "possibly_dependent",
    independenceBasis: "Wild World専用本文は確認済み。Nookipedia内ページは相互に独立票とせず、外部JP表との共通上流も未証明。",
    bodyAuditStatus: "READ"
  },
  "jp-bug-superfamicom": {
    independenceStatus: "possibly_dependent",
    independenceBasis: "日本語Wild World虫表の本文・見出し・行を確認済み。出典表示がなく、市販攻略本等の共通上流を排除できない。",
    bodyAuditStatus: "READ"
  },
  "nookipedia-fossil-ww": {
    independenceStatus: "possibly_dependent",
    independenceBasis: "Wild World専用本文は確認済み。同一Wiki系統を独立票として重複計上せず、JP資料との共通上流は未証明。",
    bodyAuditStatus: "READ"
  },
  "jp-fossil-oi-mori": {
    independenceStatus: "possibly_dependent",
    independenceBasis: "日本語Wild World化石表の本文・列を確認済み。独自実測または一次出典の表示がなく、共通攻略本由来を排除できない。",
    bodyAuditStatus: "READ"
  },
  "nookipedia-art-ww": {
    independenceStatus: "possibly_dependent",
    independenceBasis: "Wild World専用名画表の本文を確認済み。同一Nookipedia系統のForgeryページとは独立票にせず、JP地域同値も未証明。",
    bodyAuditStatus: "READ"
  },
  "nookipedia-forgery": {
    independenceStatus: "dependent",
    independenceBasis: "Wild World節が外部FAQを参照しているため、その引用元や同一Nookipediaページ群と独立した証拠として数えない。",
    bodyAuditStatus: "READ"
  },
  "jp-redd-atwiki": {
    independenceStatus: "possibly_dependent",
    independenceBasis: "日本語Wild World本文と履歴年代は確認済みだが、投稿の一次出典・攻略本系譜を確定できない。",
    bodyAuditStatus: "READ"
  },
  "supercheats-ww-faq": {
    independenceStatus: "possibly_dependent",
    independenceBasis: "Wild World FAQ本文を確認済み。著者表であるが、上流資料・転載関係と地域適用性を確定できない。",
    bodyAuditStatus: "READ"
  },
  "gameyum-ww-bugs": {
    independenceStatus: "possibly_dependent",
    independenceBasis: "Wild World虫記事本文を確認済み。編集記事の上流表と地域適用性を確定できない。",
    bodyAuditStatus: "READ"
  },
  "thonky-acww-bugs": {
    independenceStatus: "possibly_dependent",
    independenceBasis: "Wild World虫表本文を確認済み。表の上流資料・他攻略表との依存関係とJP適用性を確定できない。",
    bodyAuditStatus: "READ"
  },
  "izuito-ww-lists": {
    independenceStatus: "possibly_dependent",
    independenceBasis: "2005年発売の日本版Wild Worldを明示する本文と魚・虫・化石の売値表を確認済み。運営者は別だが、一次出典や共通攻略本由来を排除できないため独立票には数えない。",
    bodyAuditStatus: "READ"
  },
  "jp-firsthand-landscape": {
    independenceStatus: "independent",
    independenceBasis: "2005-11-28本文が『今日釣ったり拾ったりしたものだけ』『攻略サイト見れば全部載ってるだろうけど、それじゃ楽しくない』と作成方法を明示。発売3日後から本人の捕獲分だけを段階更新しており、攻略表・攻略本からの転載を否定する直接的lineage証拠がある。",
    bodyAuditStatus: "READ"
  },
  "jp-firsthand-hot-cocoa": {
    independenceStatus: "independent",
    independenceBasis: "本文が『僕の釣った魚だけでも値段表を作ります』と明示し、捕獲済みだが価格を忘れた魚は表から除外している。包括表の転載ではなく本人のプレイ観測から作成されたことを示す直接的lineage証拠がある。",
    bodyAuditStatus: "READ"
  }
};

function lineage(evidenceClass, operator, publisher, upstreamSource, lineageSignals, citedSourceIds = []) {
  return {
    evidenceClass,
    operator,
    publisher,
    firstPublication: "UNKNOWN",
    upstreamSource,
    citedSourceIds,
    lineageSignals,
    archiveStatus: "LIVE_BODY_READ_2026-09-01",
    lineageConclusion: "独立性を肯定する一次的なlineage証拠が不足。別URL・別domainだけでは独立扱いしない。"
  };
}

export const sourceLineageAudits = {
  "nookipedia-fish-ww": lineage(
    "CROSS_REGION_WW", "Nookipedia community editors", "Nookipedia",
    "UNKNOWN_COMMUNITY_AND_GUIDE_INPUTS", ["same operator as other Nookipedia pages", "shared Wiki revision ancestry"]
  ),
  "jp-fish-superfamicom": lineage(
    "JP_POSSIBLY_DEPENDENT", "super-famicom.jp site operator (identity unverified)", "super-famicom.jp",
    "UNKNOWN_POSSIBLE_COMMERCIAL_GUIDE", ["same site and table style as JP bug table", "source attribution not disclosed"]
  ),
  "nookipedia-bug-ww": lineage(
    "CROSS_REGION_WW", "Nookipedia community editors", "Nookipedia",
    "UNKNOWN_COMMUNITY_AND_GUIDE_INPUTS", ["same operator as other Nookipedia pages", "shared Wiki revision ancestry"]
  ),
  "jp-bug-superfamicom": lineage(
    "JP_POSSIBLY_DEPENDENT", "super-famicom.jp site operator (identity unverified)", "super-famicom.jp",
    "UNKNOWN_POSSIBLE_COMMERCIAL_GUIDE", ["same site and table style as JP fish table", "source attribution not disclosed"]
  ),
  "nookipedia-fossil-ww": lineage(
    "CROSS_REGION_WW", "Nookipedia community editors", "Nookipedia",
    "UNKNOWN_COMMUNITY_AND_GUIDE_INPUTS", ["same operator as other Nookipedia pages", "shared Wiki revision ancestry"]
  ),
  "jp-fossil-oi-mori": lineage(
    "JP_POSSIBLY_DEPENDENT", "oi-mori.com site editors", "どうぶつの森.com",
    "UNKNOWN_POSSIBLE_COMMERCIAL_GUIDE", ["source attribution not disclosed", "same site has known duplicate and shifted calendar rows"]
  ),
  "nookipedia-art-ww": lineage(
    "CROSS_REGION_WW", "Nookipedia community editors", "Nookipedia",
    "UNKNOWN_COMMUNITY_AND_GUIDE_INPUTS", ["same operator as Nookipedia Forgery", "shared Wiki revision ancestry"]
  ),
  "nookipedia-forgery": lineage(
    "CROSS_REGION_WW", "Nookipedia community editors", "Nookipedia",
    "EXTERNAL_FAQ_CITED_BY_PAGE", ["same operator as Nookipedia Art", "Wild World section cites an external FAQ"],
    ["external-faq-not-registered"]
  ),
  "jp-redd-atwiki": lineage(
    "JP_POSSIBLY_DEPENDENT", "historical community editors", "atwiki platform",
    "UNKNOWN_COMMUNITY_OR_GUIDE_INPUT", ["community-editable page", "exact claim author and upstream source unresolved"]
  ),
  "supercheats-ww-faq": lineage(
    "CROSS_REGION_WW", "user-authored FAQ contributor", "SuperCheats",
    "UNKNOWN_AUTHOR_RESEARCH_OR_GUIDE_INPUT", ["single author-style FAQ", "region applicability unresolved", "fossil inconsistencies observed"]
  ),
  "gameyum-ww-bugs": lineage(
    "CROSS_REGION_WW", "GameYum editorial contributor", "GameYum",
    "UNKNOWN_EDITORIAL_UPSTREAM", ["editorial list", "source attribution and region unresolved"]
  ),
  "thonky-acww-bugs": lineage(
    "CROSS_REGION_WW", "Thonky site operator", "Thonky",
    "UNKNOWN_GUIDE_OR_GAMEPLAY_INPUT", ["community guide table", "source attribution and region unresolved"]
  ),
  "izuito-ww-lists": lineage(
    "JP_POSSIBLY_DEPENDENT", "DSHata / 伊豆・伊東情報館", "伊豆・伊東情報館",
    "UNKNOWN_POSSIBLE_COMMERCIAL_GUIDE", ["separate operator from other JP sites", "no source attribution", "fish, bug and fossil sell-price lists grouped on one page"]
  ),
  "jp-firsthand-landscape": {
    evidenceClass: "JP_FIRSTHAND_GAMEPLAY_OBSERVATION",
    operator: "Saito Hiroaki",
    publisher: "Landscape / sonic64.com",
    firstPublication: "2005-11-28 (entry date); earliest Wayback capture 2006-01-16",
    upstreamSource: "AUTHOR_DIRECT_GAMEPLAY_OBSERVATION",
    citedSourceIds: [],
    lineageSignals: [
      "states the list contains only items personally caught or picked up",
      "states攻略サイト could provide a complete list but using one would not be fun",
      "partial list grows across dated 2005-11-28, 2005-12-02, 2005-12-19 and 2006-01-12 entries"
    ],
    archiveStatus: "LIVE_BODY_READ_2026-09-01; WAYBACK_EARLIEST_2006-01-16",
    lineageConclusion: "攻略サイト・攻略本を使わず本人の日本版プレイ結果を段階記録したことが本文と当時アーカイブで確認できる。"
  },
  "jp-firsthand-hot-cocoa": {
    evidenceClass: "JP_FIRSTHAND_GAMEPLAY_OBSERVATION",
    operator: "（ここぁ・ω・） / sakura",
    publisher: "hot*cocoa / 楽天ブログ",
    firstPublication: "2007-01-12 or earlier (site diary date; static page has no per-section timestamp)",
    upstreamSource: "AUTHOR_DIRECT_GAMEPLAY_OBSERVATION",
    citedSourceIds: [],
    lineageSignals: [
      "states the price table contains only fish personally caught",
      "omits personally caught fish when the author forgot their prices",
      "partial winter catch list rather than a complete encyclopedia table"
    ],
    archiveStatus: "LIVE_BODY_READ_2026-09-01; NO_WAYBACK_CDX_CAPTURE_FOUND; RSS_DIARY_2007-01-12",
    lineageConclusion: "本人の捕獲と記憶に基づく部分表であることが本文から確認できる。静的ページ自体の初回公開日は確定できないため、その不確実性を保持する。"
  }
};

function source(id, label, url, sourceType, independenceGroup, region, confidence, sourceQualityNotes) {
  const independenceAudit = sourceIndependenceAudits[id];
  const sourceLineage = sourceLineageAudits[id];
  if (!independenceAudit) throw new Error(`Missing source independence audit: ${id}`);
  if (!sourceLineage) throw new Error(`Missing source lineage audit: ${id}`);
  return {
    id,
    label,
    url,
    sourceType,
    independenceGroup,
    region,
    gameScope,
    checkedAt,
    confidence,
    sourceQualityNotes,
    independenceStatus: independenceAudit.independenceStatus,
    independenceBasis: independenceAudit.independenceBasis,
    bodyAuditStatus: independenceAudit.bodyAuditStatus,
    independenceCheckedAt: checkedAt,
    lineage: sourceLineage
  };
}

export const sources = [
  source("nookipedia-fish-ww", "Nookipedia Fish/Wild World", "https://nookipedia.com/wiki/Fish/Wild_World", "community_database", "nookipedia-community-database", "region_unknown", "High", "Wild World専用表。英語圏表示のためJP同値の単独証明には使わない。"),
  source("jp-fish-superfamicom", "おいでよ どうぶつの森 魚 完全版", "https://www.super-famicom.jp/etc00/doubutu/oideyo/ds_sakana.html", "japanese_strategy_table", "super-famicom-jp-guide", "JP", "Medium", "日本語版の行・列を目視確認。公式資料ではない。"),
  source("nookipedia-bug-ww", "Nookipedia Bug/Wild World", "https://nookipedia.com/wiki/Bug/Wild_World", "community_database", "nookipedia-community-database", "region_unknown", "High", "Wild World専用表。英語圏表示のためJP同値の単独証明には使わない。"),
  source("jp-bug-superfamicom", "おいでよ どうぶつの森 虫 完全版", "https://www.super-famicom.jp/etc00/doubutu/oideyo/ds_musi.html", "japanese_strategy_table", "super-famicom-jp-guide", "JP", "Medium", "日本語版の行・列を目視確認。公式資料ではない。"),
  source("nookipedia-fossil-ww", "Nookipedia Fossil/Wild World", "https://nookipedia.com/wiki/Fossil/Wild_World", "community_database", "nookipedia-community-database", "region_unknown", "High", "Wild World専用表。日本語版の価格一致は別資料で照合。"),
  source("jp-fossil-oi-mori", "どうぶつの森.com 化石", "https://www.oi-mori.com/nds/item/kaseki.html", "japanese_strategy_table", "oi-mori-jp-guide", "JP", "Medium", "日本語版の化石表。公式資料ではない。"),
  source("nookipedia-art-ww", "Nookipedia Art/Wild World", "https://nookipedia.com/wiki/Art/Wild_World", "community_database", "nookipedia-community-database", "region_unknown", "High", "Wild World専用表。価格・入手元を抽出したがJP地域は未確定。"),
  source("nookipedia-forgery", "Nookipedia Forgery", "https://nookipedia.com/wiki/Forgery", "community_wiki", "nookipedia-community-database", "region_unknown", "High", "Wild World節は外部FAQを引用しており、引用元と独立2資料には数えない。"),
  source("jp-redd-atwiki", "おいでよ つねきち攻略@wiki", "https://w.atwiki.jp/animal_crossing/pages/725.html", "historical_community_wiki", "jp-atwiki-community", "JP", "Medium", "2007年更新の日本語版コミュニティ資料。名画2種の記述が他資料と衝突。"),
  source("supercheats-ww-faq", "SuperCheats Wild World FAQ", "https://www.supercheats.com/nintendods/walkthroughs/animalcrossingwildworld-walkthrough09.txt", "user_authored_faq", "supercheats-user-faq", "region_unknown", "Low", "虫・魚表を追加調査。化石表には既知の不一致があり、広範な正本には採用しない。"),
  source("gameyum-ww-bugs", "GameYum Wild World insect guide", "https://www.gameyum.com/animal-crossing/8848-collection-guide-insects-wild-world-ds/", "editorial_guide", "gameyum-editorial", "region_unknown", "Low", "ヤママユガとミツバチの不一致調査に限定使用。"),
  source("thonky-acww-bugs", "Thonky ACWW bug list", "https://www.thonky.com/acww/list-of-bugs", "community_guide", "thonky-guide", "region_unknown", "Low", "月範囲に他資料との不一致があり、Canonical Evidenceには昇格しない。"),
  source("izuito-ww-lists", "伊豆・伊東情報館 おいでよ どうぶつの森 各種リスト", "https://izuito.net/game/nds-doubutu/index.htm", "japanese_strategy_table", "izuito-jp-guide", "JP", "Low", "魚・虫・化石の売値表を本文で確認。ヤママユガ1,200ベルを記載するが、共通上流を排除できないためCanonical昇格には使用しない。"),
  source("jp-firsthand-landscape", "Landscape タヌキ商店 買い取り価格リスト", "https://sonic64.com/cat_e3818ae38184e381a7e3828820e381a9e38186e381b6e381a4e381aee6a3ae.html", "firsthand_gameplay_log", "landscape-firsthand-observation", "JP", "High", "発売3日後から本人が捕獲した魚だけを段階記録。本文が攻略サイト不使用を明示し、2006-01-16以降のWayback記録あり。"),
  source("jp-firsthand-hot-cocoa", "hot*cocoa 冬の金稼ぎ・本人捕獲魚価格表", "https://plaza.rakuten.co.jp/cocoaclover/2000/", "firsthand_gameplay_log", "hot-cocoa-firsthand-observation", "JP", "Medium", "本人が釣った魚だけの部分表で、価格を忘れた魚を明示的に除外。静的ページの厳密な初回公開日は不明。")
];

export const dataDiscrepancies = [
  {
    id: "WW-DISC-001",
    entityId: "fish-salmon",
    field: "location/day split",
    region: "JP",
    sourceAId: "jp-fish-superfamicom",
    sourceARawValue: "河口(上旬)、川(下旬)",
    sourceBId: "nookipedia-fish-ww",
    sourceBRawValue: "月前半は河口、月後半は川",
    sourceClaimIds: ["WW-CLAIM-001-A", "WW-CLAIM-001-B"],
    sourceANormalizedValue: "river_mouth:early_month;river:late_month",
    sourceBNormalizedValue: "river_mouth:first_half;river:second_half",
    adoptedValue: "9月中は河口・川の両方を表示し、上旬/下旬注記を保持",
    confidence: "D",
    adoptionReason: "境界表現が一致しないため、推測せず両地点を案内する",
    needsManualVerification: true,
    resolutionStatus: "provisionally_adopted",
    userFacingImpact: "9月中の正確な場所案内を断定できない",
    releaseImpact: "BLOCKS_RC",
    checkedAt
    ,history: [{ checkedAt, status: "open", note: "日付境界が上旬/下旬と前半/後半で一致しないため保持" }]
  },
  {
    id: "WW-DISC-002",
    entityId: "art-famous-painting",
    field: "forgery handling",
    region: "JP",
    sourceAId: "nookipedia-forgery",
    sourceARawValue: "New Leaf以前は購入前判定不可",
    sourceBId: "jp-redd-atwiki",
    sourceBRawValue: "ゆうめいなめいが・たいへんなめいがは100%贋作との記述",
    sourceClaimIds: ["WW-CLAIM-002-A", "WW-CLAIM-002-B"],
    affectedEntityIds: ["art-famous-painting", "art-amazing-painting"],
    sourceANormalizedValue: "prepurchase_authentication_unavailable",
    sourceBNormalizedValue: "famous_and_amazing_always_forged",
    adoptedValue: "基本は購入前判定不可として扱い、個別注記に日本語Wikiの注意を残す",
    confidence: "D",
    adoptionReason: "購入前判定UIで未確認情報を断定しないため",
    needsManualVerification: true,
    resolutionStatus: "provisionally_adopted",
    userFacingImpact: "購入前真贋Tipsは表示しない",
    releaseImpact: "PARTIAL_GUIDANCE",
    checkedAt
    ,history: [{ checkedAt, status: "open", note: "日本語Wikiの個別断定と一般仕様が衝突。たいへんなめいがも影響対象に追加" }]
  },
  {
    id: "WW-DISC-003",
    entityId: "bug-oak-silk-moth",
    field: "sellPrice",
    region: "JP",
    sourceAId: "jp-bug-superfamicom",
    sourceARawValue: "200ベル",
    sourceBId: "nookipedia-bug-ww",
    sourceBRawValue: "1,200 Bells",
    sourceClaimIds: ["WW-CLAIM-003-A", "WW-CLAIM-003-B"],
    sourceANormalizedValue: 200,
    sourceBNormalizedValue: 1200,
    attemptedSourceIds: ["supercheats-ww-faq", "gameyum-ww-bugs", "thonky-acww-bugs", "izuito-ww-lists"],
    adoptedValue: "1,200ベル",
    confidence: "D",
    adoptionReason: "Wild World専用表の値を暫定採用するが、日本版同一値とは確定しない",
    needsManualVerification: true,
    resolutionStatus: "provisionally_adopted",
    userFacingImpact: "売値・計算結果が暫定値",
    releaseImpact: "BLOCKS_RC",
    checkedAt
    ,history: [{ checkedAt, status: "open", note: "追加3海外資料と追加JP表は1,200ベルだが、JP表の独立上流が未証明のため未解決" }]
  },
  {
    id: "WW-DISC-004",
    entityId: "bug-oak-silk-moth",
    field: "months/time",
    region: "JP",
    sourceAId: "jp-bug-superfamicom",
    sourceARawValue: "6月〜9月、深夜・夜",
    sourceBId: "nookipedia-bug-ww",
    sourceBRawValue: "6月〜8月、19:00〜04:00",
    sourceClaimIds: ["WW-CLAIM-004-A", "WW-CLAIM-004-B"],
    sourceANormalizedValue: "months:6-9;time:19:00-04:00",
    sourceBNormalizedValue: "months:6-8;time:19:00-04:00",
    attemptedSourceIds: ["supercheats-ww-faq", "gameyum-ww-bugs", "thonky-acww-bugs"],
    adoptedValue: "現行の6月〜9月・19:00〜04:00を暫定維持",
    confidence: "D",
    adoptionReason: "コア出現月が不一致のため既存値を維持し、確定表示しない",
    needsManualVerification: true,
    resolutionStatus: "open",
    userFacingImpact: "9月のNow/Leaving判定が暫定",
    releaseImpact: "BLOCKS_RC",
    checkedAt
    ,history: [{ checkedAt, status: "open", note: "追加資料も6-9、6-9、7-10と分かれ、JP値は確定できない" }]
  },
  {
    id: "WW-DISC-005",
    entityId: "bug-honeybee",
    field: "months",
    region: "JP",
    sourceAId: "jp-bug-superfamicom",
    sourceARawValue: "3月〜8月",
    sourceBId: "nookipedia-bug-ww",
    sourceBRawValue: "3月〜9月（Peak timesは3月〜7月）",
    sourceClaimIds: ["WW-CLAIM-005-A", "WW-CLAIM-005-B"],
    sourceANormalizedValue: "months:3-8",
    sourceBNormalizedValue: "months:3-9;peak:3-7",
    attemptedSourceIds: ["supercheats-ww-faq", "gameyum-ww-bugs", "thonky-acww-bugs"],
    adoptedValue: "現行の3月〜8月を暫定維持",
    confidence: "D",
    adoptionReason: "出現月とPeak timesを分離しても月範囲が一致しないため",
    needsManualVerification: true,
    resolutionStatus: "open",
    userFacingImpact: "9月のNow/Leaving判定が暫定",
    releaseImpact: "BLOCKS_RC",
    checkedAt
    ,history: [{ checkedAt, status: "open", note: "追加資料は3-8を支持するが地域不明のためNookipedia差分を解消しない" }]
  },
  {
    id: "WW-DISC-006",
    entityId: "fish-king-salmon",
    field: "location/day split",
    region: "JP",
    sourceAId: "jp-fish-superfamicom",
    sourceARawValue: "川、河口（9月・一日中）",
    sourceBId: "nookipedia-fish-ww",
    sourceBRawValue: "月前半は河口、月後半は川",
    sourceClaimIds: ["WW-CLAIM-006-A", "WW-CLAIM-006-B"],
    sourceANormalizedValue: "river_and_mouth;day_split_unspecified",
    sourceBNormalizedValue: "river_mouth:first_half;river:second_half",
    attemptedSourceIds: ["supercheats-ww-faq"],
    adoptedValue: "9月中は河口・川の両方を表示し、時期内場所差は再検証対象として保持",
    confidence: "D",
    adoptionReason: "日本語表が日付分割を示さないため、境界を推測しない",
    needsManualVerification: true,
    resolutionStatus: "open",
    userFacingImpact: "9月中の正確な場所案内を断定できない",
    releaseImpact: "BLOCKS_RC",
    checkedAt
    ,history: [{ checkedAt, status: "open", note: "追加FAQは9月・川のみで日付境界を確定できない" }]
  }
];

function createClaim({ id, entityId, field, sourceId, rawValue, normalizedValue, notes, appliesToEntityIds = null }) {
  const sourceRecord = sources.find((item) => item.id === sourceId);
  if (!sourceRecord) throw new Error(`Unknown provenance source: ${sourceId}`);
  return {
    id,
    claimId: id,
    sourceId,
    sourceUrl: sourceRecord.url,
    sourceType: sourceRecord.sourceType,
    independenceGroup: sourceRecord.independenceGroup,
    independenceStatus: sourceRecord.independenceStatus,
    sourceLineageId: sourceRecord.id,
    entityId,
    appliesToEntityIds: appliesToEntityIds ?? [entityId],
    field,
    fieldName: field,
    rawValue,
    normalizedValue,
    region: sourceRecord.region,
    checkedAt,
    notes
  };
}

export const sourceClaims = dataDiscrepancies.flatMap((item) => [
  createClaim({
    id: item.sourceClaimIds[0], entityId: item.entityId, field: item.field,
    sourceId: item.sourceAId, rawValue: item.sourceARawValue,
    normalizedValue: item.sourceANormalizedValue,
    appliesToEntityIds: item.affectedEntityIds,
    notes: `CONFLICT ${item.id} の資料A。Canonicalへ自動昇格しない。`
  }),
  createClaim({
    id: item.sourceClaimIds[1], entityId: item.entityId, field: item.field,
    sourceId: item.sourceBId, rawValue: item.sourceBRawValue,
    normalizedValue: item.sourceBNormalizedValue,
    appliesToEntityIds: item.affectedEntityIds,
    notes: `CONFLICT ${item.id} の資料B。Canonicalへ自動昇格しない。`
  })
]);

function addFieldClaim(entityId, field, sourceId, rawValue, normalizedValue, notes) {
  const id = `WW-FIELD-${entityId}-${field}-${sourceId}`;
  if (!sourceClaims.some((claim) => claim.id === id)) {
    sourceClaims.push(createClaim({ id, entityId, field, sourceId, rawValue, normalizedValue, notes }));
  }
  return id;
}

function discrepancyMatchesField(discrepancy, fieldName) {
  if (discrepancy.field === fieldName) return true;
  if (fieldName === "availability") return ["months", "months/time", "location/day split"].includes(discrepancy.field);
  if (fieldName === "location") return discrepancy.field === "location/day split";
  if (fieldName === "authenticity") return discrepancy.field === "forgery handling";
  return false;
}

function discrepancyMatchesEntity(discrepancy, entityId) {
  return discrepancy.entityId === entityId || discrepancy.affectedEntityIds?.includes(entityId);
}

function hasAuditedIndependentClaimPair(claims, requireJp = false) {
  const eligible = claims.filter((claim) => claim?.independenceStatus === "independent" && (
    !requireJp || ["JP", "multi_region_verified"].includes(claim.region)
  ));
  for (let leftIndex = 0; leftIndex < eligible.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < eligible.length; rightIndex += 1) {
      const left = eligible[leftIndex];
      const right = eligible[rightIndex];
      if (left.independenceGroup === right.independenceGroup) continue;
      if (JSON.stringify(left.normalizedValue) !== JSON.stringify(right.normalizedValue)) continue;
      return true;
    }
  }
  return false;
}

function provenance(entityId, fieldName, canonicalValue, evidence = [], override = {}) {
  const discrepancies = dataDiscrepancies.filter(
    (item) => discrepancyMatchesEntity(item, entityId) && discrepancyMatchesField(item, fieldName)
  );
  const sourceClaimIds = discrepancies.length
    ? [...new Set(discrepancies.flatMap((item) => item.sourceClaimIds))]
    : evidence.map((item) => addFieldClaim(
      entityId,
      fieldName,
      item.sourceId,
      item.rawValue,
      item.normalizedValue,
      item.notes
    ));
  const claims = sourceClaimIds.map((id) => sourceClaims.find((claim) => claim.id === id));
  const normalized = new Set(claims.map((claim) => JSON.stringify(claim?.normalizedValue)));
  const independentGroups = new Set(claims.map((claim) => claim?.independenceGroup));
  const distinctGroupAgreement = claims.length >= 2 && normalized.size === 1 && independentGroups.size >= 2;
  const jpAuditedIndependentAgreement = hasAuditedIndependentClaimPair(claims, true);
  const defaultStatus = discrepancies.length
    ? "CONFLICT"
    : jpAuditedIndependentAgreement
      ? "MULTI_SOURCE_VERIFIED"
      : distinctGroupAgreement
        ? "CORROBORATED"
        : "SINGLE_SOURCE";
  const status = override.status ?? defaultStatus;
  const confidence = override.confidence ?? (status === "CONFLICT" ? "D" : status === "MULTI_SOURCE_VERIFIED" ? "B" : "C");
  const needsManualVerification = override.needsManualVerification ?? !["OFFICIAL_VERIFIED", "MULTI_SOURCE_VERIFIED"].includes(status);
  const sourceIds = [...new Set(claims.map((claim) => claim?.sourceId).filter(Boolean))];
  return {
    entityId,
    field: fieldName,
    canonicalValue,
    status,
    verificationStatus: status,
    confidence,
    region: claims.some((claim) => claim?.region === "JP") ? "JP" : "region_unknown",
    sourceIds,
    sourceClaimIds,
    claims: sourceClaimIds,
    discrepancyIds: discrepancies.map((item) => item.id),
    adoptionReason: override.adoptionReason ?? (discrepancies.map((item) => item.adoptionReason).join(" / ") || (
      status === "CORROBORATED"
        ? "JP資料の値と独立する地域未確定資料が一致。ただしJP同値を独立2資料では証明できない。"
        : "抽出済み資料は1独立グループのみ。推測で検証済みへ昇格しない。"
    )),
    needsManualVerification,
    userFacingBehavior: override.userFacingBehavior ?? (
      status === "CONFLICT" ? "情報差分ありとして非断定表示" :
        status === "CORROBORATED" ? "地域未確定の補強資料ありとして条件付き表示" :
          "単一資料・要追加確認として表示"
    ),
    releaseImpact: override.releaseImpact ?? (
      status === "CONFLICT" ? discrepancies.map((item) => item.releaseImpact).join("/") :
        needsManualVerification ? "REQUIRES_CORROBORATION" : "NONE"
    ),
    checkedAt,
    ...override
  };
}

const allYear = [[1, 1, 12, 31]];
const allDay = [["00:00", "00:00", true]];
const fishTime = {
  all: allDay,
  morning: [["04:00", "09:00"]],
  day: [["09:00", "16:00"]],
  evening: [["16:00", "21:00"]],
  night: [["21:00", "04:00", true]],
  morningEveningNight: [["04:00", "09:00"], ["16:00", "21:00"], ["21:00", "04:00", true]],
  morningToEvening: [["04:00", "21:00"]],
  eveningToMorning: [["16:00", "09:00", true]],
  dayNight: [["09:00", "16:00"], ["21:00", "04:00", true]]
};
const bugTime = {
  all: allDay,
  deepNight: [["23:00", "04:00", true]],
  morning: [["04:00", "08:00"]],
  day1: [["08:00", "16:00"]],
  day2: [["16:00", "17:00"]],
  evening: [["17:00", "19:00"]],
  night: [["19:00", "23:00"]],
  morningToEvening: [["04:00", "19:00"]],
  morningToDay2: [["04:00", "17:00"]],
  day1ToEvening: [["08:00", "19:00"]],
  eveningToMorning: [["17:00", "08:00", true]],
  nightToMorning: [["19:00", "08:00", true]],
  eveningToDeepNight: [["17:00", "04:00", true]],
  nightAndDeepNight: [["19:00", "04:00", true]],
  deepNightMorning: [["23:00", "08:00", true]],
  day1Day2: [["08:00", "17:00"]]
};

const m = (startMonth, endMonth, startDay = 1, endDay = null) => [
  startMonth,
  startDay,
  endMonth,
  endDay ?? monthEnd(endMonth)
];
const monthEnd = (month) => ([4, 6, 9, 11].includes(month) ? 30 : month === 2 ? 29 : 31);

function rule(monthRange, timeRange, location, waterType, extra = {}) {
  const [startMonth, startDay, endMonth, endDay] = monthRange;
  const [startTime, endTime, crossesMidnight = false] = timeRange;
  return {
    startMonth,
    startDay,
    endMonth,
    endDay,
    startTime,
    endTime,
    crossesMidnight,
    allDay: startTime === "00:00" && endTime === "00:00",
    location,
    waterType,
    weather: extra.weather ?? "any",
    condition: extra.condition ?? "",
    conditionCode: extra.conditionCode ?? null,
    spawnRate: extra.spawnRate ?? null
  };
}

function rules(monthRanges, timeRanges, location, waterType, extra = {}) {
  return monthRanges.flatMap((monthRange) =>
    timeRanges.map((timeRange) => rule(monthRange, timeRange, location, waterType, extra))
  );
}

function ref(...ids) {
  return ids.map((sourceId) => ({ sourceId, checkedAt, confidence: sources.find((s) => s.id === sourceId)?.confidence ?? "Medium" }));
}

const landscapeObservedFishPrices = new Set([
  "bitterling", "crucian-carp", "dace", "barbel-steed", "carp", "popeyed-goldfish",
  "freshwater-goby", "yellow-perch", "black-bass", "pond-smelt", "rainbow-trout",
  "sea-butterfly", "zebra-turkeyfish", "horse-mackerel", "barred-knifejaw", "sea-bass",
  "red-snapper", "dab", "olive-flounder", "squid", "octopus", "football-fish", "tuna",
  "coelacanth"
]);

const hotCocoaObservedFishPrices = new Set([
  "bitterling", "dace", "barbel-steed", "carp", "koi", "goldfish", "black-bass",
  "stringfish", "sea-butterfly", "horse-mackerel", "sea-bass", "dab", "olive-flounder",
  "squid", "octopus", "football-fish", "tuna"
]);

function firsthandFishPriceEvidence(id, japaneseName, sellPrice) {
  return [
    ...(landscapeObservedFishPrices.has(id) ? [{
      sourceId: "jp-firsthand-landscape",
      rawValue: `${japaneseName} ${sellPrice}ベル`,
      normalizedValue: sellPrice,
      notes: "本人が捕獲したものだけを段階更新した2006-01-12 Ver.4本文の魚売値。攻略サイト不使用の作成過程を同ページ内で確認。"
    }] : []),
    ...(hotCocoaObservedFishPrices.has(id) ? [{
      sourceId: "jp-firsthand-hot-cocoa",
      rawValue: `${japaneseName} ${sellPrice}ベル`,
      normalizedValue: sellPrice,
      notes: "『僕の釣った魚だけ』と明示した冬の魚価格表本文から抽出。価格を忘れた魚は表から除外されている。"
    }] : [])
  ];
}

function fish(id, jp, en, sellPrice, monthText, timeText, location, waterType, shadowSize, actualSize, rarity, availabilityRules, notes = "") {
  const entityId = `fish-${id}`;
  const additionalSellPriceEvidence = firsthandFishPriceEvidence(id, jp, sellPrice);
  const sourceIds = [
    "jp-fish-superfamicom",
    "nookipedia-fish-ww",
    ...additionalSellPriceEvidence.map((item) => item.sourceId)
  ];
  const sellPriceEvidence = ["jp-fish-superfamicom", "nookipedia-fish-ww"].map((sourceId) => ({
    sourceId,
    rawValue: sourceId === "jp-fish-superfamicom" ? `${sellPrice}ベル` : `${sellPrice} Bells`,
    normalizedValue: sellPrice,
    notes: `${jp}のWild World専用表にある売値セルを抽出。`
  })).concat(additionalSellPriceEvidence);
  const availabilityEvidence = [{
    sourceId: "jp-fish-superfamicom",
    rawValue: `${monthText} / ${timeText}`,
    normalizedValue: availabilityRules,
    notes: `${jp}の日本語版表から月・時間セルを抽出し、availabilityRulesへ正規化。`
  }];
  const locationEvidence = [{
    sourceId: "jp-fish-superfamicom",
    rawValue: location,
    normalizedValue: location,
    notes: `${jp}の日本語版表から場所セルを抽出。`
  }];
  return {
    id: entityId,
    type: "fish",
    category: "サカナ",
    japaneseName: jp,
    englishName: en,
    image: resolveEntityImage({ id: entityId, type: "fish", japaneseName: jp }),
    sellPrice,
    monthText,
    timeText,
    location,
    waterType,
    shadowSize,
    actualSize,
    rarity,
    notes,
    sourceReferences: ref(...sourceIds),
    fieldProvenance: {
      sellPrice: provenance(entityId, "sellPrice", sellPrice, sellPriceEvidence),
      availability: provenance(entityId, "availability", availabilityRules, availabilityEvidence),
      location: provenance(entityId, "location", location, locationEvidence)
    },
    availabilityRules
  };
}

function bug(id, jp, en, sellPrice, monthText, timeText, location, action, rarity, availabilityRules, notes = "") {
  const entityId = `bug-${id}`;
  const sourceIds = ["jp-bug-superfamicom", "nookipedia-bug-ww"];
  const sellPriceEvidence = sourceIds.map((sourceId) => ({
    sourceId,
    rawValue: sourceId === "jp-bug-superfamicom" ? `${sellPrice}ベル` : `${sellPrice} Bells`,
    normalizedValue: sellPrice,
    notes: `${jp}のWild World専用表にある売値セルを抽出。`
  }));
  const availabilityEvidence = [{
    sourceId: "jp-bug-superfamicom",
    rawValue: `${monthText} / ${timeText}`,
    normalizedValue: availabilityRules,
    notes: `${jp}の日本語版表から月・時間セルを抽出し、availabilityRulesへ正規化。`
  }];
  const locationEvidence = [{
    sourceId: "jp-bug-superfamicom",
    rawValue: location,
    normalizedValue: location,
    notes: `${jp}の日本語版表から場所セルを抽出。`
  }];
  return {
    id: entityId,
    type: "bug",
    category: "ムシ",
    japaneseName: jp,
    englishName: en,
    image: resolveEntityImage({ id: entityId, type: "bug", japaneseName: jp }),
    sellPrice,
    monthText,
    timeText,
    location,
    action,
    size: null,
    rarity,
    notes,
    sourceReferences: ref(...sourceIds),
    fieldProvenance: {
      sellPrice: provenance(entityId, "sellPrice", sellPrice, sellPriceEvidence),
      availability: provenance(entityId, "availability", availabilityRules, availabilityEvidence),
      location: provenance(entityId, "location", location, locationEvidence)
    },
    availabilityRules
  };
}

export const fishList = [
  fish("bitterling", "タナゴ", "Bitterling", 900, "11月〜2月", "一日中", "川", "淡水", "極小", "10 cm", "普通", rules([m(11, 2)], fishTime.all, "川", "淡水")),
  fish("pale-chub", "オイカワ", "Pale chub", 200, "一年中", "昼", "川", "淡水", "極小", "15 cm", "普通", rules(allYear, fishTime.day, "川", "淡水")),
  fish("crucian-carp", "フナ", "Crucian carp", 120, "一年中", "一日中", "川", "淡水", "小", "30 cm", "普通", rules(allYear, fishTime.all, "川", "淡水")),
  fish("dace", "ウグイ", "Dace", 200, "一年中", "朝・夕・夜", "川", "淡水", "小", "35 cm", "普通", rules(allYear, fishTime.morningEveningNight, "川", "淡水")),
  fish("barbel-steed", "ニゴイ", "Barbel steed", 200, "一年中", "一日中", "川", "淡水", "中", "50 cm", "普通", rules(allYear, fishTime.all, "川", "淡水")),
  fish("carp", "コイ", "Carp", 300, "一年中", "一日中", "川", "淡水", "大", "75 cm", "普通", rules(allYear, fishTime.all, "川", "淡水")),
  fish("koi", "ニシキゴイ", "Koi", 2000, "一年中", "朝・夕・夜", "川", "淡水", "大", "75 cm", "ややレア", rules(allYear, fishTime.morningEveningNight, "川", "淡水")),
  fish("goldfish", "キンギョ", "Goldfish", 1300, "一年中", "一日中", "川", "淡水", "極小", "15 cm", "ややレア", rules(allYear, fishTime.all, "川", "淡水")),
  fish("popeyed-goldfish", "デメキン", "Popeyed goldfish", 1300, "一年中", "昼", "川", "淡水", "極小", "15 cm", "ややレア", rules(allYear, fishTime.day, "川", "淡水")),
  fish("killifish", "メダカ", "Killifish", 300, "4月〜8月", "一日中", "ため池", "淡水", "極小", "4 cm", "普通", rules([m(4, 8)], fishTime.all, "ため池", "淡水")),
  fish("crawfish", "ザリガニ", "Crawfish", 200, "4月〜9月上旬", "一日中", "ため池", "淡水", "極小", "12 cm", "普通", rules([[4, 1, 9, 10]], fishTime.all, "ため池", "淡水")),
  fish("frog", "カエル", "Frog", 120, "5月〜8月", "一日中", "ため池", "淡水", "極小", "12 cm", "普通", rules([m(5, 8)], fishTime.all, "ため池", "淡水")),
  fish("freshwater-goby", "ドンコ", "Freshwater goby", 300, "一年中", "朝・夕・夜", "川", "淡水", "極小", "15 cm", "普通", rules(allYear, fishTime.morningEveningNight, "川", "淡水")),
  fish("loach", "ドジョウ", "Loach", 300, "3月〜5月", "一日中", "川", "淡水", "極小", "20 cm", "普通", rules([m(3, 5)], fishTime.all, "川", "淡水")),
  fish("catfish", "ナマズ", "Catfish", 800, "5月〜10月", "朝・夕・夜", "池", "淡水", "中", "60 cm", "普通", rules([m(5, 10)], fishTime.morningEveningNight, "池", "淡水")),
  fish("eel", "ウナギ", "Eel", 2000, "6月〜9月上旬", "朝・夕・夜", "川", "淡水", "細長", "100 cm", "ややレア", rules([[6, 1, 9, 10]], fishTime.morningEveningNight, "川", "淡水")),
  fish("giant-snakehead", "ライギョ", "Giant snakehead", 5500, "6月〜8月", "昼", "池", "淡水", "大", "80 cm", "レア", rules([m(6, 8)], fishTime.day, "池", "淡水")),
  fish("bluegill", "ブルーギル", "Bluegill", 120, "一年中", "昼", "川", "淡水", "小", "25 cm", "普通", rules(allYear, fishTime.day, "川", "淡水")),
  fish("yellow-perch", "イエローパーチ", "Yellow perch", 240, "10月〜3月", "一日中", "川", "淡水", "小", "35 cm", "普通", rules([m(10, 3)], fishTime.all, "川", "淡水")),
  fish("black-bass", "ブラックバス", "Black bass", 300, "一年中", "一日中", "川", "淡水", "大", "50 cm", "普通", rules(allYear, fishTime.all, "川", "淡水")),
  fish("pond-smelt", "ワカサギ", "Pond smelt", 300, "12月〜2月", "一日中", "池", "淡水", "小", "15 cm", "普通", rules([m(12, 2)], fishTime.all, "池", "淡水")),
  fish("sweetfish", "アユ", "Sweetfish", 900, "7月〜9月上旬", "一日中", "川", "淡水", "中", "25 cm", "普通", rules([[7, 1, 9, 10]], fishTime.all, "川", "淡水")),
  fish("cherry-salmon", "ヤマメ", "Cherry salmon", 1000, "3月〜6月・9月〜11月", "朝〜夕", "川", "淡水", "中", "35 cm", "普通", rules([m(3, 6), m(9, 11)], fishTime.morningToEvening, "川", "淡水")),
  fish("char", "オオイワナ", "Char", 3800, "3月〜6月・9月〜11月", "朝〜夕", "滝", "淡水", "中", "50 cm", "レア", rules([m(3, 6), m(9, 11)], fishTime.morningToEvening, "滝", "淡水")),
  fish("rainbow-trout", "ニジマス", "Rainbow trout", 800, "3月〜6月・9月〜11月", "朝〜夕", "川", "淡水", "中", "70 cm", "普通", rules([m(3, 6), m(9, 11)], fishTime.morningToEvening, "川", "淡水")),
  fish("stringfish", "イトウ", "Stringfish", 15000, "12月〜1月", "朝・夕・夜", "川", "淡水", "特大", "150 cm", "超レア", rules([m(12, 1)], fishTime.morningEveningNight, "川", "淡水")),
  fish("salmon", "サケ", "Salmon", 700, "9月", "一日中", "河口・川", "淡水", "かなり大", "90 cm", "普通", [...rules([[9, 1, 9, 30]], fishTime.all, "河口", "淡水"), ...rules([[9, 1, 9, 30]], fishTime.all, "川", "淡水")], "上旬は河口、下旬は川という日本語攻略表の注記あり。"),
  fish("king-salmon", "キングサーモン", "King salmon", 1800, "9月", "一日中", "川・河口", "淡水", "特大", "160 cm", "ややレア", [...rules([m(9, 9)], fishTime.all, "川", "淡水"), ...rules([m(9, 9)], fishTime.all, "河口", "淡水")]),
  fish("guppy", "グッピー", "Guppy", 1300, "4月〜11月", "昼", "川", "淡水", "極小", "4 cm", "ややレア", rules([m(4, 11)], fishTime.day, "川", "淡水")),
  fish("angelfish", "エンゼルフィッシュ", "Angelfish", 3000, "5月〜10月", "朝・夕・夜", "川", "淡水", "極小", "12 cm", "レア", rules([m(5, 10)], fishTime.morningEveningNight, "川", "淡水")),
  fish("piranha", "ピラニア", "Piranha", 2500, "6月〜9月上旬", "昼・夜", "川", "淡水", "小", "30 cm", "レア", rules([[6, 1, 9, 10]], fishTime.dayNight, "川", "淡水")),
  fish("arowana", "アロワナ", "Arowana", 10000, "6月〜9月上旬", "朝・夕・夜", "川", "淡水", "中", "70 cm", "超レア", rules([[6, 1, 9, 10]], fishTime.morningEveningNight, "川", "淡水")),
  fish("dorado", "ドラド", "Dorado", 15000, "6月〜9月", "朝〜夕", "川", "淡水", "大", "100 cm", "超レア", rules([m(6, 9)], fishTime.morningToEvening, "川", "淡水")),
  fish("gar", "ガー", "Gar", 6000, "6月〜9月", "朝・夕・夜", "池", "淡水", "特大", "190 cm", "レア", rules([m(6, 9)], fishTime.morningEveningNight, "池", "淡水")),
  fish("arapaima", "ピラルク", "Arapaima", 10000, "7月〜9月上旬", "朝・夕・夜", "川", "淡水", "特大", "300 cm", "超レア", rules([[7, 1, 9, 10]], fishTime.morningEveningNight, "川", "淡水")),
  fish("sea-butterfly", "クリオネ", "Sea butterfly", 1000, "12月〜2月", "一日中", "海", "海水", "極小", "3 cm", "普通", rules([m(12, 2)], fishTime.all, "海", "海水")),
  fish("jellyfish", "クラゲ", "Jellyfish", 100, "8月下旬", "一日中", "海", "海水", "小", "25 cm", "普通", rules([[8, 21, 8, 31]], fishTime.all, "海", "海水")),
  fish("seahorse", "タツノオトシゴ", "Seahorse", 1100, "4月〜11月", "一日中", "海", "海水", "極小", "8 cm", "普通", rules([m(4, 11)], fishTime.all, "海", "海水")),
  fish("clownfish", "クマノミ", "Clownfish", 650, "4月〜9月", "一日中", "海", "海水", "極小", "15 cm", "普通", rules([m(4, 9)], fishTime.all, "海", "海水")),
  fish("zebra-turkeyfish", "ミノカサゴ", "Zebra turkeyfish", 400, "4月〜11月", "一日中", "海", "海水", "小", "30 cm", "普通", rules([m(4, 11)], fishTime.all, "海", "海水")),
  fish("puffer-fish", "ハリセンボン", "Puffer fish", 240, "7月〜9月", "一日中", "海", "海水", "小", "35 cm", "普通", rules([m(7, 9)], fishTime.all, "海", "海水")),
  fish("horse-mackerel", "アジ", "Horse mackerel", 150, "一年中", "一日中", "海", "海水", "小", "40 cm", "普通", rules(allYear, fishTime.all, "海", "海水")),
  fish("barred-knifejaw", "イシダイ", "Barred knifejaw", 5000, "3月〜11月", "一日中", "海", "海水", "中", "60 cm", "レア", rules([m(3, 11)], fishTime.all, "海", "海水")),
  fish("sea-bass", "スズキ", "Sea bass", 160, "一年中", "一日中", "海", "海水", "かなり大", "100 cm", "普通", rules(allYear, fishTime.all, "海", "海水")),
  fish("red-snapper", "タイ", "Red snapper", 3000, "一年中", "一日中", "海", "海水", "大", "90 cm", "ややレア", rules(allYear, fishTime.all, "海", "海水")),
  fish("dab", "カレイ", "Dab", 300, "10月〜4月", "一日中", "海", "海水", "中", "50 cm", "普通", rules([m(10, 4)], fishTime.all, "海", "海水")),
  fish("olive-flounder", "ヒラメ", "Olive flounder", 800, "3月〜12月", "一日中", "海", "海水", "かなり大", "80 cm", "普通", rules([m(3, 12)], fishTime.all, "海", "海水")),
  fish("squid", "イカ", "Squid", 400, "12月〜8月上旬", "一日中", "海", "海水", "中", "35 cm", "普通", rules([[12, 1, 8, 10]], fishTime.all, "海", "海水")),
  fish("octopus", "タコ", "Octopus", 500, "3月〜7月・9月下旬〜1月", "一日中", "海", "海水", "中", "60 cm", "普通", rules([m(3, 7), [9, 21, 1, 31]], fishTime.all, "海", "海水")),
  fish("football-fish", "チョウチンアンコウ", "Football fish", 2500, "11月〜3月", "朝・夕・夜", "海", "海水", "大", "60 cm", "ややレア", rules([m(11, 3)], fishTime.morningEveningNight, "海", "海水")),
  fish("tuna", "マグロ", "Tuna", 7000, "11月〜3月", "一日中", "海", "海水", "特大", "230 cm", "レア", rules([m(11, 3)], fishTime.all, "海", "海水")),
  fish("blue-marlin", "カジキ", "Blue marlin", 10000, "7月〜9月", "一日中", "海", "海水", "特大", "220 cm", "超レア", rules([m(7, 9)], fishTime.all, "海", "海水")),
  fish("ocean-sunfish", "マンボウ", "Ocean sunfish", 4000, "6月〜9月", "朝〜夕", "海", "海水", "背びれ", "300 cm", "レア", rules([m(6, 9)], fishTime.morningToEvening, "海", "海水")),
  fish("hammerhead-shark", "シュモクザメ", "Hammerhead shark", 8000, "6月〜9月", "朝・夕・夜", "海", "海水", "背びれ", "250 cm", "超レア", rules([m(6, 9)], fishTime.morningEveningNight, "海", "海水")),
  fish("shark", "サメ", "Shark", 15000, "6月〜9月", "朝・夕・夜", "海", "海水", "背びれ", "540 cm", "超レア", rules([m(6, 9)], fishTime.morningEveningNight, "海", "海水")),
  fish("coelacanth", "シーラカンス", "Coelacanth", 15000, "一年中", "夕〜朝", "海", "海水", "特大", "150 cm", "超レア", rules(allYear, fishTime.eveningToMorning, "海", "海水", { weather: "rain_or_snow", condition: "雨・雪の日" }))
];

export const bugList = [
  bug("common-butterfly", "モンシロチョウ", "Common butterfly", 90, "3月〜9月", "朝〜夕（9月は朝のみ）", "花の周り", "網で捕獲", "普通", [...rules([m(3, 8)], bugTime.morningToEvening, "花", "陸"), ...rules([m(9, 9)], bugTime.morning, "花", "陸")]),
  bug("yellow-butterfly", "モンキチョウ", "Yellow butterfly", 90, "3月〜9月", "朝〜夕（9月は朝のみ）", "花の周り", "網で捕獲", "普通", [...rules([m(3, 8)], bugTime.morningToEvening, "花", "陸"), ...rules([m(9, 9)], bugTime.morning, "花", "陸")]),
  bug("tiger-butterfly", "アゲハチョウ", "Tiger butterfly", 160, "3月〜9月", "朝〜夕（9月は朝のみ）", "赤・ピンクの花", "網で捕獲", "普通", [...rules([m(3, 8)], bugTime.morningToEvening, "花", "陸"), ...rules([m(9, 9)], bugTime.morning, "花", "陸")]),
  bug("peacock-butterfly", "カラスアゲハ", "Peacock butterfly", 220, "3月〜9月", "朝〜夕", "青・紫・黒い花", "網で捕獲", "ややレア", rules([m(3, 9)], bugTime.morningToEvening, "花", "陸")),
  bug("monarch-butterfly", "オオカバマダラ", "Monarch butterfly", 140, "9月〜11月", "朝〜昼2", "花の周り", "網で捕獲", "普通", rules([m(9, 11)], bugTime.morningToDay2, "花", "陸")),
  bug("emperor-butterfly", "モルフォチョウ", "Emperor butterfly", 2500, "6月〜9月", "昼1・昼2", "花の周り", "網で捕獲", "レア", rules([m(6, 9)], bugTime.day1Day2, "花", "陸")),
  bug("agrias-butterfly", "ミイロタテハ", "Agrias butterfly", 3000, "6月〜9月", "昼1・昼2", "花の周り", "網で捕獲", "レア", rules([m(6, 9)], bugTime.day1Day2, "花", "陸")),
  bug("birdwing-butterfly", "アレクサンドラアゲハ", "Birdwing butterfly", 3000, "6月〜9月", "昼1・昼2", "花の周り", "網で捕獲", "超レア", rules([m(6, 9)], bugTime.day1Day2, "花", "陸")),
  bug("moth", "ガ", "Moth", 60, "5月〜9月", "深夜・夜", "家・役場・関所の灯り", "網で捕獲", "普通", rules([m(5, 9)], bugTime.nightAndDeepNight, "明かり", "陸")),
  bug("oak-silk-moth", "ヤママユガ", "Oak silk moth", 1200, "6月〜9月", "深夜・夜", "木", "網で捕獲", "ややレア", rules([m(6, 9)], bugTime.nightAndDeepNight, "木", "陸")),
  bug("honeybee", "ミツバチ", "Honeybee", 100, "3月〜8月", "昼1・昼2", "花の周り", "網で捕獲", "普通", rules([m(3, 8)], bugTime.day1Day2, "花", "陸")),
  bug("bee", "スズメバチ", "Bee", 4500, "一年中", "一日中", "木をゆすったとき", "木を揺する", "レア", rules(allYear, bugTime.all, "木", "陸", { condition: "木を揺する", conditionCode: "tree_shake" })),
  bug("long-locust", "ショウリョウバッタ", "Long locust", 200, "8月〜11月", "昼1〜夕", "草むら", "網で捕獲", "普通", rules([m(8, 11)], bugTime.day1ToEvening, "地面", "陸")),
  bug("migratory-locust", "トノサマバッタ", "Migratory locust", 600, "9月〜11月", "昼1〜夕", "草むら", "網で捕獲", "普通", rules([m(9, 11)], bugTime.day1ToEvening, "地面", "陸")),
  bug("mantis", "カマキリ", "Mantis", 430, "8月〜11月", "昼1・昼2", "花", "網で捕獲", "普通", rules([m(8, 11)], bugTime.day1Day2, "花", "陸")),
  bug("orchid-mantis", "ハナカマキリ", "Orchid mantis", 2400, "8月〜11月", "昼1・昼2", "白い花・タンポポ", "網で捕獲", "レア", rules([m(8, 11)], bugTime.day1Day2, "花", "陸", { condition: "白い花・タンポポ", conditionCode: "white_flower" })),
  bug("brown-cicada", "アブラゼミ", "Brown cicada", 200, "7月〜8月", "昼1・昼2", "木", "網で捕獲", "普通", rules([m(7, 8)], bugTime.day1Day2, "木", "陸", { condition: "雨のときは鳴かない" })),
  bug("robust-cicada", "ミンミンゼミ", "Robust cicada", 300, "7月〜8月", "昼1・昼2", "木", "網で捕獲", "普通", rules([m(7, 8)], bugTime.day1Day2, "木", "陸", { condition: "雨のときは鳴かない" })),
  bug("walker-cicada", "ツクツクホウシ", "Walker cicada", 400, "7月〜9月", "昼1・昼2", "木", "網で捕獲", "普通", rules([m(7, 9)], bugTime.day1Day2, "木", "陸", { condition: "雨のときは鳴かない" })),
  bug("evening-cicada", "ヒグラシ", "Evening cicada", 550, "7月〜8月", "朝・昼2・夕", "木", "網で捕獲", "普通", rules([m(7, 8)], [...bugTime.morning, ...bugTime.day2, ...bugTime.evening], "木", "陸", { condition: "雨のときは鳴かない" })),
  bug("lantern-fly", "ビワハゴロモ", "Lantern fly", 1800, "6月〜9月", "深夜・朝・昼2・夕", "木", "網で捕獲", "ややレア", rules([m(6, 9)], [...bugTime.deepNight, ...bugTime.morning, ...bugTime.day2, ...bugTime.evening], "木", "陸")),
  bug("red-dragonfly", "アキアカネ", "Red dragonfly", 80, "9月〜10月", "昼1〜夕", "どこでも", "網で捕獲", "普通", rules([m(9, 10)], bugTime.day1ToEvening, "空中", "陸")),
  bug("darner-dragonfly", "ギンヤンマ", "Darner dragonfly", 200, "6月〜8月", "昼1・昼2", "どこでも", "網で捕獲", "普通", rules([m(6, 8)], bugTime.day1Day2, "空中", "陸")),
  bug("banded-dragonfly", "オニヤンマ", "Banded dragonfly", 4500, "7月〜8月", "昼1・昼2", "どこでも", "網で捕獲", "レア", rules([m(7, 8)], bugTime.day1Day2, "空中", "陸")),
  bug("ant", "アリ", "Ant", 80, "一年中", "一日中", "くさったカブ", "カブを一週間以上放置", "普通", rules(allYear, bugTime.all, "くさったカブ", "陸", { weather: "not_rain_or_snow", condition: "雨・雪以外。カブを一週間以上地面に放置", conditionCode: "spoiled_turnip" })),
  bug("pondskater", "アメンボ", "Pondskater", 130, "6月〜9月", "昼1〜夕", "ため池・池", "網で捕獲", "普通", rules([m(6, 9)], bugTime.day1ToEvening, "水辺", "淡水")),
  bug("snail", "カタツムリ", "Snail", 250, "4月〜9月", "一日中", "花", "雨の日に網で捕獲", "普通", rules([m(4, 9)], bugTime.all, "花", "陸", { weather: "rain", condition: "雨の日" })),
  bug("cricket", "コオロギ", "Cricket", 130, "9月〜11月", "夕〜朝", "草むら", "網で捕獲", "普通", rules([m(9, 11)], bugTime.eveningToMorning, "地面", "陸")),
  bug("bell-cricket", "スズムシ", "Bell cricket", 430, "9月〜10月", "夕〜朝", "草むら", "網で捕獲", "普通", rules([m(9, 10)], bugTime.eveningToMorning, "地面", "陸")),
  bug("grasshopper", "キリギリス", "Grasshopper", 160, "7月〜9月", "昼1・昼2", "草むら", "網で捕獲", "普通", rules([m(7, 9)], bugTime.day1Day2, "地面", "陸")),
  bug("mole-cricket", "オケラ", "Mole cricket", 280, "11月〜5月", "一日中", "地中", "鳴き声が大きい地点を掘る", "普通", rules([m(11, 5)], bugTime.all, "地中", "陸", { condition: "鳴き声を頼りに掘る", conditionCode: "dig_at_sound" })),
  bug("walkingstick", "ナナフシ", "Walkingstick", 600, "7月〜11月", "朝〜夕", "木", "網で捕獲", "普通", rules([m(7, 11)], bugTime.morningToEvening, "木", "陸")),
  bug("ladybug", "テントウムシ", "Ladybug", 200, "3月〜6月・10月", "昼1・昼2", "花", "網で捕獲", "普通", rules([m(3, 6), m(10, 10)], bugTime.day1Day2, "花", "陸")),
  bug("fruit-beetle", "コガネムシ", "Fruit beetle", 100, "7月〜9月", "一日中（9月は夜〜早朝）", "木", "網で捕獲", "普通", [...rules([m(7, 8)], bugTime.all, "木", "陸"), ...rules([m(9, 9)], bugTime.nightToMorning, "木", "陸")]),
  bug("scarab-beetle", "プラチナコガネ", "Scarab beetle", 6000, "7月〜8月", "深夜・朝", "木", "網で捕獲", "レア", rules([m(7, 8)], bugTime.deepNightMorning, "木", "陸")),
  bug("dung-beetle", "フンコロガシ", "Dung beetle", 800, "12月〜2月", "夕〜朝", "雪玉", "雪玉を転がしているところを捕獲", "普通", rules([m(12, 2)], bugTime.eveningToMorning, "雪玉", "陸", { condition: "雪玉がある日", conditionCode: "snowball_present" })),
  bug("goliath-beetle", "ゴライアスハナムグリ", "Goliath beetle", 6000, "6月〜8月", "夜〜朝", "ヤシの木", "網で捕獲", "レア", rules([m(6, 8)], bugTime.nightToMorning, "ヤシの木", "陸")),
  bug("firefly", "ホタル", "Firefly", 300, "6月", "夜・深夜", "水辺", "網で捕獲", "普通", rules([m(6, 6)], bugTime.nightAndDeepNight, "水辺", "淡水")),
  bug("jewel-beetle", "タマムシ", "Jewel beetle", 2400, "7月〜8月", "昼1・昼2", "木", "網で捕獲", "ややレア", rules([m(7, 8)], bugTime.day1Day2, "木", "陸")),
  bug("longhorn-beetle", "カミキリムシ", "Longhorn beetle", 260, "6月〜8月", "昼1〜夕", "木", "網で捕獲", "普通", rules([m(6, 8)], bugTime.day1ToEvening, "木", "陸")),
  bug("saw-stag", "ノコギリクワガタ", "Saw stag beetle", 2000, "7月〜8月", "一日中", "木", "網で捕獲", "普通", rules([m(7, 8)], bugTime.all, "木", "陸")),
  bug("flat-stag", "ヒラタクワガタ", "Flat stag beetle", 2000, "6月〜8月", "夜〜朝", "木", "網で捕獲", "ややレア", rules([m(6, 8)], bugTime.nightToMorning, "木", "陸")),
  bug("giant-stag", "オオクワガタ", "Giant stag beetle", 10000, "7月〜8月", "深夜・朝", "木", "網で捕獲", "超レア", rules([m(7, 8)], bugTime.deepNightMorning, "木", "陸")),
  bug("rainbow-stag", "ニジイロクワガタ", "Rainbow stag", 10000, "6月〜9月", "夜〜朝", "ヤシの木", "網で捕獲", "超レア", rules([m(6, 9)], bugTime.nightToMorning, "ヤシの木", "陸")),
  bug("dynastid-beetle", "カブトムシ", "Dynastid beetle", 1350, "7月〜8月", "夜〜朝", "木", "網で捕獲", "普通", rules([m(7, 8)], bugTime.nightToMorning, "木", "陸")),
  bug("atlas-beetle", "コーカサスオオカブト", "Atlas beetle", 8000, "7月〜8月", "夜〜朝", "ヤシの木", "網で捕獲", "超レア", rules([m(7, 8)], bugTime.nightToMorning, "ヤシの木", "陸")),
  bug("elephant-beetle", "ゾウカブト", "Elephant beetle", 8000, "7月〜8月", "夜〜朝", "ヤシの木", "網で捕獲", "超レア", rules([m(7, 8)], bugTime.nightToMorning, "ヤシの木", "陸")),
  bug("hercules-beetle", "ヘラクレスオオカブト", "Hercules beetle", 12000, "7月〜8月", "深夜・朝", "ヤシの木", "網で捕獲", "超レア", rules([m(7, 8)], bugTime.deepNightMorning, "ヤシの木", "陸")),
  bug("flea", "ノミ", "Flea", 70, "3月〜11月", "一日中", "住人", "住人についているものを捕獲", "普通", rules([m(3, 11)], bugTime.all, "住人", "陸", { condition: "住人にノミがいる", conditionCode: "infested_resident" })),
  bug("pill-bug", "ダンゴムシ", "Pill bug", 250, "一年中", "一日中", "岩", "岩をスコップで叩く", "普通", rules(allYear, bugTime.all, "岩", "陸", { condition: "岩を叩く", conditionCode: "rock_hit" })),
  bug("mosquito", "カ", "Mosquito", 130, "6月〜9月", "夕〜深夜", "どこでも", "網で捕獲", "普通", rules([m(6, 9)], bugTime.eveningToDeepNight, "空中", "陸")),
  bug("fly", "ハエ", "Fly", 60, "一年中", "一日中", "ラフレシア・くさったカブ・ゴミ", "網で捕獲", "普通", rules(allYear, bugTime.all, "ゴミ", "陸", { condition: "ラフレシア・くさったカブ・ゴミ", conditionCode: "trash_source" })),
  bug("cockroach", "ゴキブリ", "Cockroach", 5, "一年中", "一日中", "木・花・くさったカブ", "網で捕獲", "普通", rules(allYear, bugTime.all, "木・花・くさったカブ", "陸")),
  bug("spider", "クモ", "Spider", 300, "3月〜11月", "一日中", "木", "木を揺らす", "普通", rules([m(3, 11)], bugTime.all, "木", "陸", { condition: "木を揺らす", conditionCode: "tree_shake" })),
  bug("tarantula", "タランチュラ", "Tarantula", 8000, "6月〜8月", "夜・深夜", "地面", "網で捕獲", "超レア", rules([m(6, 8)], bugTime.nightAndDeepNight, "地面", "陸")),
  bug("scorpion", "サソリ", "Scorpion", 8000, "7月〜9月", "夜・深夜", "地面", "網で捕獲", "超レア", rules([m(7, 9)], bugTime.nightAndDeepNight, "地面", "陸"))
];

function fossil(id, jp, en, sellPrice, group, part = "単体") {
  const entityId = `fossil-${id}`;
  const sourceIds = ["jp-fossil-oi-mori", "nookipedia-fossil-ww"];
  const evidence = sourceIds.map((sourceId) => ({
    sourceId,
    rawValue: sourceId === "jp-fossil-oi-mori" ? `${sellPrice}ベル` : `${sellPrice} Bells`,
    normalizedValue: sellPrice,
    notes: `${jp}のWild World専用化石表にある売値セルを抽出。`
  }));
  return {
    id: entityId,
    type: "fossil",
    category: "化石",
    japaneseName: jp,
    englishName: en,
    image: resolveEntityImage({ id: entityId, type: "fossil", japaneseName: jp }),
    sellPrice,
    fossilGroup: group,
    part,
    standalone: part === "単体",
    sourceReferences: ref(...sourceIds),
    fieldProvenance: {
      sellPrice: provenance(entityId, "sellPrice", sellPrice, evidence)
    }
  };
}

export const fossilList = [
  fossil("amber", "コハク", "Amber", 1200, "単体"), fossil("ammonite", "アンモナイト", "Ammonite", 1100, "単体"),
  fossil("dino-droppings", "ウンコのかせき", "Dino droppings", 1100, "単体"), fossil("dinosaur-egg", "たまごのかせき", "Dinosaur egg", 1400, "単体"),
  fossil("fern", "シダのかせき", "Fern fossil", 1000, "単体"), fossil("footprint", "あしあとのかせき", "Dinosaur track", 1000, "単体"),
  fossil("archaeopteryx", "しそちょう", "Archaeopteryx", 1300, "単体"), fossil("peking-man", "ペキンげんじん", "Peking man", 1100, "単体"),
  fossil("shark-tooth", "サメのはのかせき", "Shark tooth", 1000, "単体"), fossil("trilobite", "さんようちゅう", "Trilobite", 1300, "単体"),
  fossil("t-rex-skull", "Ｔレックスのあたま", "T. rex skull", 6000, "Tレックス", "頭"), fossil("t-rex-torso", "Ｔレックスのからだ", "T. rex torso", 5500, "Tレックス", "体"), fossil("t-rex-tail", "Ｔレックスのしっぽ", "T. rex tail", 5000, "Tレックス", "しっぽ"),
  fossil("tricera-skull", "トリケラのあたま", "Tricera skull", 5500, "トリケラ", "頭"), fossil("tricera-torso", "トリケラのからだ", "Tricera torso", 5000, "トリケラ", "体"), fossil("tricera-tail", "トリケラのしっぽ", "Tricera tail", 4500, "トリケラ", "しっぽ"),
  fossil("mammoth-skull", "マンモスのあたま", "Mammoth skull", 3000, "マンモス", "頭"), fossil("mammoth-torso", "マンモスのからだ", "Mammoth torso", 2500, "マンモス", "体"),
  fossil("ankylo-skull", "アンキロのあたま", "Ankylo skull", 3500, "アンキロ", "頭"), fossil("ankylo-torso", "アンキロのからだ", "Ankylo torso", 3000, "アンキロ", "体"), fossil("ankylo-tail", "アンキロのしっぽ", "Ankylo tail", 2500, "アンキロ", "しっぽ"),
  fossil("apato-skull", "アパトのあたま", "Apato skull", 5000, "アパト", "頭"), fossil("apato-torso", "アパトのからだ", "Apato torso", 4500, "アパト", "体"), fossil("apato-tail", "アパトのしっぽ", "Apato tail", 4000, "アパト", "しっぽ"),
  fossil("dimetrodon-skull", "ディメトロのあたま", "Dimetrodon skull", 5500, "ディメトロ", "頭"), fossil("dimetrodon-torso", "ディメトロのからだ", "Dimetrodon torso", 5000, "ディメトロ", "体"), fossil("dimetrodon-tail", "ディメトロのしっぽ", "Dimetrodon tail", 4500, "ディメトロ", "しっぽ"),
  fossil("iguanodon-skull", "イグアノのあたま", "Iguanodon skull", 4000, "イグアノ", "頭"), fossil("iguanodon-torso", "イグアノのからだ", "Iguanodon torso", 3500, "イグアノ", "体"), fossil("iguanodon-tail", "イグアノのしっぽ", "Iguanodon tail", 3000, "イグアノ", "しっぽ"),
  fossil("sabretooth-skull", "Sタイガーのあたま", "Sabertooth skull", 2500, "Sタイガー", "頭"), fossil("sabretooth-torso", "Sタイガーのからだ", "Sabertooth torso", 2000, "Sタイガー", "体"),
  fossil("pachy-skull", "パキケファロのあたま", "Pachy skull", 4000, "パキケファロ", "頭"), fossil("pachy-torso", "パキケファロのからだ", "Pachy torso", 3500, "パキケファロ", "体"), fossil("pachy-tail", "パキケファロのしっぽ", "Pachy tail", 3000, "パキケファロ", "しっぽ"),
  fossil("parasaur-skull", "パラサウロのあたま", "Parasaur skull", 3500, "パラサウロ", "頭"), fossil("parasaur-torso", "パラサウロのからだ", "Parasaur torso", 3000, "パラサウロ", "体"), fossil("parasaur-tail", "パラサウロのしっぽ", "Parasaur tail", 2500, "パラサウロ", "しっぽ"),
  fossil("seismo-skull", "セイスモのあたま", "Seismo skull", 5000, "セイスモ", "頭"), fossil("seismo-chest", "セイスモのむね", "Seismo chest", 4500, "セイスモ", "むね"), fossil("seismo-hip", "セイスモのこし", "Seismo hip", 4000, "セイスモ", "こし"), fossil("seismo-tail", "セイスモのしっぽ", "Seismo tail", 4500, "セイスモ", "しっぽ"),
  fossil("plesio-skull", "スズキリュウのあたま", "Plesio skull", 4000, "スズキリュウ", "頭"), fossil("plesio-neck", "スズキリュウのくび", "Plesio neck", 4500, "スズキリュウ", "くび"), fossil("plesio-torso", "スズキリュウのからだ", "Plesio torso", 4500, "スズキリュウ", "体"),
  fossil("stego-skull", "ステゴのあたま", "Stego skull", 5000, "ステゴ", "頭"), fossil("stego-torso", "ステゴのからだ", "Stego torso", 4500, "ステゴ", "体"), fossil("stego-tail", "ステゴのしっぽ", "Stego tail", 4000, "ステゴ", "しっぽ"),
  fossil("ptera-skull", "プテラノのあたま", "Ptera skull", 4000, "プテラノ", "頭"), fossil("ptera-body", "プテラノのからだ", "Ptera body", 4000, "プテラノ", "体"), fossil("ptera-left-wing", "プテラノのさよく", "Ptera left wing", 4500, "プテラノ", "左翼"), fossil("ptera-right-wing", "プテラノのうよく", "Ptera right wing", 4500, "プテラノ", "右翼")
];

const artJp = {
  "dainty-painting": "すてきなめいが",
  "solemn-painting": "おごそかなめいが",
  "quaint-painting": "いなせなめいが",
  "basic-painting": "すごいめいが",
  "famous-painting": "ゆうめいなめいが",
  "perfect-painting": "すばらしいめいが",
  "amazing-painting": "たいへんなめいが",
  "nice-painting": "いいめいが",
  "moving-painting": "うつくしいめいが",
  "common-painting": "よくみるめいが",
  "flowery-painting": "たおやかなめいが",
  "warm-painting": "あたたかいめいが",
  "rare-painting": "めずらしいめいが",
  "fine-painting": "いいかんじのめいが",
  "scary-painting": "こわいめいが",
  "lovely-painting": "かわいいめいが",
  "strange-painting": "おもしろいめいが",
  "worthy-painting": "たぐいまれなるめいが",
  "calm-painting": "おだやかなめいが",
  "opulent-painting": "きらびやかなめいが"
};

export const artList = Object.entries(artJp).map(([id, japaneseName], index) => {
  const entityId = `art-${id}`;
  const sourceIds = ["nookipedia-art-ww", "nookipedia-forgery", "jp-redd-atwiki"];
  const acquisition = index === 4 || index === 13
    ? "たぬきちの店の目玉商品 / つねきち / Wishy the Star"
    : "つねきち";
  const authenticity = "Wild Worldでは購入前に本物・偽物を見分けられない。博物館寄贈、売却確認、一日経過などで判明。";
  const sellPriceEvidence = [{
    sourceId: "nookipedia-art-ww",
    rawValue: "490 Bells",
    normalizedValue: 490,
    notes: `${japaneseName}のWild World名画表から本物の売値セルを抽出。JP地域は未確定。`
  }];
  const forgedSellPriceEvidence = [{
    sourceId: "nookipedia-forgery",
    rawValue: "10 Bells",
    normalizedValue: 10,
    notes: "Wild World節の贋作売値を抽出。引用元との依存関係があるため単一独立グループ扱い。"
  }];
  const authenticityEvidence = [
    {
      sourceId: "nookipedia-forgery",
      rawValue: "cannot tell whether a painting is a forgery until after it is purchased",
      normalizedValue: "prepurchase_authentication_unavailable",
      notes: "Wild World節の購入前判定不可と購入後の確認方法を抽出。"
    },
    {
      sourceId: "jp-redd-atwiki",
      rawValue: "購入するときにそれが本物かにせものかは基本的にわかりません",
      normalizedValue: "prepurchase_authentication_unavailable",
      notes: "日本語版コミュニティ資料の基本仕様を抽出。個別2作品の例外記述はCONFLICTに分離。"
    }
  ];
  const acquisitionEvidence = [{
    sourceId: "nookipedia-art-ww",
    rawValue: index === 4 || index === 13
      ? "Redd's Tent; Nook's Cranny (Spotlight item); Wishy the Star"
      : "Redd's Tent",
    normalizedValue: acquisition,
    notes: `${japaneseName}のWild World名画表から入手元を抽出。JP地域は未確定。`
  }];
  return {
    id: entityId,
    type: "art",
    category: "名画",
    japaneseName,
    englishName: id.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" "),
    image: resolveEntityImage({ id: entityId, type: "art", japaneseName }),
    sellPrice: 490,
    forgedSellPrice: 10,
    buyPrice: 1960,
    acquisition,
    fakeExists: true,
    authenticity,
    sourceReferences: ref(...sourceIds),
    fieldProvenance: {
      sellPrice: provenance(entityId, "sellPrice", 490, sellPriceEvidence),
      forgedSellPrice: provenance(entityId, "forgedSellPrice", 10, forgedSellPriceEvidence),
      authenticity: provenance(entityId, "authenticity", authenticity, authenticityEvidence),
      acquisition: provenance(entityId, "acquisition", acquisition, acquisitionEvidence)
    }
  };
});

export const museumCategories = [
  { type: "fish", label: "サカナ", total: fishList.length },
  { type: "bug", label: "ムシ", total: bugList.length },
  { type: "fossil", label: "化石", total: fossilList.length },
  { type: "art", label: "名画", total: artList.length }
];

export const allEntities = [...fishList, ...bugList, ...fossilList, ...artList];

export function getProvenanceCoverage(entities = allEntities) {
  const criticalFields = {
    fish: ["sellPrice", "availability", "location"],
    bug: ["sellPrice", "availability", "location"],
    fossil: ["sellPrice"],
    art: ["sellPrice", "forgedSellPrice", "authenticity", "acquisition"]
  };
  const records = entities.flatMap((entity) =>
    (criticalFields[entity.type] ?? []).map((field) => entity.fieldProvenance?.[field]).filter(Boolean)
  );
  const claimById = new Map(sourceClaims.map((claim) => [claim.id, claim]));
  const hasIndependentAgreement = (record, requireJp = false) => {
    const claims = record.sourceClaimIds.map((id) => claimById.get(id)).filter(Boolean);
    if (claims.length < 2 || new Set(claims.map((claim) => claim.independenceGroup)).size < 2) return false;
    if (new Set(claims.map((claim) => JSON.stringify(claim.normalizedValue))).size !== 1) return false;
    return !requireJp || claims.every((claim) => ["JP", "multi_region_verified"].includes(claim.region));
  };
  const hasAuditedIndependentAgreement = (record, requireJp = false) => {
    const claims = record.sourceClaimIds.map((id) => claimById.get(id)).filter(Boolean);
    return hasAuditedIndependentClaimPair(claims, requireJp);
  };
  const byStatus = Object.fromEntries(
    [...new Set(records.map((record) => record.status))]
      .sort()
      .map((status) => [status, records.filter((record) => record.status === status).length])
  );
  const withIndependentAgreeingClaims = records.filter((record) => hasIndependentAgreement(record)).length;
  const withAuditedIndependentAgreement = records.filter((record) => hasAuditedIndependentAgreement(record)).length;
  const withJpIndependentVerification = records.filter((record) => hasAuditedIndependentAgreement(record, true)).length;
  const legacyUnresolved = records.filter((record) => ["UNVERIFIED", "CONFLICT", "UNKNOWN"].includes(record.status)).length;
  return {
    totalCriticalFieldInstances: records.length,
    withSourceIds: records.filter((record) => record.sourceIds.length > 0).length,
    withExtractedClaims: records.filter((record) => record.sourceClaimIds.length > 0).length,
    withIndependentAgreeingClaims,
    withDistinctGroupAgreement: withIndependentAgreeingClaims,
    withAuditedIndependentAgreement,
    withJpIndependentVerification,
    withDirectJpClaims: records.filter((record) => record.sourceClaimIds.some((id) => claimById.get(id)?.region === "JP")).length,
    conflicts: records.filter((record) => record.status === "CONFLICT").length,
    discrepancyRecords: dataDiscrepancies.length,
    byStatus,
    legacyUnresolved,
    unresolved: legacyUnresolved,
    notDistinctGroupCorroborated: records.length - withIndependentAgreeingClaims,
    notIndependentlyVerified: records.length - withAuditedIndependentAgreement,
    notJpIndependentlyVerified: records.length - withJpIndependentVerification,
    releaseBlocking: records.filter((record) => !["OFFICIAL_VERIFIED", "MULTI_SOURCE_VERIFIED"].includes(record.status)).length
  };
}

export function toHiragana(value) {
  return String(value)
    .normalize("NFKC")
    .replace(/[ァ-ン]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .toLowerCase();
}

export function searchableText(entity) {
  return toHiragana([
    entity.japaneseName,
    entity.englishName,
    entity.sellPrice,
    entity.location,
    entity.waterType,
    entity.category,
    entity.monthText,
    entity.timeText,
    entity.fossilGroup,
    entity.part,
    entity.action,
    entity.forgedSellPrice,
    ...(entity.availabilityRules ?? []).flatMap((rule) => [rule.condition, rule.weather])
  ].filter(Boolean).join(" "));
}
