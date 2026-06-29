import fs from "node:fs/promises";

import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const liveRoutes = JSON.parse(
  await fs.readFile("/Users/sasitorn/Project_SUEASafety/tmp/live_api_routes.json", "utf8"),
);
const liveDb = JSON.parse(
  await fs.readFile("/Users/sasitorn/Project_SUEASafety/tmp/live_db_metadata.json", "utf8"),
);
const existingMaps = JSON.parse(
  await fs.readFile("/Users/sasitorn/Project_SUEASafety/tmp/db_existing_maps.json", "utf8"),
);

const dbWorkbookPath = "/Users/sasitorn/Project_SUEASafety/outputs/CPAC_Safety_Database_Complete.xlsx";
const apiWorkbookPath = "/Users/sasitorn/Project_SUEASafety/outputs/SUEA_Safety_API_Inventory.xlsx";

const tableOverrides = {
  api_docs_access_users: {
    module: "IAM",
    purpose_th: "Allowlist ผู้ใช้ admin ที่ได้รับสิทธิ์เปิดหน้า API Docs / Swagger UI",
    phase: "Shared",
    priority: "High",
  },
  comment_reactions: {
    module: "Safety Culture",
    purpose_th: "ปฏิกิริยาต่อ comment ในโพสต์ Safety Culture",
    phase: "Phase 3",
    priority: "Medium",
  },
  safety_effort_submissions: {
    module: "Safety Effort",
    purpose_th: "รายการส่งกิจกรรม Safety Effort ของผู้ใช้ ใช้กับ dashboard/category และ flow ใหม่",
    phase: "Phase 2",
    priority: "High",
  },
  safety_old: {
    module: "Safety Effort",
    purpose_th: "ข้อมูลเก่า aggregate Linewalk และ Safety Contact จากระบบเดิม ใช้ join กับ users.username",
    phase: "Legacy",
    priority: "Medium",
  },
  were_ok_jobs: {
    module: "Deprecated",
    purpose_th: "คิวงานเดิมของ We\u2019re OK ที่ยังค้างอยู่ในฐานข้อมูลและรอล้างออก",
    phase: "Legacy",
    priority: "Low",
  },
};

const apiDocsLegacyTables = ["health_checks", "kyt_records", "pretrip_checks", "sos_events", "were_ok_jobs"];

function rangeAddress(cols, rows) {
  const toCol = (index) => {
    let n = index + 1;
    let out = "";
    while (n > 0) {
      const rem = (n - 1) % 26;
      out = String.fromCharCode(65 + rem) + out;
      n = Math.floor((n - 1) / 26);
    }
    return out;
  };
  return `A1:${toCol(cols - 1)}${rows}`;
}

function normalizeDefaultValue(value) {
  if (value === null || value === undefined) return "NULL";
  return String(value);
}

function keyType(column) {
  if (column.COLUMN_KEY === "PRI") return "PK";
  if (column.COLUMN_KEY === "UNI") return "UK";
  if (column.COLUMN_KEY === "MUL") return "FK/INDEX";
  return "";
}

function indexType(column) {
  if (column.COLUMN_KEY === "PRI") return "PRIMARY";
  if (column.COLUMN_KEY === "UNI") return "UNIQUE";
  if (column.COLUMN_KEY === "MUL") return "INDEX";
  return "";
}

function personalDataClassification(tableName, columnName, existing) {
  if (existing?.personal_data_classification) return existing.personal_data_classification;
  const key = `${tableName}.${columnName}`.toLowerCase();
  if (key.includes("email")) return "CONTACT";
  if (key.includes("name") || key.includes("username") || key.includes("employee")) return "IDENTIFIER";
  if (key.includes("phone")) return "CONTACT";
  if (key.includes("lat") || key.includes("lng") || key.includes("position")) return "SENSITIVE";
  return "NONE";
}

function genericColumnDescription(tableName, columnName) {
  const lower = columnName.toLowerCase();
  if (lower === "id") return "รหัสภายในของรายการ";
  if (lower.endsWith("_id")) return `รหัสอ้างอิงของ ${columnName.replace(/_id$/i, "")}`;
  if (lower === "status") return "สถานะของรายการ";
  if (lower === "created_at") return "วันที่และเวลาที่สร้างรายการ";
  if (lower === "updated_at") return "วันที่และเวลาที่แก้ไขล่าสุด";
  if (lower === "deleted_at") return "วันที่ลบแบบ Soft delete";
  if (lower === "created_by") return "users.id ของผู้สร้างรายการหรือผู้ grant สิทธิ์";
  if (lower === "updated_by") return "users.id ของผู้แก้ไขล่าสุด";
  if (lower === "user_id") return "users.id ของผู้ใช้ที่เกี่ยวข้อง";
  if (lower === "month") return "เดือนอ้างอิงของข้อมูลสรุป";
  if (lower.includes("count")) return "ค่าจำนวนสะสมของรายการ";
  if (lower.includes("json")) return "ข้อมูล JSON จากระบบหรือ payload ต้นทาง";
  return `คอลัมน์ ${columnName} ของตาราง ${tableName}`;
}

function genericExampleValue(columnName) {
  const lower = columnName.toLowerCase();
  if (lower === "id" || lower.endsWith("_id")) return "1";
  if (lower.includes("email")) return "user@scg.com";
  if (lower.includes("username")) return "SASITOJA";
  if (lower.includes("name")) return "ตัวอย่าง";
  if (lower === "status") return "ACTIVE";
  if (lower === "month") return "2026-06";
  if (lower === "created_at" || lower === "updated_at") return "2026-06-26 20:00:00";
  return "";
}

function genericValidationRule(columnName) {
  const lower = columnName.toLowerCase();
  if (lower === "status") return "ค่าใน status enum";
  if (lower === "id" || lower.endsWith("_id")) return "> 0";
  if (lower.includes("email")) return "รูปแบบอีเมล";
  return "";
}

function buildDbStructures() {
  const summaryMap = existingMaps.summary_map;
  const columnMap = existingMaps.column_map;
  const relMap = existingMaps.rel_map;
  const idxMap = existingMaps.idx_map;

  const columnGroups = new Map();
  for (const column of liveDb.columns) {
    const list = columnGroups.get(column.TABLE_NAME) || [];
    list.push(column);
    columnGroups.set(column.TABLE_NAME, list);
  }

  const parentMap = new Map();
  for (const rel of liveDb.relationships) {
    const key = rel.child_table;
    const list = parentMap.get(key) || [];
    list.push(`${rel.parent_table}.${rel.foreign_key}`);
    parentMap.set(key, list);
  }

  const relatedTablesMap = new Map();
  for (const rel of liveDb.relationships) {
    const childSet = relatedTablesMap.get(rel.child_table) || new Set();
    childSet.add(rel.parent_table);
    relatedTablesMap.set(rel.child_table, childSet);

    const parentSet = relatedTablesMap.get(rel.parent_table) || new Set();
    parentSet.add(rel.child_table);
    relatedTablesMap.set(rel.parent_table, parentSet);
  }

  const existingOrder = Object.keys(summaryMap);
  const missing = liveDb.tables.map((row) => row.TABLE_NAME).filter((table) => !existingOrder.includes(table));
  const orderedTables = [...existingOrder, ...missing];

  const tableSummaryRows = [];
  for (const tableName of orderedTables) {
    const tableInfo = liveDb.tables.find((row) => row.TABLE_NAME === tableName);
    if (!tableInfo) continue;
    const existing = summaryMap[tableName] || {};
    const override = tableOverrides[tableName] || {};
    const tableColumns = columnGroups.get(tableName) || [];
    const pkColumns = tableColumns.filter((col) => col.COLUMN_KEY === "PRI").map((col) => col.COLUMN_NAME);
    const linkedTables = [...(relatedTablesMap.get(tableName) || new Set())].sort().join(", ");
    tableSummaryRows.push([
      tableName,
      override.module || existing.module || "Shared",
      override.purpose_th || existing.purpose_th || `รายละเอียดของตาราง ${tableName}`,
      pkColumns.join(", ") || existing.primary_key || "id",
      linkedTables || existing.linked_tables || "",
      override.phase || existing.phase || "Shared",
      override.priority || existing.priority || "Medium",
      Number(tableInfo.column_count),
    ]);
  }

  const columnRows = [];
  for (const tableName of orderedTables) {
    const tableColumns = columnGroups.get(tableName) || [];
    for (const column of tableColumns) {
      const existing = columnMap[`${tableName}.${column.COLUMN_NAME}`] || {};
      const rel = liveDb.relationships.find(
        (item) => item.child_table === tableName && item.foreign_key === column.COLUMN_NAME,
      );
      columnRows.push([
        tableName,
        column.COLUMN_NAME,
        String(column.COLUMN_TYPE || "").toUpperCase(),
        column.CHARACTER_MAXIMUM_LENGTH ?? "",
        column.IS_NULLABLE,
        normalizeDefaultValue(column.COLUMN_DEFAULT || column.EXTRA || null),
        keyType(column),
        rel ? `${rel.parent_table}.${column.COLUMN_NAME}` : "",
        indexType(column),
        existing.description_th || genericColumnDescription(tableName, column.COLUMN_NAME),
        existing.example_value || genericExampleValue(column.COLUMN_NAME),
        existing.validation_rule || genericValidationRule(column.COLUMN_NAME),
        personalDataClassification(tableName, column.COLUMN_NAME, existing),
        existing.notes || "",
      ]);
    }
  }

  const relationshipRows = liveDb.relationships.map((rel) => {
    const existing = relMap[`${rel.parent_table}|${rel.child_table}|${rel.foreign_key}`] || {};
    return [
      rel.parent_table,
      rel.child_table,
      rel.foreign_key,
      "1 : Many",
      rel.on_delete,
      rel.on_update,
      existing.description_th || `${rel.child_table}.${rel.foreign_key} อ้างอิง ${rel.parent_table}`,
    ];
  });

  const indexRows = liveDb.indexes.map((idx) => {
    const existing = idxMap[`${idx.TABLE_NAME}|${idx.INDEX_NAME}`] || {};
    return [
      idx.TABLE_NAME,
      idx.INDEX_NAME,
      idx.INDEX_NAME === "PRIMARY"
        ? "PRIMARY"
        : (Number(idx.NON_UNIQUE) === 0 ? "UNIQUE" : String(idx.INDEX_TYPE || "INDEX").toUpperCase()),
      idx.columns_or_expression,
      existing.purpose_th || `ดัชนี ${idx.INDEX_NAME} ของตาราง ${idx.TABLE_NAME}`,
    ];
  });

  return { orderedTables, tableSummaryRows, columnRows, relationshipRows, indexRows };
}

function buildApiSheets() {
  const routes = liveRoutes.map((route) => ([
    route.module,
    route.method,
    route.documentedPath || route.path,
    route.purpose,
    route.caller,
    route.whenCalled,
    route.auth,
    route.pagination,
    route.responseSizeRisk,
    route.status,
    route.notes || "",
  ]));

  const summaryRows = [
    ["Area", "Current status in repo", "Target design", "Priority", "Main risk"],
    ["Backend structure", `API catalog ${liveRoutes.length} routes ต่อ backend/components และฐานจริง`, "คง HTTP layer บางและแยก repository/persistence ตาม feature", "P0", "ต้องทดสอบสิทธิ์ด้วย session จริง"],
    ["Auth", "SSO/session/users ต่อฐานจริงแล้ว และ /api-docs ใช้ DB allowlist + admin", "ใช้ session guard เดียวกันทุก API", "P0", "ต้อง monitor callback และ schema drift"],
    ["Locations", "Locations/Plant mirror/Admin CRUD ต่อฐานจริงแล้ว และมี source-detail API", "rmr_sso.Plant read-only → CPAC mirror; Admin Plant source=ADMIN", "P0", "RMR source ห้ามแก้/ลบ"],
    ["Check-in", "หน้า Check-in โหลด locations และ POST checkins จริง", "ใช้ CPAC local location id และ GPS จริง", "P0", "ต้องได้รับสิทธิ์ geolocation"],
    ["Safety Effort", "submissions/legacy/assessment/findings/reports ใช้ API และฐานจริง", "activities, submissions, runs, answers, findings/actions/comments", "P0", "ตรวจ workflow/permission รายบทบาท"],
    ["Safety Culture", "posts/events/rewards/teams/awareness ใช้ API และฐานจริง", "ไม่มี mock/localStorage ใน production flow; leaderboard/redeem ใช้ DB transaction", "P0", "redeem ต้องอยู่ใน DB transaction; team leader อาจเป็น NULL ได้"],
    ["Media/images", "uploads เก็บไฟล์จริงและ metadata ใน media_assets", "owner_type/owner_id/link_type ผูกกับข้อมูลธุรกิจ", "P0", "กำหนด storage retention และ access"],
    ["Reports/export", "export_jobs เก็บสถานะและผลลัพธ์จริง และมี OpenAPI docs ใช้งานได้", "ดาวน์โหลดจาก job/result ไม่สร้าง mock response", "P1", "งานใหญ่ควร background"],
    ["Scale rules", "list endpoints มี limit/page/pageSize; inventory และ OpenAPI sync จาก registry", "pagination/bbox/index/cache ทุกเส้น list", "P0", "ติดตาม slow query"],
  ];

  const safetyEffortRows = [
    ["Group", "Endpoint", "Purpose", "Tables", "Media handling", "Notes"],
    ["Submission", "POST /api/safety-effort/submissions", "บันทึก linewalk / safety contact แบบใหม่", "safety_effort_submissions, users", "none", "ใช้กับ flow ใหม่และ dashboard"],
    ["Submission", "GET /api/safety-effort/submissions/me", "อ่านข้อมูลของผู้ใช้พร้อม aggregate legacy", "safety_effort_submissions, safety_old, users", "none", "response มี data.legacy"],
    ["Legacy", "GET /api/safety-effort/submissions/legacy/me", "อ่านข้อมูลเก่าจาก safety_old ของผู้ใช้", "safety_old, users", "none", "join safety_old.CreatedBy กับ users.username"],
    ["Legacy", "GET /api/safety-effort/submissions/legacy/coverage", "เช็ก coverage การแมพ username ของข้อมูลเก่า", "safety_old, users", "none", "ใช้เฉพาะ admin"],
    ["Activity", "GET/POST /api/safety-effort/activities", "รายการและการเริ่มกิจกรรมจาก check-in", "safety_activities, checkins", "none", "activity per check-in"],
    ["Assessment", "GET/POST /api/safety-effort/assessment-templates", "จัดการ template แบบประเมิน", "assessment_templates, assessment_questions", "reference image URL only", "admin versioning flow"],
    ["Assessment", "GET/POST/PATCH /api/safety-effort/assessment-runs", "ทำแบบประเมิน linewalk/safety contact", "assessment_runs, assessment_answers, assessment_attachments", "attachmentIds per answer", "ห้ามฝัง base64"],
    ["Finding", "GET/POST /api/safety-effort/findings", "บันทึกและติดตามจุดเสี่ยง", "safety_findings, corrective_actions", "attachmentIds", "แยกจาก answer ถ้าต้องติดตาม action"],
    ["Corrective Action", "GET/POST/PATCH /api/safety-effort/corrective-actions", "สร้างและปิดงานแก้ไข", "corrective_actions, corrective_action_comments", "optional attachmentIds", "admin/assignee workflow"],
    ["Reports", "GET /api/safety-effort/reports/*", "summary/by-location/by-user/findings", "locations, users, safety_activities, assessment_runs, safety_findings, corrective_actions", "URL references", "ใช้กับ dashboard/admin report"],
  ];

  const mappingRows = [
    ["API path/pattern", "Primary tables", "Secondary tables", "Read/Write", "Notes"],
    ["/api/locations/plants|offices|sites|custom", "locations", "plant_location_details, office_location_details, site_location_details, organizations", "Read", "Plant อ่าน CPAC mirror; source=RMR_SSO_PLANT read-only, source=ADMIN editable"],
    ["/api/locations/:id", "locations", "organizations, users", "Read/Write", "location detail ทั่วไป"],
    ["/api/locations/:id/source-detail", "plant_location_details|office_location_details|site_location_details", "locations", "Read", "คืน sourceDetail ของ location ที่เลือก"],
    ["/api/checkins*", "checkins", "checkin_attachments, locations, users", "Write/Read", "selected vs actual GPS"],
    ["/api/safety-effort/submissions*", "safety_effort_submissions", "safety_old, users", "Write/Read", "dashboard/category รวมข้อมูลใหม่และ legacy"],
    ["/api/safety-effort/activities*", "safety_activities", "checkins", "Write/Read", "activity per check-in"],
    ["/api/safety-effort/assessment-templates*", "assessment_templates", "assessment_questions", "Read/Write", "versioned templates"],
    ["/api/safety-effort/assessment-runs*", "assessment_runs", "assessment_answers, assessment_attachments, users", "Write/Read", "answers link to attachments"],
    ["/api/safety-effort/findings*", "safety_findings", "corrective_actions", "Write/Read", "findings/action workflow"],
    ["/api/safety-effort/corrective-actions*", "corrective_actions", "corrective_action_comments, users", "Write/Read", "comment + completion flow"],
    ["/api/safety-culture/posts*", "posts", "users, organizations, teams, post_media, media_assets, comments, reactions, point_transactions, point_balances", "Read/Write", "scope=all/my-team/mine, returns real photos/category/points"],
    ["/api/safety-culture/comments*", "comments", "posts, users, notifications, comment_reactions", "Read/Write", "comment flow"],
    ["/api/safety-culture/reactions*", "reactions", "posts, users, point_transactions", "Write/Read", "post like/unlike"],
    ["/api/uploads*|/api/media", "media_assets", "post_media, checkin_attachments, assessment_attachments", "Write/Read", "upload metadata and linkage"],
    ["/api/auth/session|/api-docs access", "users", "user_roles, roles, permissions, api_docs_access_users", "Read", "API docs ต้อง admin + allowlist ใน DB"],
  ];

  const countRows = [["Module", "Total API rows", "Existing/Connected", "Disabled menu", "Comment"]];
  const byModule = new Map();
  for (const route of liveRoutes) {
    byModule.set(route.module, (byModule.get(route.module) || 0) + 1);
  }
  const moduleRows = [...byModule.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  for (const [moduleName, count] of moduleRows) {
    countRows.push([moduleName, count, count, 0, "API implementation sync กับ registry/OpenAPI"]);
  }
  countRows.push(["TOTAL", liveRoutes.length, liveRoutes.length, 0, `${liveRoutes.length} routes ใน registry/OpenAPI`]);

  const backlogRows = [
    ["Priority", "Work item", "Why", "Suggested owner", "Acceptance criteria"],
    ["P0", "ปลด metadata lock และลบตาราง legacy ที่ค้าง", "health_checks/kyt_records/pretrip_checks/sos_events/were_ok_jobs ยังอยู่ใน DB จริง", "DBA/Backend", "ลบได้ครบโดยไม่กระทบตารางใช้งานจริง"],
    ["P0", "เพิ่มหน้า admin จัดการ api_docs_access_users", "ตอนนี้ grant สิทธิ์ดู /api-docs ยังใช้ SQL", "Backend/Frontend", "admin เพิ่ม/ปิดสิทธิ์ได้จากหน้าเว็บ"],
    ["P1", "เอา fallback API_DOCS_ALLOWED_USERS ออกจาก rollout", "ตอนนี้คงไว้กันล็อกหลุดช่วงย้ายระบบ", "Backend/Infra", "ใช้ DB allowlist เป็นแหล่งเดียวหลัง verify production"],
    ["P1", "Reward category/personal ranking persistence", "บาง grouping/ranking UI ยัง local-derived", "Backend/Frontend", "หมวด reward และ ranking config อยู่ DB/API"],
    ["P1", "High-growth list endpoints cursor migration", "generic listRows หลายเส้นยังใช้ OFFSET + COUNT(*)", "Backend", "endpoint หลักใช้ cursor และ includeTotal เฉพาะ admin"],
    ["P1", "Async export job hardening", "export ใหญ่ควรย้าย background และ retry ได้", "Backend/Infra", "retry/status/download สม่ำเสมอทุก export"],
    ["P2", "Monitoring/rate limits", "กัน API หนักและดู lock/schema drift ง่ายขึ้น", "Infra/Backend", "มี logs/metrics/rate limit ต่อ endpoint สำคัญ"],
    ["OUT OF SCOPE", "Were OK / Work Permit UI", "เมนูถูกปิดและโค้ดหลักลบออกแล้ว", "Product/Frontend", "จะเชื่อมใหม่ก็ต่อเมื่อเปิด scope ใหม่"],
  ];

  return { summaryRows, routes, safetyEffortRows, mappingRows, countRows, backlogRows };
}

function styleRange(range, opts = {}) {
  if (opts.fill) range.format.fill = { color: opts.fill };
  if (opts.bold || opts.fontSize) {
    range.format.font = {
      ...(opts.bold ? { bold: true } : {}),
      ...(opts.fontSize ? { size: opts.fontSize } : {}),
      ...(opts.fontColor ? { color: opts.fontColor } : {}),
    };
  }
  if (opts.wrapText !== undefined) range.format.wrapText = opts.wrapText;
  if (opts.hAlign) range.format.horizontalAlignment = opts.hAlign;
}

async function overwriteSheet(sheet, matrix, options = {}) {
  const used = sheet.getUsedRange();
  if (used) used.clear({ applyTo: "contents" });
  const rows = matrix.length;
  const cols = matrix[0].length;
  const target = sheet.getRangeByIndexes(0, 0, rows, cols);
  target.values = matrix;
  sheet.showGridLines = false;

  target.format.wrapText = false;
  target.format.borders = { preset: "all", style: "thin", color: "#D9E2F3" };
  target.format.autofitColumns();
  target.format.autofitRows();

  if (options.titleCols) {
    sheet.getRange(`A1:${options.titleCols}1`).merge();
    sheet.getRange(`A2:${options.titleCols}2`).merge();
    styleRange(sheet.getRange(`A1:${options.titleCols}1`), { bold: true, fontSize: 16, fill: "#D9EAF7" });
    styleRange(sheet.getRange(`A2:${options.titleCols}2`), { fill: "#EEF5FB" });
  }
  if (options.headerRow) {
    styleRange(sheet.getRangeByIndexes(options.headerRow - 1, 0, 1, cols), {
      bold: true,
      fill: "#1F4E78",
      fontColor: "#FFFFFF",
      wrapText: true,
    });
  }
  if (options.freezeRows) {
    sheet.freezePanes.freezeRows(options.freezeRows);
  }
}

async function updateApiWorkbook() {
  const input = await FileBlob.load(apiWorkbookPath);
  const workbook = await SpreadsheetFile.importXlsx(input);
  const { summaryRows, routes, safetyEffortRows, mappingRows, countRows, backlogRows } = buildApiSheets();

  await overwriteSheet(workbook.worksheets.getItem("00_Summary"), summaryRows, { headerRow: 1 });
  await overwriteSheet(
    workbook.worksheets.getItem("01_API_Inventory"),
    [["Module", "Method", "Path", "Purpose", "Caller/Page", "When called", "Auth", "Pagination", "Response size risk", "Status", "Notes"], ...routes],
    { headerRow: 1, freezeRows: 1 },
  );
  await overwriteSheet(workbook.worksheets.getItem("03_Safety_Effort"), safetyEffortRows, { headerRow: 1, freezeRows: 1 });
  await overwriteSheet(workbook.worksheets.getItem("06_Table_Mapping"), mappingRows, { headerRow: 1, freezeRows: 1 });
  await overwriteSheet(workbook.worksheets.getItem("09_Backlog"), backlogRows, { headerRow: 1, freezeRows: 1 });
  await overwriteSheet(workbook.worksheets.getItem("10_API_Counts"), countRows, { headerRow: 1, freezeRows: 1 });

  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(apiWorkbookPath);
}

function buildDbOverviewRows(structures) {
  const { tableSummaryRows, columnRows, relationshipRows } = structures;
  const tablesCount = tableSummaryRows.length;
  const legacyRemaining = apiDocsLegacyTables.filter((table) =>
    liveDb.tables.some((row) => row.TABLE_NAME === table),
  );

  const completeIndexRows = [
    ["CPAC_Safety Database Complete", "", "", ""],
    [`ไฟล์เดียวรวม Database Blueprint, Data Dictionary, Relationships, DDL และหน้าแยกครบ ${tablesCount} tables`, "", "", ""],
    ["", "", "", ""],
    ["section", "sheet_name", "description", "how_to_open"],
    ["Overview", "Database Setup", "ชื่อ database, charset, collation และ SQL สำหรับ Create database", "เปิดแท็บ Database Setup"],
    ["Overview", "README", "ภาพรวมและกติกาการออกแบบฐานข้อมูล", "เปิดแท็บ README"],
    ["Overview", "Table Summary", `สรุป ${tablesCount} tables`, "เปิดแท็บ Table Summary"],
    ["Overview", "Column Dictionary", `รายละเอียด ${columnRows.length} columns`, "เปิดแท็บ Column Dictionary"],
    ["Overview", "Relationships", `ความสัมพันธ์ ${relationshipRows.length} relationships`, "เปิดแท็บ Relationships"],
    ["Overview", "External Source Mapping", "Mapping จาก rmr_sso.Plant แบบ read-only เข้าสู่ CPAC_Safety พร้อมกติกา sync/upsert", "เปิดแท็บ External Source Mapping"],
    ["Overview", "Enums & Status", "ค่ามาตรฐานและสถานะ", "เปิดแท็บ Enums & Status"],
    ["Overview", "Indexes & Constraints", "Index และ Constraint จาก schema จริง", "เปิดแท็บ Indexes & Constraints"],
    ["Overview", "MySQL DDL Examples", "ตัวอย่าง SQL DDL สำคัญ", "เปิดแท็บ MySQL DDL Examples"],
    ["Overview", "Data Flow", "การไหลของข้อมูลในระบบ", "เปิดแท็บ Data Flow"],
    ["Overview", "Privacy & Audit", "แนวทาง Privacy, GPS และ Audit", "เปิดแท็บ Privacy & Audit"],
    ["Overview", "SSO DB Integration", "รายละเอียดการเก็บ SSO ลง users และการเชื่อม session user", "เปิดแท็บ SSO DB Integration"],
    ["Overview", "Location Source Mapping", "กติกา RMR SSO Plant, Admin Plant, Site, Office และ Custom เข้าสู่ locations กลาง", "เปิดแท็บ Location Source Mapping"],
  ];

  for (const row of tableSummaryRows) {
    completeIndexRows.push(["Table Page", row[0], row[2], `เปิดแท็บ ${row[0]}`]);
  }

  const databaseSetupRows = [
    ["Database Setup", "", "", ""],
    ["ค่าที่ใช้ตอน Create database ตามสถานะจริงของระบบล่าสุด", "", "", ""],
    ["", "", "", ""],
    ["setting", "value", "description_th", "sql_or_note"],
    ["database_name", "CPAC_Safety", "ชื่อฐานข้อมูลหลักของระบบ CPAC Safety", "USE `CPAC_Safety`;"],
    ["charset", "utf8mb4", "รองรับภาษาไทย ภาษาอังกฤษ emoji และ Unicode", "CHARACTER SET utf8mb4"],
    ["collation", "utf8mb4_0900_ai_ci", "Collation มาตรฐาน MySQL 8", "COLLATE utf8mb4_0900_ai_ci"],
    ["engine", "InnoDB", "Storage engine สำหรับ transaction และ row-level locking", "ENGINE=InnoDB"],
    ["app_user", "cpac_safety_app", "User สำหรับแอป CPAC Safety", "grant อยู่ใน infra จริง"],
    ["table_count_created", String(tablesCount), "จำนวน table ปัจจุบันใน CPAC_Safety", "ตรวจจาก information_schema.TABLES"],
    ["column_count_created", String(columnRows.length), "จำนวน columns ปัจจุบันใน CPAC_Safety", "ตรวจจาก information_schema.COLUMNS"],
    ["foreign_key_count_created", String(relationshipRows.length), "จำนวน foreign key ปัจจุบันใน CPAC_Safety", "ตรวจจาก information_schema.REFERENTIAL_CONSTRAINTS"],
    ["location_detail_tables_added", "plant_location_details, site_location_details, office_location_details", "ตารางรายละเอียดสถานที่ที่ผูกกับ locations กลาง", "ใช้กับ /api/locations/:id/source-detail"],
    ["api_docs_access_control", "api_docs_access_users", "สิทธิ์ดู /api-docs ย้ายจาก env ไป MySQL allowlist แล้ว", "ต้องเป็น admin + มี row ACTIVE"],
    ["legacy_tables_remaining", legacyRemaining.join(", "), "ตารางเก่าที่ค้างเพราะ metadata lock และยังอยู่ใน DB จริง", "รอ DBA/ช่วง DB ว่างเพื่อลบออก"],
    ["sso_connected_status", "Connected", "ระบบ SSO เชื่อมได้ผ่าน /api/auth/login และ callback", "callback upsert users ก่อน set session cookie"],
    ["legacy_join_rule", "safety_old.CreatedBy -> users.username", "ข้อมูลเก่า linewalk/safety contact ใช้ username เป็นกุญแจเชื่อม", "เมื่อ users.username ครบ จะ join ติดเอง"],
  ];

  return { completeIndexRows, databaseSetupRows };
}

function tablePageMatrix(tableName, summaryRow, tableColumns, relationshipRows) {
  const references = new Map(
    relationshipRows
      .filter((row) => row[1] === tableName)
      .map((row) => [row[2], row[0]]),
  );
  const matrix = [
    [tableName, "", "", "", "", "", "", "", "", "", "", "", ""],
    [`${summaryRow[1]} | ${summaryRow[5]} | ${summaryRow[6]} | ${summaryRow[2]}`, "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["table_name", tableName, "module", summaryRow[1], "phase", summaryRow[5], "priority", summaryRow[6], "", "", "", "", ""],
    ["purpose_th", summaryRow[2], "primary_key", summaryRow[3], "column_count", tableColumns.length, "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["Column Dictionary", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["column_name", "data_type", "length", "nullable", "default_value", "key_type", "references", "index_type", "description_th", "example_value", "validation_rule", "personal_data_classification", "notes"],
  ];

  for (const row of tableColumns) {
    matrix.push(row.slice(1));
  }

  return matrix;
}

async function updateDbWorkbook() {
  const input = await FileBlob.load(dbWorkbookPath);
  const workbook = await SpreadsheetFile.importXlsx(input);
  const structures = buildDbStructures();
  const { completeIndexRows, databaseSetupRows } = buildDbOverviewRows(structures);

  await overwriteSheet(workbook.worksheets.getItem("Complete Index"), completeIndexRows, { titleCols: "D", headerRow: 4, freezeRows: 4 });
  await overwriteSheet(workbook.worksheets.getItem("Database Setup"), databaseSetupRows, { titleCols: "D", headerRow: 4, freezeRows: 4 });
  await overwriteSheet(
    workbook.worksheets.getItem("Table Summary"),
    [["Table Summary", "", "", "", "", "", "", ""], ["สรุปทุก table ในระบบล่าสุด", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""], ["table_name", "module", "purpose_th", "primary_key", "linked_tables", "phase", "priority", "column_count"], ...structures.tableSummaryRows],
    { titleCols: "H", headerRow: 4, freezeRows: 4 },
  );
  await overwriteSheet(
    workbook.worksheets.getItem("Column Dictionary"),
    [["Column Dictionary", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["รายละเอียดทุกคอลัมน์ของฐานข้อมูลล่าสุด", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["table_name", "column_name", "data_type", "length", "nullable", "default_value", "key_type", "references", "index_type", "description_th", "example_value", "validation_rule", "personal_data_classification", "notes"], ...structures.columnRows],
    { titleCols: "N", headerRow: 4, freezeRows: 4 },
  );
  await overwriteSheet(
    workbook.worksheets.getItem("Relationships"),
    [["Relationships", "", "", "", "", "", ""], ["Foreign Key และความสัมพันธ์ระหว่างตารางล่าสุด", "", "", "", "", "", ""], ["", "", "", "", "", "", ""], ["parent_table", "child_table", "foreign_key", "cardinality", "on_delete", "on_update", "description_th"], ...structures.relationshipRows],
    { titleCols: "G", headerRow: 4, freezeRows: 4 },
  );
  await overwriteSheet(
    workbook.worksheets.getItem("Indexes & Constraints"),
    [["Indexes & Constraints", "", "", "", ""], ["Index และ Constraint จาก schema จริงล่าสุด", "", "", "", ""], ["", "", "", "", ""], ["table_name", "name", "type", "columns_or_expression", "purpose_th"], ...structures.indexRows],
    { titleCols: "E", headerRow: 4, freezeRows: 4 },
  );

  const columnRowsByTable = new Map();
  for (const row of structures.columnRows) {
    const list = columnRowsByTable.get(row[0]) || [];
    list.push(row);
    columnRowsByTable.set(row[0], list);
  }

  const summaryByTable = new Map(structures.tableSummaryRows.map((row) => [row[0], row]));
  for (const tableName of structures.orderedTables) {
    let sheet;
    try {
      sheet = workbook.worksheets.getItem(tableName);
    } catch {
      sheet = workbook.worksheets.add(tableName);
    }
    const matrix = tablePageMatrix(
      tableName,
      summaryByTable.get(tableName),
      columnRowsByTable.get(tableName) || [],
      structures.relationshipRows,
    );
    await overwriteSheet(sheet, matrix, { titleCols: "M", headerRow: 9, freezeRows: 9 });
  }

  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(dbWorkbookPath);
}

await updateApiWorkbook();
await updateDbWorkbook();

console.log(JSON.stringify({
  apiWorkbookPath,
  dbWorkbookPath,
  routeCount: liveRoutes.length,
  tableCount: liveDb.tables.length,
}, null, 2));
