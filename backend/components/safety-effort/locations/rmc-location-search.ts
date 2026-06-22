import "server-only";

import { createHash } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";

import { queryRmrSsoRows } from "@backend/components/core/rmr-sso-db";
import { withTransaction } from "@backend/components/core/db";
import { listSafetyEffortLocationsBySourceKeys, type SafetyEffortLocationType } from "./repository";

type SourceRow = RowDataPacket & Record<string, unknown>;

function text(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function coordinate(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validCoordinates(lat: number | null, lng: number | null): lat is number {
  return lat !== null && lng !== null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function officeKey(row: SourceRow) {
  const identity = `${text(row.DIVISION_NAME)}:${text(row.OFFICE_NAME)}`;
  return `OFFICE-${createHash("sha1").update(identity).digest("hex").slice(0, 24)}`;
}

async function mirrorRows(type: SafetyEffortLocationType, source: string, rows: SourceRow[]) {
  const normalized = rows.flatMap((row) => {
    const externalKey = type === "SITE" ? text(row.SITE_NO) : officeKey(row);
    const nameTh = type === "SITE" ? text(row.SITE_NAME) : text(row.OFFICE_NAME);
    const lat = coordinate(row.LATITUDE);
    const lng = coordinate(row.LONGITUDE);
    if (!externalKey || !nameTh || !validCoordinates(lat, lng)) return [];
    return [{
      externalKey,
      nameTh,
      lat,
      lng: lng as number,
      provinceName: text(row.PROVINCE_NAME) || null,
      districtName: type === "SITE" ? text(row.DISTRICT_NAME) || null : null,
      status: type === "SITE" && text(row.STATUS) !== "A" ? "INACTIVE" : "ACTIVE",
    }];
  });

  await withTransaction(async (connection) => {
    for (const item of normalized) {
      await connection.execute(
        `INSERT INTO locations
         (location_type, source, external_key, code, name_th, position, province_name,
          district_name, status, map_visible, checkin_enabled)
         VALUES (:type,:source,:externalKey,:externalKey,:nameTh,
          ST_GeomFromText(:pointWkt,4326,'axis-order=long-lat'),:provinceName,
          :districtName,:status,1,1)
         ON DUPLICATE KEY UPDATE location_type=VALUES(location_type), code=VALUES(code),
          name_th=VALUES(name_th), position=VALUES(position), province_name=VALUES(province_name),
          district_name=VALUES(district_name), status=VALUES(status), map_visible=1,
          checkin_enabled=1, deleted_at=NULL`,
        { ...item, type, source, pointWkt: `POINT(${item.lng} ${item.lat})` },
      );
    }
  });

  const keys = normalized.map((item) => item.externalKey);
  if (!keys.length) return [];
  return listSafetyEffortLocationsBySourceKeys(source, keys);
}

export async function listRmcOffices() {
  const rows = await queryRmrSsoRows<SourceRow>(
    `SELECT DIVISION_NAME, OFFICE_NAME, LATITUDE, LONGITUDE, PROVINCE_NAME
     FROM offices
     WHERE OFFICE_NAME IS NOT NULL AND LATITUDE IS NOT NULL AND LONGITUDE IS NOT NULL
     ORDER BY OFFICE_NAME`,
  );
  return mirrorRows("OFFICE", "RMC_SSO_OFFICE", rows);
}

export async function searchRmcSites(query: string, limit = 30) {
  const keyword = query.trim();
  if (keyword.length < 3) return [];
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 30);
  const rows = await queryRmrSsoRows<SourceRow>(
    `SELECT SITE_NO, SITE_NAME, DISTRICT_NAME, PROVINCE_NAME, LATITUDE, LONGITUDE, STATUS
     FROM sites
     WHERE STATUS = 'A'
       AND LATITUDE IS NOT NULL AND LONGITUDE IS NOT NULL
       AND (SITE_NO LIKE :prefix OR SITE_NAME LIKE :contains
         OR PROVINCE_NAME LIKE :contains OR CUSTOMER_NAME LIKE :contains)
     ORDER BY CASE WHEN SITE_NO = :keyword THEN 0 WHEN SITE_NO LIKE :prefix THEN 1 ELSE 2 END,
       UPDATE_DATE DESC, SITE_NAME
     LIMIT ${safeLimit}`,
    { keyword, prefix: `${keyword}%`, contains: `%${keyword}%` },
  );
  return mirrorRows("SITE", "RMC_SSO_SITE", rows);
}
