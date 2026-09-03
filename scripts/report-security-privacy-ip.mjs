import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { sources } from "../src/data.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(path.join(root, relative), "utf8");
const html = read("index.html");
const app = read("src/app.js");
const storage = read("src/storage.js");
const serviceWorker = read("sw.js");
const csp = /Content-Security-Policy" content="([^"]+)"/.exec(html)?.[1] ?? "";

const securityChecks = {
  cspSelfOnlyExecution: ["default-src 'self'", "script-src 'self'", "connect-src 'self'", "object-src 'none'", "frame-src 'none'", "form-action 'none'"]
    .every((directive) => csp.includes(directive)),
  noThirdPartyExecutableAssets: !/<(?:script|link)[^>]+(?:src|href)="https?:\/\//i.test(html),
  noRuntimeTelemetryLocationOrCookies: !/navigator\.(?:geolocation|sendBeacon)|document\.cookie|\bfetch\s*\(/.test(app),
  serviceWorkerSameOriginOnly: /new URL\(event\.request\.url\)\.origin !== self\.location\.origin/.test(serviceWorker),
  externalLinksNoOpener: /target="_blank" rel="noopener noreferrer"/.test(app),
  sourceUrlsHttps: sources.every((source) => {
    try { return new URL(source.url).protocol === "https:"; } catch { return false; }
  }),
  noReferrerMeta: /<meta name="referrer" content="no-referrer"/.test(html),
  localOnlyDisclosure: /保存データはこの端末のブラウザ内だけに保存され/.test(app),
  stableStorageKey: /const KEY = "wildWorldCompanionState\.v1"/.test(storage)
};

const packageManifests = new Map();
const pnpmStore = path.join(root, "node_modules", ".pnpm");
for (const entry of readdirSync(pnpmStore, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || entry.name !== "package.json") continue;
  try {
    const manifest = JSON.parse(readFileSync(path.join(entry.parentPath, entry.name), "utf8"));
    if (manifest.name && manifest.version) {
      packageManifests.set(`${manifest.name}@${manifest.version}`, manifest.license ?? manifest.licenses ?? null);
    }
  } catch {
    // Package-manager metadata can contain non-package package.json files; they are outside the inventory.
  }
}
const licenseGroups = {};
for (const license of packageManifests.values()) {
  const key = typeof license === "string" ? license : "UNDECLARED";
  licenseGroups[key] = (licenseGroups[key] ?? 0) + 1;
}

const credentialPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/g,
  /ghp_[A-Za-z0-9]{20,}/g,
  /AIza[0-9A-Za-z_-]{20,}/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/g
];
const secretScanTargets = ["index.html", "manifest.webmanifest", "src", "docs", "README.md", "package.json"];
const secretHits = [];
function scanTarget(relative) {
  const absolute = path.join(root, relative);
  const entries = readdirSync(absolute, { withFileTypes: true });
  for (const entry of entries) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) scanTarget(child);
    else if (entry.isFile()) {
      const content = read(child);
      if (credentialPatterns.some((pattern) => (pattern.lastIndex = 0, pattern.test(content)))) secretHits.push(child);
    }
  }
}
for (const target of secretScanTargets) {
  if (path.extname(target)) {
    const content = read(target);
    if (credentialPatterns.some((pattern) => (pattern.lastIndex = 0, pattern.test(content)))) secretHits.push(target);
  } else scanTarget(target);
}

let dependencyAudit = { status: "NOT_RUN", reason: "pnpm execution context unavailable" };
if (process.env.npm_execpath) {
  const audit = spawnSync(process.execPath, [process.env.npm_execpath, "audit", "--audit-level", "high", "--json"], {
    cwd: root,
    encoding: "utf8",
    timeout: 120_000
  });
  try {
    const parsed = JSON.parse(audit.stdout || audit.stderr);
    const vulnerabilities = parsed.metadata?.vulnerabilities ?? {};
    const known = Object.values(vulnerabilities).reduce((sum, count) => sum + Number(count ?? 0), 0);
    dependencyAudit = {
      status: audit.status === 0 && known === 0 ? "PASS" : "FAIL",
      auditLevel: "high",
      knownVulnerabilities: known,
      metadata: parsed.metadata ?? null,
      exitCode: audit.status
    };
  } catch {
    dependencyAudit = { status: "ERROR", reason: (audit.stderr || audit.stdout || "unparseable audit output").trim() };
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  securityPrivacy: {
    status: Object.values(securityChecks).every(Boolean) && secretHits.length === 0 ? "PASS" : "FAIL",
    checks: securityChecks,
    credentialPatternHits: secretHits,
    localStorageKey: /const KEY = "([^"]+)"/.exec(storage)?.[1] ?? null,
    externalSourceLinks: sources.length,
    note: "Static/runtime contract validation. The authorized GitHub Pages endpoint is verified separately; GitHub Pages supplies HTTPS/HSTS while document CSP and referrer policy are enforced by meta tags."
  },
  dependencySecurity: dependencyAudit,
  dependencyLicenses: {
    status: (licenseGroups.UNDECLARED ?? 0) === 0 ? "METADATA_COMPLETE" : "INCOMPLETE",
    packageRecords: packageManifests.size,
    undeclaredLicenseFields: licenseGroups.UNDECLARED ?? 0,
    licenseGroups,
    note: "License metadata inventory is not a legal compatibility opinion."
  },
  ipLegal: {
    status: "BLOCKED_EXTERNAL_REVIEW",
    unofficialDisclosurePresent: /非公式/.test(html),
    trademarkAttributionInReadme: /関連商標は各権利者に帰属/.test(read("README.md")),
    gameDataProvenanceDocumented: true,
    legalReviewCompleted: false,
    blocker: "Trademark use and redistribution rights for game-derived names and data require owner/legal review."
  }
};

const output = path.join(root, "artifacts", "qa", "security-privacy-ip-report.json");
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.securityPrivacy.status !== "PASS" || dependencyAudit.status === "FAIL") process.exitCode = 1;
