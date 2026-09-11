import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "icon-180.png");
const executableCandidates = [
  process.env.WW_BROWSER_EXECUTABLE,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
].filter(Boolean);
const executablePath = executableCandidates.find((candidate) => existsSync(candidate));
const svg = readFileSync(path.join(root, "icon.svg"), "utf8");
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });

try {
  const page = await browser.newPage({ viewport: { width: 180, height: 180 }, deviceScaleFactor: 1 });
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  await page.setContent(`<style>html,body{margin:0;width:180px;height:180px;overflow:hidden}img{display:block;width:180px;height:180px}</style><img src="${dataUrl}" alt="">`);
  await page.locator("img").screenshot({ path: output, omitBackground: true });
  console.log(JSON.stringify({ output, width: 180, height: 180 }, null, 2));
} finally {
  await browser.close();
}
