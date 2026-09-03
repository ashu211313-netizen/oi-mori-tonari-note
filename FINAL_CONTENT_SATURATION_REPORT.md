# Wild World Content Saturation Finisher — Final execution report

Date: 2026-09-03  
Classification: **PERSONAL_ULTIMATE_MAX_CONTENT_COMPLETE**  
Scope: single-user local/offline use. This is not a public Release Ready or a claim that every field is independently verified.

## Outcome

The repository now contains 1,583 real expansion records and 1,767 searchable records including the unchanged 184 core records. The six non-core item sections exposed by the Japanese NDS item index were added: fruit/turnips/acorns 13, flowers 31, shells 9, stationery 63, Nook-original goods 13, and event/recovered items 12. Twelve source-table events are integrated into universal search, detail views, month calendars, and resident-birthday views.

| Required metric | Before | After |
|---|---:|---:|
| Acquisition records with any evidence-backed edge | 301 | 1,255 |
| Acquisition with no edge (`UNKNOWN`) | 829 | 16 |
| Events | 0 | 12 |
| Items | 1,130 | 1,271 |
| Searchable total | 1,614 | 1,767 |
| Expansion records | 1,430 | 1,583 |
| Expansion source claims / provenance fields | 6,718 / 6,718 | 9,120 / 9,120 |

The acquisition total is deliberately split: 389 records have explicit or categorical acquisition text; 866 have only a numeric buy-price cell and are stored as `PURCHASE / RETAIL_OR_CATALOG_UNSPECIFIED`. Those 866 records do not assert a seller, shop, or catalog availability. The remaining 16 records are only grouped as campaign items and retain no acquisition edge because their campaign and distribution conditions are not stated.

## Field coverage

Counts are populated fields / records. `not captured` means the old runtime did not retain that raw field, so no retrospective value was invented.

| Domain / field | Before | After |
|---|---:|---:|
| Item category / group | 1,130/1,130 each | 1,271/1,271 each |
| Item numeric buy / sell | 991/1,130; 1,125/1,130 | 1,059/1,271; 1,249/1,271 |
| Item raw sell text | not captured | 1,271/1,271 |
| Item any acquisition edge | 301/1,130 | 1,255/1,271 |
| Item explicit/categorical acquisition text | 301/1,130 | 389/1,271 |
| Item notes | 301/1,130 | 387/1,271 |
| Item color / mood / style | 584 / 584 / 256 | 584 / 584 / 256 |
| Item catalog-orderable | 0/1,130 | 0/1,271 — no inference from buy price |
| Resident English name / species / gender | 0 / 6 / 0 | 148 / 148 / 148 |
| Resident birthday / personality | 142 / 142 | 148 / 148 |
| Resident preferred / disliked style | 142 / 142 | 142 / 142 |
| Resident English-edition catchphrase | 0/148 | 148/148 |
| Gyroid group / sell / color / mood | 127 each | 127 each; group now preserves source table heading |
| NPC schedule / role / services / details | 17 each | 17 each |
| NPC location / structured conditions / rewards | 0 / 0 / 0 | 17 / 10 / 8 |
| Facility hours / services / details | 5 / 8 / 8 | 7 / 8 / 8 |
| Facility tables / upgrades / requirements / rewards | 0 each | 4 / 2 / 3 / 2 |
| Event date rule / time rule / description / conditions | 0 | 12 each |
| Event reward text / linked item IDs / location | 0 | 9 / 2 events / 0 |

Event location remains 0/12 because the source table does not state it. The two unresolved resident spelling pairs (`カルビ/カルピ`, `モモコ/ももこ`) remain excluded; the resident count is 148, not fabricated to 150.

## Source integrity and core preservation

- Expansion registry: 56 sources, 3 declared lineages. All 54 `oi-mori.com/nds/` URLs remain one `oi-mori-nds` lineage.
- Resident English identity data is from an explicit Wild World roster and is marked `GLOBAL_WW`; it is not counted as JP independent verification.
- Search snippets, remote images, and data from another Animal Crossing title were not used as canonical evidence.
- Core Canonical changes: 0. Core claim coverage remains 468/468, JP audited-independent verification 14/468, and strict public blocker metric 454.
- Core conflicts remain 9 field instances / 6 registry records and remain visibly non-definitive.
- Save key remains `wildWorldCompanionState.v1`; schema remains v3. Data Version is `2026.09.03.2`; Service Worker is v12.
- Real images: 0. Accessible local fallback: 1,767. External image downloads: 0.

## Verification

| Gate | Result |
|---|---|
| Unit/contract | PASS — 107/107 |
| TypeScript checkJs | PASS |
| ESLint | PASS |
| Build | PASS — image, data, provenance, evidence sufficiency, static, security |
| Migration/backup | PASS — 10/10, schema v1/v2→v3 and round trip |
| Chrome 152.0.7977.75 | PASS — 19/19 |
| Edge 152.0.4191.53 | PASS — 19/19 |
| managed WebKit 26.5 | PASS — 19/19; not physical Safari |
| Firefox managed 1538 | ENVIRONMENT_BLOCKED — `spawn UNKNOWN` before app assertions, including escalated headed retry |
| Accessibility automation | PASS — axe critical/serious 0, 320 px/44 px/overflow flow |
| Localhost PWA/offline/update | PASS — SW v12, saved state and unrelated cache retained |
| Lighthouse 13.4.1 | 95 / 100 / 100 / 100 |

Raw browser evidence is in `artifacts/qa/e2e-saturation-final-v12-*.json`. Machine-readable content metrics, field coverage, gate evidence, and red-team findings are in `artifacts/data-audit/content-saturation-report.json`.

## Adversarial classification

The governing Personal Max Content gate passes because core tests/save/offline behavior are preserved, all six target domains remain meaningful, Events are non-empty real rows, Acquisition coverage materially increases with uncertainty labels intact, every implemented domain is searchable, primary-engine E2E is green, and no high-severity regression was found.

This classification does not erase the remaining gaps: 16 acquisition records have no edge, 866 purchase edges have no seller, event locations are absent, item catalogability is unknown, two resident names remain unresolved, core conflicts remain, Firefox could not start, and Safari/iOS/Android physical devices plus real screen readers were not executed. These are reported rather than promoted to PASS.
