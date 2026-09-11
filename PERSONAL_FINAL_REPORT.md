# Personal Final Report — 2026-09-11 deployment sync

## Classification

- **PERSONAL_FINAL_COMPLETE** — content/local-offline scope
- **IPHONE_FIRST_PERSONAL_FINAL_COMPLETE / EMULATED_VERIFIED / LIVE_PAGES_VERIFIED / PHYSICAL_NOT_RUN** — current deployment scope

個人用content/local-offline scopeと現在のGitHub Pages配備を分けた最終判定です。公開向けRelease Ready、全フィールド検証済み、または物理iPhone検証済みを意味しません。

## Content delta

| Metric | Before | After |
|---|---:|---:|
| Evidence-backed acquisition | 1,255 | 1,271 |
| Acquisition UNKNOWN | 16 | 0 |
| Explicit/categorical acquisition | 389 | 405 |
| Price-only, seller unspecified | 866 | 866 |
| Event reward text | 9/12 | 9/12 |
| Event known location | 0/12 | 5/12 |
| Events with linked reward items | 2/12 | 7/12 |
| Expansion event discrepancies | 0 | 3 |
| Searchable records | 1,767 | 1,767 |

## Final gates

- Unit: 130/130 PASS; TypeScript checkJs, ESLint, Build, Data, Provenance, Evidence, Static, Security, Images: PASS.
- Existing browser E2E: installed Chrome 152.0.7977.83 22/22 PASS (16,708.4848ms); Edge 152.0.4191.66 22/22 PASS (16,644.6033ms); managed WebKit 26.5 22/22 PASS (32,808.9665ms). Managed WebKit is not physical Safari.
- iPhone-focused E2E: installed Chrome 20/20 PASS (36,526.2435ms); managed WebKit 26.5 20/20 PASS (76,493.9532ms).
- Screenshots: Chrome 27/27 PASS; managed WebKit 27/27 PASS. GitHub Pages repository-subpath gate: 5/5 PASS.
- Lighthouse 13.4.1: Performance 91, Accessibility 100, Best Practices 100, SEO 100.
- Migration/backup: 10/10 PASS; key `wildWorldCompanionState.v1`, schema 3.
- Service Worker: `wild-world-companion-v15`; offline origin-stop and v15-page future-update contracts are included in E2E. The staged Chrome v14→v15 run is `PASS_WITH_HARNESS_RECOVERY`: the first harness timed out after old/new cache coexistence, then the same persistent profile proved v15 activation, v14 cache removal, byte-identical state, and unrelated sentinel retention. Physical Safari/Home Screen migration remains `NOT_RUN`.
- GitHub Pages: PR [#3](https://github.com/ashu211313-netizen/oi-mori-tonari-note/pull/3) merged as `aa91a5462694831941c17e4856fb12916a9b2d8f`; [main CI](https://github.com/ashu211313-netizen/oi-mori-tonari-note/actions/runs/34580717627) and [Pages deploy](https://github.com/ashu211313-netizen/oi-mori-tonari-note/actions/runs/34580717646) succeeded. Live functional verification is 13/13 PASS, HTTPS contract is 5/5 `PASS_HTTP_CONTRACT`, and live Lighthouse 13.4.1 is 97/100/100/100.

## Truthful limits

- Core claim coverage 468/468 is not verification. JP audited-independent verification remains 14/468; strict public blocker metric 454.
- Core CONFLICT 9 fields / 6 registry and expansion event CONFLICT 3 remain visible. Canonical core changes: 0.
- Residents remain 148 records plus 2 unresolved/excluded names. Real images remain 0; all 1,767 records use honest original fallback graphics.
- Firefox returned `spawn UNKNOWN` before app assertions in both normal and elevated runs, so its status is `ENVIRONMENT_BLOCKED_BEFORE_APP_ASSERTIONS`, not an application-level 0/22 FAIL or PASS. Physical iPhone/Safari, Home Screen PWA, real keyboard/Japanese IME, real safe-area/resume/offline/Backup, VoiceOver, and Android are `PHYSICAL_NOT_RUN / NOT CLAIMED`. Managed WebKit and device emulation are not physical Safari evidence.
