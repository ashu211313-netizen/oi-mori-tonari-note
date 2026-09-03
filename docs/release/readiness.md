# GitHub Pages deployment readiness — 2026-09-04

## Classification

現在の配備分類は **`GITHUB_PAGES_DEPLOYED_AND_VERIFIED`** です。

`PERSONAL_FINAL_COMPLETE`版の機能、データ、保存互換性、offline動作を維持し、public repository、PR、CI、GitHub Pages、repository-path PWA、実HTTPS URLの機械検証を完了しました。これは全データ検証済み、物理iPhone/Safari確認済み、App Store配布準備済み、または外部法務レビュー済みを意味しません。

## Deployment identity

- Repository: [ashu211313-netizen/oi-mori-tonari-note](https://github.com/ashu211313-netizen/oi-mori-tonari-note)
- Live app: [https://ashu211313-netizen.github.io/oi-mori-tonari-note/](https://ashu211313-netizen.github.io/oi-mori-tonari-note/)
- Source branch: `main`
- GitHub Pages source: GitHub Actions
- HTTPS enforcement: enabled
- Application deployment commit: `2a510f8ec063a4b11311be38b3e645c1c277ae58`
- Deployment PR: [#1](https://github.com/ashu211313-netizen/oi-mori-tonari-note/pull/1)
- Main CI: [run 33806379292](https://github.com/ashu211313-netizen/oi-mori-tonari-note/actions/runs/33806379292)
- Pages deploy: [run 33806379300](https://github.com/ashu211313-netizen/oi-mori-tonari-note/actions/runs/33806379300)

## Deployment gate

| Gate | Result |
|---|---|
| Public repository / default branch | PASS — public / `main` |
| PR merge / branch cleanup | PASS — PR #1 squash merged、remote feature branch removed |
| CI on PR and `main` | PASS |
| Unit / checkJs / ESLint / Build | PASS — 118/118 / PASS / PASS / PASS |
| Data / Provenance / Evidence / Static / Security | PASS |
| Clean Pages artifact | PASS — 23 runtime files、forbidden 0 |
| Repository-path E2E | PASS — Chromium 5/5 at `/oi-mori-tonari-note/` |
| Pages workflow | PASS — official artifact/deploy actions、least-privilege permissions |
| Real HTTPS / HSTS | PASS — live 200 / GitHub HSTS |
| Manifest / icons / SW | PASS — repository-relative、SW v14 |
| Live precache | PASS — 21/21 URLs return 200 inside scope |
| Live source exclusions | PASS — `.env` / `node_modules` / `artifacts` / `tests` / `scripts` return 404 |
| Live installed Chrome | PASS — HTTPS/SW/offline/search/Collection/Calendar/Backup/storage |
| Live managed WebKit+iPhone descriptor | PASS — HTTPS/SW/online reload/major UI/storage; physical-device PASSではない |
| Live Lighthouse 13.4.1 | PASS — 100 / 100 / 100 / 100 |
| Migration / backup | PASS — 10/10、schema v1/v2→v3、failed import non-mutation |
| Existing local browser E2E | PASS — Chrome / Edge / managed WebKit 各22/22 |

## Product and data invariants

| Domain | Records | Search | Collection state |
|---|---:|---:|---|
| Fish / bugs / fossils / art | 56 / 56 / 52 / 20 | 184 | caught/acquired/identified/genuine/donated/favorite |
| Items | 1,271 | 1,271 | acquired/cataloged/favorite |
| Residents | 148 | 148 | favorite |
| Gyroids | 127 | 127 | collected/favorite |
| NPCs / facilities | 17 / 8 | 25 | favorite |
| Events | 12 | 12 | favorite/calendar |

横断検索1,767件、Data Version `2026.09.03.3`、Service Worker v14です。保存key `wildWorldCompanionState.v1` とschemaVersion 3は維持しています。PCとiPhoneは異なるbrowser-local storageを持つため、端末間移行にはBackup export/importを使います。

## Evidence truth

| Metric | Current |
|---|---:|
| Core claim coverage | 468/468（verifiedではない） |
| Core source claims | 693 |
| Core JP audited-independent | 14/468 |
| Strict public data blocker metric | 454 |
| Core SINGLE_SOURCE / CORROBORATED / VERIFIED | 278 / 167 / 14 |
| Core CONFLICT | 9 fields / 6 registry |
| Expansion source registry / lineages | 58 / 5 |
| Expansion source claims / provenance fields | 9,170 / 9,162 |
| Expansion event CONFLICT | 3 |
| Core Canonical changes in deployment | 0 |

GitHub Pages配備はデータ証拠の深さを変更しません。未解決値、lineage、CONFLICTを隠さず、UIの非断定表示を維持しています。

## Adversarial decision

secret/private artifactの公開、root-relative path破損、repository subpath外のSW、古いcache、保存破壊、CI迂回、localhostをpublic HTTPSとする誤表記、WebKit emulationを物理iPhoneとする誤表記を失格条件として再点検しました。公開URLはPC上のPowerShell、Node server、tunnelに依存せず、GitHub Pagesから通常利用できます。

なお、物理iPhone/Safari、Android実機、real screen reader、Firefox app assertions、外部法務reviewは完了していません。GitHub Pagesはrepository-controlledなcustom response headersを提供しないため、document CSP metaとGitHub HSTSを使用します。これらは[既知の不確実性](known-issues.md)に残し、PASSとは宣言しません。
