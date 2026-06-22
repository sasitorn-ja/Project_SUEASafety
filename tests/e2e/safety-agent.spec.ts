import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const ENTRY_PATHS = [
  "/",
  "/dashboard",
  "/category",
  "/create-post",
  "/safety-culture",
  "/safety-culture/post",
  "/safety-culture/leaderboard",
  "/safety-culture/rewards",
  "/notifications",
  "/profile",
];

const SAFE_BUTTON_SKIP = /delete|remove|logout|login|sign in|sso|เข้าสู่ระบบ|ออกจากระบบ|ลบ|ยืนยัน|submit|โพสต์|บันทึก|save|ส่ง|approve|reject/i;
const ALLOWED_STATUS = new Set([0, 101, 204, 206, 301, 302, 304, 307, 308, 401, 403]);
const ALLOWED_CONSOLE = /favicon|Failed to load resource: the server responded with a status of 404|ResizeObserver loop|Hydration failed because the server rendered HTML/i;
const ALLOWED_NETWORK_URL = /\/favicon\.(ico|png|svg)$/i;

type Finding = {
  type: "console" | "network" | "pageerror";
  url?: string;
  method?: string;
  status?: number;
  message: string;
};

async function createTinyPng() {
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    "base64",
  );
  const filePath = path.join(os.tmpdir(), `suea-safety-upload-${Date.now()}.png`);
  await fs.writeFile(filePath, bytes);
  return filePath;
}

function installAuditListeners(page: Page, findings: Finding[]) {
  page.on("console", (message) => {
    if (!["error", "warning"].includes(message.type())) return;
    const text = message.text();
    if (ALLOWED_CONSOLE.test(text)) return;
    findings.push({
      type: "console",
      message: `[${message.type()}] ${text}`,
      url: page.url(),
    });
  });

  page.on("pageerror", (error) => {
    findings.push({
      type: "pageerror",
      message: error.message,
      url: page.url(),
    });
  });

  page.on("response", (response) => {
    const status = response.status();
    if (status < 400 || ALLOWED_STATUS.has(status)) return;
    if (ALLOWED_NETWORK_URL.test(response.url())) return;
    const request = response.request();
    findings.push({
      type: "network",
      method: request.method(),
      status,
      url: response.url(),
      message: `${request.method()} ${response.url()} returned ${status}`,
    });
  });
}

function summarizeFindings(findings: Finding[]) {
  const seen = new Set<string>();
  const unique: Finding[] = [];
  for (const finding of findings) {
    const key = `${finding.type}:${finding.method || ""}:${finding.status || ""}:${finding.url || ""}:${finding.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(finding);
  }
  return unique.slice(0, 50);
}

async function auditClickableControls(page: Page) {
  const controls = page
    .locator("a[href], button:not([disabled]), [role='button']:not([aria-disabled='true'])")
    .filter({ hasNotText: SAFE_BUTTON_SKIP });
  const count = Math.min(await controls.count(), 30);

  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    if (!(await control.isVisible().catch(() => false))) continue;
    const href = await control.getAttribute("href").catch(() => null);
    const target = await control.getAttribute("target").catch(() => null);
    if (target === "_blank" || href?.startsWith("http") || href?.startsWith("mailto:") || href?.startsWith("tel:")) continue;
    if (!process.env.PLAYWRIGHT_STORAGE_STATE && /login|auth|sso/i.test(href || "")) continue;

    const before = page.url();
    await control.click({ timeout: 3_000 }).catch(() => undefined);
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
    if (page.url() !== before) {
      await page.goBack({ waitUntil: "domcontentloaded", timeout: 8_000 }).catch(() => undefined);
    }
  }
}

async function auditImageUploads(page: Page) {
  const fileInput = page.locator("input[type='file']").first();
  if (!(await fileInput.count())) return;

  const imagePath = await createTinyPng();
  await fileInput.setInputFiles(imagePath).catch(() => undefined);
  await page.waitForTimeout(800);
}

test.describe("SUEA Safety automated audit agent", () => {
  test("dashboard does not expose the retired hardcoded KPI snapshot", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).not.toContainText("19 มิ.ย. 2569");
    await expect(page.locator("body")).not.toContainText("67/100 คะแนน");
  });

  test("walks menus, buttons, network, console, and image upload controls", async ({ page }) => {
    const findings: Finding[] = [];
    installAuditListeners(page, findings);

    for (const entryPath of ENTRY_PATHS) {
      await page.goto(entryPath, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
      await expect(page.locator("body")).toBeAttached();
      await expect(page.locator("body")).not.toBeEmpty();
      await auditImageUploads(page);
      await auditClickableControls(page);
    }

    const summary = summarizeFindings(findings);
    expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
  });
});
