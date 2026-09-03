# Test strategy

## Layers

- Unit/contract: core出現境界・価格・保存不変条件に加え、拡張domainの実件数、stable ID、source/claim/provenance、lineage、取得edge、横断検索、Collection、画像metadataを検証する。
- Type/static: TypeScript `checkJs`、ESLint、構文、manifest、SW v14 precache、CSP、core/expansion data validation、Evidence Sufficiencyを検証する。
- Browser E2E: core回帰、拡張6 domain検索、event detail/calendar/birthday、販売場所未特定の取得表示、item/gyroid/resident状態永続化、画像fallback、320〜430px、axe、44px、overflow、origin停止offline拡張検索を検証する。
- Pages E2E: clean deployment artifactを実repository pathへmountし、root非依存、manifest/icon/SW scope、offline reload、保存、主要UIを検証する。実配備後はHTTPS/HSTS、全precache URL、公開除外、installed Chromeとmanaged WebKitで再検証する。
- Lighthouse: Performance、Accessibility、Best Practices、SEO。Lighthouse 13にPWA categoryはないため、install/offline/updateはstatic/E2Eで検証する。
- Migration/backup: legacy unversioned、schema v1/v2/v3、corrupt/future rejection、不可能state修復、failed import非破壊、SW独立性を10ケースで検証する。

## Regression and evidence policy

確認した不具合には回帰テストを残し、期待値を弱めて成功させません。CONFLICTは不一致とraw claimの保持を検証します。拡張recordはsource body hash、region、lineage、field claimを必須とし、同一lineageの複数URLを独立sourceへ昇格させません。買値欄しかない取得情報は販売者未特定、根拠がない取得方法は`UNKNOWN`のままとします。

## Unsupported claims

Chrome/Edge/managed WebKitの成功からSafari/Firefoxや実端末の成功を推定しません。axeはVoiceOver/NVDA/TalkBackによる実読み上げの代替ではありません。未実行targetは`NOT_RUN`、host起動不能は`ENVIRONMENT_BLOCKED`として保持します。
