# Wild World Personal Ultimate — Final Execution Report

Date: 2026-09-03 (JST)  
Classification: **`PERSONAL_ULTIMATE_COMPLETE`**  
Scope: single-user Windows local/offline use

## Decision

The governing Personal Ultimate gate is satisfied. The result contains actual Japanese Wild World records and usable UI behavior rather than schemas or placeholders: 1,430 expansion records were added, all 1,614 core and expansion records are searchable, all new domains have detail/provenance views, five new domains have persistent Collection/favorite state, and 301 item records have evidence-backed acquisition methods.

This is not a public `Release Ready` declaration and does not mean all game data is verified. Public deployment, App Store distribution, monetization, external legal review, real Safari/iOS/Android, and real screen-reader completion are outside this personal-use gate and are not reported as PASS.

## Exact delivered records

| Domain | Before | After | New | Searchable |
|---|---:|---:|---:|---:|
| Fish | 56 | 56 | 0 | 56 |
| Bugs | 56 | 56 | 0 | 56 |
| Fossils | 52 | 52 | 0 | 52 |
| Art | 20 | 20 | 0 | 20 |
| Items / furniture / clothing | 0 | 1,130 | 1,130 | 1,130 |
| Residents | 0 | 148 | 148 | 148 |
| Gyroids | 0 | 127 | 127 | 127 |
| NPCs | 0 | 17 | 17 | 17 |
| Facilities | 0 | 8 | 8 | 8 |
| Events | 0 | 0 | 0 | 0 |
| Total | 184 | 1,614 | 1,430 | 1,614 |

Collection state is supported for nine domains: fish, bugs, fossils, art, items, gyroids, residents, NPCs, and facilities. New state consists of item acquired/cataloged/favorite, gyroid collected/favorite, and resident/NPC/facility favorite. The LocalStorage key remains `wildWorldCompanionState.v1`; schema v1/v2 migrate to schema v3.

## Acquisition

Items with explicit acquisition methods: **301/1,130**. Method instances are NPC 170, SHOP 49, OTHER 71, EXCHANGE 5, REWARD 2, EVENT 4. The remaining **829** keep acquisition `UNKNOWN`. A numeric buy price alone was never interpreted as proof of a shop or seller. Dangling references and invalid method codes are both 0.

## Evidence and data safety

The expansion registry contains 48 source URLs, 1,430 records, 6,718 Source Claims, and 6,718 field-provenance instances. Status totals are SINGLE_SOURCE 6,576 and CORROBORATED 142. All `oi-mori.com/nds/` pages count as the single `oi-mori-nds` lineage, so URL count is not treated as source independence.

The extracted source set is scoped by the [Japanese NDS Wild World index](https://www.oi-mori.com/nds/), with structured lists such as the [gyroid list](https://www.oi-mori.com/nds/item/haniwa.html) and Japanese resident pages. A modern [ACWW resident index](https://animalcrossing.soopoolleaf.com/ja/acna/g/acww/) was used only as a derived-lineage cross-check. Search snippets, other-series values, and remote images were not used as Canonical evidence.

Two resident spellings disagree between lineages: `カルビ/カルピ` and `モモコ/ももこ`. Neither spelling was guessed into Canonical data; both remain explicit `UNKNOWN`, leaving 148 confirmed residents. Event records remain 0.

Core data was not silently reclassified:

| Core metric | Before | After |
|---|---:|---:|
| Critical field claim coverage | 468/468 | 468/468 |
| Source Claims | 693 | 693 |
| JP audited-independent verification | 14/468 | 14/468 |
| Strict public blocker metric | 454 | 454 |
| SINGLE_SOURCE / CORROBORATED / VERIFIED | 278 / 167 / 14 | 278 / 167 / 14 |
| CONFLICT fields / registry | 9 / 6 | 9 / 6 |
| Canonical changes | 0 | 0 |

Data Version is `2026.09.03.1`; Service Worker cache is `wild-world-companion-v11`.

## Verification results

| Gate | Result |
|---|---|
| Unit/contract | PASS — 102/102 |
| TypeScript checkJs | PASS — 0 errors |
| ESLint | PASS — 0 errors |
| Build | PASS |
| Data / Provenance / Evidence Sufficiency | PASS validators |
| Static PWA / Security | PASS |
| Image validation | PASS — metadata 1,614; real 0; honest fallback 1,614; remote 0 |
| Migration / backup | PASS — 10/10 |
| Chrome 152.0.7977.75 | PASS — 17/17 |
| Edge 152.0.4191.53 | PASS — 17/17 |
| managed WebKit 26.5 | PASS — 17/17; not Safari |
| Firefox managed 1538 | ENVIRONMENT_BLOCKED — `spawn UNKNOWN` before app assertions |
| Offline/PWA update | PASS — v11, state/cache retention, origin-stop expansion search |
| Lighthouse 13.4.1 | 95 / 100 / 100 / 100 |

## Adversarial residual audit

- Core public-release evidence remains incomplete at 14/468 JP independently verified, with strict blocker metric 454 and unresolved CONFLICT 9 fields / 6 registry.
- Firefox did not execute app assertions on this host; it is not reported as PASS.
- Safari desktop, iOS physical, Android physical, and real screen-reader sessions were not run. Managed WebKit and axe are not relabeled as those targets.
- Public HTTPS and external legal review are out of the declared personal-use scope, not PASS.
- Real images remain 0 because no user-owned image corpus was supplied. All 1,614 entries use an accessible missing-image state, and the local import workflow remains operational.
- Acquisition remains `UNKNOWN` for 829 items; two resident spellings remain `UNKNOWN`; event data remains 0.

These limits prevent a public `Release Ready` or “all data verified” statement, but they do not fail the governing single-user local/offline Personal Ultimate gate.

## Package

- ZIP: `WILD_WORLD_PERSONAL_ULTIMATE_2026-09-03.zip`
- Bytes: 888,023
- SHA-256: `75c5485fbeb51ba41b73573654082556dfe50069d690cba417ccbcbfd56439d5`
- External manifest: `WILD_WORLD_PERSONAL_ULTIMATE_2026-09-03.zip.manifest.json`
- Internal manifest: `MANIFEST.json`, 181 files listed before the manifest itself

Machine-readable gate: `docs/qa/personal-ultimate-readiness.json`  
Expansion audit: `artifacts/data-audit/expansion-provenance-report.json`  
Acquisition audit: `artifacts/data-audit/acquisition-report.json`
