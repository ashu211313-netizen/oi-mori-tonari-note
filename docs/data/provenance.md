# Core provenance coverage — Data Version 2026.09.03.3

`pnpm run validate:provenance` がcore source、claim、critical field、独立性、地域、CONFLICT historyを構造検証します。表はcore 184 recordsの実測値で、拡張1,583 recordsは[Expansion provenance](expansion-provenance.md)に分離しています。

| Metric | Before | After |
|---|---:|---:|
| Critical field instances | 468 | 468 |
| With source IDs | 468 | 468 |
| With extracted field claims | 468 | 468 |
| Source claim records | 652 | 693 |
| Distinct-group agreeing claims | 181 | 181 |
| Audited-independent agreeing claims | 0 | 14 |
| Direct JP claims | 408 | 408 |
| JP independent verification | 0 | 14 |
| Conflict field instances | 9 | 9 |
| Legacy unresolved (`UNVERIFIED` / `CONFLICT` / `UNKNOWN`) | 9 | 9 |
| Not independently verified | 468 | 454 |
| Not JP-independently verified | 468 | 454 |
| Release-blocking provenance | 468 | 454 |

After statusは `MULTI_SOURCE_VERIFIED` 14、`CORROBORATED` 167、`SINGLE_SOURCE` 278、`CONFLICT` 9です。`CORROBORATED` は異なる `independenceGroup` の値が一致するだけの分類で、転載・共通上流が否定されたことを意味しません。`MULTI_SOURCE_VERIFIED` は、同じ正規化値を直接支持するJP適用可能な監査済み独立claim pairがある場合だけ付与します。弱い補助資料が同じfieldに併記されても検証ペアへは数えません。

新規claimはLandscape 24件、hot*cocoa 17件の計41件です。両資料の重複14件だけが検証済みです。Canonical値は変更していないため `canonicalChanges` は0です。

影響フィールドが8→9になったのは、WW-DISC-002の日本語資料が「ゆうめいなめいが」と「たいへんなめいが」の2作品へ適用されるためです。差分registryは6件のままで、解消していません。

完全な機械可読レポートは `artifacts/data-audit/provenance-report.json`、`evidence-warroom-ledger.json`、`source-independence-report.json`、`jp-verification-report.json`、正本ロジックは `scripts/provenance-core.mjs` です。

今回の拡張でcore Canonical値、693 claims、14/468 JP independent verification、9 conflict fields / 6 registryは変更していません。Data Versionの更新は、source/provenance付き拡張recordsを参照データセットへ追加したためです。

## Evidence Sufficiency re-audit — 2026-09-02

JP 2-source未達だけを機械的blockerにせず、468 fieldsをUI断定・user risk・alternative evidence routeまで再評価しました。結果はB JP audited-independent 14、C JP single-source 385、D conflict 9、D dependent corroboration only 60です。Critical 448、High 20で、解除に必要な証拠を満たしたfieldは0でした。したがってrelease blockersは454→454であり、基準の弱化や名称変更による数字削減はありません。各fieldのL1〜L7、blocker rationale、hardware plan IDは`artifacts/data-audit/evidence-sufficiency-report.json`と`zero-blockers-454-field-disposition.json`が正本です。
