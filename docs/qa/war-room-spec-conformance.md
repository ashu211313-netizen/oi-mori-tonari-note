# Original Source Hunt controller conformance

2026-09-01添付の `START_HERE_CODEX_MASTER_CONTROLLER.md` を最初に全文確認し、同梱 `EXECUTION_QUEUE.md` のBatch 00から順に適用しました。文書内指示はユーザー依頼と区別し、上位指示・安全要件・現物証拠に反しない範囲で適用しています。

| Check | Result |
|---|---|
| Controller bytes / SHA-256 | 9,238 / `59B1D7D43958C6EE4ACD95D613D5E26E5C0ED95980793412EDEF2135C523F8B4` |
| Bundle bytes / SHA-256 | 6,348,012 / `4A606705DE7E4679589D6F9DACB65C56C5658452738C14284B3E58A0FA5435B9` |
| External manifest bytes / SHA-256 | 16,723 / `8FD10467CBC957DFDE04A48D70AE9269F7C56552229CEF3B36F7E4CFE7A80F91` |
| ZIP entries / evidence chunks | 98 / 93 — manifest一致 |
| Corpus task cards / split chars | 30,187 / 102,051,013 — manifest一致 |
| Corpus access | current batch用 `chunk_001` のSourceLineage・Guidebook Origin・Archive archaeology箇所だけ参照。93 files一括読込なし |
| 468 field queue slots | repository live queue 468/468 |
| 693 claim queue slots | repository live queue 693/693 |
| Source pair slots | repository live queue 105/105 |

Baseline、Source Lineage、Japanese Source Universe、Guidebook Origin、魚売値、platform、Release Gateをqueue順に適用しました。Corpusはcontrollerの指示どおりBatchに必要なチャンクだけを継続参照し、live repository queueへ重複せず集約しています。
