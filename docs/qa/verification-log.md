# Verification log — 2026-09-03 Personal Final pass

環境: Windows、Node 24.19.0、pnpm 11.19.0、Data Version `2026.09.03.3`、Service Worker v13、save schema 3。

| Gate | Result |
|---|---|
| Unit/contract | PASS — 113/113 |
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
| localhost PWA | PASS — v13/cache、state保持、origin-stop offline search |
| Security/privacy/dependencies | PASS — third-party executable 0、telemetry/location/cookie 0、known vulnerabilities 0 |
| Lighthouse 13.4.1 | 94 / 100 / 100 / 100 |
| Physical devices / real screen reader / public HTTPS | NOT RUN / NOT CLAIMED |

Raw browser reportsは`artifacts/qa/e2e-final-perfect-v13-*.json`、機械判定は`artifacts/data-audit/personal-final-report.json`です。
