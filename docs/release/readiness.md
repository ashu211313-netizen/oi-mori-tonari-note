# Release readiness

## Current iPhone-first candidate — 2026-09-11

現在の作業ツリー分類は **`IPHONE_FIRST_PERSONAL_FINAL_CANDIDATE`** です。これは個人用途の日常利用に向けた候補であり、一般公開向けRelease Readyの宣言ではありません。

| Candidate gate | Result |
|---|---|
| Unit / checkJs / ESLint / Build | PASS — 128/128 / PASS / PASS / PASS |
| Data / Provenance / Evidence / Static / Security / Images | PASS — Data VersionとCanonical値の変更0 |
| Existing browser E2E | PASS — installed Chrome 152.0.7977.83 22/22（16,708.4848ms）、Edge 152.0.4191.66 22/22（16,644.6033ms）、managed WebKit 26.5 22/22（32,808.9665ms） |
| Focused iPhone E2E / Chrome | PASS — installed Chrome 152、20/20、36,526.2435ms |
| Focused iPhone E2E / managed WebKit | PASS — managed WebKit 26.5、20/20、76,493.9532ms |
| Responsive matrix | PASS — 390×844、393×852、430×932、375×812、428×926、768×1024、1280×900 |
| IME / keyboard / safe-area | PASS（自動）— composition、390×500 viewport相当、四辺inset |
| Resume / list return | PASS（自動）— event coalescing、route/query/filter/scroll復元 |
| Offline / persistence | PASS（ローカル）— origin-stop、Backup、QuotaExceeded、同一origin exclusive Web Lock下の異なる2 item同時write。strict latest-read → mutation → saveで両方保持 |
| Service Worker | PASS（ローカル）— v15 install待機、canonical shell、v15画面からの将来explicit handoff / reload-loop guard。実v14→v15移行は`NOT_RUN` |
| Screen captures | PASS — Chrome 27/27、managed WebKit 26.5 27/27。最終manifest 27枚 |
| Screenshot visual checks | PASS — native clear重複なし、通知/戻る26px間隔、keyboard nav退避 |
| Repository subpath gate | PASS — 5/5 |
| Local Lighthouse 13.4.1 | PASS — 91 / 100 / 100 / 100 |
| CI / Pages gate definition | PASS（static）— Chromium + managed WebKit各20件、CI screenshots各27枚をengine別artifact化 |
| Firefox | `ENVIRONMENT_BLOCKED_BEFORE_APP_ASSERTIONS` — 通常・権限昇格runともapp assertion前に`spawn UNKNOWN`。0/22のアプリFAIL/PASSではない |
| Physical iPhone/Safari/Home Screen/real keyboard/IME/VoiceOver/Android | `NOT_RUN` |
| PR / merge / GitHub Pages v15 deployment / live verification | `NOT_RUN` |

横断検索は1,767件、Data Versionは`2026.09.03.3`、保存keyは`wildWorldCompanionState.v1`、schemaVersionは3のままです。Canonical game-data、Provenance、CONFLICT、実records数は変更していません。これらの自動結果をphysical Safari、実IME、VoiceOverのPASSへ拡張しません。

multi-tab PASSはWeb Locks APIが有効な同一originのinstalled Chrome 152 / managed WebKit 26.5に限定する。Web Locks非対応browser、Safari Lockdown Mode、または異なるorigin / storage partitionには拡張しない。その条件では単一タブ保存は維持するが、cross-tab排他は`OUT_OF_GUARANTEE`である。`storage` event / BroadcastChannelだけで同時書込を保護できるとは判定しない。

managed WebKitの最終PASS前には、origin停止中の予期された接続ログを通常failureとして扱った19/20と、scroll / Service Worker installのsettle不足による計測raceの18/20があった。ログ例外をorigin停止期間だけに限定し、再描画時のviewportを保持し、最大scroll到達とinstall完了を待つよう修正した。assertionや合格閾値は削除・緩和していない。

v14→v15の初回更新について、旧v14画面にはv15の更新noticeがない。v15は全旧clientが終了するまでwaitingし、次回起動でactivateする。安全な利用手順はBackup書き出し→同originの全Safari tab / Home Screen PWA終了→オンライン再起動である。`wildWorldCompanionState.v1`のdurable stateは保持対象だが、旧v14 sessionのroute / query / scrollは保証対象外である。この移行のphysical iPhone Safari実行は`NOT_RUN`であり、上表のローカルPASSへ含めない。

## Historical GitHub Pages deployment — 2026-09-04

## Historical deployment classification

2026-09-04公開版の配備分類は **`GITHUB_PAGES_DEPLOYED_AND_VERIFIED`** です。以下はService Worker v14配備時点の履歴であり、現在のv15候補のlive PASSを意味しません。

`PERSONAL_FINAL_COMPLETE`版の機能、データ、保存互換性、offline動作を維持し、public repository、PR、CI、GitHub Pages、repository-path PWA、実HTTPS URLの機械検証を完了しました。これは全データ検証済み、物理iPhone/Safari確認済み、App Store配布準備済み、または外部法務レビュー済みを意味しません。

## Historical deployment identity

- Repository: [ashu211313-netizen/oi-mori-tonari-note](https://github.com/ashu211313-netizen/oi-mori-tonari-note)
- Live app: [https://ashu211313-netizen.github.io/oi-mori-tonari-note/](https://ashu211313-netizen.github.io/oi-mori-tonari-note/)
- Source branch: `main`
- GitHub Pages source: GitHub Actions
- HTTPS enforcement: enabled
- Application deployment commit: `2a510f8ec063a4b11311be38b3e645c1c277ae58`
- Deployment PR: [#1](https://github.com/ashu211313-netizen/oi-mori-tonari-note/pull/1)
- Main CI: [run 33806379292](https://github.com/ashu211313-netizen/oi-mori-tonari-note/actions/runs/33806379292)
- Pages deploy: [run 33806379300](https://github.com/ashu211313-netizen/oi-mori-tonari-note/actions/runs/33806379300)

## Historical deployment gate

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

横断検索1,767件、Data Version `2026.09.03.3`、保存key `wildWorldCompanionState.v1`、schemaVersion 3は現在も維持しています。上表の公開配備はService Worker v14で、現在の再配備前候補はv15です。PCとiPhoneは異なるbrowser-local storageを持つため、端末間移行にはBackup export/importを使います。

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

なお、物理iPhone/Safari、Home Screen PWA、実software keyboard / 日本語IME、Android実機、VoiceOverを含むreal screen reader、Firefox app assertions、外部法務reviewは完了していません。GitHub Pagesはrepository-controlledなcustom response headersを提供しないため、document CSP metaとGitHub HSTSを使用します。v15候補のPR / merge / deployment / live結果は`NOT_RUN`であり、2026-09-04のv14履歴を上書きせず、再配備後に別証拠として追記します。
