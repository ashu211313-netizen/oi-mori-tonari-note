# GitHub Pages deployment

## iPhone-first v15 candidate — deployment pending

Current source uses `wild-world-companion-v15` and keeps Data Version `2026.09.03.3`, 1,767 searchable records, `wildWorldCompanionState.v1`, schemaVersion 3, and all Canonical game-data unchanged. The candidate adds an exact 180px Apple touch icon, four-sided safe-area handling, IME/keyboard/resume recovery, atomic persistence, two-page storage synchronization, route/scroll restoration, and an explicit Service Worker update handoff for updates initiated from a v15-controlled page.

The 2026-09-11 local gates record Unit 128/128 and PASS for TypeScript checkJs, ESLint, Build, Data, Provenance, Evidence, Static, Security, and Images. Existing E2E passed on installed Chrome 152.0.7977.83 at 22/22 (16,708.4848ms), Edge 152.0.4191.66 at 22/22 (16,644.6033ms), and managed WebKit 26.5 at 22/22 (32,808.9665ms). Focused iPhone E2E passed on installed Chrome at 20/20 (36,526.2435ms) and managed WebKit 26.5 at 20/20 (76,493.9532ms). Pages subpath is 5/5, local Lighthouse 13.4.1 is 91/100/100/100, and screenshot capture is 27/27 on both engines. The retained visual set has no duplicate native/custom clear control, keeps 26px between the notice and back control, and moves navigation out of the keyboard viewport. Physical iPhone/Safari, Home Screen PWA, real keyboard/Japanese IME, VoiceOver, and Android are `NOT_RUN`.

Two managed WebKit intermediate runs were retained as engineering history: 19/20 when the monitor counted the expected connection error during the deliberate origin stop, and 18/20 during scroll/install measurement races. The final run passed without weakening assertions after scoping the known log only to the origin-down interval, preserving viewport position during recovery renders, and waiting for maximum scroll and Service Worker installation to settle.

Firefox returned `spawn UNKNOWN` before app assertions in both normal and elevated runs. It is therefore `ENVIRONMENT_BLOCKED_BEFORE_APP_ASSERTIONS`, not an application-level 0/22 FAIL or PASS. The candidate PR, merge, Pages deployment, and live v15 verification are all `NOT_RUN` at this document revision. The deployment facts below describe the existing 2026-09-04 v14 publication and are not reused as v15 results.

## Published deployment — historical v14 baseline

- Repository: [ashu211313-netizen/oi-mori-tonari-note](https://github.com/ashu211313-netizen/oi-mori-tonari-note)
- App: [https://ashu211313-netizen.github.io/oi-mori-tonari-note/](https://ashu211313-netizen.github.io/oi-mori-tonari-note/)
- Source: GitHub Actions workflow deployment from `main`
- Repository visibility: public
- HTTPS enforcement: enabled

The live endpoint and deployed v14 runtime were tested after the original pull request was merged. Exact evidence and the intentionally unclaimed device cases are recorded in [verification.md](verification.md). That record must remain intact when the v15 result is appended.

## Architecture

`pnpm run build:pages` creates a clean `dist/` artifact containing only the PWA shell, icons, Service Worker, runtime modules, generated runtime data, and registered local image assets. Source audits, tests, scripts, local QA artifacts, backups, credentials, and `node_modules` are not deployed.

The app deliberately uses relative URLs:

- `./manifest.webmanifest`
- `./src/app.js`
- `./src/styles.css`
- `./sw.js`
- manifest `start_url` and `scope`: `./`

This keeps local development at `/` and GitHub repository Pages at `/oi-mori-tonari-note/` compatible with the same source. The app does not use History API routing, so Pages deep-link rewriting is unnecessary.

## Automation

- `.github/workflows/ci.yml` runs frozen install, Unit, TypeScript checkJs, ESLint, all build validators, full Chromium E2E, separate Chromium and managed WebKit iPhone-first 20-case gates, and repository-path E2E for pull requests and `main` pushes. It captures 27 iPhone screens with each engine and uploads them as distinct `iphone-first-screenshots-chromium` and `iphone-first-screenshots-webkit` artifacts.
- `.github/workflows/pages.yml` repeats the pre-deploy gates, including full browser, repository-path, Chromium iPhone-first, and managed WebKit iPhone-first E2E, creates and validates `dist/`, uploads it with the official Pages artifact action, and deploys only from `main`.
- Pages deployment has only `contents: read`, `pages: write`, and `id-token: write`. The CI workflow has only `contents: read`.

The workflow versions follow the current official GitHub Pages custom-workflow guidance: `configure-pages@v5`, `upload-pages-artifact@v4`, and `deploy-pages@v4`.

## PWA and storage

The currently published Pages deployment uses `wild-world-companion-v14`. The pending v15 worker does not call `skipWaiting()` during install. Because the published v14 page has no v15 update-notice code, the first v14→v15 transition is not an in-session explicit handoff: v15 remains waiting until every v14 Safari tab and Home Screen PWA client is closed, then activates for the next launch. Once a v15-controlled page is running, later v15→v16-style updates can use the notice and explicit `SKIP_WAITING` path. The worker uses one canonical scope-relative `index.html` key for navigation so query URLs do not expand the cache. Its scope remains limited to the repository path, all precache URLs are scope-relative, and unrelated caches are not removed.

User progress remains browser-local under `wildWorldCompanionState.v1`, schemaVersion 3. PC and iPhone therefore have separate state. Use the existing Backup export on one device and Import on the other when progress needs to move between them.

For the first v14→v15 migration, export a Backup, close every Safari tab and Home Screen PWA instance for this origin, and reopen the app online. Durable LocalStorage state is intended to remain; the old v14 session's route, query, and scroll position are not guaranteed because v14 cannot create the v15 UI-session snapshot. Do not clear Safari website data as an update step. Physical iPhone Safari / Home Screen PWA execution of this procedure is `NOT_RUN`.

## iPhone installation

These steps currently install the published v14 build. After v15 deployment they will use the same permanent URL. They are usage instructions, not evidence that physical iPhone testing has passed.

1. Open the published HTTPS URL in Safari.
2. Tap Share.
3. Choose “Add to Home Screen”.
4. Confirm the name “おい森 となりノート”.

After installation, normal use does not require a PC, PowerShell, Node server, tunnel, or local network connection. The first online load is required so Safari can obtain the current app shell.

After the v15 deployment, live verification must separately record HTTPS/HSTS, all precache URLs, the exact cache name, 390/430 layout, the v14→v15 close/reopen transition, offline cold reload, resume without a loop, Backup, Collection persistence, and console/network failures. A future v15→v16 update must separately verify the explicit notice/handoff. PR, merge, workflow run, and live results will be added only after those checks finish.

## Local development

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Local development continues at `http://127.0.0.1:8765/` and uses the same relative PWA paths.
