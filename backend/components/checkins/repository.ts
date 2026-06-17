import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { queryRows, withTransaction } from "@backend/components/core/db";
import { getSafetyEffortLocation } from "@backend/components/safety-effort/locations/repository";

type CheckinRow = RowDataPacket & {
  id: string;
  user_id: string;
  selected_location_id: string;
  selected_location_name_snapshot: string;
  selected_lat: number | string | null;
  selected_lng: number | string | null;
  actual_lat: number | string | null;
  actual_lng: number | string | null;
  actual_accuracy_m: number | string | null;
  distance_from_selected_m: number | string;
  location_match_status: string;
  location_source: string;
  device_metadata: string | null;
  checked_in_at: Date | string;
  created_at: Date | string;
};

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earthRadiusM = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function mapCheckin(row: CheckinRow) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    selectedLocationId: String(row.selected_location_id),
    selectedLocationName: row.selected_location_name_snapshot,
    selectedLat: row.selected_lat === null ? null : Number(row.selected_lat),
    selectedLng: row.selected_lng === null ? null : Number(row.selected_lng),
    actualLat: row.actual_lat === null ? null : Number(row.actual_lat),
    actualLng: row.actual_lng === null ? null : Number(row.actual_lng),
    actualAccuracyM: row.actual_accuracy_m === null ? null : Number(row.actual_accuracy_m),
    distanceFromSelectedM: Number(row.distance_from_selected_m),
    locationMatchStatus: row.location_match_status,
    locationSource: row.location_source,
    deviceMetadata: typeof row.device_metadata === "string" ? JSON.parse(row.device_metadata || "null") : row.device_metadata,
    checkedInAt: new Date(row.checked_in_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

const SELECT_CHECKINS_SQL = `
  SELECT
    c.id,
    c.user_id,
    c.selected_location_id,
    c.selected_location_name_snapshot,
    ST_Y(c.selected_location_position_snapshot) AS selected_lat,
    ST_X(c.selected_location_position_snapshot) AS selected_lng,
    ST_Y(c.actual_position) AS actual_lat,
    ST_X(c.actual_position) AS actual_lng,
    c.actual_accuracy_m,
    c.distance_from_selected_m,
    c.location_match_status,
    c.location_source,
    c.device_metadata,
    c.checked_in_at,
    c.created_at
  FROM checkins c
`;

export async function createCheckin(input: {
  userId: string;
  locationId: string;
  actualLat: number;
  actualLng: number;
  actualAccuracyM?: number | null;
  locationSource?: string | null;
  deviceMetadata?: unknown;
}) {
  const selectedLocation = await getSafetyEffortLocation(input.locationId);
  if (!selectedLocation?.lat || !selectedLocation.lng) {
    throw new Error("selected_location_not_found");
  }

  const distance = distanceMeters(
    { lat: selectedLocation.lat, lng: selectedLocation.lng },
    { lat: input.actualLat, lng: input.actualLng },
  );
  const matchStatus = distance <= 250 ? "MATCHED" : "OUT_OF_RANGE";

  const id = await withTransaction(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      `
        INSERT INTO checkins (
          user_id,
          selected_location_id,
          selected_location_name_snapshot,
          selected_location_position_snapshot,
          actual_position,
          actual_accuracy_m,
          distance_from_selected_m,
          location_match_status,
          location_source,
          device_metadata
        ) VALUES (
          :userId,
          :locationId,
          :locationName,
          ST_GeomFromText(:selectedPointWkt, 4326),
          ST_GeomFromText(:actualPointWkt, 4326),
          :actualAccuracyM,
          :distance,
          :matchStatus,
          :locationSource,
          :deviceMetadata
        )
      `,
      {
        userId: input.userId,
        locationId: input.locationId,
        locationName: selectedLocation.nameTh,
        selectedPointWkt: `POINT(${selectedLocation.lng} ${selectedLocation.lat})`,
        actualPointWkt: `POINT(${input.actualLng} ${input.actualLat})`,
        actualAccuracyM: input.actualAccuracyM ?? null,
        distance,
        matchStatus,
        locationSource: input.locationSource || "GPS",
        deviceMetadata: input.deviceMetadata ? JSON.stringify(input.deviceMetadata) : null,
      },
    );
    return String(result.insertId);
  });

  return getCheckin(id, input.userId);
}

export async function getCheckin(id: string, userId?: string) {
  const where = ["c.id = :id"];
  const params: Record<string, unknown> = { id };
  if (userId) {
    where.push("c.user_id = :userId");
    params.userId = userId;
  }
  const rows = await queryRows<CheckinRow>(
    `${SELECT_CHECKINS_SQL} WHERE ${where.join(" AND ")} LIMIT 1`,
    params,
  );
  return rows[0] ? mapCheckin(rows[0]) : null;
}

export async function listCheckins(options: {
  userId?: string;
  locationId?: string | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(Number(options.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(options.pageSize) || 50, 1), 200);
  const offset = (page - 1) * pageSize;
  const where = ["1 = 1"];
  const params: Record<string, unknown> = { limit: pageSize, offset };

  if (options.userId) {
    where.push("c.user_id = :userId");
    params.userId = options.userId;
  }
  if (options.locationId) {
    where.push("c.selected_location_id = :locationId");
    params.locationId = options.locationId;
  }
  if (options.from) {
    where.push("c.checked_in_at >= :from");
    params.from = `${options.from} 00:00:00`;
  }
  if (options.to) {
    where.push("c.checked_in_at <= :to");
    params.to = `${options.to} 23:59:59`;
  }

  const rows = await queryRows<CheckinRow>(
    `
      ${SELECT_CHECKINS_SQL}
      WHERE ${where.join(" AND ")}
      ORDER BY c.checked_in_at DESC, c.id DESC
      LIMIT :limit OFFSET :offset
    `,
    params,
  );

  return {
    items: rows.map(mapCheckin),
    page,
    pageSize,
    nextPage: rows.length === pageSize ? page + 1 : null,
  };
}
