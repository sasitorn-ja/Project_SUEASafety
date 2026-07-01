const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const baseUrl = process.env.NETWORK_AUDIT_BASE_URL || "http://localhost:3002";
const waitMs = Number(process.env.NETWORK_AUDIT_WAIT_MS || 800);
const batchSize = Number(process.env.NETWORK_AUDIT_BATCH_SIZE || 6);
const outputDir = path.resolve(__dirname, "../../outputs");

const allRoutes = [
  "/",
  "/activity",
  "/api-docs",
  "/assessment-summary",
  "/category",
  "/checkin",
  "/create-post",
  "/dashboard",
  "/dashboard-safety-effort",
  "/linewalk",
  "/login",
  "/notifications",
  "/profile",
  "/profile/activity-history",
  "/safety-admin",
  "/safety-admin/export-report",
  "/safety-admin/manage-data",
  "/safety-admin/report-history",
  "/safety-contact",
  "/safety-culture",
  "/safety-culture/admin-awareness",
  "/safety-culture/admin-event",
  "/safety-culture/admin-leaderboard",
  "/safety-culture/admin-points",
  "/safety-culture/admin-reward",
  "/safety-culture/admin-users",
  "/safety-culture/leaderboard",
  "/safety-culture/post",
  "/safety-culture/posts/37",
  "/safety-culture/rewards",
];
const routeFilter = String(process.env.NETWORK_AUDIT_ONLY || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const routes = routeFilter.length > 0 ? allRoutes.filter((route) => routeFilter.includes(route)) : allRoutes;

const sessionPayload = {
  authenticated: true,
  user: {
    id: "1",
    sub: "network-audit",
    name: "Network Audit",
    email: "network.audit@localhost",
    roles: ["ADMIN"],
    permissions: ["*"],
    isAdmin: true,
  },
};

function score(total, duplicateCount) {
  if (duplicateCount > 0) return Math.max(30, 85 - duplicateCount * 10);
  if (total <= 5) return 100;
  if (total <= 8) return 95;
  if (total <= 12) return 90;
  if (total <= 16) return 80;
  return 65;
}

async function auditRoute(browser, route, routeWaitMs = waitMs) {
  const context = await browser.newContext({ viewport: { width: 430, height: 932 } });
  const page = await context.newPage();
  await page.route("**/api/auth/session", (requestRoute) => requestRoute.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(sessionPayload),
  }));

  const requests = [];
  page.on("request", (request) => {
    if (!request.url().includes("/api/")) return;
    const url = new URL(request.url());
    requests.push({ method: request.method(), path: `${url.pathname}${url.search}` });
  });

  let finalUrl = "";
  let error = "";
  try {
    await page.goto(new URL(route, baseUrl).toString(), { waitUntil: "domcontentloaded", timeout: 10_000 });
    await page.waitForTimeout(routeWaitMs);
    finalUrl = page.url();
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }

  const counts = new Map();
  for (const request of requests) {
    const key = `${request.method} ${request.path}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const duplicates = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([request, count]) => ({ request, count }));
  const result = {
    route,
    finalUrl,
    totalRequests: requests.length,
    uniqueRequests: counts.size,
    duplicateCount: duplicates.reduce((sum, item) => sum + item.count - 1, 0),
    score: score(requests.length, duplicates.length),
    duplicates,
    requests: [...counts.entries()].map(([request, count]) => ({ request, count })),
    error,
  };
  await context.close();
  return result;
}

function markdown(report) {
  const rows = report.pages.map((page) => (
    `| \`${page.route}\` | ${page.totalRequests} | ${page.uniqueRequests} | ${page.duplicateCount} | ${page.score}% | ${page.error ? "ERROR" : "OK"} |`
  )).join("\n");
  const duplicateRows = report.pages.flatMap((page) => page.duplicates.map((item) => (
    `| \`${page.route}\` | \`${item.request}\` | ${item.count} |`
  ))).join("\n") || "| - | - | 0 |";
  return `# Page Network Audit

Generated: ${report.generatedAt}

- Base URL: \`${report.baseUrl}\`
- Pages: **${report.pages.length}**
- Average initial API requests: **${report.averageRequests}**
- Pages with duplicate API requests: **${report.pagesWithDuplicates}**
- Network score: **${report.networkScore}%**

## Page Results

| Page | API requests | Unique | Duplicates | Score | Status |
|---|---:|---:|---:|---:|---|
${rows}

## Duplicate Requests

| Page | Request | Count |
|---|---|---:|
${duplicateRows}
`;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const pages = [];
    for (let index = 0; index < routes.length; index += batchSize) {
      const batch = routes.slice(index, index + batchSize);
      pages.push(...await Promise.all(batch.map((route) => auditRoute(browser, route))));
    }
    for (let index = 0; index < pages.length; index += 1) {
      if (pages[index].totalRequests > 0 && !pages[index].error) continue;
      pages[index] = await auditRoute(browser, pages[index].route, Math.max(waitMs, 1_500));
    }
    let reportPages = pages;
    if (routeFilter.length > 0 && process.env.NETWORK_AUDIT_MERGE === "1") {
      const existingPath = path.join(outputDir, "page-network-audit.json");
      if (fs.existsSync(existingPath)) {
        const existing = JSON.parse(fs.readFileSync(existingPath, "utf8"));
        const updates = new Map(pages.map((page) => [page.route, page]));
        reportPages = existing.pages.map((page) => updates.get(page.route) || page);
      }
    }
    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      pages: reportPages,
      averageRequests: Number((reportPages.reduce((sum, page) => sum + page.totalRequests, 0) / reportPages.length).toFixed(1)),
      pagesWithDuplicates: reportPages.filter((page) => page.duplicateCount > 0).length,
      networkScore: Math.round(reportPages.reduce((sum, page) => sum + page.score, 0) / reportPages.length),
    };
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, "page-network-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, "PAGE_NETWORK_AUDIT.md"), markdown(report));
    console.log(JSON.stringify({
      pages: report.pages.length,
      averageRequests: report.averageRequests,
      pagesWithDuplicates: report.pagesWithDuplicates,
      networkScore: report.networkScore,
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
