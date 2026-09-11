# Verification log

## 2026-09-11 iPhone-first candidate — local final

環境: Windows、Data Version `2026.09.03.3`、Service Worker v15、save key `wildWorldCompanionState.v1`、schema 3。PR / merge / Pages v15 / live verification前のローカル候補。

| Gate | Result |
|---|---|
| Unit / checkJs / ESLint / Build | PASS — 128/128 / PASS / PASS / PASS |
| Data / Provenance / Evidence / Static / Security / Images | PASS / PASS / PASS / PASS / PASS / PASS |
| Existing installed Chrome 152.0.7977.83 E2E | PASS — 22/22、16,708.4848ms |
| Existing Edge 152.0.4191.66 E2E | PASS — 22/22、16,644.6033ms |
| Existing managed WebKit 26.5 E2E | PASS — 22/22、32,808.9665ms。Safariではない |
| Focused iPhone Chrome 152 | PASS — 20/20、36,526.2435ms |
| Focused iPhone managed WebKit 26.5 | PASS — 20/20、76,493.9532ms |
| WebKit intermediate history | 19/20 connection-log monitor、18/20 scroll/install measurement race。origin停止期間限定ログ分類、viewport保持、max-scroll/install settleで修正。assertion緩和なし |
| Responsive / IME / lifecycle | PASS — 7 viewport、composition、safe-area、keyboard、resume、scroll restore |
| Offline / persistence | PASS — origin-stop、Backup、QuotaExceeded atomicity、2-page storage sync |
| Screen captures | PASS — Chrome/WebKit各27/27。native clear重複なし、通知/戻る26px間隔、keyboard nav退避 |
| Repository subpath gate | PASS — 5/5 |
| Local Lighthouse 13.4.1 | PASS — 91 / 100 / 100 / 100 |
| CI / Pages definition | PASS（static）— Chromium/WebKit focused各20件。CI screenshotsはengine別27枚artifact |
| Data / save compatibility | UNCHANGED — searchable 1,767、Canonical 0変更、Data Version / key / schema不変 |
| Firefox | `ENVIRONMENT_BLOCKED_BEFORE_APP_ASSERTIONS` — 通常・権限昇格runとも`spawn UNKNOWN`。0/22のアプリFAIL/PASSではない |
| Physical iPhone/Safari/Home Screen/real keyboard/IME/VoiceOver/Android | `NOT_RUN` / NOT CLAIMED |
| Physical v14→v15 migration | NOT_RUN — Backup→全Safari/PWA client終了→オンライン再起動が必要。durable state保持対象、旧route/query/scroll非保証 |
| PR / merge / Pages v15 deployment / public live | `NOT_RUN` — 最終配備後に追記 |

## 2026-09-04 GitHub Pages deployment pass（historical v14）

環境: Windows、Node 24.19.0、pnpm 11.19.0、Data Version `2026.09.03.3`、Service Worker v14、save schema 3。

| Gate | Result |
|---|---|
| Unit/contract | PASS — 118/118 |
| TypeScript checkJs / ESLint | PASS / PASS |
| Build | PASS — Images、Data、Provenance、Evidence、Static、Security |
| Expansion | PASS — 1,583 records、9,170 claims、9,162 field provenance instances |
| Search / Collection | PASS — core 184 + expansion 1,583 = 1,767、10 domains |
| Acquisition | PASS — evidence 1,271、explicit/categorical 405、price-only 866、UNKNOWN 0 |
| Events | PASS with disclosed limits — 12 records、reward 9、location 5、linked reward 7、new CONFLICT 3 |
| Images | PASS — metadata 1,767、real 0、fallback 1,767、remote 0 |
| Core evidence | PASS validator — claims 693、coverage 468/468、JP independent 14/468 |
| Conflict safety | PASS — core 9 fields / 6 registry + expansion event 3をUI非断定表示 |
| Migration/backup | PASS — 10/10、key `wildWorldCompanionState.v1`、schema v1/v2→v3 |
| Chrome 152.0.7977.75 | PASS — 22/22 |
| Edge 152.0.4191.53 | PASS — 22/22 |
| managed WebKit 26.5 | PASS — 22/22。Safariではない |
| Firefox managed | ENVIRONMENT_BLOCKED — `spawn UNKNOWN`、app assertion前 |
| 320px / axe / target / overflow | PASS — critical/serious 0、44px未満0、overflow 0 |
| 375/390/430px responsive search | PASS |
| localhost PWA | PASS — v14/cache、state保持、origin-stop offline search |
| Security/privacy/dependencies | PASS — third-party executable 0、telemetry/location/cookie 0、known vulnerabilities 0 |
| Lighthouse 13.4.1 | local 93 / 100 / 100 / 100; live Pages 100 / 100 / 100 / 100 |
| Pages-like subpath | PASS — Chromium 5/5、clean artifact 23 files |
| Public GitHub Pages HTTPS | PASS — live 200/HSTS、SW v14、precache 21/21、Chrome offline、major UI/storage |
| Managed WebKit+iPhone descriptor live | PASS — online reload/major UI/storage。physical Safariではない |
| Physical devices / real screen reader | NOT RUN / NOT CLAIMED |

Raw browser reportsは`artifacts/qa/e2e-final-perfect-v13-*.json`、従来の機械判定は`artifacts/data-audit/personal-final-report.json`、実公開結果は`artifacts/deployment/live-pages-verification.json`です。生成artifactはgitへ含めません。
