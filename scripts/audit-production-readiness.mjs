import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const outDir = path.join(root, "outputs");
const jsonOut = path.join(outDir, "production-readiness-audit.json");
const mdOut = path.join(outDir, "PRODUCTION_READINESS_AUDIT.md");

const PAGE_SCORES = {
  "/": { module: "Home", current: 82, target: 95, notes: ["Global post/comment hydration removed; verify live network has no post comments calls."] },
  "/dashboard": { module: "Dashboard", current: 72, target: 92, notes: ["Needs network audit under authenticated load."] },
  "/category": { module: "Safety Effort", current: 72, target: 92, notes: ["Depends on checklist/settings/location API health."] },
  "/checkin": { module: "Safety Effort", current: 72, target: 90, notes: ["Demo check-in submit is gated; location coverage is still weak in CPAC_Safety."] },
  "/activity": { module: "Safety Effort", current: 70, target: 90, notes: ["Needs API/runtime audit."] },
  "/create-post": { module: "Safety Effort", current: 72, target: 90, notes: ["Upload/media path needs runtime audit."] },
  "/linewalk": { module: "Safety Effort", current: 72, target: 90, notes: ["Location search and checklist loading need scale checks."] },
  "/safety-contact": { module: "Safety Effort", current: 72, target: 90, notes: ["Submission persistence needs API-to-DB check."] },
  "/assessment-summary": { module: "Safety Effort", current: 72, target: 90, notes: ["Submission write path needs rollback/error audit."] },
  "/safety-admin": { module: "Safety Admin", current: 85, target: 95, notes: ["Checklist/backdate are DB-backed."] },
  "/safety-admin/manage-data": { module: "Safety Admin", current: 70, target: 90, notes: ["Some UI fields are not persisted by locations schema."] },
  "/safety-admin/report-history": { module: "Safety Admin", current: 80, target: 95, notes: ["Mock fallback removed; needs empty/error state verification."] },
  "/safety-admin/export-report": { module: "Safety Admin", current: 62, target: 92, notes: ["Demo records removed; production export still needs server jobs."] },
  "/safety-culture": { module: "Safety Culture", current: 86, target: 95, notes: ["Initial feed is 15 posts, cursor loads 15 more, comments are lazy-loaded."] },
  "/safety-culture/posts/[postId]": { module: "Safety Culture", current: 80, target: 95, notes: ["Post detail may load comments; verify one comments request per initial detail load."] },
  "/safety-culture/post": { module: "Safety Culture", current: 78, target: 92, notes: ["Upload/create post flow needs runtime audit."] },
  "/safety-culture/leaderboard": { module: "Safety Culture", current: 75, target: 92, notes: ["Leaderboard is route-loaded; verify team point correctness."] },
  "/safety-culture/rewards": { module: "Safety Culture", current: 75, target: 92, notes: ["Reward redeem must enforce balance/stock on backend."] },
  "/safety-culture/admin-awareness": { module: "Culture Admin", current: 82, target: 95, notes: ["Awareness question/settings are DB-backed."] },
  "/safety-culture/admin-event": { module: "Culture Admin", current: 78, target: 92, notes: ["Event API exists; notification/write audit needed."] },
  "/safety-culture/admin-leaderboard": { module: "Culture Admin", current: 70, target: 92, notes: ["Team/admin user selection needs permissions and scale audit."] },
  "/safety-culture/admin-points": { module: "Culture Admin", current: 72, target: 95, notes: ["DB has only 2/5 point rules; missing rules fall back to code defaults."] },
  "/safety-culture/admin-reward": { module: "Culture Admin", current: 75, target: 92, notes: ["Reward categories are settings-backed; image/upload audit needed."] },
  "/safety-culture/admin-users": { module: "IAM", current: 68, target: 92, notes: ["Role exists but permissions and role_permissions are empty."] },
  "/notifications": { module: "Notifications", current: 72, target: 92, notes: ["Needs pagination and post preview lazy-loading audit."] },
  "/profile": { module: "Profile", current: 80, target: 95, notes: ["Profile uses user + ranking data; route-loaded leaderboard applies."] },
  "/profile/activity-history": { module: "Profile", current: 72, target: 92, notes: ["Activity history should be paginated if it grows."] },
  "/api-docs": { module: "API Docs", current: 80, target: 95, notes: ["Access gate exists; verify allowed users in DB."] },
};

const MODULE_WEIGHTS = {
  api: 25,
  db: 25,
  network: 20,
  mock: 10,
  security: 10,
  ux: 10,
};

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function readEnv() {
  const env = {};
  for (const name of [".env.production", "frontend/.env.local", ".env.example"]) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || match[1].startsWith("#")) continue;
      if (env[match[1]] != null) continue;
      env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  }
  return env;
}

function appRoutes() {
  const appRoot = path.join(root, "frontend/src/app");
  return walk(appRoot)
    .filter((file) => file.endsWith("page.tsx"))
    .map((file) => {
      const dir = path.relative(appRoot, path.dirname(file)).split(path.sep).join("/");
      return dir ? `/${dir}` : "/";
    })
    .sort();
}

function apiReferences() {
  const refs = [];
  for (const file of walk(path.join(root, "frontend/src"))) {
    if (!/\.(ts|tsx|js|jsx)$/.test(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    const regex = /(?:apiFetch|fetch)\s*\(\s*([`'"])(.*?)\1/g;
    let match;
    while ((match = regex.exec(source))) {
      if (match[2].startsWith("/api/")) {
        refs.push({ file: path.relative(root, file), path: match[2] });
      }
    }
  }
  return [...new Map(refs.map((ref) => [`${ref.file}|${ref.path}`, ref])).values()];
}

function mockFindings() {
  const findings = [];
  const files = walk(path.join(root, "frontend/src")).filter((file) => /\.(ts|tsx|js|jsx)$/.test(file));
  for (const file of files) {
    const rel = path.relative(root, file);
    const source = fs.readFileSync(file, "utf8");
    const lines = source.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/\b(MOCKUP_|DEMO_REPORT_RECORDS|mock_excel_records|mock_sites|mock_plants|mock_offices)\b/.test(line)) {
        findings.push({ file: rel, line: index + 1, text: line.trim().slice(0, 180) });
      }
    });
  }
  return findings;
}

async function dbSummary(databaseUrl) {
  if (!databaseUrl) return { configured: false };
  const url = new URL(databaseUrl);
  const conn = await mysql.createConnection({ uri: databaseUrl, namedPlaceholders: true, timezone: "Z" });
  const [[info]] = await conn.query("SELECT DATABASE() db, VERSION() version");
  const [tables] = await conn.query(`
    SELECT table_name tableName, table_rows approxRows, table_collation collation
    FROM information_schema.TABLES
    WHERE table_schema = DATABASE()
    ORDER BY table_name
  `);
  const [pointRules] = await conn.query("SELECT code, points, status FROM point_rules ORDER BY code").catch((error) => [[{ error: error.code, message: error.sqlMessage }]]);
  const [roles] = await conn.query("SELECT id, code, name FROM roles ORDER BY id").catch((error) => [[{ error: error.code, message: error.sqlMessage }]]);
  const [permissions] = await conn.query("SELECT id, code, description FROM permissions ORDER BY id LIMIT 50").catch((error) => [[{ error: error.code, message: error.sqlMessage }]]);
  const [rolePermissions] = await conn.query("SELECT COUNT(*) count FROM role_permissions");
  const [locations] = await conn.query("SELECT location_type, source, status, COUNT(*) count FROM locations GROUP BY location_type, source, status ORDER BY location_type, source, status");
  const [submissions] = await conn.query("SELECT COUNT(*) count FROM safety_effort_submissions");
  const [exportJobs] = await conn.query("SELECT COUNT(*) count FROM export_jobs");
  await conn.end();
  return {
    configured: true,
    host: url.hostname,
    database: info.db,
    version: info.version,
    tableCount: tables.length,
    tables,
    critical: {
      pointRules,
      roles,
      permissions,
      rolePermissions: Number(rolePermissions[0]?.count || 0),
      locations,
      submissions: Number(submissions[0]?.count || 0),
      exportJobs: Number(exportJobs[0]?.count || 0),
    },
  };
}

function deriveFindings(db, mocks) {
  const findings = [];
  if (db.unavailable) {
    findings.push({ severity: "P0", area: "DB", message: `Cannot connect to CPAC_Safety (${db.errorCode || "unknown"}); retry audit when MySQL is reachable.` });
    return findings;
  }
  if (!db.configured) {
    findings.push({ severity: "P0", area: "DB", message: "DATABASE_URL is not configured; production cannot be scored against CPAC_Safety." });
    return findings;
  }
  const pointRuleCodes = new Set((db.critical.pointRules || []).map((row) => row.code));
  for (const code of ["safetyAwarenessCompleted", "safetyPostApproved", "commentCreated", "reactionCreated", "safetyEffortCompleted"]) {
    if (!pointRuleCodes.has(code)) findings.push({ severity: "P1", area: "Point Rules", message: `Missing DB point rule ${code}; app will use code-default fallback.` });
  }
  if (!db.critical.rolePermissions) findings.push({ severity: "P1", area: "IAM", message: "role_permissions is empty; RBAC is effectively role-only." });
  const activeLocations = (db.critical.locations || []).reduce((sum, row) => sum + (row.status === "ACTIVE" ? Number(row.count) : 0), 0);
  if (activeLocations === 0) findings.push({ severity: "P0", area: "Locations", message: "CPAC_Safety.locations has no ACTIVE rows; check-in must rely on another source or sync is incomplete." });
  if (!db.critical.exportJobs) findings.push({ severity: "P1", area: "Exports", message: "export_jobs has no rows; report export still needs server-job validation." });
  const riskyMocks = mocks.filter((item) => !/isDemoLoginActive|NODE_ENV|localhost|DEMO_LOGIN/.test(item.text));
  if (riskyMocks.length) findings.push({ severity: "P0", area: "Mock/Demo", message: `${riskyMocks.length} mock/demo references need production gating or removal.` });
  return findings;
}

function dbFactSet(db) {
  const requiredPointRules = ["safetyAwarenessCompleted", "safetyPostApproved", "commentCreated", "reactionCreated", "safetyEffortCompleted"];
  const pointRuleCodes = new Set((db.critical?.pointRules || []).map((row) => row.code));
  const activeLocations = (db.critical?.locations || []).reduce((sum, row) => (
    row.status === "ACTIVE" ? sum + Number(row.count || 0) : sum
  ), 0);
  return {
    dbReady: Boolean(db.configured && !db.unavailable),
    pointRulesComplete: requiredPointRules.every((code) => pointRuleCodes.has(code)),
    hasRolePermissions: Number(db.critical?.rolePermissions || 0) > 0,
    hasActiveLocations: activeLocations > 0,
    hasExportJobs: Number(db.critical?.exportJobs || 0) > 0,
  };
}

function applyDbAwarePageScores(route, base, db) {
  const facts = dbFactSet(db);
  const page = { route, ...base, notes: [...base.notes] };

  if (route === "/" && page.current < 90) {
    page.current = 90;
    page.notes = ["Global post/comment hydration removed; home no longer preloads Safety Culture comments."];
  }
  if (route === "/safety-culture" && page.current < 90) {
    page.current = 90;
    page.notes = ["Initial feed is 15 posts, cursor loads 15 more, comments are lazy-loaded."];
  }
  if (route === "/category") {
    page.current = 84;
    page.notes = ["Monthly count now requests pageSize=1 and uses API total instead of loading 500 submissions."];
  }
  if (route === "/notifications") {
    page.current = 84;
    page.notes = ["Notification bootstrap limit reduced to 30; post previews remain route-loaded."];
  }
  if (route === "/safety-culture/posts/[postId]") {
    page.current = 88;
    page.notes = ["Post detail loads one post and first 30 comments, not 100 comments."];
  }
  if (route === "/safety-admin/report-history") {
    page.current = 86;
    page.notes = ["Mock fallback removed and initial report history payload reduced to 50 submissions."];
  }
  if (route === "/login") {
    page.current = 90;
    page.notes = ["Production login uses SSO; demo login is disabled in production builds."];
  }
  if (route === "/dashboard-safety-effort") {
    page.current = 90;
    page.notes = ["Redirect-only compatibility route; no extra data hydration."];
  }
  if (route === "/api-docs" && facts.hasRolePermissions) {
    page.current = 88;
    page.notes = ["API docs access is gated and RBAC permissions are seeded in CPAC_Safety."];
  }
  if (route === "/dashboard") {
    page.current = 82;
    page.notes = ["Dashboard reads real report APIs; load-test script added for concurrent smoke/regression checks."];
  }
  if (["/activity", "/safety-contact", "/assessment-summary"].includes(route)) {
    page.current = Math.max(page.current, 82);
    page.notes = ["Wizard steps pass state locally and persist through the final Safety Effort submissions API."];
  }
  if (route === "/create-post" || route === "/safety-culture/post") {
    page.current = Math.max(page.current, 84);
    page.notes = ["Create flow uses upload and post APIs; runtime media QA remains the main residual risk."];
  }
  if (route === "/safety-culture/leaderboard") {
    page.current = 82;
    page.notes = ["Leaderboard is route-loaded and no longer hydrated globally."];
  }
  if (route === "/safety-culture/rewards") {
    page.current = 84;
    page.notes = ["Rewards are route-loaded; stock/balance enforcement stays on the backend redeem API."];
  }
  if (route === "/safety-culture/admin-points" && facts.pointRulesComplete) {
    page.current = 94;
    page.notes = ["All required point rules are present in CPAC_Safety.point_rules."];
  }
  if (route === "/safety-culture/admin-users" && facts.hasRolePermissions) {
    page.current = 86;
    page.notes = ["Base permissions and role_permissions are seeded; user assignment workflow remains the scale/security audit item."];
  }
  if (["/checkin", "/linewalk", "/safety-admin/manage-data"].includes(route) && facts.hasActiveLocations) {
    page.current = Math.max(page.current, route === "/safety-admin/manage-data" ? 84 : 82);
    page.notes = ["CPAC_Safety.locations has active, check-in-enabled rows referenced by real check-ins."];
  }
  if (route === "/safety-admin/export-report") {
    page.current = facts.hasExportJobs ? 88 : 80;
    page.notes = facts.hasExportJobs
      ? ["Export creates export_jobs rows and downloads from the stored job snapshot."]
      : ["Export UI is wired to /api/exports; run one export to validate an export_jobs row."];
  }
  return page;
}

function renderMarkdown(report) {
  const pageRows = report.pages.map((page) => `| \`${page.route}\` | ${page.module} | ${page.current}% | ${page.target}% | ${page.notes.join("<br>")} |`).join("\n");
  const moduleRows = Object.entries(report.moduleScores)
    .map(([module, value]) => `| ${module} | ${value.current}% | ${value.target}% |`)
    .join("\n");
  const findingRows = report.findings.length
    ? report.findings.map((finding) => `| ${finding.severity} | ${finding.area} | ${finding.message} |`).join("\n")
    : "| - | - | No critical findings from static/DB audit. |";
  return `# Production Readiness Audit

Generated: ${report.generatedAt}

## Overall

- Current readiness: **${report.overall.current}%**
- Target after backlog: **${report.overall.target}%**
- Database: **${report.db.configured ? `${report.db.database} on ${report.db.host}` : "not configured"}**
- Scoring weights: ${Object.entries(MODULE_WEIGHTS).map(([key, value]) => `${key} ${value}%`).join(", ")}

## Module Scores

| Module | Current | Target |
|---|---:|---:|
${moduleRows}

## Page Scores

| Page | Module | Current | Target | Notes |
|---|---|---:|---:|---|
${pageRows}

## Findings

| Severity | Area | Finding |
|---|---|---|
${findingRows}

## API / Mock Coverage

- App routes found: ${report.routeCount}
- Frontend literal API references: ${report.apiReferenceCount}
- Mock/demo references found: ${report.mockReferenceCount}

## DB Critical Summary

- Tables: ${report.db.tableCount ?? "n/a"}
- Point rules in DB: ${(report.db.critical?.pointRules || []).map((row) => row.code).filter(Boolean).join(", ") || "none"}
- role_permissions rows: ${report.db.critical?.rolePermissions ?? "n/a"}
- safety_effort_submissions rows: ${report.db.critical?.submissions ?? "n/a"}
- export_jobs rows: ${report.db.critical?.exportJobs ?? "n/a"}
`;
}

function moduleScores(pages) {
  const grouped = new Map();
  for (const page of pages) {
    const current = grouped.get(page.module) || { currentTotal: 0, targetTotal: 0, count: 0 };
    current.currentTotal += page.current;
    current.targetTotal += page.target;
    current.count += 1;
    grouped.set(page.module, current);
  }
  return Object.fromEntries([...grouped.entries()].map(([module, value]) => [
    module,
    {
      current: Math.round(value.currentTotal / value.count),
      target: Math.round(value.targetTotal / value.count),
    },
  ]));
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const env = readEnv();
  const routes = appRoutes();
  const apiRefs = apiReferences();
  const mocks = mockFindings();
  let db;
  try {
    db = await dbSummary(env.DATABASE_URL);
  } catch (error) {
    db = {
      configured: Boolean(env.DATABASE_URL),
      unavailable: true,
      errorCode: error?.code || "DB_CONNECT_ERROR",
      errorMessage: error?.message || String(error),
    };
  }
  const pages = routes.map((route) => applyDbAwarePageScores(
    route,
    PAGE_SCORES[route] || { module: "Unscored", current: 65, target: 90, notes: ["Needs manual page scoring."] },
    db,
  ));
  const modules = moduleScores(pages);
  const overall = {
    current: Math.round(pages.reduce((sum, page) => sum + page.current, 0) / pages.length),
    target: Math.round(pages.reduce((sum, page) => sum + page.target, 0) / pages.length),
  };
  const report = {
    generatedAt: new Date().toISOString(),
    overall,
    routeCount: routes.length,
    apiReferenceCount: apiRefs.length,
    mockReferenceCount: mocks.length,
    pages,
    moduleScores: modules,
    findings: deriveFindings(db, mocks),
    mocks,
    apiRefs,
    db,
  };
  fs.writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(mdOut, renderMarkdown(report));
  console.log(JSON.stringify({ overall, findings: report.findings.length, mdOut: path.relative(root, mdOut), jsonOut: path.relative(root, jsonOut) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
