# Repository guide

このリポジトリは依存の少ないES Modules製PWAである。最上位の安全要件は、Nintendo DS日本版『おいでよ どうぶつの森』の未確認値を推測で補完しないこと、既存LocalStorageキーを変更しないこと、テストを弱めないことである。

## Map

- `index.html`, `manifest.webmanifest`, `sw.js`: PWAシェル、インストール情報、オフラインキャッシュ
- `src/app.js`, `src/styles.css`, `src/ui-logic.js`: 表示、操作、純粋UIロジック
- `src/data.js`: 正規化済みcoreゲームデータ、出典、claim、差分、field provenance
- `src/expansion-data.js`, `src/generated/expansion-records.js`: アイテム・住民・はにわ・NPC・施設・イベントの実recordsとprovenance
- `src/universal-search.js`, `src/calendar-content.js`: 全domain検索とイベント・住民誕生日カレンダー
- `src/availability.js`: 日付・時刻・天候・特殊条件の出現判定
- `src/storage.js`: schemaVersion 3の保存、移行、import/export検証
- `src/pricing.js`, `src/recommendations.js`: 売値計算、推薦順位
- `tests/`: 単体・契約・ブラウザE2E
- `scripts/`: ローカルサーバー、データ・静的・Lighthouse検証
- `docs/`: 設計、データ監査、QA、リリース判定

## Change rules

1. ゲームデータ変更時は `sources`、`sourceClaims`、field provenance、`dataDiscrepancies` を同時更新する。資料間不一致はCONFLICTとして残す。
2. 保存形式変更時も実装済みキー `wildWorldCompanionState.v1` を維持し、旧データの正規化テストと将来schema拒否テストを追加する。
3. 可用性、価格、推薦、UI状態の修正には先に失敗する回帰テストを追加する。
4. 完了前に `test`、`typecheck`、`lint`、`build`、実ブラウザE2Eを実行する。未実施のゲートをpassと記録しない。
5. PWAキャッシュ内容を変えたら `CACHE_NAME` を更新し、precache契約とオフラインE2Eを通す。

リリース状態とブロッカーの正本は `docs/release/readiness.md` と `docs/release/known-issues.md` である。
