import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { queryRows, withTransaction } from "@backend/components/core/db";

export type SafetyEffortLocationType = "PLANT" | "OFFICE" | "SITE" | "CUSTOM";

export type SafetyEffortLocationInput = {
  locationType: SafetyEffortLocationType;
  nameTh: string;
  lat: number;
  lng: number;
  code?: string | null;
  externalKey?: string | null;
  source?: string | null;
  nameEn?: string | null;
  provinceName?: string | null;
  districtName?: string | null;
  status?: string | null;
  mapVisible?: boolean;
  checkinEnabled?: boolean;
  organizationId?: string | number | null;
  createdBy?: string | number | null;
};

type LocationRow = RowDataPacket & {
  id: string;
  created_by: string | null;
  creator_name: string | null;
  creator_email: string | null;
  organization_id: string | null;
  organization_code: string | null;
  organization_name: string | null;
  location_type: SafetyEffortLocationType;
  source: string;
  external_key: string | null;
  code: string | null;
  name_th: string;
  name_en: string | null;
  province_name: string | null;
  district_name: string | null;
  plant_type: string | null;
  production_type: string | null;
  sap_code: string | null;
  site_material_code: string | null;
  status: string;
  map_visible: 0 | 1 | boolean;
  checkin_enabled: 0 | 1 | boolean;
  lat: number | string | null;
  lng: number | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type LocationSourceDetailRow = RowDataPacket & Record<string, unknown>;

export type SafetyEffortLocationSourceDetail = {
  table: "plant_location_details" | "office_location_details" | "site_location_details";
  data: Record<string, unknown>;
} | null;

const LOCATION_TYPES = new Set<SafetyEffortLocationType>(["PLANT", "OFFICE", "SITE", "CUSTOM"]);

export function normalizeLocationType(value: string | null): SafetyEffortLocationType | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === "FACTORY") return "PLANT";
  return LOCATION_TYPES.has(normalized as SafetyEffortLocationType)
    ? (normalized as SafetyEffortLocationType)
    : null;
}

function assertFiniteNumber(value: unknown, fieldName: string) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  return numberValue;
}

export function parseLocationInput(raw: unknown, createdBy?: string): SafetyEffortLocationInput {
  if (!raw || typeof raw !== "object") throw new Error("Invalid location payload");
  const input = raw as Record<string, unknown>;
  const locationType = normalizeLocationType(String(input.locationType || input.type || ""));
  if (!locationType) throw new Error("locationType must be PLANT, OFFICE, SITE, or CUSTOM");

  const nameTh = String(input.nameTh || input.name || "").trim();
  if (!nameTh) throw new Error("nameTh is required");

  return {
    locationType,
    nameTh,
    lat: assertFiniteNumber(input.lat, "lat"),
    lng: assertFiniteNumber(input.lng, "lng"),
    code: input.code ? String(input.code).trim() : null,
    externalKey: input.externalKey ? String(input.externalKey).trim() : null,
    source: input.source ? String(input.source).trim().toUpperCase() : "ADMIN",
    nameEn: input.nameEn ? String(input.nameEn).trim() : null,
    provinceName: input.provinceName ? String(input.provinceName).trim() : null,
    districtName: input.districtName ? String(input.districtName).trim() : null,
    status: input.status ? String(input.status).trim().toUpperCase() : "ACTIVE",
    mapVisible: input.mapVisible !== false,
    checkinEnabled: input.checkinEnabled !== false,
    organizationId: input.organizationId ? String(input.organizationId) : null,
    createdBy: input.createdBy ? String(input.createdBy) : createdBy || null,
  };
}

function mapLocation(row: LocationRow) {
  return {
    id: String(row.id),
    createdBy: row.created_by ? String(row.created_by) : null,
    creatorName: row.creator_name,
    creatorEmail: row.creator_email,
    organizationId: row.organization_id ? String(row.organization_id) : null,
    organizationCode: row.organization_code,
    organizationName: row.organization_name,
    locationType: row.location_type,
    source: row.source,
    readOnly: row.source.startsWith("RMR_SSO_") || row.source.startsWith("RMC_SSO_"),
    externalKey: row.external_key,
    code: row.code,
    nameTh: row.name_th,
    nameEn: row.name_en,
    provinceName: row.province_name,
    districtName: row.district_name,
    plantType: row.plant_type,
    productionType: row.production_type,
    sapCode: row.sap_code,
    siteMaterialCode: row.site_material_code,
    status: row.status,
    mapVisible: Boolean(row.map_visible),
    checkinEnabled: Boolean(row.checkin_enabled),
    lat: row.lat === null ? null : Number(row.lat),
    lng: row.lng === null ? null : Number(row.lng),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function normalizeSourceDetailValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return Number(value);
  if (Buffer.isBuffer(value)) {
    const text = value.toString("utf8");
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return value;
      }
    }
  }
  return value;
}

function mapSourceDetail(table: "plant_location_details" | "office_location_details" | "site_location_details", row: LocationSourceDetailRow) {
  return {
    table,
    data: Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, normalizeSourceDetailValue(value)]),
    ),
  } satisfies NonNullable<SafetyEffortLocationSourceDetail>;
}

export async function getSafetyEffortLocationSourceDetail(id: string): Promise<SafetyEffortLocationSourceDetail> {
  const rows = await queryRows<RowDataPacket & { location_type: SafetyEffortLocationType }>(
    `
      SELECT location_type
      FROM locations
      WHERE id = :id AND deleted_at IS NULL
      LIMIT 1
    `,
    { id },
  );
  const locationType = rows[0]?.location_type;
  if (!locationType) return null;

  if (locationType === "PLANT") {
    const detailRows = await queryRows<LocationSourceDetailRow>(
      "SELECT * FROM plant_location_details WHERE location_id = :id LIMIT 1",
      { id },
    );
    return detailRows[0] ? mapSourceDetail("plant_location_details", detailRows[0]) : null;
  }

  if (locationType === "OFFICE") {
    const detailRows = await queryRows<LocationSourceDetailRow>(
      "SELECT * FROM office_location_details WHERE location_id = :id LIMIT 1",
      { id },
    );
    return detailRows[0] ? mapSourceDetail("office_location_details", detailRows[0]) : null;
  }

  if (locationType === "SITE") {
    const detailRows = await queryRows<LocationSourceDetailRow>(
      "SELECT * FROM site_location_details WHERE location_id = :id LIMIT 1",
      { id },
    );
    return detailRows[0] ? mapSourceDetail("site_location_details", detailRows[0]) : null;
  }

  return null;
}

const SELECT_LOCATIONS_SQL = `
  SELECT
    l.id,
    l.created_by,
    COALESCE(NULLIF(creator.name_th, ''), NULLIF(creator.name_en, ''), creator.email) AS creator_name,
    creator.email AS creator_email,
    l.organization_id,
    o.external_code AS organization_code,
    o.name_th AS organization_name,
    l.location_type,
    l.source,
    l.external_key,
    l.code,
    l.name_th,
    l.name_en,
    l.province_name,
    l.district_name,
    l.plant_type,
    l.production_type,
    l.sap_code,
    l.site_material_code,
    l.status,
    l.map_visible,
    l.checkin_enabled,
    ST_Latitude(l.position) AS lat,
    ST_Longitude(l.position) AS lng,
    l.created_at,
    l.updated_at
  FROM locations l
  LEFT JOIN organizations o ON o.id = l.organization_id
  LEFT JOIN users creator ON creator.id = l.created_by AND creator.deleted_at IS NULL
`;

export async function listSafetyEffortLocations(options: {
  type?: SafetyEffortLocationType | null;
  search?: string | null;
  source?: string | null;
  limit?: number;
}) {
  const where = ["l.deleted_at IS NULL"];
  const params: Record<string, unknown> = {
    limit: Math.min(Math.max(options.limit || 200, 1), 1000),
  };

  if (options.type) {
    where.push("l.location_type = :type");
    params.type = options.type;
  }

  if (options.source?.trim()) {
    where.push("l.source = :source");
    params.source = options.source.trim().toUpperCase();
  }

  if (options.search?.trim()) {
    where.push("(l.name_th LIKE :search OR l.name_en LIKE :search OR l.code LIKE :search OR l.external_key LIKE :search OR l.province_name LIKE :search OR l.district_name LIKE :search)");
    params.search = `%${options.search.trim()}%`;
  }

  const rows = await queryRows<LocationRow>(
    `
      ${SELECT_LOCATIONS_SQL}
      WHERE ${where.join(" AND ")}
      ORDER BY l.location_type, l.name_th
      LIMIT :limit
    `,
    params,
  );

  return rows.map(mapLocation);
}

export async function listSafetyEffortLocationsBySourceKeys(source: string, externalKeys: string[]) {
  if (!externalKeys.length) return [];
  const rows = await queryRows<LocationRow>(
    `
      ${SELECT_LOCATIONS_SQL}
      WHERE l.source = :source AND l.external_key IN (:externalKeys) AND l.deleted_at IS NULL
      ORDER BY l.name_th
    `,
    { source, externalKeys },
  );
  return rows.map(mapLocation);
}

export async function getSafetyEffortLocation(id: string) {
  const rows = await queryRows<LocationRow>(
    `
      ${SELECT_LOCATIONS_SQL}
      WHERE l.id = :id AND l.deleted_at IS NULL
      LIMIT 1
    `,
    { id },
  );
  if (!rows[0]) return null;
  return {
    ...mapLocation(rows[0]),
    sourceDetail: await getSafetyEffortLocationSourceDetail(id),
  };
}

export async function findSafetyEffortLocationForCheckin(input: {
  id?: string | null;
  code?: string | null;
  name?: string | null;
}) {
  const clauses = ["l.deleted_at IS NULL"];
  const params: Record<string, unknown> = {};

  if (input.id) {
    clauses.push("l.id = :id");
    params.id = input.id;
  }
  if (input.code) {
    clauses.push("l.code = :code OR l.external_key = :code");
    params.code = input.code;
  }
  if (input.name) {
    clauses.push("l.name_th = :name OR l.name_en = :name");
    params.name = input.name;
  }
  if (!params.id && !params.code && !params.name) return null;

  const rows = await queryRows<LocationRow>(
    `
      ${SELECT_LOCATIONS_SQL}
      WHERE (${clauses.slice(1).join(" OR ")}) AND l.deleted_at IS NULL
      ORDER BY l.checkin_enabled DESC, l.updated_at DESC
      LIMIT 1
    `,
    params,
  );
  return rows[0] ? mapLocation(rows[0]) : null;
}

type NearestLocationRow = LocationRow & {
  distance_m: number | string | null;
};

export async function findNearestSafetyEffortLocation(input: {
  lat: number;
  lng: number;
}) {
  const rows = await queryRows<NearestLocationRow>(
    `
      SELECT
        l.id,
        l.created_by,
        COALESCE(NULLIF(creator.name_th, ''), NULLIF(creator.name_en, ''), creator.email) AS creator_name,
        creator.email AS creator_email,
        l.organization_id,
        o.external_code AS organization_code,
        o.name_th AS organization_name,
        l.location_type,
        l.source,
        l.external_key,
        l.code,
        l.name_th,
        l.name_en,
        l.province_name,
        l.district_name,
        l.plant_type,
        l.production_type,
        l.sap_code,
        l.site_material_code,
        l.status,
        l.map_visible,
        l.checkin_enabled,
        ST_Latitude(l.position) AS lat,
        ST_Longitude(l.position) AS lng,
        l.created_at,
        l.updated_at,
        ST_Distance_Sphere(l.position, ST_GeomFromText(:pointWkt, 4326, 'axis-order=long-lat')) AS distance_m
      FROM locations l
      LEFT JOIN organizations o ON o.id = l.organization_id
      LEFT JOIN users creator ON creator.id = l.created_by AND creator.deleted_at IS NULL
      WHERE l.deleted_at IS NULL
        AND l.position IS NOT NULL
      ORDER BY distance_m ASC
      LIMIT 1
    `,
    { pointWkt: `POINT(${input.lng} ${input.lat})` },
  );
  if (!rows[0]) return null;
  return {
    ...mapLocation(rows[0]),
    distanceM: rows[0].distance_m === null ? null : Number(rows[0].distance_m),
  };
}

export async function createSafetyEffortLocation(input: SafetyEffortLocationInput) {
  const normalizedInput = {
    ...input,
    source: input.locationType === "PLANT" ? "ADMIN" : input.source || "ADMIN",
  };
  const pointWkt = `POINT(${input.lng} ${input.lat})`;
  const id = await withTransaction(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      `
        INSERT INTO locations (
          organization_id,
          location_type,
          source,
          external_key,
          code,
          name_th,
          name_en,
          position,
          province_name,
          district_name,
          status,
          map_visible,
          checkin_enabled,
          created_by
        ) VALUES (
          :organizationId,
          :locationType,
          :source,
          :externalKey,
          :code,
          :nameTh,
          :nameEn,
          ST_GeomFromText(:pointWkt, 4326, 'axis-order=long-lat'),
          :provinceName,
          :districtName,
          :status,
          :mapVisible,
          :checkinEnabled,
          :createdBy
        )
      `,
      { ...normalizedInput, pointWkt },
    );
    return String(result.insertId);
  });

  const location = await getSafetyEffortLocation(id);
  if (!location) throw new Error("Unable to load created location");
  return location;
}

export async function updateSafetyEffortLocation(id: string, input: Partial<SafetyEffortLocationInput>) {
  const current = await getSafetyEffortLocation(id);
  if (!current) return null;
  if (current.source.startsWith("RMR_SSO_") || current.source.startsWith("RMC_SSO_")) throw new Error("source_read_only");

  const next = {
    locationType: input.locationType ?? current.locationType,
    source: input.source ?? current.source,
    externalKey: input.externalKey ?? current.externalKey,
    code: input.code ?? current.code,
    nameTh: input.nameTh ?? current.nameTh,
    nameEn: input.nameEn ?? current.nameEn,
    lat: input.lat ?? current.lat,
    lng: input.lng ?? current.lng,
    provinceName: input.provinceName ?? current.provinceName,
    districtName: input.districtName ?? current.districtName,
    status: input.status ?? current.status,
    mapVisible: input.mapVisible ?? current.mapVisible,
    checkinEnabled: input.checkinEnabled ?? current.checkinEnabled,
    organizationId: input.organizationId ?? current.organizationId,
  };

  if (next.lat === null || next.lng === null) throw new Error("lat/lng are required");
  const pointWkt = `POINT(${next.lng} ${next.lat})`;

  await withTransaction(async (connection) => {
    await connection.execute<ResultSetHeader>(
      `
        UPDATE locations
        SET
          organization_id = :organizationId,
          location_type = :locationType,
          source = :source,
          external_key = :externalKey,
          code = :code,
          name_th = :nameTh,
          name_en = :nameEn,
          position = ST_GeomFromText(:pointWkt, 4326, 'axis-order=long-lat'),
          province_name = :provinceName,
          district_name = :districtName,
          status = :status,
          map_visible = :mapVisible,
          checkin_enabled = :checkinEnabled
        WHERE id = :id AND deleted_at IS NULL
      `,
      { ...next, id, pointWkt },
    );
  });

  return getSafetyEffortLocation(id);
}

export async function deleteSafetyEffortLocation(id: string) {
  const current = await getSafetyEffortLocation(id);
  if (!current) return;
  if (current.source.startsWith("RMR_SSO_") || current.source.startsWith("RMC_SSO_")) throw new Error("source_read_only");
  await withTransaction(async (connection) => {
    await connection.execute<ResultSetHeader>(
      `
        UPDATE locations
        SET deleted_at = UTC_TIMESTAMP(3), status = 'INACTIVE'
        WHERE id = :id AND deleted_at IS NULL
      `,
      { id },
    );
  });
}
