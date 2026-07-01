import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const rootDir = process.cwd();
const outDir = path.join(rootDir, "outputs");
const outFile = path.join(outDir, "SYSTEM_INVENTORY_SUMMARY.md");

const tablePurposes = {
  api_docs_access_users: "รายชื่อผู้ใช้ที่มีสิทธิ์เข้า API Docs/OpenAPI",
  archived_notifications: "รายการ notification ที่ผู้ใช้ archive แล้ว",
  assessment_answers: "คำตอบย่อยใน assessment/checklist แต่ละครั้ง",
  assessment_attachments: "ไฟล์แนบหลักฐานของ assessment run",
  assessment_questions: "คำถาม/หัวข้อ checklist สำหรับ assessment",
  assessment_runs: "รอบการทำ assessment / Linewalk / Safety Contact",
  assessment_templates: "แม่แบบ checklist/assessment",
  audit_logs: "ประวัติการกระทำสำคัญสำหรับ audit",
  awareness_answers: "คำตอบของแบบทดสอบ Safety Awareness",
  awareness_attempts: "รอบการทำ Safety Awareness ของผู้ใช้",
  awareness_questions: "คลังคำถาม Safety Awareness",
  checkin_attachments: "ไฟล์แนบของ check-in",
  checkins: "ข้อมูล check-in รวมตำแหน่งที่เลือก/ตำแหน่งจริง",
  comment_reactions: "reaction ต่อ comment",
  comments: "ความคิดเห็นใน Safety Culture posts",
  corrective_action_comments: "ความคิดเห็น/บันทึกติดตาม corrective action",
  corrective_actions: "งานแก้ไข/ติดตามจาก safety finding หรือ assessment",
  export_jobs: "คิว export/report jobs",
  holidays: "วันหยุด/ปฏิทินที่ใช้คำนวณงานและ awareness",
  location_import_batches: "ชุดการนำเข้า location",
  location_import_rows: "รายละเอียดแต่ละแถวจากการ import location",
  locations: "สถานที่ใน CPAC_Safety โดยเฉพาะ custom/admin และ snapshot ที่ระบบใช้",
  media_assets: "metadata ไฟล์รูป/สื่อที่อัปโหลด",
  notification_preferences: "การตั้งค่าการแจ้งเตือนของผู้ใช้",
  notifications: "notification ของผู้ใช้",
  organizations: "หน่วยงาน/โครงสร้างองค์กรในระบบ",
  permissions: "สิทธิ์ย่อยของระบบ",
  point_balances: "ยอด Coin/คะแนนคงเหลือของผู้ใช้",
  point_rules: "กติกาการให้คะแนน",
  point_transactions: "ประวัติรับ/ใช้คะแนน",
  post_media: "ความสัมพันธ์โพสต์กับ media_assets",
  posts: "โพสต์ Safety Culture feed",
  reactions: "reaction ต่อโพสต์",
  reward_inventory_transactions: "ประวัติ stock รางวัลเข้า/ออก",
  reward_redemptions: "ประวัติแลกรางวัล",
  rewards: "รายการรางวัลในร้านแลกของ",
  role_permissions: "ความสัมพันธ์ role กับ permission",
  roles: "บทบาทผู้ใช้",
  safety_activities: "กิจกรรม safety",
  safety_culture_events: "กิจกรรม/event/banner ของ Safety Culture",
  safety_effort_submissions: "submission จริงของ Safety Effort เช่น Linewalk/Safety Contact/custom activity",
  safety_findings: "finding/ประเด็นความปลอดภัย",
  safety_old: "ข้อมูล legacy safety เดิม ถ้ายังเหลือในฐาน",
  safety_settings: "ค่า config กลาง เช่น categories, awareness, reward, point condition",
  team_members: "สมาชิกทีม Safety Culture",
  teams: "ทีม Safety Culture",
  user_roles: "ความสัมพันธ์ผู้ใช้กับบทบาท",
  users: "บัญชีผู้ใช้และข้อมูลจาก SSO/LINE/profile",
};

const uploadPages = [
  {
    page: "/safety-culture/post",
    purpose: "โพสต์ Safety Culture แนบรูป",
    count: "สูงสุด 5 รูปต่อโพสต์",
    clientLimit: "แปลงรูปเป็น JPEG ด้านยาวไม่เกิน 1600px, quality 0.78 ก่อนอัปโหลด",
    serverLimit: "หลัง normalize ส่งเข้า /api/uploads ต้องไม่เกิน 5 MB ต่อไฟล์",
    types: "JPEG, PNG, WebP, GIF ผ่าน input image/* แต่ท้ายทาง backend รับเฉพาะ image/jpeg, image/png, image/webp, image/gif",
  },
  {
    page: "/profile",
    purpose: "รูปโปรไฟล์ผู้ใช้",
    count: "1 รูป",
    clientLimit: "ไฟล์ต้นฉบับต้องไม่เกิน 3 MB",
    serverLimit: "หลัง normalize ส่งเข้า /api/uploads ต้องไม่เกิน 5 MB ต่อไฟล์",
    types: "JPEG, PNG, WebP, GIF ผ่าน input image/* แต่ท้ายทาง backend รับเฉพาะ image/jpeg, image/png, image/webp, image/gif",
  },
  {
    page: "/safety-culture/admin-event",
    purpose: "รูปกิจกรรม/feed event ในหน้า admin",
    count: "1 รูปต่อ event draft",
    clientLimit: "อ่านเป็น Data URL เพื่อ preview/state ในหน้า admin; ยังไม่ผ่าน /api/uploads ใน flow นี้",
    serverLimit: "ยังไม่มี server upload limit เพราะยังไม่บันทึกเป็น media_assets",
    types: "input accept=image/*",
  },
  {
    page: "Safety Effort evidence media",
    purpose: "ไฟล์หลักฐานจาก Linewalk/Safety Contact/assessment ถ้าเรียก uploadSafetyEffortMedia",
    count: "ขึ้นกับ flow ที่เรียกใช้งาน",
    clientLimit: "normalize เป็นเป้าหมายไม่เกิน 1 MB, ด้านยาวไม่เกิน 1280px; ถ้าต้นฉบับเกิน 20 MB จะ reject",
    serverLimit: "หลัง normalize ส่งเข้า /api/uploads ต้องไม่เกิน 5 MB ต่อไฟล์",
    types: "JPEG, PNG, WebP, GIF; GIF ที่เกิน 1 MB จะ reject ฝั่ง client",
  },
  {
    page: "/api/assistant/chat",
    purpose: "รูปสำหรับผู้ช่วย Safety วิเคราะห์ภาพ",
    count: "1 data:image ต่อข้อความ",
    clientLimit: "ส่งเป็น data URL ไม่ใช่ media upload ปกติ",
    serverLimit: "จำกัดด้วย MAX_IMAGE_CHARS ใน route assistant",
    types: "data:image/*",
  },
];

function loadEnvFile(fileName) {
  const file = path.join(rootDir, fileName);
  if (!fs.existsSync(file)) return {};
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

async function loadRoutes() {
  const registry = fs.readFileSync(path.join(rootDir, "backend/components/api-catalog/registry.ts"), "utf8");
  const match = registry.match(/export const API_CATALOG_ROUTES = (\[[\s\S]*?\]);/);
  if (!match) throw new Error("API_CATALOG_ROUTES not found");
  const jsExpression = match[1].replace(/\]\s+as const[\s\S]*$/, "]");
  return Function(`"use strict"; return ${jsExpression}`)();
}

async function dbInventory(databaseUrl) {
  if (!databaseUrl) return { configured: false, tables: [] };
  const pool = mysql.createPool({
    uri: databaseUrl,
    charset: "utf8mb4",
    connectionLimit: 4,
    waitForConnections: true,
    namedPlaceholders: true,
    timezone: "Z",
  });
  try {
    const [dbRows] = await pool.query("SELECT DATABASE() AS db");
    const schema = dbRows?.[0]?.db || "CPAC_Safety";
    const [tables] = await pool.query(
      `SELECT TABLE_NAME AS name, TABLE_ROWS AS estimatedRows, ENGINE AS engine
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME ASC`,
      [schema],
    );
    const [columns] = await pool.query(
      `SELECT TABLE_NAME AS tableName, COUNT(*) AS columnCount
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ?
       GROUP BY TABLE_NAME`,
      [schema],
    );
    const [indexes] = await pool.query(
      `SELECT TABLE_NAME AS tableName, COUNT(DISTINCT INDEX_NAME) AS indexCount
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ?
       GROUP BY TABLE_NAME`,
      [schema],
    );
    const [fks] = await pool.query(
      `SELECT TABLE_NAME AS tableName, COUNT(*) AS fkCount
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
       GROUP BY TABLE_NAME`,
      [schema],
    );
    const byTable = new Map();
    for (const row of columns) byTable.set(row.tableName, { columnCount: Number(row.columnCount || 0), indexCount: 0, fkCount: 0 });
    for (const row of indexes) byTable.set(row.tableName, { ...(byTable.get(row.tableName) || {}), indexCount: Number(row.indexCount || 0) });
    for (const row of fks) byTable.set(row.tableName, { ...(byTable.get(row.tableName) || {}), fkCount: Number(row.fkCount || 0) });
    return {
      configured: true,
      schema,
      tables: tables.map((row) => ({
        name: row.name,
        estimatedRows: row.estimatedRows,
        engine: row.engine,
        ...(byTable.get(row.name) || {}),
        purpose: tablePurposes[row.name] || "ยังไม่มีคำอธิบายเฉพาะใน mapping; ตรวจชื่อ column/usage เพิ่มเมื่อต้องแก้ feature นี้",
      })),
    };
  } finally {
    await pool.end();
  }
}

function countBy(items, key) {
  return [...items.reduce((map, item) => {
    const value = item[key] || "-";
    map.set(value, (map.get(value) || 0) + 1);
    return map;
  }, new Map()).entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((cell) => String(cell ?? "").replace(/\|/g, "\\|").replace(/\n/g, "<br>")).join(" | ")} |`),
  ].join("\n");
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const env = { ...loadEnvFile(".env.production"), ...process.env };
  const routes = await loadRoutes();
  const uniquePaths = new Set(routes.map((route) => `${route.method} ${route.path}`));
  const db = await dbInventory(env.DATABASE_URL);
  const now = new Date().toISOString();

  const lines = [
    "# System Inventory Summary",
    "",
    `Generated: ${now}`,
    "",
    "## Upload Image Limits",
    "",
    "- Backend `/api/uploads` accepts only `image/jpeg`, `image/png`, `image/webp`, `image/gif`.",
    "- Backend max is `MAX_UPLOAD_BYTES`, default `5 MB` per uploaded file.",
    "- Shared frontend uploader tries to normalize images to about `1 MB`, max dimension `1280px`, before sending to backend.",
    "",
    mdTable(["Page/Area", "Use", "Count", "Client limit", "Server limit", "Types"], uploadPages.map((item) => [item.page, item.purpose, item.count, item.clientLimit, item.serverLimit, item.types])),
    "",
    "## API Inventory",
    "",
    `- Registry definitions: ${routes.length}`,
    `- Unique method+path routes: ${uniquePaths.size}`,
    "",
    "### API Count By Module",
    "",
    mdTable(["Module", "Routes"], countBy(routes, "module")),
    "",
    "### API Routes",
    "",
    mdTable(["Module", "Method", "Path", "Purpose", "Caller", "Auth", "Pagination", "Risk", "Status"], routes.map((route) => [
      route.module,
      route.method,
      route.documentedPath || route.path,
      route.purpose,
      route.caller,
      route.auth,
      route.pagination,
      route.responseSizeRisk,
      route.status,
    ])),
    "",
    "## CPAC_Safety Tables",
    "",
    db.configured
      ? `- Database: ${db.schema}\n- Tables: ${db.tables.length}`
      : "- DATABASE_URL is not configured, so table inventory could not be loaded.",
    "",
    db.configured
      ? mdTable(["Table", "What it stores", "Rows est.", "Columns", "Indexes", "FKs", "Engine"], db.tables.map((table) => [
        table.name,
        table.purpose,
        table.estimatedRows ?? "",
        table.columnCount ?? "",
        table.indexCount ?? "",
        table.fkCount ?? "",
        table.engine ?? "",
      ]))
      : "",
    "",
  ];

  fs.writeFileSync(outFile, `${lines.join("\n")}\n`);
  console.log(JSON.stringify({
    output: outFile,
    apiRoutes: routes.length,
    uniqueRoutes: uniquePaths.size,
    tables: db.tables.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
