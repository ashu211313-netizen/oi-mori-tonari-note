# GitHub Pages deployment

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

- `.github/workflows/ci.yml` runs frozen install, Unit, TypeScript checkJs, ESLint, all build validators, Pages artifact validation, and repository-path Chromium E2E for pull requests and `main` pushes.
- `.github/workflows/pages.yml` repeats the pre-deploy gates, creates and validates `dist/`, uploads it with the official Pages artifact action, and deploys only from `main`.
- Pages deployment has only `contents: read`, `pages: write`, and `id-token: write`. The CI workflow has only `contents: read`.

The workflow versions follow the current official GitHub Pages custom-workflow guidance: `configure-pages@v5`, `upload-pages-artifact@v4`, and `deploy-pages@v4`.

## PWA and storage

The Pages deployment uses `wild-world-companion-v14`. Its scope is limited to the repository path, all precache URLs are relative, navigation fallback remains inside that scope, and unrelated caches are not removed.

User progress remains browser-local under `wildWorldCompanionState.v1`, schemaVersion 3. PC and iPhone therefore have separate state. Use the existing Backup export on one device and Import on the other when progress needs to move between them.

## iPhone installation

1. Open the published HTTPS URL in Safari.
2. Tap Share.
3. Choose “Add to Home Screen”.
4. Confirm the name “おい森 となりノート”.

After installation, normal use does not require a PC, PowerShell, Node server, tunnel, or local network connection. The first online load is required so Safari can obtain the current app shell.

## Local development

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Local development continues at `http://127.0.0.1:8765/` and uses the same relative PWA paths.
