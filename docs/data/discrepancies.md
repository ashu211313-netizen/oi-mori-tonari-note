# Data discrepancy register — 2026-09-01

RegistryはBefore 6 / After 6で、全件未解決です。推測による数字削減はしていません。field instanceは8→9です。

| ID | Entity / field | Conflicting normalized claims | Current handling | Release impact |
|---|---|---|---|---|
| WW-DISC-001 | salmon / location-day split | early/late month vs first/second half | 河口・川を併記し境界を断定しない | BLOCKS_RC |
| WW-DISC-002 | famous + amazing painting / authenticity | 購入前判定不可 vs 2作品100%贋作 | 購入前Tipsを断定せず2作品へ警告 | PARTIAL_GUIDANCE |
| WW-DISC-003 | oak silk moth / sellPrice | 200 vs 1,200 | 1,200を暫定表示しCONFLICTを常時表示 | BLOCKS_RC |
| WW-DISC-004 | oak silk moth / months-time | 6–9月 vs 6–8月 | 既存6–9月を暫定維持 | BLOCKS_RC |
| WW-DISC-005 | honeybee / months | 3–8月 vs 3–9月 | 既存3–8月を暫定維持 | BLOCKS_RC |
| WW-DISC-006 | king salmon / location-day split | 境界不明 vs first/second half | 両地点を併記し境界を断定しない | BLOCKS_RC |

SuperCheats、GameYum、Thonky、伊豆・伊東情報館に加え、Landscape、hot*cocoa、2006年当時の個人プレイ記録、任天堂日本語取扱説明書、攻略本刊行資料を本文まで調査しました。独立観測2資料は魚売値の部分表であり、上記6 CONFLICTを直接扱わないため、Conflict数・Canonical値は変更していません。検索スニペットはclaimに採用していません。

Raw値、Normalized値、source ID/URL/type、independenceGroup、region、claim ID、history、attemptedSourceIdsは `src/data.js` と `artifacts/data-audit/conflict-report.json` が機械可読な正本です。

2026-09-02のZero Blockers Tribunalでも全6件を再審理しました。追加JP web、archive、guidebook bibliography、public game-dataを経ても直接裁定できる独立ADMJ証拠がなく、Before 6/9→After 6/9、resolved 0、Canonical変更0です。実機falsification planは`artifacts/data-audit/zero-blockers-conflict-tribunal.json`、実行手順は`docs/qa/human-verification-kit.md`にあります。
