# GitHub Pages verification

## Deployed endpoint — 2026-09-11 (v15)

Classification: **`IPHONE_FIRST_PERSONAL_FINAL_COMPLETE`** / **`EMULATED_VERIFIED`** / **`LIVE_PAGES_VERIFIED`** / **`PHYSICAL_NOT_RUN`**

- Deployment PR: [#3](https://github.com/ashu211313-netizen/oi-mori-tonari-note/pull/3) — squash merged `2026-09-11T08:45:02Z`
- Application deployment commit: `aa91a5462694831941c17e4856fb12916a9b2d8f`
- Main CI: [run 34580717627](https://github.com/ashu211313-netizen/oi-mori-tonari-note/actions/runs/34580717627) — success, `2026-09-11T08:45:05Z`–`2026-09-11T08:49:54Z`
- Pages: [run 34580717646](https://github.com/ashu211313-netizen/oi-mori-tonari-note/actions/runs/34580717646) — success, completed `2026-09-11T08:56:31Z`

The v15 live verifier passed 13/13 at `2026-09-11T09:14:43Z`: Chrome 152 and managed WebKit 26.5 smoke coverage, 390/430 layouts, all 22 precache URLs, critical 404=0, and Chrome offline. The public HTTPS validator passed 5/5 `PASS_HTTP_CONTRACT` at `2026-09-11T09:17:33Z`. Lighthouse 13.4.1 against this v15 endpoint scored 97/100/100/100.

The staged v14→v15 check observed a stable old client and both caches coexisting. Its original harness reopened too early and timed out. Recovery in the same persistent profile then confirmed v15 active, v14 cache removal, byte-identical schema 3 saved state, and sentinel preservation: `PASS_WITH_HARNESS_RECOVERY`. This is emulated recovery evidence, not a physical iPhone/Safari or Home Screen PWA migration PASS; those targets, real keyboard/IME, VoiceOver, and Android remain `NOT_RUN`.

GitHub Pages response headers are host-managed. The public HTTPS contract therefore records GitHub HSTS and the document CSP meta; it does not claim repository-controlled custom response headers.

## Historical deployed endpoint — 2026-09-04 (v14)

Classification: **`GITHUB_PAGES_DEPLOYED_AND_VERIFIED`**

- Repository: [ashu211313-netizen/oi-mori-tonari-note](https://github.com/ashu211313-netizen/oi-mori-tonari-note)
- Public URL: [https://ashu211313-netizen.github.io/oi-mori-tonari-note/](https://ashu211313-netizen.github.io/oi-mori-tonari-note/)
- Deployment PR: [#1](https://github.com/ashu211313-netizen/oi-mori-tonari-note/pull/1)
- Application deployment commit: `2a510f8ec063a4b11311be38b3e645c1c277ae58`
- Main CI: [run 33806379292](https://github.com/ashu211313-netizen/oi-mori-tonari-note/actions/runs/33806379292) — PASS
- Pages: [run 33806379300](https://github.com/ashu211313-netizen/oi-mori-tonari-note/actions/runs/33806379300) — PASS

The live verifier passed again at `2026-09-03T21:25:13.599Z`. The real HTTPS endpoint returned 200 with GitHub's HSTS policy; the manifest, 192/512/SVG icons, Service Worker v14, and all 21 precache URLs returned 200 inside `/oi-mori-tonari-note/`. Probe requests for `.env`, `node_modules`, `artifacts`, `tests`, and `scripts` returned 404. Lighthouse 13.4.1 against the same public URL scored 100/100/100/100 for Performance/Accessibility/Best Practices/SEO.

Installed Chrome 152 passed live HTTPS, Service Worker, offline reload, search, Collection, Calendar, Backup, and schema 3 saved-state preservation. Managed WebKit 26.5 with an iPhone 14 descriptor passed live HTTPS, Service Worker, online reload, the same major UI flows, and saved-state preservation. That WebKit bundle required a toolchain-only certificate-trust bypass because it cannot read the Windows host trust store; Node and installed Chrome validated the real certificate without bypass. Live WebKit offline reload encountered a tool-internal error and is not claimed; repository-path WebKit offline behavior is separately covered by the local suite.

## Current local Pages-like gate — v15

`pnpm run test:pages` builds the exact deployment artifact, validates its contents, and mounts it at `/oi-mori-tonari-note/` rather than `/`.

Verified locally:

- artifact contains 25 runtime files and no forbidden files;
- no root-absolute HTML asset URLs;
- manifest and all icons resolve under the repository path;
- Service Worker scope is the repository path;
- `wild-world-companion-v15` installs and supports offline reload;
- `wildWorldCompanionState.v1` schemaVersion 3 survives the offline reload;
- search, Collection, Calendar, and Backup UI remain usable;
- the host root returns 404, proving the app does not depend on `/`.

## Live endpoint gate

For reproducible post-deployment verification, run `$env:WW_PUBLIC_URL='https://ashu211313-netizen.github.io/oi-mori-tonari-note/'; pnpm run verify:live-pages`. A live PASS requires:

- real HTTPS 200 response;
- title and security meta policy;
- manifest, icons, and Service Worker v15;
- every precached runtime asset returning 200 under the repository path;
- `.env`, `node_modules`, `artifacts`, `tests`, and `scripts` returning 404;
- Chromium and managed WebKit+iPhone-descriptor smoke tests;
- search, Collection, Calendar, Backup, offline reload, and saved-state preservation.

Managed WebKit with an iPhone descriptor is not reported as a physical-device PASS. Physical iPhone/Safari, Android, Firefox, and real screen-reader testing remain NOT_RUN or environment-blocked and are not represented by the successful live automated gate.
