# GitHub Pages verification

## Deployed endpoint — 2026-09-04

Classification: **`GITHUB_PAGES_DEPLOYED_AND_VERIFIED`**

- Repository: [ashu211313-netizen/oi-mori-tonari-note](https://github.com/ashu211313-netizen/oi-mori-tonari-note)
- Public URL: [https://ashu211313-netizen.github.io/oi-mori-tonari-note/](https://ashu211313-netizen.github.io/oi-mori-tonari-note/)
- Deployment PR: [#1](https://github.com/ashu211313-netizen/oi-mori-tonari-note/pull/1)
- Application deployment commit: `2a510f8ec063a4b11311be38b3e645c1c277ae58`
- Main CI: [run 33806379292](https://github.com/ashu211313-netizen/oi-mori-tonari-note/actions/runs/33806379292) — PASS
- Pages: [run 33806379300](https://github.com/ashu211313-netizen/oi-mori-tonari-note/actions/runs/33806379300) — PASS

The live verifier passed again at `2026-09-03T21:25:13.599Z`. The real HTTPS endpoint returned 200 with GitHub's HSTS policy; the manifest, 192/512/SVG icons, Service Worker v14, and all 21 precache URLs returned 200 inside `/oi-mori-tonari-note/`. Probe requests for `.env`, `node_modules`, `artifacts`, `tests`, and `scripts` returned 404. Lighthouse 13.4.1 against the same public URL scored 100/100/100/100 for Performance/Accessibility/Best Practices/SEO.

Installed Chrome 152 passed live HTTPS, Service Worker, offline reload, search, Collection, Calendar, Backup, and schema 3 saved-state preservation. Managed WebKit 26.5 with an iPhone 14 descriptor passed live HTTPS, Service Worker, online reload, the same major UI flows, and saved-state preservation. That WebKit bundle required a toolchain-only certificate-trust bypass because it cannot read the Windows host trust store; Node and installed Chrome validated the real certificate without bypass. Live WebKit offline reload encountered a tool-internal error and is not claimed; repository-path WebKit offline behavior is separately covered by the local suite.

## Local Pages-like gate

`pnpm run test:pages` builds the exact deployment artifact, validates its contents, and mounts it at `/oi-mori-tonari-note/` rather than `/`.

Verified locally:

- artifact contains 23 runtime files and no forbidden files;
- no root-absolute HTML asset URLs;
- manifest and all icons resolve under the repository path;
- Service Worker scope is the repository path;
- `wild-world-companion-v14` installs and supports offline reload;
- `wildWorldCompanionState.v1` schemaVersion 3 survives the offline reload;
- search, Collection, Calendar, and Backup UI remain usable;
- the host root returns 404, proving the app does not depend on `/`.

## Live endpoint gate

For reproducible post-deployment verification, run `$env:WW_PUBLIC_URL='https://ashu211313-netizen.github.io/oi-mori-tonari-note/'; pnpm run verify:live-pages`. A live PASS requires:

- real HTTPS 200 response;
- title and security meta policy;
- manifest, icons, and Service Worker v14;
- every precached runtime asset returning 200 under the repository path;
- `.env`, `node_modules`, `artifacts`, `tests`, and `scripts` returning 404;
- Chromium and managed WebKit+iPhone-descriptor smoke tests;
- search, Collection, Calendar, Backup, offline reload, and saved-state preservation.

Managed WebKit with an iPhone descriptor is not reported as a physical-device PASS. Physical iPhone/Safari, Android, Firefox, and real screen-reader testing remain NOT_RUN or environment-blocked and are not represented by the successful live automated gate.
