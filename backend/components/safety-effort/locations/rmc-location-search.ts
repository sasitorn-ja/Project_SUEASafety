import "server-only";

import { createHash } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";

import { queryRows } from "@backend/components/core/db";
import { queryRmrSsoRows } from "@backend/components/core/rmr-sso-db";
import type { SafetyEffortLocationType } from "./repository";

type SourceRow = RowDataPacket & Record<string, unknown>;

type NormalizedLiveLocation = {
  id: string;
  createdBy: null;
  creatorName: null;
  creatorEmail: null;
  organizationId: null;
  organizationCode: null;
  organizationName: null;
  locationType: SafetyEffortLocationType;
  source: string;
  readOnly: true;
  externalKey: string;
  code: string;
  nameTh: string;
  nameEn: string | null;
  provinceName: string | null;
  districtName: string | null;
  plantType: string | null;
  productionType: string | null;
  sapCode: string | null;
  siteMaterialCode: string | null;
  status: string;
  mapVisible: true;
  checkinEnabled: true;
  lat: number;
  lng: number;
  createdAt: null;
  updatedAt: null;
  distanceM?: number | null;
  sourceDetail?: Record<string, unknown>;
};

function text(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validCoordinates(lat: number | null, lng: number | null): lat is number {
  return lat !== null && lng !== null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function distanceSquared(lat: number, lng: number, near?: { lat: number | null; lng: number | null }) {
  if (!validCoordinates(near?.lat ?? null, near?.lng ?? null)) return Number.POSITIVE_INFINITY;
  return Math.pow(lat - Number(near?.lat), 2) + Math.pow(lng - Number(near?.lng), 2);
}

function officeKey(row: SourceRow) {
  const identity = `${text(row.DIVISION_NAME)}:${text(row.OFFICE_NAME)}`;
  return `OFFICE-${createHash("sha1").update(identity).digest("hex").slice(0, 24)}`;
}

function sourceValue(row: SourceRow, ...names: string[]) {
  const entries = new Map(Object.entries(row).map(([key, value]) => [key.toUpperCase(), value]));
  for (const name of names) {
    const value = entries.get(name.toUpperCase());
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return null;
}

function buildLiveLocation(input: {
  locationType: SafetyEffortLocationType;
  source: string;
  externalKey: string;
  code?: string | null;
  nameTh: string;
  nameEn?: string | null;
  provinceName?: string | null;
  districtName?: string | null;
  plantType?: string | null;
  productionType?: string | null;
  sapCode?: string | null;
  siteMaterialCode?: string | null;
  status?: string | null;
  lat: number;
  lng: number;
  sourceDetail?: Record<string, unknown>;
  distanceM?: number | null;
}): NormalizedLiveLocation {
  return {
    id: `${input.source}:${input.externalKey}`,
    createdBy: null,
    creatorName: null,
    creatorEmail: null,
    organizationId: null,
    organizationCode: null,
    organizationName: null,
    locationType: input.locationType,
    source: input.source,
    readOnly: true,
    externalKey: input.externalKey,
    code: input.code || input.externalKey,
    nameTh: input.nameTh,
    nameEn: input.nameEn || null,
    provinceName: input.provinceName || null,
    districtName: input.districtName || null,
    plantType: input.plantType || null,
    productionType: input.productionType || null,
    sapCode: input.sapCode || null,
    siteMaterialCode: input.siteMaterialCode || null,
    status: input.status || "ACTIVE",
    mapVisible: true,
    checkinEnabled: true,
    lat: input.lat,
    lng: input.lng,
    createdAt: null,
    updatedAt: null,
    distanceM: input.distanceM ?? null,
    sourceDetail: input.sourceDetail,
  };
}

function normalizeOfficeRows(rows: SourceRow[], near?: { lat: number | null; lng: number | null }) {
  return rows
    .flatMap((row) => {
      const externalKey = officeKey(row);
      const nameTh = text(row.OFFICE_NAME);
      const lat = numberValue(row.LATITUDE);
      const lng = numberValue(row.LONGITUDE);
      if (!externalKey || !nameTh || !validCoordinates(lat, lng)) return [];
      return [
        buildLiveLocation({
          locationType: "OFFICE",
          source: "RMC_SSO_OFFICE",
          externalKey,
          nameTh,
          provinceName: text(row.PROVINCE_NAME) || null,
          lat,
          lng: lng as number,
          distanceM: validCoordinates(near?.lat ?? null, near?.lng ?? null)
            ? Math.round(Math.sqrt(distanceSquared(lat, lng as number, near)) * 111000)
            : null,
          sourceDetail: {
            divisionName: text(row.DIVISION_NAME) || null,
            officeName: nameTh,
          },
        }),
      ];
    })
    .sort((left, right) => left.nameTh.localeCompare(right.nameTh, "th"));
}

function normalizeSiteRows(rows: SourceRow[], near?: { lat: number | null; lng: number | null }) {
  return rows
    .flatMap((row) => {
      const externalKey = text(row.SITE_NO);
      const nameTh = text(row.SITE_NAME);
      const lat = numberValue(row.LATITUDE);
      const lng = numberValue(row.LONGITUDE);
      if (!externalKey || !nameTh || !validCoordinates(lat, lng)) return [];
      return [
        buildLiveLocation({
          locationType: "SITE",
          source: "RMC_SSO_SITE",
          externalKey,
          nameTh,
          provinceName: text(row.PROVINCE_NAME) || null,
          districtName: text(row.DISTRICT_NAME) || null,
          status: text(row.STATUS) === "A" ? "ACTIVE" : "INACTIVE",
          lat,
          lng: lng as number,
          distanceM: validCoordinates(near?.lat ?? null, near?.lng ?? null)
            ? Math.round(Math.sqrt(distanceSquared(lat, lng as number, near)) * 111000)
            : null,
          sourceDetail: {
            customerName: text(row.CUSTOMER_NAME) || null,
            siteNo: externalKey,
          },
        }),
      ];
    });
}

function normalizePlantRows(rows: SourceRow[], near?: { lat: number | null; lng: number | null }) {
  return rows
    .flatMap((row) => {
      const plantKey = text(sourceValue(row, "PLANT_NO", "PLANT_ID", "ID", "CODE"));
      const plantName = text(sourceValue(row, "PLANT_NAME", "NAME_TH", "NAME"));
      const lat = numberValue(sourceValue(row, "LATITUDE", "LAT"));
      const lng = numberValue(sourceValue(row, "LONGITUDE", "LNG", "LON"));
      if (!plantKey || !plantName || !validCoordinates(lat, lng)) return [];
      const plantNameEn = text(sourceValue(row, "PLANT_NAME_EN", "NAME_EN")) || null;
      const plantNameCn = text(sourceValue(row, "PLANT_NAME_CN", "NAME_CN")) || null;
      const divisionNo = text(sourceValue(row, "DIVISION_NO")) || null;
      const divisionName = text(sourceValue(row, "DIVISION_NAME")) || null;
      const factNo = text(sourceValue(row, "FACT_NO")) || null;
      const factName = text(sourceValue(row, "FACT_NAME")) || null;
      const sectNo = text(sourceValue(row, "SECT_NO")) || null;
      const sectName = text(sourceValue(row, "SECT_NAME")) || null;
      const plantTypeProd = text(sourceValue(row, "PLANT_TYPE_PROD", "PRODUCTION_TYPE")) || null;
      const plantType = text(sourceValue(row, "PLANT_TYPE")) || null;
      const sapCode = text(sourceValue(row, "PLANT_NO_SAP", "SAP_CODE")) || null;
      const siteMaterialCode = text(sourceValue(row, "SITEMATERAIL", "SITE_MATERIAL", "SITE_MATERIAL_CODE")) || null;
      const provinceName = text(sourceValue(row, "PROVINCE_NAME", "PROVINCE")) || null;
      const districtName = text(sourceValue(row, "DISTRICT_NAME", "DISTRICT")) || null;
      const statusCode = text(sourceValue(row, "STATUS", "STATUS_CODE") || "A").toUpperCase();
      return [
        buildLiveLocation({
          locationType: "PLANT",
          source: "RMR_SSO_PLANT",
          externalKey: plantKey,
          code: plantKey,
          nameTh: plantName,
          nameEn: plantNameEn,
          provinceName,
          districtName,
          plantType,
          productionType: plantTypeProd,
          sapCode,
          siteMaterialCode,
          status: statusCode === "C" ? "CLOSED" : "ACTIVE",
          lat,
          lng: lng as number,
          distanceM: validCoordinates(near?.lat ?? null, near?.lng ?? null)
            ? Math.round(Math.sqrt(distanceSquared(lat, lng as number, near)) * 111000)
            : null,
          sourceDetail: {
            divisionNo,
            divisionName,
            factNo,
            factName,
            sectNo,
            sectName,
            plantNameCn,
          },
        }),
      ];
    });
}

function filterAndLimit(
  items: NormalizedLiveLocation[],
  search = "",
  limit = 1000,
  near?: { lat: number | null; lng: number | null },
) {
  const keyword = search.trim().toLowerCase();
  let filtered = items;
  if (keyword) {
    filtered = items.filter((item) => {
      const haystack = [
        item.nameTh,
        item.nameEn,
        item.code,
        item.externalKey,
        item.provinceName,
        item.districtName,
        item.sourceDetail ? Object.values(item.sourceDetail).join(" ") : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }

  const hasNear = validCoordinates(near?.lat ?? null, near?.lng ?? null);
  filtered.sort((left, right) => {
    if (hasNear) {
      const leftDistance = distanceSquared(left.lat, left.lng, near);
      const rightDistance = distanceSquared(right.lat, right.lng, near);
      if (leftDistance !== rightDistance) return leftDistance - rightDistance;
    }
    return left.nameTh.localeCompare(right.nameTh, "th");
  });

  return filtered.slice(0, Math.min(Math.max(limit || 30, 1), 1000));
}

export async function listRmcOffices(options?: {
  search?: string;
  limit?: number;
  near?: { lat: number | null; lng: number | null };
}) {
  const rows = await queryRmrSsoRows<SourceRow>(
    `SELECT DIVISION_NAME, OFFICE_NAME, LATITUDE, LONGITUDE, PROVINCE_NAME
     FROM offices
     WHERE OFFICE_NAME IS NOT NULL AND LATITUDE IS NOT NULL AND LONGITUDE IS NOT NULL`,
  );
  return filterAndLimit(normalizeOfficeRows(rows, options?.near), options?.search, options?.limit || 200, options?.near);
}

export async function searchRmcSites(query: string, limit = 30, near?: { lat: number | null; lng: number | null }) {
  const keyword = query.trim();
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 50);
  const nearLat = near?.lat ?? null;
  const nearLng = near?.lng ?? null;
  const hasNear = validCoordinates(nearLat, nearLng);
  const distanceOrder = hasNear
    ? `POW(CAST(LATITUDE AS DECIMAL(12,8)) - :nearLat, 2) + POW(CAST(LONGITUDE AS DECIMAL(12,8)) - :nearLng, 2),`
    : "";

  const rows = keyword.length < 3
    ? await queryRmrSsoRows<SourceRow>(
        `SELECT SITE_NO, SITE_NAME, DISTRICT_NAME, PROVINCE_NAME, LATITUDE, LONGITUDE, STATUS, CUSTOMER_NAME
         FROM sites
         WHERE STATUS = 'A'
           AND LATITUDE IS NOT NULL AND LONGITUDE IS NOT NULL
         ORDER BY ${distanceOrder} UPDATE_DATE DESC, SITE_NAME
         LIMIT ${safeLimit}`,
        hasNear ? { nearLat, nearLng } : undefined,
      )
    : await queryRmrSsoRows<SourceRow>(
        `SELECT SITE_NO, SITE_NAME, DISTRICT_NAME, PROVINCE_NAME, LATITUDE, LONGITUDE, STATUS, CUSTOMER_NAME
         FROM sites
         WHERE STATUS = 'A'
           AND LATITUDE IS NOT NULL AND LONGITUDE IS NOT NULL
           AND (SITE_NO LIKE :prefix OR SITE_NAME LIKE :contains
             OR PROVINCE_NAME LIKE :contains OR CUSTOMER_NAME LIKE :contains)
         ORDER BY CASE WHEN SITE_NO = :keyword THEN 0 WHEN SITE_NO LIKE :prefix THEN 1 ELSE 2 END,
           ${distanceOrder}
           UPDATE_DATE DESC, SITE_NAME
         LIMIT ${safeLimit}`,
        { keyword, prefix: `${keyword}%`, contains: `%${keyword}%`, ...(hasNear ? { nearLat, nearLng } : {}) },
      );

  return normalizeSiteRows(rows, near).slice(0, safeLimit);
}

export async function listRmrPlants(options?: {
  search?: string;
  limit?: number;
  near?: { lat: number | null; lng: number | null };
}) {
  const rows = await queryRmrSsoRows<SourceRow>("SELECT * FROM plant");
  return filterAndLimit(normalizePlantRows(rows, options?.near), options?.search, options?.limit || 1000, options?.near);
}

export async function buildRmrPlantBusinessUnitMap() {
  const rows = await listRmrPlants({ limit: 5000 });
  return new Map(
    rows.map((row) => [
      row.code,
      {
        divisionName: typeof row.sourceDetail?.divisionName === "string" ? row.sourceDetail.divisionName : "",
        factName: typeof row.sourceDetail?.factName === "string" ? row.sourceDetail.factName : "",
      },
    ]),
  );
}

export async function findMasterLocationBySource(input: {
  source?: string | null;
  code?: string | null;
  name?: string | null;
}) {
  const source = text(input.source).toUpperCase();
  const code = text(input.code);
  const name = text(input.name);

  if (source === "RMR_SSO_PLANT") {
    const plants = await listRmrPlants({ search: code || name, limit: 50 });
    return plants.find((item) => item.code === code || item.externalKey === code || item.nameTh === name) || null;
  }
  if (source === "RMC_SSO_OFFICE") {
    const offices = await listRmcOffices({ search: code || name, limit: 50 });
    return offices.find((item) => item.code === code || item.externalKey === code || item.nameTh === name) || null;
  }
  if (source === "RMC_SSO_SITE") {
    const sites = await searchRmcSites(code || name, 50);
    return sites.find((item) => item.code === code || item.externalKey === code || item.nameTh === name) || null;
  }
  return null;
}

export async function findNearestCustomLocation(input: { lat: number; lng: number }) {
  const rows = await queryRows<RowDataPacket & {
    id: string;
    source: string;
    location_type: string;
    external_key: string | null;
    code: string | null;
    name_th: string;
    province_name: string | null;
    district_name: string | null;
    lat: number | string | null;
    lng: number | string | null;
    distance_m: number | string | null;
  }>(
    `
      SELECT
        l.id,
        l.source,
        l.location_type,
        l.external_key,
        l.code,
        l.name_th,
        l.province_name,
        l.district_name,
        ST_Latitude(l.position) AS lat,
        ST_Longitude(l.position) AS lng,
        ST_Distance_Sphere(l.position, ST_GeomFromText(:pointWkt, 4326, 'axis-order=long-lat')) AS distance_m
      FROM locations l
      WHERE l.deleted_at IS NULL
        AND l.position IS NOT NULL
        AND l.source = 'ADMIN'
      ORDER BY distance_m ASC
      LIMIT 1
    `,
    { pointWkt: `POINT(${input.lng} ${input.lat})` },
  );

  const row = rows[0];
  if (!row || row.lat === null || row.lng === null) return null;
  return buildLiveLocation({
    locationType: String(row.location_type || "CUSTOM") as SafetyEffortLocationType,
    source: String(row.source || "ADMIN"),
    externalKey: String(row.external_key || row.code || row.id),
    code: String(row.code || row.external_key || row.id),
    nameTh: String(row.name_th || "-"),
    provinceName: row.province_name ? String(row.province_name) : null,
    districtName: row.district_name ? String(row.district_name) : null,
    lat: Number(row.lat),
    lng: Number(row.lng),
    distanceM: row.distance_m === null ? null : Number(row.distance_m),
  });
}

export async function findNearestMasterLocation(input: { lat: number; lng: number }) {
  const [plants, offices, sites, custom] = await Promise.all([
    listRmrPlants({ limit: 5000, near: input }),
    listRmcOffices({ limit: 200, near: input }),
    searchRmcSites("", 30, input),
    findNearestCustomLocation(input),
  ]);

  const candidates = [...plants, ...offices, ...sites, ...(custom ? [custom] : [])];
  if (!candidates.length) return null;
  candidates.sort((left, right) => (left.distanceM ?? Number.POSITIVE_INFINITY) - (right.distanceM ?? Number.POSITIVE_INFINITY));
  return candidates[0] || null;
}
