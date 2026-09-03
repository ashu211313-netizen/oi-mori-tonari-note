# GitHub Pages verification

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

After deployment, run `WW_PUBLIC_URL=https://… pnpm run verify:live-pages`. A live PASS requires:

- real HTTPS 200 response;
- title and security meta policy;
- manifest, icons, and Service Worker v14;
- every precached runtime asset returning 200 under the repository path;
- `.env`, `node_modules`, `artifacts`, `tests`, and `scripts` returning 404;
- Chromium and managed WebKit+iPhone-descriptor smoke tests;
- search, Collection, Calendar, Backup, offline reload, and saved-state preservation.

Managed WebKit with an iPhone descriptor is not reported as a physical-device PASS. The final deployment URL, workflow run, commit, and exact live results are recorded here only after the real endpoint passes.
