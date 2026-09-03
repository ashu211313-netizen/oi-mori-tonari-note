# Personal Final Report — 2026-09-03

## Classification

**PERSONAL_FINAL_COMPLETE**

個人用local/offline scopeの最終判定です。公開向けRelease Readyや全フィールド検証済みを意味しません。

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

- Unit: 113/113 PASS; TypeScript checkJs, ESLint, Data, Provenance, Evidence, Static, Security, Images: PASS.
- Chrome / Edge / managed WebKit: 22/22 PASS each. Managed WebKit is not physical Safari.
- Lighthouse: Performance 94, Accessibility 100, Best Practices 100, SEO 100.
- Migration/backup: 10/10 PASS; key `wildWorldCompanionState.v1`, schema 3.
- Service Worker: `wild-world-companion-v13`; offline origin-stop, cache update, saved state preservation included in E2E.

## Truthful limits

- Core claim coverage 468/468 is not verification. JP audited-independent verification remains 14/468; strict public blocker metric 454.
- Core CONFLICT 9 fields / 6 registry and expansion event CONFLICT 3 remain visible. Canonical core changes: 0.
- Residents remain 148 records plus 2 unresolved/excluded names. Real images remain 0; all 1,767 records use honest original fallback graphics.
- Firefox is environment-blocked before app assertions. Physical Safari/iOS/Android, real screen reader and public HTTPS were not run and are not claimed.
