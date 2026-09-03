# Architecture

## Runtime flow

```text
index.html
   │
   ├─ src/app.js ── UI state / event delegation / rendering
   │      ├─ data.js ── entities + sources + claims + discrepancies
   │      ├─ images.js / generated/image-assets.js ── local image metadata
   │      ├─ expansion-data.js / generated/expansion-records.js ── 1,583 expansion records + provenance
   │      ├─ universal-search.js ── 10 domains / 1,767 records
   │      ├─ calendar-content.js ── event and resident-birthday rules
   │      ├─ catalog-model.js ── public catalog exports
   │      ├─ acquisition.js ── explicit acquisition-edge validation
   │      ├─ availability.js ── calendar/time/weather/condition engine
   │      ├─ storage.js ── migration, validation, LocalStorage
   │      ├─ pricing.js / recommendations.js
   │      └─ ui-logic.js ── search and filter normalization
   │
   └─ sw.js ── versioned shell cache, image runtime cache, navigation fallback
```

ビルド変換を行わない静的ES Modules構成で、サーバーやアカウントを必要としません。状態はブラウザのLocalStorageだけに保存されます。UIはイベント委譲を用い、再描画時には入力フォーカスと選択範囲を復元します。

## Boundaries

- `data.js` は事実、出典、差分を保持し、推論による補完を行いません。
- `availability.js` は構造化ルールだけを評価します。不明な天候・特殊条件は「条件あり」とし、捕獲可能と断定しません。
- `storage.js` が唯一の永続化境界です。外部importは厳格に拒否し、ローカルの旧データは安全な初期値へ修復します。
- Service Workerは同一オリジンだけを扱い、HTML navigationだけをshellへフォールバックします。欠落したJS/CSSをHTMLで偽装しません。
- `images.js` は画像が実在しないときにpathを作らず、明示的なmissing metadataを返します。`sync-image-manifest.mjs`はlocal folderだけを走査します。
- `expansion-data.js` は生成済みcompact tuplesを実行時recordへ展開し、source references、field claims、region、confidence、lineageを付与します。
- `universal-search.js` はcoreと拡張domainを一つの検索indexへ統合します。拡張moduleはidle時または初回検索・detail・calendar時にloadし、Service Workerがoffline用にprecacheします。
- `acquisition.js` は明示された取得文をedge化し、数値の買値だけがある場合は販売者不明の`PURCHASE`として区別します。価格だけから販売者を推測しません。
- `catalog-model.js` は実recordsを公開する互換境界であり、空placeholderではありません。

## Data and save compatibility

保存キーは実装済みの `wildWorldCompanionState.v1` のままです。schemaVersion 3は、従来のschema v1/v2を自動移行し、core状態に加えて`itemAcquired`、`itemCataloged`、`gyroidCollected`、全domain共通の`favorites`を保持します。寄贈済みなら所持・捕獲済みを満たす、偽物名画は寄贈済みにできない、数量は有限整数1〜9999に制限する、という既存不変条件も維持します。未知の将来schema、配列root、不正日付、不正enumはimport時に拒否されます。migration/backup matrixは10/10 PASSです。

## Security and privacy

外部送信は行わず、CSPはスクリプト・接続・画像をselfへ制限し、referrerを送信しません。外部出典リンクは新規タブで `noopener` を使います。`frame-ancestors` はmeta CSPで効かないため、本番配信時にHTTPレスポンスヘッダーとして設定する必要があります。
