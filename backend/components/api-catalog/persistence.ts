import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";

import { queryRows, withTransaction } from "@backend/components/core/db";
import { syncRmrPlants } from "@backend/components/safety-effort/locations/rmr-plant-sync";

type CatalogSession = {
  user?: {
    id?: string;
  };
} | null;

type RouteMatch = {
  route: {
    path: string;
  };
  params: Record<string, string>;
};

type ParsedBody = {
  contentType?: string;
  json?: Record<string, unknown> | null;
  fields?: Record<string, string>;
  files?: Array<{
    field: string;
    name: string;
    type: string;
    size: number;
    bytes?: Uint8Array;
  }>;
};

type DbRow = RowDataPacket & Record<string, unknown>;
type JsonInput = Record<string, any>;

const TABLE_COLUMNS = {
  organizations: ["parent_id", "organization_type", "external_code", "name_th", "name_en", "status"],
  users: ["organization_id", "employee_no", "email", "name_th", "name_en", "position_name", "profile_image_url", "status"],
  roles: ["code", "name", "description"],
  permissions: ["code", "description"],
  safety_activities: ["checkin_id", "activity_type", "title", "status", "started_at", "completed_at", "notes"],
  assessment_templates: ["code", "name", "version", "status", "created_by"],
  assessment_questions: ["template_id", "question_code", "question_text", "answer_type", "options_json", "is_required", "sort_order"],
  assessment_runs: ["activity_id", "template_id", "assessor_id", "status", "score", "submitted_at"],
  assessment_answers: ["assessment_run_id", "question_id", "answer_json", "score", "notes"],
  safety_findings: ["activity_id", "reported_by", "severity", "description", "status", "due_at"],
  corrective_actions: ["finding_id", "assignee_id", "action_text", "status", "due_at", "completed_at"],
  awareness_questions: ["question_text", "options_json", "correct_answer_json", "status"],
  holidays: ["holiday_date", "name"],
  point_rules: ["code", "source_type", "points", "status"],
  rewards: ["code", "name", "points_required", "stock_qty", "status"],
} as const;

const JSON_COLUMNS = new Set([
  "options_json",
  "answer_json",
  "correct_answer_json",
  "payload",
  "metadata",
  "before_data",
  "after_data",
]);

const SOFT_DELETE_TABLES = new Set([
  "organizations",
  "users",
  "safety_activities",
  "assessment_templates",
  "safety_findings",
  "rewards",
]);

function jsonData(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

function jsonError(error: unknown, status = 400) {
  return NextResponse.json(
    { ok: false, error: error instanceof Error ? error.message : String(error || "error") },
    { status },
  );
}

function bodyJson(body: unknown): JsonInput {
  if (!body || typeof body !== "object") return {};
  const parsed = body as ParsedBody;
  if (parsed.json && typeof parsed.json === "object") return parsed.json;
  return parsed.fields || {};
}

function snakeCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();
}

function normalizeValue(column: string, value: unknown) {
  if (value === undefined) return undefined;
  if (value === "") return null;
  if (JSON_COLUMNS.has(column) && value !== null && typeof value !== "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}

function pickColumns(input: JsonInput, columns: readonly string[], defaults: Record<string, unknown> = {}) {
  const normalized = new Map<string, unknown>();
  for (const [key, value] of Object.entries(input)) normalized.set(snakeCase(key), value);
  const result: Record<string, unknown> = {};
  for (const column of columns) {
    const value = normalized.has(column) ? normalized.get(column) : defaults[column];
    const next = normalizeValue(column, value);
    if (next !== undefined) result[column] = next;
  }
  return result;
}

function pageParams(request: NextRequest, maximum = 200) {
  const page = Math.max(Number(request.nextUrl.searchParams.get("page") || 1), 1);
  const pageSize = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("pageSize") || request.nextUrl.searchParams.get("limit") || 50), 1),
    maximum,
  );
  return { page, pageSize, offset: (page - 1) * pageSize };
}

function cursorLimit(request: NextRequest, maximum = 100) {
  return Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") || 30), 1), maximum);
}

function serializeRow(row: Record<string, unknown>) {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) output[key] = value.toISOString();
    else if (typeof value === "bigint") output[key] = value.toString();
    else if (Buffer.isBuffer(value)) output[key] = value.toString();
    else if (typeof value === "string" && (key.endsWith("_json") || key === "payload" || key.endsWith("_data"))) {
      try {
        output[key] = JSON.parse(value);
      } catch {
        output[key] = value;
      }
    } else output[key] = value;
  }
  return output;
}

async function listRows(
  table: string,
  request: NextRequest,
  options: {
    where?: string[];
    params?: Record<string, unknown>;
    orderBy?: string;
    select?: string;
    maxPageSize?: number;
  } = {},
) {
  const { page, pageSize, offset } = pageParams(request, options.maxPageSize);
  const where = [...(options.where || [])];
  if (SOFT_DELETE_TABLES.has(table)) where.push("deleted_at IS NULL");
  const params = { ...(options.params || {}), limit: pageSize, offset };
  const rows = await queryRows<DbRow>(
    `SELECT ${options.select || "*"} FROM ${table}
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY ${options.orderBy || "id DESC"}
     LIMIT :limit OFFSET :offset`,
    params,
  );
  const countRows = await queryRows<DbRow>(
    `SELECT COUNT(*) AS total FROM ${table}
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}`,
    options.params || {},
  );
  const total = Number(countRows[0]?.total || 0);
  return {
    items: rows.map(serializeRow),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    nextPage: page * pageSize < total ? page + 1 : null,
  };
}

async function attachUserRolesToList<T extends { items: Array<Record<string, unknown>> }>(list: T): Promise<T> {
  const userIds = list.items.map((item) => String(item.id || "")).filter(Boolean);
  if (!userIds.length) return list;

  const roleRows = await queryRows<DbRow>(
    `
      SELECT
        ur.user_id,
        r.id AS role_id,
        r.code AS role_code,
        r.name AS role_name
      FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id IN (:userIds)
      ORDER BY r.code
    `,
    { userIds },
  );
  const rolesByUser = new Map<string, Array<Record<string, unknown>>>();
  for (const row of roleRows) {
    const userId = String(row.user_id || "");
    const roles = rolesByUser.get(userId) || [];
    roles.push({
      id: String(row.role_id || ""),
      code: String(row.role_code || ""),
      name: String(row.role_name || row.role_code || ""),
    });
    rolesByUser.set(userId, roles);
  }

  return {
    ...list,
    items: list.items.map((item) => {
      const roles = rolesByUser.get(String(item.id || "")) || [];
      return {
        ...item,
        roles,
        role_codes: roles.map((role) => role.code),
      };
    }),
  };
}

async function attachUserRolesToRow(user: Record<string, unknown> | null) {
  if (!user?.id) return user;
  const list = await attachUserRolesToList({ items: [user] });
  return list.items[0] || user;
}

async function getRow(table: string, id: string, select = "*") {
  const where = ["id = :id"];
  if (SOFT_DELETE_TABLES.has(table)) where.push("deleted_at IS NULL");
  const rows = await queryRows<DbRow>(
    `SELECT ${select} FROM ${table} WHERE ${where.join(" AND ")} LIMIT 1`,
    { id },
  );
  return rows[0] ? serializeRow(rows[0]) : null;
}

async function insertRow(table: keyof typeof TABLE_COLUMNS, input: JsonInput, defaults: Record<string, unknown> = {}) {
  const values = pickColumns(input, TABLE_COLUMNS[table], defaults);
  const columns = Object.keys(values);
  if (!columns.length) throw new Error("empty_payload");
  const placeholders = columns.map((column) => `:${column}`);
  const id = await withTransaction(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
      values as never,
    );
    return String(result.insertId);
  });
  return getRow(table, id);
}

async function updateRow(table: keyof typeof TABLE_COLUMNS, id: string, input: JsonInput) {
  const values = pickColumns(input, TABLE_COLUMNS[table]);
  const columns = Object.keys(values);
  if (!columns.length) return getRow(table, id);
  await withTransaction(async (connection) => {
    await connection.execute<ResultSetHeader>(
      `UPDATE ${table} SET ${columns.map((column) => `${column} = :${column}`).join(", ")} WHERE id = :id`,
      { ...values, id } as never,
    );
  });
  return getRow(table, id);
}

async function deleteRow(table: keyof typeof TABLE_COLUMNS, id: string) {
  await withTransaction(async (connection) => {
    if (SOFT_DELETE_TABLES.has(table)) {
      await connection.execute<ResultSetHeader>(
        `UPDATE ${table} SET deleted_at = UTC_TIMESTAMP(3), status = 'INACTIVE' WHERE id = :id AND deleted_at IS NULL`,
        { id },
      );
    } else {
      await connection.execute<ResultSetHeader>(`DELETE FROM ${table} WHERE id = :id`, { id });
    }
  });
  return { deleted: true };
}

async function audit(input: {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  before?: unknown;
  after?: unknown;
  request?: NextRequest;
}) {
  await withTransaction(async (connection) => {
    await connection.execute<ResultSetHeader>(
      `INSERT INTO audit_logs
       (actor_user_id, action, entity_type, entity_id, before_data, after_data, ip_address)
       VALUES (:actorUserId, :action, :entityType, :entityId, :beforeData, :afterData, :ipAddress)`,
      {
        actorUserId: input.actorUserId || null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId || null,
        beforeData: input.before === undefined ? null : JSON.stringify(input.before),
        afterData: input.after === undefined ? null : JSON.stringify(input.after),
        ipAddress: input.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      },
    );
  });
}

async function createCultureEvent(input: JsonInput, userId?: string | null) {
  const id = await withTransaction(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO safety_culture_events
       (title, description, event_start_at, event_end_at, location_text, status, metadata, created_by)
       VALUES (:title, :description, :eventStartAt, :eventEndAt, :locationText, :status, :metadata, :createdBy)`,
      {
        title: input.title || input.name || "Safety Event",
        description: input.description || input.body || null,
        eventStartAt: input.eventStartAt || input.startAt || null,
        eventEndAt: input.eventEndAt || input.endAt || null,
        locationText: input.locationText || input.location || null,
        status: input.status || "DRAFT",
        metadata: JSON.stringify(input.metadata || input),
        createdBy: userId || null,
      },
    );
    return String(result.insertId);
  });
  return getRow("safety_culture_events", id);
}

async function updateCultureEvent(id: string, input: JsonInput) {
  const values = {
    title: input.title || input.name || undefined,
    description: input.description || input.body,
    event_start_at: input.eventStartAt || input.startAt,
    event_end_at: input.eventEndAt || input.endAt,
    location_text: input.locationText || input.location,
    status: input.status,
    metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
  };
  const columns = Object.entries(values).filter(([, value]) => value !== undefined);
  if (columns.length) {
    await withTransaction(async (connection) => {
      await connection.execute<ResultSetHeader>(
        `UPDATE safety_culture_events
         SET ${columns.map(([column]) => `${column} = :${column}`).join(", ")}
         WHERE id = :id AND deleted_at IS NULL`,
        Object.fromEntries([...columns, ["id", id]]) as never,
      );
    });
  }
  return getRow("safety_culture_events", id);
}

async function createMediaAsset(input: JsonInput, userId?: string | null) {
  const id = await withTransaction(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO media_assets
       (file_name, original_name, mime_type, size_bytes, status, module, owner_type, owner_id, link_type, upload_mode, storage_path, public_url, metadata, created_by)
       VALUES (:fileName, :originalName, :mimeType, :sizeBytes, :status, :module, :ownerType, :ownerId, :linkType, :uploadMode, :storagePath, :publicUrl, :metadata, :createdBy)`,
      {
        fileName: input.fileName,
        originalName: input.originalName || input.fileName || null,
        mimeType: input.mimeType || null,
        sizeBytes: Number(input.size || input.sizeBytes || 0),
        status: input.status || "READY",
        module: input.module || null,
        ownerType: input.ownerType || null,
        ownerId: input.ownerId || null,
        linkType: input.linkType || null,
        uploadMode: input.uploadMode || "server",
        storagePath: input.storagePath || null,
        publicUrl: input.publicUrl || null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        createdBy: userId || null,
      },
    );
    return String(result.insertId);
  });
  return getRow("media_assets", id);
}

async function updateMediaAsset(id: string, input: JsonInput) {
  const values = pickColumns(input, [
    "status",
    "module",
    "owner_type",
    "owner_id",
    "link_type",
    "upload_mode",
    "storage_path",
    "public_url",
    "metadata",
    "deleted_at",
  ]);
  const columns = Object.keys(values);
  if (columns.length) {
    await withTransaction(async (connection) => {
      await connection.execute<ResultSetHeader>(
        `UPDATE media_assets SET ${columns.map((column) => `${column} = :${column}`).join(", ")}
         WHERE id = :id AND deleted_at IS NULL`,
        { ...values, id } as never,
      );
    });
  }
  return getRow("media_assets", id);
}

async function createExportJob(input: JsonInput, userId?: string | null) {
  const jobType = String(input.jobType || input.type || "GENERIC_EXPORT");
  const id = await withTransaction(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO export_jobs
       (job_type, status, params, result_json, file_name, created_by, started_at, completed_at)
       VALUES (:jobType, 'COMPLETED', :params, :resultJson, :fileName, :createdBy, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
      {
        jobType,
        params: JSON.stringify(input),
        resultJson: JSON.stringify({ ready: true, jobType }),
        fileName: input.fileName || `${jobType.toLowerCase()}-${Date.now()}.csv`,
        createdBy: userId || null,
      },
    );
    return String(result.insertId);
  });
  return getRow("export_jobs", id);
}

async function getNotificationPreferences(userId: string) {
  const rows = await queryRows<DbRow>(
    "SELECT * FROM notification_preferences WHERE user_id = :userId LIMIT 1",
    { userId },
  );
  return rows[0]
    ? serializeRow(rows[0])
    : { user_id: userId, email_enabled: 1, in_app_enabled: 1, preferences_json: null };
}

async function updateNotificationPreferences(userId: string, input: JsonInput) {
  await withTransaction(async (connection) => {
    await connection.execute<ResultSetHeader>(
      `INSERT INTO notification_preferences (user_id, email_enabled, in_app_enabled, preferences_json)
       VALUES (:userId, :emailEnabled, :inAppEnabled, :preferencesJson)
       ON DUPLICATE KEY UPDATE
         email_enabled = VALUES(email_enabled),
         in_app_enabled = VALUES(in_app_enabled),
         preferences_json = VALUES(preferences_json)`,
      {
        userId,
        emailEnabled: input.email === false || input.emailEnabled === false ? 0 : 1,
        inAppEnabled: input.inApp === false || input.inAppEnabled === false ? 0 : 1,
        preferencesJson: JSON.stringify(input),
      },
    );
  });
  return getNotificationPreferences(userId);
}

async function handleOrganizations(request: NextRequest, method: string, match: RouteMatch, input: JsonInput, userId?: string) {
  const pathPattern = match.route.path;
  if (method === "GET" && pathPattern === "/api/organizations/tree") {
    const rows = await queryRows<DbRow>(
      `SELECT * FROM organizations WHERE deleted_at IS NULL ORDER BY parent_id, organization_type, name_th`,
    );
    const items = rows.map(serializeRow);
    const byParent = new Map<string, Record<string, unknown>[]>();
    for (const item of items) {
      const key = item.parent_id === null ? "root" : String(item.parent_id);
      const list = byParent.get(key) || [];
      list.push({ ...item, children: [] });
      byParent.set(key, list);
    }
    const attach = (parent: string): Record<string, unknown>[] =>
      (byParent.get(parent) || []).map((item) => ({ ...item, children: attach(String(item.id)) }));
    return jsonData({ items, tree: attach("root") });
  }
  if (method === "GET" && pathPattern === "/api/organizations") {
    const where: string[] = [];
    const params: Record<string, unknown> = {};
    const parentId = request.nextUrl.searchParams.get("parentId");
    const type = request.nextUrl.searchParams.get("type");
    if (parentId) { where.push("parent_id = :parentId"); params.parentId = parentId; }
    if (type) { where.push("organization_type = :type"); params.type = type; }
    return jsonData(await listRows("organizations", request, { where, params, orderBy: "name_th" }));
  }
  if (pathPattern === "/api/organizations/:id") {
    if (method === "GET") return jsonData({ organization: await getRow("organizations", match.params.id) });
    if (method === "PATCH") {
      const before = await getRow("organizations", match.params.id);
      const organization = await updateRow("organizations", match.params.id, input);
      await audit({ actorUserId: userId, action: "UPDATE", entityType: "ORGANIZATION", entityId: match.params.id, before, after: organization, request });
      return jsonData({ organization });
    }
    if (method === "DELETE") {
      const children = await queryRows<DbRow>("SELECT id FROM organizations WHERE parent_id = :id AND deleted_at IS NULL LIMIT 1", { id: match.params.id });
      if (children.length) return jsonError("organization_has_children", 409);
      await deleteRow("organizations", match.params.id);
      await audit({ actorUserId: userId, action: "DELETE", entityType: "ORGANIZATION", entityId: match.params.id, request });
      return jsonData({ deleted: true });
    }
  }
  if (method === "POST" && pathPattern === "/api/organizations") {
    const organization = await insertRow("organizations", input, { status: "ACTIVE" });
    await audit({ actorUserId: userId, action: "CREATE", entityType: "ORGANIZATION", entityId: String(organization?.id), after: organization, request });
    return jsonData({ organization }, { status: 201 });
  }
  return null;
}

async function handleUsersIam(request: NextRequest, method: string, match: RouteMatch, input: JsonInput, userId?: string) {
  const route = match.route.path;
  if (route === "/api/users/me") {
    if (!userId) return jsonError("unauthorized", 401);
    if (method === "GET") return jsonData({ user: await getRow("users", userId) });
    if (method === "PATCH") return jsonData({ user: await updateRow("users", userId, input) });
  }
  if (method === "GET" && route === "/api/users") {
    const where: string[] = [];
    const params: Record<string, unknown> = {};
    const search = request.nextUrl.searchParams.get("search");
    const organizationId = request.nextUrl.searchParams.get("organizationId");
    if (search) {
      where.push("(name_th LIKE :search OR name_en LIKE :search OR email LIKE :search OR employee_no LIKE :search)");
      params.search = `%${search}%`;
    }
    if (organizationId) { where.push("organization_id = :organizationId"); params.organizationId = organizationId; }
    const users = await listRows("users", request, { where, params, orderBy: "name_th" });
    return jsonData(await attachUserRolesToList(users));
  }
  if (method === "GET" && route === "/api/users/:id") return jsonData({ user: await attachUserRolesToRow(await getRow("users", match.params.id)) });
  if (method === "PATCH" && route === "/api/users/:id/status") {
    const user = await updateRow("users", match.params.id, { status: input.status || "INACTIVE" });
    await audit({ actorUserId: userId, action: "STATUS_CHANGE", entityType: "USER", entityId: match.params.id, after: user, request });
    return jsonData({ user });
  }
  if (route === "/api/roles") {
    if (method === "GET") return jsonData(await listRows("roles", request, { orderBy: "code", maxPageSize: 500 }));
    if (method === "POST") return jsonData({ role: await insertRow("roles", input) }, { status: 201 });
  }
  if (method === "PATCH" && route === "/api/roles/:id") return jsonData({ role: await updateRow("roles", match.params.id, input) });
  if (method === "GET" && route === "/api/permissions") return jsonData(await listRows("permissions", request, { orderBy: "code", maxPageSize: 500 }));
  if (method === "PUT" && route === "/api/users/:id/roles") {
    const roleIds = Array.isArray(input.roleIds) ? input.roleIds : [];
    await withTransaction(async (connection) => {
      await connection.execute("DELETE FROM user_roles WHERE user_id = :userId", { userId: match.params.id });
      for (const roleId of roleIds) {
        await connection.execute(
          "INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (:userId, :roleId, :assignedBy)",
          { userId: match.params.id, roleId, assignedBy: userId || null },
        );
      }
    });
    await audit({ actorUserId: userId, action: "ASSIGN_ROLES", entityType: "USER", entityId: match.params.id, after: { roleIds }, request });
    return jsonData({ userId: match.params.id, roleIds });
  }
  if (method === "PUT" && route === "/api/roles/:id/permissions") {
    const permissionIds = Array.isArray(input.permissionIds) ? input.permissionIds : [];
    await withTransaction(async (connection) => {
      await connection.execute("DELETE FROM role_permissions WHERE role_id = :roleId", { roleId: match.params.id });
      for (const permissionId of permissionIds) {
        await connection.execute(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES (:roleId, :permissionId)",
          { roleId: match.params.id, permissionId },
        );
      }
    });
    return jsonData({ roleId: match.params.id, permissionIds });
  }
  return null;
}

async function handleCheckinExtras(request: NextRequest, method: string, match: RouteMatch, input: JsonInput, userId?: string) {
  const route = match.route.path;
  if (method === "GET" && route === "/api/checkins/nearby") {
    const lat = Number(request.nextUrl.searchParams.get("lat"));
    const lng = Number(request.nextUrl.searchParams.get("lng"));
    const radiusM = Math.min(Math.max(Number(request.nextUrl.searchParams.get("radiusM") || 5000), 1), 100000);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return jsonError("lat_lng_required");
    const rows = await queryRows<DbRow>(
      `SELECT id, location_type, source, external_key, code, name_th, name_en,
       ST_Y(position) lat, ST_X(position) lng,
       ST_Distance_Sphere(position, ST_SRID(POINT(:lng, :lat), 4326)) distance_m
       FROM locations
       WHERE deleted_at IS NULL AND status = 'ACTIVE' AND checkin_enabled = 1
       HAVING distance_m <= :radiusM ORDER BY distance_m LIMIT 100`,
      { lat, lng, radiusM },
    );
    return jsonData({ items: rows.map(serializeRow) });
  }
  if (method === "POST" && route === "/api/checkins/:id/attachments") {
    const fileUrl = String(input.fileUrl || input.url || "");
    if (!fileUrl) return jsonError("file_url_required");
    const id = await withTransaction(async (connection) => {
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO checkin_attachments (checkin_id, file_url, attachment_type, created_by)
         VALUES (:checkinId, :fileUrl, :attachmentType, :createdBy)`,
        { checkinId: match.params.id, fileUrl, attachmentType: input.attachmentType || "EVIDENCE", createdBy: userId || null },
      );
      return String(result.insertId);
    });
    return jsonData({ attachment: await getRow("checkin_attachments", id) }, { status: 201 });
  }
  if (method === "DELETE" && route === "/api/checkins/:id/attachments/:attachmentId") {
    await withTransaction(async (connection) => {
      await connection.execute(
        "DELETE FROM checkin_attachments WHERE id = :attachmentId AND checkin_id = :checkinId",
        { attachmentId: match.params.attachmentId, checkinId: match.params.id },
      );
    });
    return jsonData({ deleted: true });
  }
  if (method === "GET" && route === "/api/checkins/stats") {
    const where: string[] = ["1=1"];
    const params: Record<string, unknown> = {};
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");
    const locationType = request.nextUrl.searchParams.get("locationType");
    if (from) { where.push("c.checked_in_at >= :from"); params.from = `${from} 00:00:00`; }
    if (to) { where.push("c.checked_in_at <= :to"); params.to = `${to} 23:59:59`; }
    if (locationType) { where.push("l.location_type = :locationType"); params.locationType = locationType; }
    const rows = await queryRows<DbRow>(
      `SELECT COUNT(*) total_checkins, COUNT(DISTINCT c.user_id) unique_users,
       COUNT(DISTINCT c.selected_location_id) unique_locations,
       AVG(c.distance_from_selected_m) avg_distance_m
       FROM checkins c JOIN locations l ON l.id = c.selected_location_id
       WHERE ${where.join(" AND ")}`,
      params,
    );
    return jsonData(serializeRow(rows[0] || {}));
  }
  return null;
}

async function handleActivitiesAssessments(request: NextRequest, method: string, match: RouteMatch, input: JsonInput, userId?: string) {
  const route = match.route.path;
  if (route === "/api/safety-effort/activities") {
    if (method === "POST") return jsonData({ activity: await insertRow("safety_activities", input, { status: "DRAFT", started_at: new Date() }) }, { status: 201 });
  }
  if (method === "GET" && route === "/api/safety-effort/activities/me") {
    if (!userId) return jsonError("unauthorized", 401);
    const status = request.nextUrl.searchParams.get("status");
    const where = ["c.user_id = :userId"];
    const params: Record<string, unknown> = { userId };
    if (status) { where.push("a.status = :status"); params.status = status; }
    return jsonData(await listRows("safety_activities a JOIN checkins c ON c.id = a.checkin_id", request, {
      select: "a.*",
      where,
      params,
      orderBy: "a.id DESC",
    }));
  }
  if (route === "/api/safety-effort/activities/:id") {
    if (method === "GET") return jsonData({ activity: await getRow("safety_activities", match.params.id) });
    if (method === "PATCH") return jsonData({ activity: await updateRow("safety_activities", match.params.id, input) });
  }
  if (method === "GET" && route === "/api/safety-effort/assessment-templates") {
    const where = ["status = 'PUBLISHED'"];
    return jsonData(await listRows("assessment_templates", request, { where, orderBy: "code, version DESC" }));
  }
  if (route === "/api/safety-effort/assessment-templates/:id") {
    if (method === "GET") return jsonData({ template: await getRow("assessment_templates", match.params.id) });
    if (method === "PATCH") return jsonData({ template: await updateRow("assessment_templates", match.params.id, input) });
  }
  if (method === "POST" && route === "/api/safety-effort/assessment-templates") {
    return jsonData({ template: await insertRow("assessment_templates", input, { version: 1, status: "DRAFT", created_by: userId }) }, { status: 201 });
  }
  if (method === "POST" && route === "/api/safety-effort/assessment-templates/:id/publish") {
    return jsonData({ template: await updateRow("assessment_templates", match.params.id, { status: "PUBLISHED" }) });
  }
  if (method === "POST" && route === "/api/safety-effort/assessment-templates/:id/archive") {
    return jsonData({ template: await updateRow("assessment_templates", match.params.id, { status: "ARCHIVED" }) });
  }
  if (route === "/api/safety-effort/assessment-templates/:id/questions") {
    if (method === "GET") return jsonData(await listRows("assessment_questions", request, {
      where: ["template_id = :templateId"], params: { templateId: match.params.id }, orderBy: "sort_order, id",
    }));
    if (method === "POST") return jsonData({ question: await insertRow("assessment_questions", { ...input, templateId: match.params.id }, { is_required: 1, sort_order: 0 }) }, { status: 201 });
  }
  if (route === "/api/safety-effort/questions/:id") {
    if (method === "PATCH") return jsonData({ question: await updateRow("assessment_questions", match.params.id, input) });
    if (method === "DELETE") return jsonData(await deleteRow("assessment_questions", match.params.id));
  }
  if (method === "POST" && route === "/api/safety-effort/assessment-runs") {
    const answers = Array.isArray(input.answers) ? input.answers as JsonInput[] : [];
    const run = await insertRow("assessment_runs", input, { assessor_id: userId, status: "DRAFT", score: 0 });
    for (const answer of answers) {
      await insertRow("assessment_answers", { ...answer, assessmentRunId: run?.id });
    }
    return jsonData({ run: await getAssessmentRun(String(run?.id)) }, { status: 201 });
  }
  if (route === "/api/safety-effort/assessment-runs/:id") {
    if (method === "GET") return jsonData({ run: await getAssessmentRun(match.params.id) });
  }
  if (method === "GET" && route === "/api/safety-effort/assessment-runs") {
    const where: string[] = [];
    const params: Record<string, unknown> = {};
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");
    if (from) { where.push("created_at >= :from"); params.from = `${from} 00:00:00`; }
    if (to) { where.push("created_at <= :to"); params.to = `${to} 23:59:59`; }
    return jsonData(await listRows("assessment_runs", request, { where, params }));
  }
  if (method === "PATCH" && route === "/api/safety-effort/assessment-runs/:id/draft") {
    const answers = Array.isArray(input.answers) ? input.answers as JsonInput[] : [];
    await updateRow("assessment_runs", match.params.id, { ...input, status: "DRAFT" });
    for (const answer of answers) {
      const questionId = answer.questionId || answer.question_id;
      if (!questionId) continue;
      await withTransaction(async (connection) => {
        await connection.execute(
          `INSERT INTO assessment_answers (assessment_run_id, question_id, answer_json, score, notes)
           VALUES (:runId, :questionId, :answerJson, :score, :notes)
           ON DUPLICATE KEY UPDATE answer_json = VALUES(answer_json), score = VALUES(score), notes = VALUES(notes)`,
          {
            runId: match.params.id,
            questionId,
            answerJson: JSON.stringify(answer.answer ?? answer.answerJson ?? answer),
            score: answer.score ?? null,
            notes: answer.notes ?? null,
          },
        );
      });
    }
    return jsonData({ run: await getAssessmentRun(match.params.id) });
  }
  if (method === "POST" && route === "/api/safety-effort/assessment-runs/:id/submit") {
    const missing = await queryRows<DbRow>(
      `SELECT q.id FROM assessment_runs r
       JOIN assessment_questions q ON q.template_id = r.template_id AND q.is_required = 1
       LEFT JOIN assessment_answers a ON a.assessment_run_id = r.id AND a.question_id = q.id
       WHERE r.id = :id AND a.id IS NULL LIMIT 1`,
      { id: match.params.id },
    );
    if (missing.length) return jsonError("required_answers_missing", 422);
    await updateRow("assessment_runs", match.params.id, { status: "SUBMITTED", submitted_at: new Date() });
    return jsonData({ run: await getAssessmentRun(match.params.id) });
  }
  if (method === "POST" && route === "/api/safety-effort/assessment-runs/:id/attachments") {
    const id = await withTransaction(async (connection) => {
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO assessment_attachments
         (assessment_run_id, media_asset_id, file_url, attachment_type, metadata, created_by)
         VALUES (:assessmentRunId, :mediaAssetId, :fileUrl, :attachmentType, :metadata, :createdBy)`,
        {
          assessmentRunId: match.params.id,
          mediaAssetId: input.mediaAssetId || input.media_asset_id || null,
          fileUrl: input.fileUrl || input.url || null,
          attachmentType: input.attachmentType || "EVIDENCE",
          metadata: JSON.stringify(input.metadata || input),
          createdBy: userId || null,
        },
      );
      return String(result.insertId);
    });
    return jsonData({ attachment: await getRow("assessment_attachments", id) }, { status: 201 });
  }
  if (method === "GET" && route === "/api/safety-effort/assessment-runs/export") {
    const rows = await queryRows<DbRow>(
      `SELECT r.*, t.code template_code, t.name template_name, u.name_th assessor_name
       FROM assessment_runs r
       JOIN assessment_templates t ON t.id = r.template_id
       JOIN users u ON u.id = r.assessor_id ORDER BY r.id DESC LIMIT 10000`,
    );
    const csv = toCsv(rows.map(serializeRow));
    return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=assessment-runs.csv" } });
  }
  return null;
}

async function getAssessmentRun(id: string) {
  const run = await getRow("assessment_runs", id);
  if (!run) return null;
  const answers = await queryRows<DbRow>("SELECT * FROM assessment_answers WHERE assessment_run_id = :id ORDER BY question_id", { id });
  return { ...run, answers: answers.map(serializeRow) };
}

async function handleFindingsActions(request: NextRequest, method: string, match: RouteMatch, input: JsonInput, userId?: string) {
  const route = match.route.path;
  if (method === "POST" && route === "/api/safety-effort/findings") {
    return jsonData({ finding: await insertRow("safety_findings", input, { reported_by: userId, status: "OPEN", severity: "MEDIUM" }) }, { status: 201 });
  }
  if (method === "GET" && route === "/api/safety-effort/findings") {
    const where: string[] = [];
    const params: Record<string, unknown> = {};
    for (const key of ["status", "severity"]) {
      const value = request.nextUrl.searchParams.get(key);
      if (value) { where.push(`${key} = :${key}`); params[key] = value; }
    }
    return jsonData(await listRows("safety_findings", request, { where, params }));
  }
  if (route === "/api/safety-effort/findings/:id") {
    if (method === "GET") {
      const finding = await getRow("safety_findings", match.params.id);
      const actions = await queryRows<DbRow>("SELECT * FROM corrective_actions WHERE finding_id = :id ORDER BY id", { id: match.params.id });
      return jsonData({ finding: finding ? { ...finding, actions: actions.map(serializeRow) } : null });
    }
    if (method === "PATCH") return jsonData({ finding: await updateRow("safety_findings", match.params.id, input) });
  }
  if (method === "POST" && route === "/api/safety-effort/corrective-actions") {
    return jsonData({ action: await insertRow("corrective_actions", input, { status: "OPEN" }) }, { status: 201 });
  }
  if (method === "GET" && route === "/api/safety-effort/corrective-actions") {
    const where: string[] = [];
    const params: Record<string, unknown> = {};
    const status = request.nextUrl.searchParams.get("status");
    const assigneeId = request.nextUrl.searchParams.get("assigneeId");
    if (status) { where.push("status = :status"); params.status = status; }
    if (assigneeId) { where.push("assignee_id = :assigneeId"); params.assigneeId = assigneeId; }
    return jsonData(await listRows("corrective_actions", request, { where, params }));
  }
  if (method === "PATCH" && route === "/api/safety-effort/corrective-actions/:id") {
    return jsonData({ action: await updateRow("corrective_actions", match.params.id, input) });
  }
  if (method === "POST" && route === "/api/safety-effort/corrective-actions/:id/complete") {
    return jsonData({ action: await updateRow("corrective_actions", match.params.id, { ...input, status: "COMPLETED", completedAt: new Date() }) });
  }
  if (method === "POST" && route === "/api/safety-effort/corrective-actions/:id/comments") {
    const content = String(input.content || input.text || "").trim();
    if (!content) return jsonError("content_required", 422);
    const id = await withTransaction(async (connection) => {
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO corrective_action_comments (corrective_action_id, author_id, content, metadata)
         VALUES (:actionId, :authorId, :content, :metadata)`,
        {
          actionId: match.params.id,
          authorId: userId || null,
          content,
          metadata: JSON.stringify(input.metadata || {}),
        },
      );
      return String(result.insertId);
    });
    return jsonData({ comment: await getRow("corrective_action_comments", id) }, { status: 201 });
  }
  return null;
}

async function handleWereOk(method: string, match: RouteMatch, input: JsonInput, userId?: string) {
  if (method !== "POST") return null;
  const tableByRoute: Record<string, string> = {
    "/api/were-ok/health-checks": "health_checks",
    "/api/were-ok/pretrip-checks": "pretrip_checks",
    "/api/were-ok/kyt-records": "kyt_records",
    "/api/were-ok/sos-events": "sos_events",
  };
  const table = tableByRoute[match.route.path];
  if (!table) return null;
  if (!userId) return jsonError("unauthorized", 401);
  const id = await withTransaction(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO ${table} (activity_id, user_id, status, payload, occurred_at)
       VALUES (:activityId, :userId, :status, :payload, UTC_TIMESTAMP(3))`,
      {
        activityId: input.activityId || input.activity_id || null,
        userId,
        status: input.status || "COMPLETED",
        payload: JSON.stringify(input.payload || input),
      } as never,
    );
    return String(result.insertId);
  });
  return jsonData({ record: await getRow(table, id) }, { status: 201 });
}

async function handleCultureRewards(request: NextRequest, method: string, match: RouteMatch, input: JsonInput, userId?: string) {
  const route = match.route.path;
  if (route === "/api/safety-culture/teams") {
    if (method === "GET") {
      const rows = await queryRows<DbRow>(
        `SELECT t.id, t.organization_id, t.name, t.status, COUNT(tm.user_id) members
         FROM teams t
         LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.left_at IS NULL
         WHERE t.deleted_at IS NULL
         GROUP BY t.id, t.organization_id, t.name, t.status
         ORDER BY t.name`,
      );
      return jsonData({ items: rows.map(serializeRow) });
    }
    if (method === "PUT") {
      const teams = Array.isArray(input.teams) ? input.teams as JsonInput[] : [];
      await withTransaction(async (connection) => {
        const keepIds: string[] = [];
        for (const team of teams) {
          const id = Number(team.id);
          if (Number.isFinite(id) && id > 0) {
            await connection.execute(
              `UPDATE teams SET name = :name, organization_id = :organizationId, status = :status,
               deleted_at = NULL WHERE id = :id`,
              {
                id,
                name: team.name || `Team ${id}`,
                organizationId: team.organizationId || null,
                status: team.status || "ACTIVE",
              },
            );
            keepIds.push(String(id));
          } else {
            const [result] = await connection.execute<ResultSetHeader>(
              "INSERT INTO teams (organization_id, name, status) VALUES (:organizationId, :name, :status)",
              {
                organizationId: team.organizationId || null,
                name: team.name || "New Team",
                status: team.status || "ACTIVE",
              },
            );
            keepIds.push(String(result.insertId));
          }
        }
        if (keepIds.length) {
          await connection.query(
            "UPDATE teams SET deleted_at = UTC_TIMESTAMP(3), status = 'INACTIVE' WHERE deleted_at IS NULL AND id NOT IN (?)",
            [keepIds],
          );
        } else {
          await connection.execute("UPDATE teams SET deleted_at = UTC_TIMESTAMP(3), status = 'INACTIVE' WHERE deleted_at IS NULL");
        }
      });
      const rows = await queryRows<DbRow>("SELECT * FROM teams WHERE deleted_at IS NULL ORDER BY name");
      return jsonData({ items: rows.map(serializeRow) });
    }
  }
  if (route.startsWith("/api/safety-culture/events")) {
    if (method === "GET" && route === "/api/safety-culture/events") {
      const status = request.nextUrl.searchParams.get("status");
      return jsonData(await listRows("safety_culture_events", request, {
        where: ["deleted_at IS NULL", ...(status ? ["status = :status"] : [])],
        params: status ? { status } : {},
        orderBy: "COALESCE(event_start_at, created_at) DESC, id DESC",
      }));
    }
    if (method === "POST" && route === "/api/safety-culture/events") return jsonData({ event: await createCultureEvent(input, userId) }, { status: 201 });
    if (method === "GET" && route === "/api/safety-culture/events/:id") return jsonData({ event: await getRow("safety_culture_events", match.params.id) });
    if (method === "PATCH" && route === "/api/safety-culture/events/:id") return jsonData({ event: await updateCultureEvent(match.params.id, input) });
    if (method === "POST" && route === "/api/safety-culture/events/:id/notify") {
      const event = await getRow("safety_culture_events", match.params.id);
      if (!event) return jsonError("event_not_found", 404);
      const users = await queryRows<DbRow>("SELECT id FROM users WHERE status = 'ACTIVE' AND deleted_at IS NULL");
      await withTransaction(async (connection) => {
        for (const user of users) {
          await connection.execute(
            `INSERT INTO notifications (user_id, notification_type, title, body)
             VALUES (:userId, 'EVENT', :title, :body)`,
            {
              userId: user.id,
              title: String(event.title || "Safety Event"),
              body: String(event.description || ""),
            },
          );
        }
      });
      return jsonData({ notified: users.length });
    }
  }
  if (method === "GET" && route === "/api/safety-culture/leaderboard") {
    if (!userId) return jsonError("unauthorized", 401);
    const memberships = await queryRows<DbRow>(
      `SELECT tm.team_id
       FROM team_members tm
       JOIN teams t ON t.id = tm.team_id
       WHERE tm.user_id = :userId
         AND tm.left_at IS NULL
         AND t.deleted_at IS NULL
         AND t.status = 'ACTIVE'
       LIMIT 1`,
      { userId },
    );
    const teamId = memberships[0]?.team_id;
    if (!teamId) return jsonData({ items: [] });

    const rows = await queryRows<DbRow>(
      `SELECT u.id user_id, u.name_th, t.name team, COALESCE(pb.balance, 0) points
       FROM team_members tm
       JOIN teams t ON t.id = tm.team_id
       JOIN users u ON u.id = tm.user_id
       LEFT JOIN point_balances pb ON pb.user_id = u.id
       WHERE tm.team_id = :teamId
         AND tm.left_at IS NULL
         AND t.deleted_at IS NULL
         AND t.status = 'ACTIVE'
         AND u.deleted_at IS NULL
         AND u.status = 'ACTIVE'
       ORDER BY points DESC, u.name_th LIMIT 100`,
      { teamId },
    );
    return jsonData({ items: rows.map(serializeRow) });
  }
  if (route === "/api/safety-culture/rewards") {
    if (method === "GET") return jsonData(await listRows("rewards", request, { where: ["status = 'ACTIVE'"], orderBy: "points_required, id" }));
    if (method === "POST") return jsonData({ reward: await insertRow("rewards", input, { status: "ACTIVE", stock_qty: 0 }) }, { status: 201 });
  }
  if (method === "PATCH" && route === "/api/safety-culture/rewards/:id") return jsonData({ reward: await updateRow("rewards", match.params.id, input) });
  if (method === "DELETE" && route === "/api/safety-culture/rewards/:id") return jsonData(await deleteRow("rewards", match.params.id));
  if (method === "POST" && route === "/api/safety-culture/rewards/:id/redeem") {
    if (!userId) return jsonError("unauthorized", 401);
    const redemption = await redeemReward(match.params.id, userId);
    return jsonData({ redemption }, { status: 201 });
  }
  if (method === "GET" && route === "/api/safety-culture/reward-redemptions") {
    const status = request.nextUrl.searchParams.get("status");
    return jsonData(await listRows("reward_redemptions", request, {
      where: status ? ["status = :status"] : [],
      params: status ? { status } : {},
      orderBy: "id DESC",
    }));
  }
  if (method === "PATCH" && route === "/api/safety-culture/reward-redemptions/:id/status") {
    const status = String(input.status || "PENDING");
    await withTransaction(async (connection) => {
      await connection.execute("UPDATE reward_redemptions SET status = :status WHERE id = :id", { status, id: match.params.id });
    });
    return jsonData({ redemption: await getRow("reward_redemptions", match.params.id) });
  }
  if (method === "POST" && route === "/api/safety-culture/rewards/:id/inventory-transactions") {
    const quantity = Number(input.quantity);
    if (!Number.isFinite(quantity) || quantity === 0) return jsonError("non_zero_quantity_required");
    await withTransaction(async (connection) => {
      await connection.execute(
        `INSERT INTO reward_inventory_transactions
         (reward_id, transaction_type, quantity, source_type, source_id)
         VALUES (:rewardId, :transactionType, :quantity, :sourceType, :sourceId)`,
        {
          rewardId: match.params.id,
          transactionType: input.transactionType || (quantity > 0 ? "IN" : "OUT"),
          quantity,
          sourceType: input.sourceType || "ADMIN",
          sourceId: input.sourceId || null,
        },
      );
      await connection.execute(
        "UPDATE rewards SET stock_qty = GREATEST(stock_qty + :quantity, 0) WHERE id = :rewardId",
        { rewardId: match.params.id, quantity },
      );
    });
    return jsonData({ reward: await getRow("rewards", match.params.id) }, { status: 201 });
  }
  if (method === "GET" && route === "/api/safety-culture/posts/admin") {
    const status = request.nextUrl.searchParams.get("status");
    return jsonData(await listRows("posts", request, { where: status ? ["status = :status"] : [], params: status ? { status } : {} }));
  }
  if (method === "POST" && route === "/api/safety-culture/posts/:id/approve") {
    await withTransaction(async (connection) => connection.execute(
      "UPDATE posts SET status='PUBLISHED', published_at=COALESCE(published_at, UTC_TIMESTAMP(3)) WHERE id=:id",
      { id: match.params.id },
    ));
    return jsonData({ post: await getRow("posts", match.params.id) });
  }
  if (method === "POST" && route === "/api/safety-culture/posts/:id/reject") {
    await withTransaction(async (connection) => connection.execute("UPDATE posts SET status='REJECTED' WHERE id=:id", { id: match.params.id }));
    await audit({ actorUserId: userId, action: "REJECT", entityType: "POST", entityId: match.params.id, after: input, request });
    return jsonData({ post: await getRow("posts", match.params.id) });
  }
  if (method === "PATCH" && route === "/api/safety-culture/points/rules/:id") {
    return jsonData({ rule: await updateRow("point_rules", match.params.id, input) });
  }
  return null;
}

async function redeemReward(rewardId: string, userId: string) {
  return withTransaction(async (connection) => {
    const [rewardRows] = await connection.execute<DbRow[]>(
      "SELECT * FROM rewards WHERE id = :rewardId AND status = 'ACTIVE' AND deleted_at IS NULL FOR UPDATE",
      { rewardId },
    );
    const reward = rewardRows[0];
    if (!reward) throw new Error("reward_not_found");
    if (Number(reward.stock_qty) <= 0) throw new Error("reward_out_of_stock");
    const [balanceRows] = await connection.execute<DbRow[]>(
      "SELECT balance FROM point_balances WHERE user_id = :userId FOR UPDATE",
      { userId },
    );
    const balance = Number(balanceRows[0]?.balance || 0);
    const points = Number(reward.points_required);
    if (balance < points) throw new Error("insufficient_points");
    const [transaction] = await connection.execute<ResultSetHeader>(
      `INSERT INTO point_transactions
       (user_id, transaction_type, amount, source_type, source_id, idempotency_key, description)
       VALUES (:userId, 'SPEND', :amount, 'REWARD', :rewardId, :key, :description)`,
      { userId, amount: -points, rewardId, key: `reward:${rewardId}:${userId}:${Date.now()}`, description: `Redeem ${reward.name}` },
    );
    await connection.execute("UPDATE point_balances SET balance = balance - :points WHERE user_id = :userId", { userId, points });
    await connection.execute("UPDATE rewards SET stock_qty = stock_qty - 1 WHERE id = :rewardId", { rewardId });
    const [redemption] = await connection.execute<ResultSetHeader>(
      `INSERT INTO reward_redemptions
       (user_id, reward_id, point_transaction_id, points_used, status)
       VALUES (:userId, :rewardId, :transactionId, :points, 'PENDING')`,
      { userId, rewardId, transactionId: transaction.insertId, points },
    );
    await connection.execute(
      `INSERT INTO reward_inventory_transactions
       (reward_id, transaction_type, quantity, source_type, source_id)
       VALUES (:rewardId, 'REDEEM', -1, 'REDEMPTION', :sourceId)`,
      { rewardId, sourceId: redemption.insertId },
    );
    return { id: String(redemption.insertId), rewardId, userId, pointsUsed: points, status: "PENDING" };
  });
}

async function handleAwarenessHolidays(request: NextRequest, method: string, match: RouteMatch, input: JsonInput, userId?: string) {
  const route = match.route.path;
  if (method === "GET" && route === "/api/safety-awareness/questions") {
    const date = request.nextUrl.searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const rows = await queryRows<DbRow>(
      `SELECT id, question_text, options_json FROM awareness_questions
       WHERE status = 'ACTIVE' ORDER BY MOD(id + DAYOFYEAR(:date), 997) LIMIT 5`,
      { date },
    );
    return jsonData({ items: rows.map(serializeRow), date });
  }
  if (method === "GET" && route === "/api/safety-awareness/questions/admin") {
    return jsonData(await listRows("awareness_questions", request, { orderBy: "id ASC", maxPageSize: 1000 }));
  }
  if (method === "POST" && route === "/api/safety-awareness/questions") {
    return jsonData({ question: await insertRow("awareness_questions", input, { status: "ACTIVE" }) }, { status: 201 });
  }
  if (method === "PATCH" && route === "/api/safety-awareness/questions/:id") {
    return jsonData({ question: await updateRow("awareness_questions", match.params.id, input) });
  }
  if (method === "DELETE" && route === "/api/safety-awareness/questions/:id") {
    return jsonData({ question: await updateRow("awareness_questions", match.params.id, { status: "INACTIVE" }) });
  }
  if (method === "GET" && route === "/api/safety-awareness/attempts/me") {
    return jsonData(await listRows("awareness_attempts", request, { where: ["user_id = :userId"], params: { userId }, orderBy: "attempt_date DESC, id DESC" }));
  }
  if (method === "GET" && route === "/api/safety-awareness/attempts") {
    const where: string[] = [];
    const params: Record<string, unknown> = {};
    const requestedUserId = request.nextUrl.searchParams.get("userId");
    if (requestedUserId) { where.push("user_id = :userId"); params.userId = requestedUserId; }
    return jsonData(await listRows("awareness_attempts", request, { where, params, orderBy: "attempt_date DESC, id DESC" }));
  }
  if (route === "/api/holidays") {
    if (method === "GET") {
      const year = Number(request.nextUrl.searchParams.get("year") || new Date().getFullYear());
      return jsonData(await listRows("holidays", request, { where: ["YEAR(holiday_date) = :year"], params: { year }, orderBy: "holiday_date", maxPageSize: 500 }));
    }
    if (method === "POST") return jsonData({ holiday: await insertRow("holidays", input) }, { status: 201 });
  }
  if (method === "DELETE" && route === "/api/holidays/:id") return jsonData(await deleteRow("holidays", match.params.id));
  return null;
}

async function handleNotifications(request: NextRequest, method: string, match: RouteMatch, input: JsonInput, userId?: string) {
  const route = match.route.path;
  if (!userId) return jsonError("unauthorized", 401);
  if (method === "GET" && route === "/api/notifications") {
    const limit = cursorLimit(request);
    const cursor = request.nextUrl.searchParams.get("cursor");
    const where = ["user_id = :userId"];
    const params: Record<string, unknown> = { userId, limit };
    if (cursor) { where.push("id < :cursor"); params.cursor = cursor; }
    const rows = await queryRows<DbRow>(
      `SELECT * FROM notifications WHERE ${where.join(" AND ")} ORDER BY id DESC LIMIT :limit`,
      params,
    );
    return jsonData({ items: rows.map(serializeRow), nextCursor: rows.length === limit ? String(rows[rows.length - 1].id) : null });
  }
  if (method === "PATCH" && route === "/api/notifications/:id/read") {
    await withTransaction(async (connection) => connection.execute(
      "UPDATE notifications SET read_at = UTC_TIMESTAMP(3) WHERE id = :id AND user_id = :userId",
      { id: match.params.id, userId },
    ));
    return jsonData({ notification: await getRow("notifications", match.params.id) });
  }
  if (method === "POST" && route === "/api/notifications/broadcast") {
    const users = await queryRows<DbRow>("SELECT id FROM users WHERE status='ACTIVE' AND deleted_at IS NULL");
    await withTransaction(async (connection) => {
      for (const user of users) {
        await connection.execute(
          "INSERT INTO notifications (user_id, notification_type, title, body) VALUES (:userId, :type, :title, :body)",
          { userId: user.id, type: input.notificationType || "BROADCAST", title: input.title || "Notification", body: input.body || "" },
        );
      }
    });
    return jsonData({ sent: users.length }, { status: 201 });
  }
  if (method === "POST" && route === "/api/notifications/:id/archive") {
    const notification = await getRow("notifications", match.params.id);
    if (!notification || String(notification.user_id) !== String(userId)) return jsonError("notification_not_found", 404);
    await withTransaction(async (connection) => {
      await connection.execute<ResultSetHeader>(
        `INSERT INTO archived_notifications
         (notification_id, user_id, notification_type, title, body, read_at, original_created_at)
         VALUES (:notificationId, :userId, :notificationType, :title, :body, :readAt, :originalCreatedAt)`,
        {
          notificationId: String(notification.id),
          userId,
          notificationType: String(notification.notification_type),
          title: String(notification.title),
          body: notification.body == null ? null : String(notification.body),
          readAt: notification.read_at == null ? null : notification.read_at as never,
          originalCreatedAt: notification.created_at == null ? null : notification.created_at as never,
        },
      );
      await connection.execute("DELETE FROM notifications WHERE id=:id AND user_id=:userId", { id: match.params.id, userId });
    });
    return jsonData({ archived: true });
  }
  if (method === "PATCH" && route === "/api/notifications/read-all") {
    const result = await withTransaction(async (connection) => {
      const [header] = await connection.execute<ResultSetHeader>(
        "UPDATE notifications SET read_at = COALESCE(read_at, UTC_TIMESTAMP(3)) WHERE user_id = :userId",
        { userId },
      );
      return header.affectedRows;
    });
    return jsonData({ updated: result });
  }
  if (route === "/api/notifications/preferences") {
    if (method === "GET") {
      return jsonData({ preferences: await getNotificationPreferences(userId) });
    }
    if (method === "PATCH") {
      return jsonData({ preferences: await updateNotificationPreferences(userId, input) });
    }
  }
  return null;
}

function safeFileName(name: string) {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function uploadRoot() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), ".data", "uploads");
}

async function handleUploadsMedia(request: NextRequest, method: string, match: RouteMatch, input: JsonInput, body: ParsedBody, userId?: string) {
  const route = match.route.path;
  if (method === "POST" && route === "/api/uploads") {
    const file = body.files?.[0];
    if (!file?.bytes) return jsonError("file_required");
    const fileName = `${Date.now()}-${safeFileName(file.name)}`;
    await fs.mkdir(uploadRoot(), { recursive: true });
    const storagePath = path.join(uploadRoot(), fileName);
    await fs.writeFile(storagePath, file.bytes);
    const media = await createMediaAsset({
      fileName,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      status: "READY",
      module: input.module || "general",
      ownerType: input.ownerType || null,
      ownerId: input.ownerId || null,
      storagePath,
    }, userId);
    return jsonData({ attachment: media, media }, { status: 201 });
  }
  if (route === "/api/uploads/:id") {
    const media = await getRow("media_assets", match.params.id);
    if (method === "GET") return media ? jsonData({ media }) : jsonError("media_not_found", 404);
    if (method === "DELETE") {
      if (media?.file_name) await fs.unlink(String(media.storage_path || path.join(uploadRoot(), String(media.file_name)))).catch(() => undefined);
      await updateMediaAsset(match.params.id, { status: "DELETED", deleted_at: new Date() });
      return jsonData({ deleted: true });
    }
  }
  if (method === "GET" && route === "/api/uploads/:id/download") {
    const media = await getRow("media_assets", match.params.id);
    if (!media?.file_name) return jsonError("media_not_found", 404);
    const bytes = await fs.readFile(String(media.storage_path || path.join(uploadRoot(), String(media.file_name)))).catch(() => null);
    if (!bytes) return jsonError("file_not_found", 404);
    return new NextResponse(bytes, {
      headers: {
        "content-type": String(media.mime_type || "application/octet-stream"),
        "content-disposition": `attachment; filename="${safeFileName(String(media.original_name || media.file_name))}"`,
      },
    });
  }
  if (method === "POST" && route === "/api/uploads/cleanup-drafts") {
    const records = await listRows("media_assets", request, { where: ["status = 'DRAFT'", "deleted_at IS NULL"] });
    let cleaned = 0;
    for (const media of records.items) {
      if (media.file_name) await fs.unlink(String(media.storage_path || path.join(uploadRoot(), String(media.file_name)))).catch(() => undefined);
      await updateMediaAsset(String(media.id), { status: "DELETED" });
      cleaned += 1;
    }
    return jsonData({ cleaned });
  }
  if (route === "/api/uploads/:id/link") {
    if (method === "POST") return jsonData({ media: await updateMediaAsset(match.params.id, { ...input, status: "LINKED" }) });
    if (method === "DELETE") return jsonData({ media: await updateMediaAsset(match.params.id, { ownerType: null, ownerId: null, linkType: null, status: "READY" }) });
  }
  if (method === "GET" && route === "/api/media") {
    const ownerType = request.nextUrl.searchParams.get("ownerType");
    const ownerId = request.nextUrl.searchParams.get("ownerId");
    return jsonData(await listRows("media_assets", request, {
      where: [
        "deleted_at IS NULL",
        ...(ownerType ? ["owner_type = :ownerType"] : []),
        ...(ownerId ? ["owner_id = :ownerId"] : []),
      ],
      params: { ...(ownerType ? { ownerType } : {}), ...(ownerId ? { ownerId } : {}) },
      orderBy: "id DESC",
    }));
  }
  if (method === "POST" && route === "/api/uploads/presign") {
    const draft = await createMediaAsset({
      fileName: input.fileName || `draft-${Date.now()}`,
      originalName: input.originalName || input.fileName || null,
      mimeType: input.mimeType || null,
      size: input.size || 0,
      ...input,
      status: "DRAFT",
      uploadMode: "server",
    }, userId);
    return jsonData({ id: draft?.id, uploadUrl: "/api/uploads", method: "POST", fields: { draftId: draft?.id } }, { status: 201 });
  }
  if (method === "POST" && route === "/api/uploads/:id/complete") {
    return jsonData({ media: await updateMediaAsset(match.params.id, { ...input, status: "READY" }) });
  }
  return null;
}

async function handleImportsReportsAudit(request: NextRequest, method: string, match: RouteMatch, input: JsonInput, userId?: string) {
  const route = match.route.path;
  if (route === "/api/safety-settings") {
    const key = String(request.nextUrl.searchParams.get("key") || input.key || "safety_backdate");
    if (method === "GET") {
      const rows = await queryRows<DbRow>(
        "SELECT setting_key, setting_value, updated_at FROM safety_settings WHERE setting_key = :key LIMIT 1",
        { key },
      );
      return jsonData({ setting: rows[0] ? serializeRow(rows[0]) : null });
    }
    if (method === "PUT") {
      await withTransaction(async (connection) => {
        await connection.execute<ResultSetHeader>(
          `INSERT INTO safety_settings (setting_key, setting_value, updated_by)
           VALUES (:key, :value, :updatedBy)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
          {
            key,
            value: JSON.stringify(input.value || input),
            updatedBy: userId || null,
          },
        );
      });
      const rows = await queryRows<DbRow>(
        "SELECT setting_key, setting_value, updated_at FROM safety_settings WHERE setting_key = :key LIMIT 1",
        { key },
      );
      return jsonData({ setting: rows[0] ? serializeRow(rows[0]) : null });
    }
  }
  if (route === "/api/location-imports") {
    if (method === "GET") {
      const status = request.nextUrl.searchParams.get("status");
      return jsonData(await listRows("location_import_batches", request, { where: status ? ["status=:status"] : [], params: status ? { status } : {} }));
    }
    if (method === "POST") {
      if (!userId) return jsonError("unauthorized", 401);
      if (input.source === "RMR_SSO_PLANT") {
        return jsonData({ import: await syncRmrPlants(userId) }, { status: 202 });
      }
      const id = await withTransaction(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
          `INSERT INTO location_import_batches (file_name, source, imported_by, status)
           VALUES (:fileName, :source, :importedBy, 'PROCESSING')`,
          { fileName: input.fileName || `${input.source || "LOCATION"}-${Date.now()}`, source: input.source || "ADMIN", importedBy: userId },
        );
        return String(result.insertId);
      });
      return jsonData({ import: await getRow("location_import_batches", id) }, { status: 202 });
    }
  }
  if (method === "GET" && route === "/api/location-imports/:id") return jsonData({ import: await getRow("location_import_batches", match.params.id) });
  if (method === "GET" && route === "/api/location-imports/:id/rows") {
    const status = request.nextUrl.searchParams.get("status");
    return jsonData(await listRows("location_import_rows", request, {
      where: ["import_batch_id=:id", ...(status ? ["action=:status"] : [])],
      params: { id: match.params.id, ...(status ? { status } : {}) },
      orderBy: "row_number",
    }));
  }
  if (method === "POST" && ["/api/location-imports/:id/retry", "/api/location-imports/:id/apply"].includes(route)) {
    const status = route.endsWith("/apply") ? "COMPLETED" : "PROCESSING";
    await withTransaction(async (connection) => connection.execute(
      `UPDATE location_import_batches SET status=:status,
       completed_at=CASE WHEN :status='COMPLETED' THEN UTC_TIMESTAMP(3) ELSE NULL END WHERE id=:id`,
      { id: match.params.id, status },
    ));
    return jsonData({ import: await getRow("location_import_batches", match.params.id) });
  }
  if (method === "GET" && route.startsWith("/api/safety-effort/reports/")) {
    if (route === "/api/safety-effort/reports/summary") {
      const rows = await queryRows<DbRow>(
        `SELECT
         (SELECT COUNT(*) FROM safety_activities WHERE deleted_at IS NULL) activities,
         (SELECT COUNT(*) FROM assessment_runs WHERE status='SUBMITTED') submitted_assessments,
         (SELECT COUNT(*) FROM safety_findings WHERE deleted_at IS NULL AND status <> 'CLOSED') open_findings,
         (SELECT COUNT(*) FROM corrective_actions WHERE status <> 'COMPLETED') open_actions`,
      );
      return jsonData(serializeRow(rows[0] || {}));
    }
    if (route === "/api/safety-effort/reports/by-location") {
      const { page, pageSize, offset } = pageParams(request);
      const rows = await queryRows<DbRow>(
        `SELECT l.id, l.name_th, l.location_type,
         COUNT(DISTINCT c.id) checkins, COUNT(DISTINCT a.id) activities
         FROM locations l
         LEFT JOIN checkins c ON c.selected_location_id=l.id
         LEFT JOIN safety_activities a ON a.checkin_id=c.id AND a.deleted_at IS NULL
         WHERE l.deleted_at IS NULL
         GROUP BY l.id, l.name_th, l.location_type
         ORDER BY activities DESC, checkins DESC
         LIMIT :limit OFFSET :offset`,
        { limit: pageSize, offset },
      );
      return jsonData({ items: rows.map(serializeRow), page, pageSize, nextPage: rows.length === pageSize ? page + 1 : null });
    }
    if (route === "/api/safety-effort/reports/by-user") {
      const { page, pageSize, offset } = pageParams(request);
      const rows = await queryRows<DbRow>(
        `SELECT u.id, u.name_th,
         COUNT(DISTINCT c.id) checkins, COUNT(DISTINCT a.id) activities
         FROM users u
         LEFT JOIN checkins c ON c.user_id=u.id
         LEFT JOIN safety_activities a ON a.checkin_id=c.id AND a.deleted_at IS NULL
         WHERE u.deleted_at IS NULL
         GROUP BY u.id, u.name_th
         ORDER BY activities DESC, checkins DESC
         LIMIT :limit OFFSET :offset`,
        { limit: pageSize, offset },
      );
      return jsonData({ items: rows.map(serializeRow), page, pageSize, nextPage: rows.length === pageSize ? page + 1 : null });
    }
    if (route === "/api/safety-effort/reports/findings") {
      return jsonData(await listRows("safety_findings", request));
    }
  }
  if (route === "/api/exports") {
    if (method === "POST") {
      const job = await createExportJob(input, userId);
      return jsonData({ export: job }, { status: 202 });
    }
  }
  if (method === "GET" && route === "/api/exports/:id") return jsonData({ export: await getRow("export_jobs", match.params.id) });
  if (method === "GET" && route === "/api/exports/:id/download") {
    const job = await getRow("export_jobs", match.params.id);
    if (!job) return jsonError("export_not_found", 404);
    const csv = toCsv([job]);
    return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename=export-${match.params.id}.csv` } });
  }
  if (method === "GET" && route === "/api/audit-logs") {
    const where: string[] = [];
    const params: Record<string, unknown> = {};
    const actor = request.nextUrl.searchParams.get("actor");
    const entity = request.nextUrl.searchParams.get("entity");
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");
    if (actor) { where.push("actor_user_id=:actor"); params.actor = actor; }
    if (entity) { where.push("entity_type=:entity"); params.entity = entity; }
    if (from) { where.push("created_at>=:from"); params.from = `${from} 00:00:00`; }
    if (to) { where.push("created_at<=:to"); params.to = `${to} 23:59:59`; }
    return jsonData(await listRows("audit_logs", request, { where, params }));
  }
  return null;
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "\uFEFF";
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const cell = (value: unknown) => `"${String(typeof value === "object" && value !== null ? JSON.stringify(value) : value ?? "").replace(/"/g, '""')}"`;
  return `\uFEFF${headers.map(cell).join(",")}\n${rows.map((row) => headers.map((header) => cell(row[header])).join(",")).join("\n")}`;
}

export async function handlePersistedCatalogRoute(
  request: NextRequest,
  method: string,
  match: RouteMatch,
  session: CatalogSession,
  body: unknown,
) {
  const input = bodyJson(body);
  const userId = session?.user?.id;
  try {
    if (method === "GET" && match.route.path === "/api/health") {
      await queryRows<DbRow>("SELECT 1 ok");
      return jsonData({ status: "ok", database: "connected", checkedAt: new Date().toISOString() });
    }
    if (method === "GET" && match.route.path === "/api/version") {
      return jsonData({
        name: "suea-safety",
        version: process.env.npm_package_version || "1.0.0",
        apiStatus: "implemented",
      });
    }
    const handlers = [
      () => handleOrganizations(request, method, match, input, userId),
      () => handleUsersIam(request, method, match, input, userId),
      () => handleCheckinExtras(request, method, match, input, userId),
      () => handleActivitiesAssessments(request, method, match, input, userId),
      () => handleFindingsActions(request, method, match, input, userId),
      () => handleWereOk(method, match, input, userId),
      () => handleCultureRewards(request, method, match, input, userId),
      () => handleAwarenessHolidays(request, method, match, input, userId),
      () => handleNotifications(request, method, match, input, userId),
      () => handleUploadsMedia(request, method, match, input, body as ParsedBody, userId),
      () => handleImportsReportsAudit(request, method, match, input, userId),
    ];
    for (const handler of handlers) {
      const response = await handler();
      if (response) return response;
    }
    return null;
  } catch (error) {
    return jsonError(error, error instanceof Error && error.message.endsWith("_not_found") ? 404 : 400);
  }
}
