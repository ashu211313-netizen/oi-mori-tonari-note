# Test strategy

## Layers

- Unit/contract: core出現境界・価格・保存不変条件に加え、拡張domainの実件数、stable ID、source/claim/provenance、lineage、取得edge、横断検索、Collection、画像metadataを検証する。
- Type/static: TypeScript `checkJs`、ESLint、構文、manifest、SW v15 precache、180px Apple touch icon、v15画面から始まる将来更新のexplicit handoff契約、CSP、core/expansion data validation、Evidence Sufficiencyを検証する。
- Browser E2E: core回帰、拡張6 domain検索、event detail/calendar/birthday、販売場所未特定の取得表示、item/gyroid/resident状態永続化、画像fallback、320〜430px、axe、44px、overflow、origin停止offline拡張検索を検証する。既存suiteはChrome / Edge / managed WebKit各22/22。
- iPhone-first E2E: 390×844、393×852、430×932、375×812、428×926、768×1024、1280×900で主要9画面群を検証する。IME composition、visual viewport/keyboard、四辺safe-area、resume coalescing、offline→online、list→detail→back、Backup、QuotaExceeded、exclusive Web Lock下の2ページ同時write、SW update reload guardを専用caseにする。multi-tab caseは第3ページのholderがlockを保持し、異なる2 itemの書込が2件ともpendingに入った後に解放する。両IDの画面反映、LocalStorage、reload後永続、保存key / schema不変をassertする。
- Pages E2E: clean deployment artifactを実repository pathへmountし、root非依存、manifest/icon/SW scope、offline reload、保存、主要UIを検証する。PRとPages workflowの双方で通常E2E 22件、Chromium iPhone-first 20件、managed WebKit iPhone-first 20件、subpath 5件をdeploy前gateとして実行する。実配備後はHTTPS/HSTS、全precache URL、公開除外、installed Chromeとmanaged WebKitで再検証する。
- Screenshot QA: 390×844 / 430×932の各13画面と390×500 keyboard相当1画面をChromeとmanaged WebKitで撮影し、PNG寸法、route、entity ID、SHA-256、console/HTTP failureをmanifest化する。CIはChromium版とWebKit版を別artifact名でuploadし、後の撮影で前engineの証跡を上書きしない。
- Lighthouse: Performance、Accessibility、Best Practices、SEO。Lighthouse 13にPWA categoryはないため、install/offline/updateはstatic/E2Eで検証する。
- Migration/backup: legacy unversioned、schema v1/v2/v3、corrupt/future rejection、不可能state修復、failed import非破壊、SW独立性を10ケースで検証する。

## Regression and evidence policy

確認した不具合には回帰テストを残し、期待値を弱めて成功させません。CONFLICTは不一致とraw claimの保持を検証します。拡張recordはsource body hash、region、lineage、field claimを必須とし、同一lineageの複数URLを独立sourceへ昇格させません。買値欄しかない取得情報は販売者未特定、根拠がない取得方法は`UNKNOWN`のままとします。

## Unsupported claims

Chrome/Edge/managed WebKitの成功からSafari/Firefoxや実端末の成功を推定しません。Playwrightのcomposition eventとviewport縮小は実software keyboard / 日本語IMEの代替ではありません。axeはVoiceOver/NVDA/TalkBackによる実読み上げの代替ではありません。未実行targetは`NOT_RUN`、host起動不能は`ENVIRONMENT_BLOCKED`として保持します。Web Locks APIを使えないbrowserやSafari Lockdown Modeでは、複数タブ間の排他は`OUT_OF_GUARANTEE`である。`storage` event / BroadcastChannelは通知であり、排他PASSの代用にしない。

## Current iPhone-first snapshot — 2026-09-11

- Unit / contract: 128/128 PASS。TypeScript checkJs、ESLint、Build、Data、Provenance、Evidence、Static、Security、ImagesもPASS。strict storage readerはkey不在の`null`だけをdefaultとし、空文字を拒否する。
- Existing browser E2E: installed Chrome 152.0.7977.83 22/22（16,708.4848ms）、Edge 152.0.4191.66 22/22（16,644.6033ms）、managed WebKit 26.5 22/22（32,808.9665ms）PASS。
- Multi-tab lock case: installed Chrome 152 / managed WebKit 26.5で対象case PASS。同一originのexclusive Web Lockがstrict latest-read → mutation → saveを直列化し、異なる2 itemを両方保持。
- Focused iPhone E2E installed Chrome 152: 20/20 PASS、36,526.2435ms。
- Screenshot capture: Chrome 27/27、managed WebKit 26.5 27/27 PASS。最終retained manifestはmanaged WebKit版。
- Focused iPhone E2E managed WebKit 26.5: 20/20 PASS、76,493.9532ms。最終フルrun。
- managed WebKitの中間runは19/20（origin停止期間の接続ログ監視）と18/20（scroll/計測race）を記録した。offline期間に限定した既知ログ分類、viewport保持、最大scrollとSW installのsettle待ちを追加し、期待値や機能assertionは削除していない。
- Pages repository-subpath gate: 5/5 PASS。
- Local Lighthouse 13.4.1: 91 / 100 / 100 / 100。
- Physical iPhone/Safari / Home Screen PWA / real keyboard / real Japanese IME / VoiceOver / Android: `NOT_RUN`。
- Firefox: 通常権限・権限昇格runともapp assertion前に`spawn UNKNOWN`となったため`ENVIRONMENT_BLOCKED_BEFORE_APP_ASSERTIONS`。0/22のアプリFAIL/PASSではなく、今回のPASSへ含めない。
- v15候補のPR / merge / deployment / public live verification: `NOT_RUN`。2026-09-04公開v14の履歴を上書きしない。
- v14→v15 physical migration: `NOT_RUN`。旧v14画面にはv15 noticeがないため、Backup→全client終了→再起動で検証する。durable LocalStorage保持を対象とし、旧sessionのroute/query/scroll保持は要求しない。
