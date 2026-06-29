import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3100";
const port = new URL(baseURL).port || "3100";
const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: path.join(frontendRoot, "tests/e2e"),
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["json", { outputFile: path.join(frontendRoot, "test-results/safety-agent-report.json") }],
    ["html", { outputFolder: path.join(frontendRoot, "playwright-report"), open: "never" }],
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    storageState: process.env.PLAYWRIGHT_STORAGE_STATE || undefined,
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command: `PORT=${port} HOSTNAME=127.0.0.1 npm run start`,
        cwd: frontendRoot,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
