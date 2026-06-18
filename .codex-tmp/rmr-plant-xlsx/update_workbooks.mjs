import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const root = "/Users/sasitorn/Project_SUEASafety";
const outputDir = path.join(root, ".codex-tmp/rmr-plant-xlsx/output");
const previewDir = path.join(root, ".codex-tmp/rmr-plant-xlsx/previews");
const databasePath = path.join(root, "outputs/CPAC_Safety_Database_Complete.xlsx");
const apiPath = path.join(root, "outputs/SUEA_Safety_API_Inventory.xlsx");

async function loadWorkbook(filePath) {
  return SpreadsheetFile.importXlsx(await FileBlob.load(filePath));
}

async function workbookSummary(workbook) {
  const result = await workbook.inspect({
    kind: "workbook,sheet",
    include: "id,name",
    maxChars: 12000,
  });
  return result.ndjson;
}

function getSheetValues(workbook, sheetName) {
  const sheet = workbook.worksheets.getItem(sheetName);
  return sheet.getUsedRange().values;
}

function setSheetValues(workbook, sheetName, values) {
  const sheet = workbook.worksheets.getItem(sheetName);
  const rows = values.length;
  const cols = Math.max(...values.map((row) => row.length));
  const normalized = values.map((row) => Array.from({ length: cols }, (_, index) => row[index] ?? null));
  sheet.getRangeByIndexes(0, 0, rows, cols).values = normalized;
}

function updateRows(values, predicate, updater) {
  let count = 0;
  for (let index = 0; index < values.length; index += 1) {
    if (!predicate(values[index], index)) continue;
    values[index] = updater([...values[index]], index);
    count += 1;
  }
  return count;
}

function replaceText(value, replacements) {
  if (typeof value !== "string") return value;
  let next = value;
  for (const [search, replacement] of replacements) {
    next = next.split(search).join(replacement);
  }
  return next;
}

function copyRowStyle(sheet, fromRowNumber, toRowNumber, columnCount) {
  const source = sheet.getRangeByIndexes(fromRowNumber - 1, 0, 1, columnCount);
  const target = sheet.getRangeByIndexes(toRowNumber - 1, 0, 1, columnCount);
  target.copyFrom(source, "formats");
  target.format.wrapText = true;
  target.format.rowHeight = Math.max(source.format.rowHeight || 18, 28);
}

function appendRows(workbook, sheetName, rows) {
  const sheet = workbook.worksheets.getItem(sheetName);
  const used = sheet.getUsedRange();
  const values = used.values;
  const startRow = values.length + 1;
  const columnCount = Math.max(...values.map((row) => row.length), ...rows.map((row) => row.length));
  for (let offset = 0; offset < rows.length; offset += 1) {
    copyRowStyle(sheet, values.length, startRow + offset, columnCount);
  }
  const normalized = rows.map((row) => Array.from({ length: columnCount }, (_, index) => row[index] ?? null));
  sheet.getRangeByIndexes(startRow - 1, 0, rows.length, columnCount).values = normalized;
}

function normalizeApiPath(value) {
  return String(value || "").split("?")[0];
}

const implementedApiRoutes = new Set([
  "GET /api/auth/session",
  "GET /api/auth/login",
  "GET /api/auth/callback/rmc-sso",
  "GET /api/auth/logout",
  "POST /api/assistant/chat",
  "GET /api/locations/plants",
  "GET /api/locations/offices",
  "GET /api/locations/sites",
  "GET /api/locations/custom",
  "GET /api/locations/map",
  "GET /api/locations/search",
  "GET /api/locations/:id",
  "POST /api/locations",
  "PATCH /api/locations/:id",
  "DELETE /api/locations/:id",
  "GET /api/safety-effort",
  "GET /api/safety-effort/locations",
  "POST /api/safety-effort/locations",
  "GET /api/safety-effort/locations/:id",
  "PATCH /api/safety-effort/locations/:id",
  "DELETE /api/safety-effort/locations/:id",
  "POST /api/checkins",
  "GET /api/checkins/me",
  "GET /api/checkins",
  "GET /api/checkins/:id",
  "GET /api/safety-culture/posts",
  "POST /api/safety-culture/posts",
  "GET /api/safety-culture/posts/:id",
  "PATCH /api/safety-culture/posts/:id",
  "DELETE /api/safety-culture/posts/:id",
  "POST /api/safety-culture/posts/:id/comments",
  "GET /api/safety-culture/posts/:id/comments",
  "POST /api/safety-culture/posts/:id/reactions",
  "DELETE /api/safety-culture/posts/:id/reactions",
  "POST /api/safety-awareness/attempts",
  "GET /api/safety-culture/points/me",
  "GET /api/safety-culture/points/me/transactions",
  "GET /api/safety-culture/points/rules",
  "POST /api/safety-culture/points/adjustments",
  "GET /api/health",
  "GET /api/version",
]);

function updateDatabaseWorkbook(workbook) {
  const completeIndex = getSheetValues(workbook, "Complete Index");
  updateRows(
    completeIndex,
    (row) => row[1] === "DataOcean Mapping",
    (row) => {
      row[1] = "External Source Mapping";
      row[2] = "Mapping จาก rmr_sso.Plant แบบ read-only เข้าสู่ CPAC_Safety พร้อมกติกา sync/upsert";
      row[3] = "เปิดแท็บ External Source Mapping";
      return row;
    },
  );
  updateRows(
    completeIndex,
    (row) => row[1] === "Location Source Mapping",
    (row) => {
      row[2] = "กติกา RMR SSO Plant, Admin Plant, Site, Office และ Custom เข้าสู่ locations กลาง";
      return row;
    },
  );
  updateRows(
    completeIndex,
    (row) => row[1] === "plant_location_details",
    (row) => {
      row[2] = "รายละเอียดโรงงานที่ sync จาก rmr_sso.Plant หรือสร้างโดย Admin โดยผูกกับ locations กลาง";
      return row;
    },
  );
  setSheetValues(workbook, "Complete Index", completeIndex);

  const setup = getSheetValues(workbook, "Database Setup");
  updateRows(
    setup,
    (row) => row[0] === "location_detail_tables_added",
    (row) => {
      row[2] = "ตารางรายละเอียดสถานที่ รวม mirror โรงงานจาก rmr_sso.Plant";
      row[3] = "plant_location_details.location_id FK ไป locations.id";
      return row;
    },
  );
  setSheetValues(workbook, "Database Setup", setup);
  appendRows(workbook, "Database Setup", [
    [
      "rmr_sso_database_url",
      "RMR_SSO_DATABASE_URL",
      "Connection แยกสำหรับอ่าน Plant Master จากฐาน rmr_sso",
      "ให้สิทธิ์ SELECT เฉพาะ rmr_sso.Plant; ห้ามใช้ credential ที่เขียน Master ได้",
    ],
    [
      "rmr_sso_plant_policy",
      "Read-only source",
      "แอปอ่าน Plant Master แล้ว incremental sync เข้า CPAC_Safety",
      "ห้าม INSERT/UPDATE/DELETE rmr_sso.Plant จากแอป Safety",
    ],
  ]);

  const readme = getSheetValues(workbook, "README");
  updateRows(
    readme,
    (row) => row[0] === "Custom Location",
    (row) => {
      row[1] = "จุดที่ผู้ใช้ปักเองใช้ source=USER, type=CUSTOM; โรงงานที่ Admin เพิ่มใช้ source=ADMIN, type=PLANT และเก็บใน CPAC_Safety เท่านั้น";
      return row;
    },
  );
  updateRows(
    readme,
    (row) => row[0] === "Phase 1",
    (row) => {
      row[1] = "Foundation/IAM, Organizations, Locations, RMR SSO Plant Sync, Location Import และ Check-in";
      return row;
    },
  );
  updateRows(
    readme,
    (row) => row[0] === "หมายเหตุ",
    (row) => {
      row[1] = "rmr_sso.Plant เป็น Master แบบ read-only; แอปใช้ข้อมูล mirror ใน CPAC_Safety สำหรับ Map/Check-in และไม่เขียนกลับฐานกลาง";
      return row;
    },
  );
  updateRows(
    readme,
    (row) => row[0] === "DataOcean Mapping",
    (row) => {
      row[0] = "External Source Mapping";
      row[1] = "เลือกแท็บ \"External Source Mapping\" ด้านล่างของ Workbook";
      return row;
    },
  );
  setSheetValues(workbook, "README", readme);
  appendRows(workbook, "README", [
    ["RMR SSO Plant Master", "อ่านจาก rmr_sso.Plant ผ่าน RMR_SSO_DATABASE_URL ด้วยสิทธิ์ SELECT เท่านั้น แล้ว upsert mirror เข้า locations + plant_location_details"],
    ["Plant Sync Key", "ใช้ (source='RMR_SSO_PLANT', external_key=Plant key) ป้องกันซ้ำ; รายการที่หายจากต้นทางเปลี่ยน INACTIVE ไม่ลบทิ้ง"],
    ["Admin Plant", "โรงงานที่เพิ่มจากเว็บเก็บใน CPAC_Safety.locations ด้วย source=ADMIN, created_by=user.id และไม่ส่งกลับ rmr_sso.Plant"],
  ]);

  const tableSummary = getSheetValues(workbook, "Table Summary");
  updateRows(
    tableSummary,
    (row) => row[0] === "locations",
    (row) => {
      row[2] = "Master สถานที่ภายใน CPAC Safety รวม mirror โรงงานจาก RMR SSO และโรงงานที่ Admin เพิ่ม";
      return row;
    },
  );
  updateRows(
    tableSummary,
    (row) => row[0] === "plant_location_details",
    (row) => {
      row[2] = "รายละเอียดโรงงานจาก rmr_sso.Plant แบบ read-only mirror และโรงงาน source=ADMIN";
      return row;
    },
  );
  updateRows(
    tableSummary,
    (row) => row[0] === "location_import_batches",
    (row) => {
      row[2] = "หัวรายการ sync/import Master สถานที่จาก RMR SSO และแหล่งภายนอก";
      return row;
    },
  );
  updateRows(
    tableSummary,
    (row) => row[0] === "location_import_rows",
    (row) => {
      row[2] = "ผล sync/import และข้อมูลต้นฉบับรายแถวจากแต่ละ source";
      return row;
    },
  );
  setSheetValues(workbook, "Table Summary", tableSummary);

  const dictionary = getSheetValues(workbook, "Column Dictionary");
  updateRows(
    dictionary,
    (row) => row[0] === "locations" && row[1] === "source",
    (row) => {
      row[9] = "แหล่งที่มาของสถานที่และสิทธิ์แก้ไข";
      row[10] = "RMR_SSO_PLANT";
      row[11] = "ค่าใน location_source enum; RMR_SSO_PLANT เป็น read-only, ADMIN แก้ไขได้";
      row[13] = "Plant Master ห้ามแก้/ลบผ่านเว็บเมื่อ source=RMR_SSO_PLANT";
      return row;
    },
  );
  updateRows(
    dictionary,
    (row) => row[0] === "locations" && row[1] === "external_key",
    (row) => {
      row[9] = "รหัสจากระบบต้นทาง เช่น Plant key";
      row[11] = "Unique ร่วมกับ source; RMR ใช้ Plant key";
      row[13] = "Sync upsert ด้วย (source, external_key)";
      return row;
    },
  );
  updateRows(
    dictionary,
    (row) => row[0] === "locations" && row[1] === "created_by",
    (row) => {
      row[9] = "ผู้สร้างกรณี USER/ADMIN; รายการ sync จาก RMR อาจเป็น NULL";
      row[13] = "โรงงานที่เพิ่มจากเว็บต้องเก็บ Admin user id";
      return row;
    },
  );
  updateRows(
    dictionary,
    (row) => row[0] === "locations" && row[1] === "plant_type",
    (row) => {
      row[9] = "ประเภทโรงงานจาก rmr_sso.Plant หรือข้อมูลที่ Admin ระบุ";
      return row;
    },
  );
  updateRows(
    dictionary,
    (row) => row[0] === "location_import_batches" && row[1] === "file_name",
    (row) => {
      row[9] = "ชื่อไฟล์หรือตัวระบุ sync job ต้นทาง";
      row[10] = "rmr_sso_plant_incremental";
      row[13] = "RMR sync อาจไม่มีไฟล์จริง ให้เก็บชื่อ job/run";
      return row;
    },
  );
  updateRows(
    dictionary,
    (row) => row[0] === "location_import_batches" && row[1] === "source",
    (row) => {
      row[9] = "ระบบต้นทางของ sync/import";
      row[10] = "RMR_SSO_PLANT";
      row[11] = "ค่าใน external source enum";
      row[13] = "ค่า default DATAOCEAN เป็น legacy; job ต้องส่ง source ชัดเจน";
      return row;
    },
  );
  updateRows(
    dictionary,
    (row) => row[0] === "location_import_rows" && row[1] === "external_key",
    (row) => {
      row[9] = "Plant key หรือ external key ที่อ่านได้";
      row[13] = "ใช้คู่กับ source ของ import batch";
      return row;
    },
  );
  updateRows(
    dictionary,
    (row) => row[0] === "plant_location_details" && row[1] === "plant_no",
    (row) => {
      row[9] = "Plant key/รหัสโรงงานจาก rmr_sso.Plant หรือรหัสที่ Admin กำหนด";
      row[13] = "ใช้คู่กับ locations.external_key; source แยก RMR_SSO_PLANT กับ ADMIN";
      return row;
    },
  );
  updateRows(
    dictionary,
    (row) => row[0] === "plant_location_details" && row[1] === "source_raw",
    (row) => {
      row[9] = "ข้อมูลต้นฉบับจาก rmr_sso.Plant เพื่อ audit การ sync";
      row[13] = "รายการ ADMIN เก็บ payload form ที่จำเป็นหรือ NULL";
      return row;
    },
  );
  setSheetValues(workbook, "Column Dictionary", dictionary);

  const sourceSheet = workbook.worksheets.getItem("DataOcean Mapping");
  sourceSheet.name = "External Source Mapping";
  const sourceMapping = sourceSheet.getUsedRange().values;
  sourceMapping[0][0] = "External Source Mapping";
  sourceMapping[1][0] = "Mapping ฟิลด์จาก rmr_sso.Plant แบบ read-only เพื่อ sync เข้า CPAC_Safety";
  updateRows(
    sourceMapping,
    (row, index) => index >= 4,
    (row) => {
      row[3] = replaceText(row[3], [
        ["source=DATAOCEAN", "source=RMR_SSO_PLANT"],
        ["External Unique Key", "Plant Master sync key"],
      ]);
      row[6] = replaceText(row[6], [
        ["ต้นทาง", "rmr_sso.Plant"],
        ["1,180 แถวและ unique 1,180 ค่า", "ต้อง unique ภายใน source=RMR_SSO_PLANT"],
        ["ทุกแถวมีพิกัด valid", "ต้อง validate พิกัดก่อนเปิด map/check-in"],
      ]);
      if (["PLANT_NO", "PLANT_NAME", "PLANT_NAME_CN", "PLANT_NAME_EN", "STATUS", "PLANT_TYPE_PROD", "PLANT_TYPE", "PLANT_NO_SAP", "SITEMATERAIL", "LATITUDE", "LONGITUDE", "PROVINCE_NAME", "DISTRICT_NAME"].includes(row[0])) {
        row[1] = row[0] === "PLANT_NO" ? "locations + plant_location_details" : "plant_location_details + locations";
      }
      return row;
    },
  );
  const sourceQualityNotes = {
    PLANT_NO: "Plant key ต้องไม่ว่างและ unique ภายใน source=RMR_SSO_PLANT",
    PLANT_NAME: "ชื่ออาจซ้ำได้ ห้ามใช้เป็น sync key",
    STATUS: "Map ตามค่าจริงจาก rmr_sso.Plant; ค่าที่ไม่รู้จักต้อง quarantine",
    PLANT_TYPE_PROD: "Trim และ validate ค่าที่ไม่เคยพบก่อนนำไปใช้",
    PLANT_TYPE: "Trim และ validate กับค่าที่ระบบรองรับ",
    PLANT_NO_SAP: "อาจไม่ unique; ห้ามใช้แทน Plant key",
    LATITUDE: "ต้องอยู่ระหว่าง -90..90 ก่อนเปิด map/check-in",
    LONGITUDE: "ต้องอยู่ระหว่าง -180..180; อนุญาตพิกัดซ้ำ",
    PROVINCE_NAME: "Normalize กับ master จังหวัดเมื่อมีข้อมูล",
    DISTRICT_NAME: "Nullable และ normalize ชื่อเขต/อำเภอ",
  };
  updateRows(
    sourceMapping,
    (row) => Object.hasOwn(sourceQualityNotes, row[0]),
    (row) => {
      row[6] = sourceQualityNotes[row[0]];
      return row;
    },
  );
  sourceSheet.getUsedRange().values = sourceMapping;

  const enums = getSheetValues(workbook, "Enums & Status");
  updateRows(
    enums,
    (row) => row[0] === "location_type" && row[1] === "PLANT",
    (row) => {
      row[2] = "โรงงานจาก RMR SSO mirror หรือ Admin เพิ่มใน CPAC";
      return row;
    },
  );
  updateRows(
    enums,
    (row) => row[0] === "location_source" && row[1] === "DATAOCEAN",
    (row) => {
      row[1] = "RMR_SSO_PLANT";
      row[2] = "Plant Master จาก rmr_sso.Plant แบบ read-only และ sync เข้า CPAC";
      return row;
    },
  );
  updateRows(
    enums,
    (row) => row[0] === "location_source" && row[1] === "ADMIN",
    (row) => {
      row[2] = "Admin สร้างใน CPAC_Safety; แก้ไขและ soft-delete ได้";
      return row;
    },
  );
  updateRows(
    enums,
    (row) => row[0] === "location_status" && row[1] === "INACTIVE",
    (row) => {
      row[2] = "ระงับใช้งาน/ไม่พบในรอบ sync ล่าสุด โดยไม่ลบทิ้ง";
      return row;
    },
  );
  setSheetValues(workbook, "Enums & Status", enums);

  const dataFlow = getSheetValues(workbook, "Data Flow");
  updateRows(
    dataFlow,
    (row) => row[1] === "Import DataOcean",
    (row) => {
      row[1] = "RMR SSO Plant Sync";
      row[2] = "Scheduled job หรือ Admin เริ่ม incremental sync";
      row[3] = "อ่าน rmr_sso.Plant แบบ SELECT-only → Validate → Upsert locations source=RMR_SSO_PLANT → Upsert plant_location_details → เก็บผล import";
      row[4] = "location_import_batches, location_import_rows, organizations, locations, plant_location_details";
      row[5] = "ใช้ (source, external_key) ป้องกันซ้ำ; รายการที่หายเปลี่ยน INACTIVE; ห้ามเขียนกลับ rmr_sso.Plant";
      return row;
    },
  );
  updateRows(
    dataFlow,
    (row) => row[1] === "Import Plant/Site/Office",
    (row) => {
      row[1] = "Sync Plant / Import Site & Office";
      row[2] = "RMR sync job หรือ Admin/API นำเข้าพิกัด";
      row[3] = "Plant sync จาก rmr_sso.Plant; Site/Office ใช้แหล่งเดิม → Upsert locations กลางและ detail table";
      row[5] = "ทุกชนิดอ้าง locations.id; API ไม่ query ข้ามฐานในทุก request";
      return row;
    },
  );
  setSheetValues(workbook, "Data Flow", dataFlow);
  appendRows(workbook, "Data Flow", [
    [
      "10",
      "Admin Plant Create",
      "Admin เพิ่มโรงงานในเว็บ Safety",
      "Validate code/name/GPS → INSERT locations type=PLANT, source=ADMIN, created_by=user → INSERT plant_location_details",
      "users, locations, plant_location_details, audit_logs",
      "ไม่เขียนกลับ rmr_sso.Plant; แก้ไขและ soft-delete ได้เฉพาะ source=ADMIN",
    ],
  ]);

  const locationMapping = getSheetValues(workbook, "Location Source Mapping");
  locationMapping[1][0] = "RMR SSO Plant, Admin Plant, Site, Office และ Custom location เข้าสู่ locations กลาง";
  updateRows(
    locationMapping,
    (row) => row[0] === "Plant Master",
    (row) => {
      row[0] = "RMR SSO Plant Master";
      row[2] = "RMR_SSO_PLANT";
      row[3] = "Plant key";
      row[5] = "Plant key, Plant name, latitude, longitude";
      row[6] = "อ่าน rmr_sso.Plant แบบ read-only → validate → locations.position POINT SRID 4326";
      row[7] = "สถานะต้นทาง → ACTIVE/CLOSED; ไม่พบในรอบ sync → INACTIVE";
      row[8] = "Mirror เข้า CPAC; readOnly=true; ห้ามแก้/ลบผ่านเว็บ";
      return row;
    },
  );
  setSheetValues(workbook, "Location Source Mapping", locationMapping);
  appendRows(workbook, "Location Source Mapping", [
    [
      "Admin Plant",
      "PLANT",
      "ADMIN",
      "Admin plant code",
      "plant_location_details",
      "plant code, plant name, latitude, longitude, created_by",
      "Admin ปักหมุด → locations.position POINT SRID 4326",
      "ACTIVE/INACTIVE; soft delete เท่านั้น",
      "เก็บใน CPAC_Safety และไม่เขียนกลับ rmr_sso.Plant; แก้ไขได้",
    ],
  ]);

  const locationsPage = getSheetValues(workbook, "locations");
  locationsPage[1][0] = "Location | Phase 1 | Critical | Master ภายใน CPAC สำหรับ Map/Check-in รวม RMR SSO Plant mirror และ Admin Plant";
  updateRows(
    locationsPage,
    (row) => row[0] === "source",
    (row) => {
      row[8] = "แหล่งที่มาและสิทธิ์แก้ไข";
      row[9] = "RMR_SSO_PLANT";
      row[10] = "RMR_SSO_PLANT read-only; ADMIN แก้ไขได้";
      row[12] = "Plant API คืน readOnly ตาม source";
      return row;
    },
  );
  updateRows(
    locationsPage,
    (row) => row[0] === "external_key",
    (row) => {
      row[8] = "Plant key หรือรหัสจากระบบต้นทาง";
      row[10] = "Unique ร่วมกับ source";
      row[12] = "RMR sync upsert ด้วย source + external_key";
      return row;
    },
  );
  updateRows(
    locationsPage,
    (row) => row[0] === "plant_type",
    (row) => {
      row[8] = "ประเภทโรงงานจาก rmr_sso.Plant หรือ Admin";
      return row;
    },
  );
  setSheetValues(workbook, "locations", locationsPage);

  const importBatchPage = getSheetValues(workbook, "location_import_batches");
  importBatchPage[1][0] = "Location | Phase 1 | High | หัวรายการ sync/import Master สถานที่จาก RMR SSO และแหล่งภายนอก";
  updateRows(
    importBatchPage,
    (row) => row[0] === "purpose_th",
    (row) => {
      row[1] = "หัวรายการ sync/import Master สถานที่จาก RMR SSO และแหล่งภายนอก";
      return row;
    },
  );
  updateRows(
    importBatchPage,
    (row) => row[0] === "file_name",
    (row) => {
      row[8] = "ชื่อไฟล์หรือตัวระบุ sync job";
      row[9] = "rmr_sso_plant_incremental";
      row[12] = "RMR sync อาจไม่มีไฟล์จริง";
      return row;
    },
  );
  updateRows(
    importBatchPage,
    (row) => row[0] === "source",
    (row) => {
      row[8] = "ระบบต้นทาง";
      row[9] = "RMR_SSO_PLANT";
      row[10] = "ต้องระบุ source ต่อ job";
      row[12] = "DATAOCEAN default เป็น legacy";
      return row;
    },
  );
  setSheetValues(workbook, "location_import_batches", importBatchPage);

  const importRowsPage = getSheetValues(workbook, "location_import_rows");
  importRowsPage[1][0] = "Location | Phase 1 | High | ผล sync/import และข้อมูลต้นฉบับรายแถวจากแต่ละ source";
  updateRows(
    importRowsPage,
    (row) => row[0] === "purpose_th",
    (row) => {
      row[1] = "ผล sync/import และข้อมูลต้นฉบับรายแถวจากแต่ละ source";
      return row;
    },
  );
  updateRows(
    importRowsPage,
    (row) => row[0] === "external_key",
    (row) => {
      row[8] = "Plant key หรือ external key ที่อ่านได้";
      row[12] = "ใช้คู่กับ source ของ batch";
      return row;
    },
  );
  setSheetValues(workbook, "location_import_rows", importRowsPage);

  const plantPage = getSheetValues(workbook, "plant_location_details");
  plantPage[1][0] = "Locations | Phase 1 | High | รายละเอียดโรงงานจาก rmr_sso.Plant mirror หรือโรงงานที่ Admin เพิ่ม";
  updateRows(
    plantPage,
    (row) => row[0] === "purpose_th",
    (row) => {
      row[1] = "เก็บรายละเอียดโรงงานจาก rmr_sso.Plant แบบ read-only mirror และ source=ADMIN โดยผูกกับ locations";
      return row;
    },
  );
  updateRows(
    plantPage,
    (row) => row[0] === "plant_no",
    (row) => {
      row[8] = "Plant key จาก RMR SSO หรือรหัสโรงงานที่ Admin กำหนด";
      row[12] = "ใช้คู่กับ locations.external_key และ source";
      return row;
    },
  );
  updateRows(
    plantPage,
    (row) => row[0] === "source_raw",
    (row) => {
      row[8] = "ข้อมูลต้นฉบับจาก rmr_sso.Plant เพื่อ audit การ sync";
      row[12] = "รายการ ADMIN อาจเก็บ payload form หรือ NULL";
      return row;
    },
  );
  setSheetValues(workbook, "plant_location_details", plantPage);
}

function updateApiWorkbook(workbook) {
  const summary = getSheetValues(workbook, "00_Summary");
  updateRows(
    summary,
    (row) => row[0] === "Locations",
    (row) => {
      row[1] = "มี locations repository/API และ RMR SSO Plant sync design";
      row[2] = "rmr_sso.Plant read-only → mirror CPAC; Admin Plant เก็บ source=ADMIN";
      row[4] = "ห้าม query ข้ามฐานทุก request และห้ามเขียน Plant Master";
      return row;
    },
  );
  setSheetValues(workbook, "00_Summary", summary);

  const inventory = getSheetValues(workbook, "01_API_Inventory");
  updateRows(
    inventory,
    (row) => row[2] === "/api/auth/logout",
    (row) => {
      row[1] = "GET";
      row[5] = "เมื่อผู้ใช้เปิด logout endpoint";
      row[10] = "มี dedicated route และล้าง session cookie";
      return row;
    },
  );
  updateRows(
    inventory,
    (row) => normalizeApiPath(row[2]) === "/api/locations/plants" && row[1] === "GET",
    (row) => {
      row[3] = "รายการโรงงานจาก CPAC mirror รวม RMR SSO Plant และ Admin Plant";
      row[7] = "Required page/pageSize";
      row[9] = "Existing";
      row[10] = "อ่าน CPAC locations; คืน source, externalKey, readOnly; ไม่ query rmr_sso ทุก request";
      return row;
    },
  );
  updateRows(
    inventory,
    (row) => normalizeApiPath(row[2]) === "/api/locations" && row[1] === "POST",
    (row) => {
      row[3] = "เพิ่ม location; ถ้า type=PLANT บังคับ source=ADMIN";
      row[9] = "Existing";
      row[10] = "เขียน CPAC_Safety.locations; Plant Admin ไม่เขียนกลับ rmr_sso.Plant";
      return row;
    },
  );
  updateRows(
    inventory,
    (row) => normalizeApiPath(row[2]) === "/api/locations/:id" && ["PATCH", "DELETE"].includes(row[1]),
    (row) => {
      row[3] = row[1] === "PATCH" ? "แก้ไข location ที่ source อนุญาต" : "soft delete location ที่ source อนุญาต";
      row[9] = "Existing";
      row[10] = "อนุญาต ADMIN/USER ตามสิทธิ์; RMR_SSO_PLANT ต้องตอบ 403 source_read_only";
      return row;
    },
  );
  updateRows(
    inventory,
    (row) => normalizeApiPath(row[2]) === "/api/location-imports" && row[1] === "POST",
    (row) => {
      row[3] = "เริ่ม import/sync location master";
      row[4] = "Admin/Scheduled job";
      row[5] = "Admin import หรือ incremental RMR Plant sync";
      row[7] = "Upload/job";
      row[10] = "รองรับ body {source:\"RMR_SSO_PLANT\"}; SELECT-only แล้ว upsert CPAC mirror";
      return row;
    },
  );
  for (let index = 1; index < inventory.length; index += 1) {
    const row = inventory[index];
    const routeKey = `${row[1]} ${normalizeApiPath(row[2])}`;
    row[9] = implementedApiRoutes.has(routeKey) ? "Existing" : "Target";
    if (row[9] === "Existing" && (!row[10] || row[10] === "มีแล้วใน repo")) {
      row[10] = "มี implementation ใน repo";
    }
  }
  setSheetValues(workbook, "01_API_Inventory", inventory);

  const checkinLocations = getSheetValues(workbook, "02_Checkin_Locations");
  updateRows(
    checkinLocations,
    (row) => row[0] === "โรงงาน list",
    (row) => {
      row[7] = "CPAC locations mirror; source + external_key unique";
      row[8] = "แสดง badge RMR/Admin และปิดแก้ไขเมื่อ readOnly=true";
      row[9] = "ไม่ query rmr_sso.Plant ทุก request; ใช้ local ID สำหรับ Check-in";
      return row;
    },
  );
  setSheetValues(workbook, "02_Checkin_Locations", checkinLocations);

  const tableMapping = getSheetValues(workbook, "06_Table_Mapping");
  updateRows(
    tableMapping,
    (row) => row[0] === "/api/locations/plants|offices|sites|custom",
    (row) => {
      row[1] = "locations";
      row[2] = "plant_location_details, organizations";
      row[4] = "Plant อ่าน CPAC mirror; source=RMR_SSO_PLANT read-only, source=ADMIN editable";
      return row;
    },
  );
  setSheetValues(workbook, "06_Table_Mapping", tableMapping);
  appendRows(workbook, "06_Table_Mapping", [
    [
      "POST /api/location-imports {source=RMR_SSO_PLANT}",
      "location_import_batches, location_import_rows",
      "rmr_sso.Plant (SELECT-only), locations, plant_location_details",
      "Read external / Write CPAC",
      "incremental upsert by source + external_key; missing source rows become INACTIVE",
    ],
  ]);

  const payloads = getSheetValues(workbook, "07_Payload_Response");
  updateRows(
    payloads,
    (row) => row[0] === "GET /api/locations/map",
    (row) => {
      row[2] = "{\"ok\":true,\"data\":{\"locations\":[{\"id\":\"500\",\"nameTh\":\"...\",\"source\":\"RMR_SSO_PLANT\",\"externalKey\":\"13A1\",\"readOnly\":true,\"lat\":13.8,\"lng\":100.5}]}}";
      row[3] = "bbox required; cap markers; Plant ใช้ CPAC mirror";
      return row;
    },
  );
  setSheetValues(workbook, "07_Payload_Response", payloads);
  appendRows(workbook, "07_Payload_Response", [
    [
      "GET /api/locations/plants",
      "?page=1&pageSize=50&search=คลองเตย",
      "{\"ok\":true,\"data\":{\"items\":[{\"id\":\"500\",\"source\":\"RMR_SSO_PLANT\",\"externalKey\":\"13A1\",\"readOnly\":true}]}}",
      "อ่านจาก CPAC mirror และใช้ local id สำหรับ Map/Check-in",
    ],
    [
      "POST /api/locations",
      "{\"locationType\":\"PLANT\",\"code\":\"ADM-001\",\"nameTh\":\"โรงงานใหม่\",\"lat\":13.7,\"lng\":100.5}",
      "{\"ok\":true,\"data\":{\"location\":{\"source\":\"ADMIN\",\"readOnly\":false}}}",
      "Server บังคับ source=ADMIN และเก็บ created_by",
    ],
    [
      "POST /api/location-imports",
      "{\"source\":\"RMR_SSO_PLANT\",\"mode\":\"incremental\"}",
      "{\"ok\":true,\"data\":{\"importId\":\"1001\",\"status\":\"PROCESSING\"}}",
      "อ่าน RMR แบบ SELECT-only; upsert CPAC; missing rows → INACTIVE",
    ],
  ]);

  const scaleRules = getSheetValues(workbook, "08_Scale_Rules");
  updateRows(
    scaleRules,
    (row) => row[0] === "Caching",
    (row) => {
      row[1] = "Plant list อ่าน CPAC mirror และ cache read-heavy endpoints";
      row[2] = "หลีกเลี่ยง cross-database query ทุก request";
      row[3] = "RMR Plant sync, templates, rewards, leaderboard";
      return row;
    },
  );
  updateRows(
    scaleRules,
    (row) => row[0] === "Audit",
    (row) => {
      row[1] = "write/admin endpoints และ Plant sync ต้อง audit";
      row[2] = "traceability และแยกข้อมูล Master/ADMIN";
      row[3] = "location sync, admin CRUD, rewards, events";
      return row;
    },
  );
  setSheetValues(workbook, "08_Scale_Rules", scaleRules);
  appendRows(workbook, "08_Scale_Rules", [
    ["External DB", "RMR_SSO_DATABASE_URL ใช้ pool แยกและ SELECT เฉพาะ rmr_sso.Plant", "จำกัด blast radius และป้องกันแก้ Master", "Plant sync job"],
    ["Sync key", "Upsert ด้วย source + external_key และเปลี่ยน missing rows เป็น INACTIVE", "ป้องกันข้อมูลซ้ำและรักษาประวัติ", "locations"],
  ]);

  const backlog = getSheetValues(workbook, "09_Backlog");
  updateRows(
    backlog,
    (row) => row[1] === "แยก locations API ตาม plants/offices/sites/map/search",
    (row) => {
      row[1] = "ทำ RMR SSO Plant incremental sync เข้า CPAC mirror";
      row[2] = "Plant Master ต้อง read-only แต่ Check-in ต้องใช้ locations.id";
      row[3] = "Backend/Infra";
      row[4] = "sync upsert ได้, missing→INACTIVE, ไม่มี write ไป rmr_sso.Plant";
      return row;
    },
  );
  updateRows(
    backlog,
    (row) => row[1] === "ปรับ frontend check-in ให้เรียก API แทน mock/localStorage",
    (row) => {
      row[2] = "ข้อมูลจริงต้องมาจาก CPAC mirror และ Admin Plant API";
      row[4] = "เห็น source/readOnly, เลือก Check-in ด้วย local id และแก้ RMR Plant ไม่ได้";
      return row;
    },
  );
  setSheetValues(workbook, "09_Backlog", backlog);
  appendRows(workbook, "09_Backlog", [
    ["P0", "เชื่อมหน้า Admin Plant กับ API", "ปัจจุบันยังใช้ localStorage", "Frontend", "เพิ่มโรงงานแล้ว source=ADMIN ใน CPAC และ refresh แล้วยังอยู่"],
    ["P0", "บังคับ source read-only ใน PATCH/DELETE", "ป้องกันแก้ RMR Master ผ่าน Safety", "Backend", "RMR_SSO_PLANT ตอบ 403 source_read_only"],
    ["P1", "ตั้ง scheduled incremental Plant sync", "ลดข้อมูลล้าสมัยและไม่ query ข้ามฐานทุก request", "Infra/Backend", "มี monitoring, retry และ import history"],
  ]);

  const counts = getSheetValues(workbook, "10_API_Counts");
  const apiRows = inventory.slice(1).filter((row) => row[0] && row[1] && row[2]);
  const moduleCounts = new Map();
  for (const row of apiRows) {
    const module = row[0];
    const current = moduleCounts.get(module) || { total: 0, existing: 0, target: 0 };
    current.total += 1;
    if (row[9] === "Existing") current.existing += 1;
    else current.target += 1;
    moduleCounts.set(module, current);
  }
  for (let index = 1; index < counts.length; index += 1) {
    const module = counts[index][0];
    if (!moduleCounts.has(module)) continue;
    const current = moduleCounts.get(module);
    counts[index][1] = current.total;
    counts[index][2] = current.existing;
    counts[index][3] = current.target;
    if (module === "Locations") counts[index][4] = "Plant ใช้ CPAC mirror; RMR read-only และ Admin editable";
  }
  const totalRow = counts.find((row) => String(row[0]).toLowerCase().includes("total"));
  if (totalRow) {
    totalRow[1] = apiRows.length;
    totalRow[2] = apiRows.filter((row) => row[9] === "Existing").length;
    totalRow[3] = apiRows.filter((row) => row[9] === "Target").length;
  }
  setSheetValues(workbook, "10_API_Counts", counts);
}

async function renderAllSheets(workbook, workbookLabel) {
  const sheetInfo = await workbook.inspect({ kind: "sheet", include: "name", maxChars: 20000 });
  const sheets = sheetInfo.ndjson
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((item) => item.kind === "sheet");
  const manifest = [];
  for (let index = 0; index < sheets.length; index += 1) {
    const sheet = sheets[index];
    const safeName = sheet.name.replace(/[^\p{L}\p{N}_-]+/gu, "_");
    const match = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(sheet.range || "A1:A1");
    const firstCol = match?.[1] || "A";
    const firstRow = Number(match?.[2] || 1);
    const lastCol = match?.[3] || "A";
    const lastRow = Number(match?.[4] || 1);
    const chunkSize = 60;
    for (let startRow = firstRow; startRow <= lastRow; startRow += chunkSize) {
      const endRow = Math.min(startRow + chunkSize - 1, lastRow);
      const range = `${firstCol}${startRow}:${lastCol}${endRow}`;
      const blob = await workbook.render({
        sheetName: sheet.name,
        range,
        scale: 0.6,
        format: "png",
      });
      const suffix = lastRow > chunkSize ? `_r${startRow}-${endRow}` : "";
      const filePath = path.join(
        previewDir,
        `${workbookLabel}_${String(index + 1).padStart(2, "0")}_${safeName}${suffix}.png`,
      );
      await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
      manifest.push(filePath);
    }
  }
  return manifest;
}

async function verifyWorkbook(filePath, checks) {
  const workbook = await loadWorkbook(filePath);
  const results = {};
  for (const [name, range] of Object.entries(checks)) {
    results[name] = (
      await workbook.inspect({
        kind: "table",
        range,
        include: "values,formulas",
        tableMaxRows: 80,
        tableMaxCols: 16,
        maxChars: 30000,
      })
    ).ndjson;
  }
  results.formulaErrors = (
    await workbook.inspect({
      kind: "match",
      searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
      options: { useRegex: true, maxResults: 300 },
      summary: "final formula error scan",
      maxChars: 12000,
    })
  ).ndjson;
  return results;
}

async function main() {
  const [databaseWorkbook, apiWorkbook] = await Promise.all([
    loadWorkbook(databasePath),
    loadWorkbook(apiPath),
  ]);

  if (process.env.MODE === "inspect") {
    console.log("DATABASE");
    console.log(await workbookSummary(databaseWorkbook));
    console.log("API");
    console.log(await workbookSummary(apiWorkbook));
    return;
  }

  if (process.env.MODE === "inspect-targets") {
    for (const name of [
      "Database Setup",
      "README",
      "DataOcean Mapping",
      "Enums & Status",
      "Data Flow",
      "Location Source Mapping",
    ]) {
      console.log(`DATABASE:${name}`);
      console.log(JSON.stringify(getSheetValues(databaseWorkbook, name)));
    }
    for (const name of [
      "00_Summary",
      "01_API_Inventory",
      "02_Checkin_Locations",
      "06_Table_Mapping",
      "07_Payload_Response",
      "08_Scale_Rules",
      "09_Backlog",
      "10_API_Counts",
    ]) {
      console.log(`API:${name}`);
      console.log(JSON.stringify(getSheetValues(apiWorkbook, name)));
    }
    return;
  }

  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(previewDir, { recursive: true });

  updateDatabaseWorkbook(databaseWorkbook);
  updateApiWorkbook(apiWorkbook);

  const databasePreviewFiles = await renderAllSheets(databaseWorkbook, "database");
  const apiPreviewFiles = await renderAllSheets(apiWorkbook, "api");

  const databaseOutput = path.join(outputDir, "CPAC_Safety_Database_Complete.xlsx");
  const apiOutput = path.join(outputDir, "SUEA_Safety_API_Inventory.xlsx");
  await (await SpreadsheetFile.exportXlsx(databaseWorkbook)).save(databaseOutput);
  await (await SpreadsheetFile.exportXlsx(apiWorkbook)).save(apiOutput);

  const databaseVerification = await verifyWorkbook(databaseOutput, {
    setup: "Database Setup!A1:D28",
    readme: "README!A1:B34",
    index: "Complete Index!A1:D59",
    sourceMapping: "External Source Mapping!A1:G23",
    locationMapping: "Location Source Mapping!A1:I9",
    tableSummary: "Table Summary!A1:H46",
    columnDictionary: "Column Dictionary!A1:N423",
  });
  const apiVerification = await verifyWorkbook(apiOutput, {
    summary: "00_Summary!A1:E10",
    inventory: "01_API_Inventory!A1:K156",
    locations: "02_Checkin_Locations!A1:J8",
    mapping: "06_Table_Mapping!A1:E21",
    payloads: "07_Payload_Response!A1:D11",
    scale: "08_Scale_Rules!A1:D13",
    backlog: "09_Backlog!A1:E14",
    counts: "10_API_Counts!A1:E27",
  });

  await fs.writeFile(
    path.join(outputDir, "verification.json"),
    JSON.stringify(
      {
        previews: {
          database: databasePreviewFiles,
          api: apiPreviewFiles,
        },
        databaseVerification,
        apiVerification,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      databaseOutput,
      apiOutput,
      databasePreviewCount: databasePreviewFiles.length,
      apiPreviewCount: apiPreviewFiles.length,
    }),
  );
}

await main();
