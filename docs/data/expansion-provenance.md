# Expansion provenance — Data Version 2026.09.03.3

## Scope and exact counts

| Domain | Records |
|---|---:|
| Items | 1,271 |
| Residents | 148 |
| Gyroids | 127 |
| NPCs | 17 |
| Facilities | 8 |
| Events | 12 |
| Total | 1,583 |

Source registryは58件、lineageは5件、Source Claimsは9,170件、field-level provenanceは9,162件です。claim数がfield数より8多いのは、同一fieldに複数の相違claimを保持しているためです。これらはcore 468 critical fieldsの公開向けverification metricとは別集計です。

## Source and lineage rules

- 主要抽出元は日本版Nintendo DS『おいでよ どうぶつの森』を明示する[どうぶつの森.com NDS index](https://www.oi-mori.com/nds/)配下の取得済み本文です。
- `oi-mori.com/nds/`配下54 URLはすべて`oi-mori-nds`という一つのlineageです。54 URLを54独立資料として数えません。
- 最後の16 acquisitionは[どうぶつの森DS Wiki*「公式イベント」](https://wikiwiki.jp/ds-doubutu/%E5%85%AC%E5%BC%8F%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88)本文で、対象名、配布期間・経路、カタログ不可を確認しました。歴史的なcommunity recordであり、`wikiwiki-ds-doubutu-community` 1 lineage、`SINGLE_SOURCE`です。
- Eventの補足は[年中行事・イベント](https://www.super-famicom.jp/etc00/doubutu/oideyo/ds_event.html)本文を使用しました。報酬・場所を採用した一方、既存event表との相違はCONFLICTとして保持しました。
- 住民候補の突合せはACWW住民一覧とWild World明示住民名簿を使います。GLOBAL_WWやderived sourceをJP独立検証へ数えません。
- 検索結果snippetはCanonical Evidenceに使わず、別region・別シリーズの値を補完しません。
- 各取得本文のSHA-256、retrieved date、region、language、source type、lineageはgenerated recordsとextraction reportに保持します。

## Acquisition disposition

- Evidence-backed acquisitionは1,255→1,271、完全`UNKNOWN`は16→0です。
- 明示・分類付き取得文は389→405です。追加16件はすべて歴史的配布で、`EVENT / HISTORICAL_DS_DISTRIBUTION`、`EXPLICIT_HISTORICAL_DISTRIBUTION_TABLE`、`catalogOrderable: false`です。
- 866件は買値欄だけを根拠に`PURCHASE / RETAIL_OR_CATALOG_UNSPECIFIED`としています。販売場所・販売者・catalog可否は推測しません。

## Event disposition

- Event recordsは12、date/time/descriptionは12/12、reward textは9/12、locationは5/12、reward item linkは7/12イベント・19 item IDsです。
- 報酬が確認できない3イベントは`NOT_STATED_IN_PRIMARY_SOURCE`で、UIは「資料に記載なし」と表示します。
- `WW-EXP-DISC-001`: 秋のどんぐり祭りの報酬表記が「各種どんぐり」と「きのこ家具等12種」で不一致。詳細側を暫定表示するがCONFLICT。
- `WW-EXP-DISC-002`: つり大会の開始が0:00と12:00で不一致。既存値を維持しCONFLICT。
- `WW-EXP-DISC-003`: ムシとり大会の開始が0:00と12:00で不一致。既存値を維持しCONFLICT。

## Remaining uncertainty

- 住民`カルビ/カルピ`、`モモコ/ももこ`はCanonicalを選ばず、2件とも`UNKNOWN`として未登録です。
- Core CONFLICT 9 fields / 6 registry、JP audited-independent 14/468、strict public blocker metric 454は変更していません。
- Core Canonical変更は0です。

## Reproducibility

`pnpm run research:expansion`はnetworkから本文を再取得し、compact generated recordsとhash reportを再生成します。通常buildはchecked-in recordsを使うためnetwork不要です。

- `artifacts/data-audit/expansion-extraction-report.json`
- `artifacts/data-audit/personal-final-report.json`
- `PERSONAL_FINAL_REPORT.md`
