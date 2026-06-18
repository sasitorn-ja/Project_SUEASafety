import "server-only";

import type { RowDataPacket } from "mysql2/promise";

import { queryRmrSsoRows } from "@backend/components/core/rmr-sso-db";
import { withTransaction } from "@backend/components/core/db";

type PlantSourceRow = RowDataPacket & Record<string, unknown>;

function sourceValue(row: PlantSourceRow, ...names: string[]) {
  const entries = new Map(Object.entries(row).map(([key, value]) => [key.toUpperCase(), value]));
  for (const name of names) {
    const value = entries.get(name.toUpperCase());
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return null;
}

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function syncRmrPlants(importedBy: string) {
  const sourceRows = await queryRmrSsoRows<PlantSourceRow>("SELECT * FROM Plant");
  const normalized = sourceRows.flatMap((row) => {
    const plantKey = sourceValue(row, "PLANT_NO", "PLANT_ID", "ID", "CODE");
    const plantName = sourceValue(row, "PLANT_NAME", "NAME_TH", "NAME");
    const lat = numberValue(sourceValue(row, "LATITUDE", "LAT"));
    const lng = numberValue(sourceValue(row, "LONGITUDE", "LNG", "LON"));
    if (!plantKey || !plantName || lat === null || lng === null) return [];
    return [{
      row,
      plantKey: String(plantKey).trim(),
      plantName: String(plantName).trim(),
      plantNameEn: sourceValue(row, "PLANT_NAME_EN", "NAME_EN"),
      plantNameCn: sourceValue(row, "PLANT_NAME_CN", "NAME_CN"),
      statusCode: String(sourceValue(row, "STATUS", "STATUS_CODE") || "A").toUpperCase(),
      lat,
      lng,
    }];
  });

  return withTransaction(async (connection) => {
    const [batchResult] = await connection.execute<import("mysql2/promise").ResultSetHeader>(
      `INSERT INTO location_import_batches
       (file_name, source, imported_by, status, total_rows)
       VALUES (:fileName, 'RMR_SSO_PLANT', :importedBy, 'PROCESSING', :totalRows)`,
      { fileName: `rmr_sso_plant_${Date.now()}`, importedBy, totalRows: sourceRows.length },
    );
    const batchId = String(batchResult.insertId);
    let successRows = 0;
    let failedRows = 0;
    const seenKeys: string[] = [];

    for (let index = 0; index < sourceRows.length; index += 1) {
      const item = normalized.find((candidate) => candidate.row === sourceRows[index]);
      if (!item) {
        failedRows += 1;
        await connection.execute(
          `INSERT INTO location_import_rows
           (import_batch_id, row_number, action, raw_data, error_message)
           VALUES (:batchId, :rowNumber, 'ERROR', :rawData, 'missing plant key/name/GPS')`,
          { batchId, rowNumber: index + 1, rawData: JSON.stringify(sourceRows[index]) },
        );
        continue;
      }

      const status = item.statusCode === "C" ? "CLOSED" : "ACTIVE";
      const pointWkt = `POINT(${item.lng} ${item.lat})`;
      const [existing] = await connection.execute<RowDataPacket[]>(
        "SELECT id FROM locations WHERE source='RMR_SSO_PLANT' AND external_key=:plantKey LIMIT 1",
        { plantKey: item.plantKey },
      );
      let locationId: string;
      let action: "INSERT" | "UPDATE";
      if (existing[0]) {
        locationId = String(existing[0].id);
        action = "UPDATE";
        await connection.execute(
          `UPDATE locations SET name_th=:nameTh, name_en=:nameEn,
           position=ST_GeomFromText(:pointWkt,4326), status=:status,
           map_visible=1, checkin_enabled=1, deleted_at=NULL
           WHERE id=:id`,
          { id: locationId, nameTh: item.plantName, nameEn: item.plantNameEn, pointWkt, status },
        );
      } else {
        action = "INSERT";
        const [locationResult] = await connection.execute<import("mysql2/promise").ResultSetHeader>(
          `INSERT INTO locations
           (location_type, source, external_key, code, name_th, name_en, position, status, map_visible, checkin_enabled)
           VALUES ('PLANT','RMR_SSO_PLANT',:plantKey,:plantKey,:nameTh,:nameEn,
           ST_GeomFromText(:pointWkt,4326),:status,1,1)`,
          { plantKey: item.plantKey, nameTh: item.plantName, nameEn: item.plantNameEn, pointWkt, status },
        );
        locationId = String(locationResult.insertId);
      }
      await connection.execute(
        `INSERT INTO plant_location_details
         (location_id, plant_no, plant_name, plant_name_en, plant_name_cn,
          status_code, source_latitude, source_longitude, source_raw)
         VALUES (:locationId,:plantNo,:plantName,:plantNameEn,:plantNameCn,
          :statusCode,:lat,:lng,:sourceRaw)
         ON DUPLICATE KEY UPDATE plant_name=VALUES(plant_name),
          plant_name_en=VALUES(plant_name_en), plant_name_cn=VALUES(plant_name_cn),
          status_code=VALUES(status_code), source_latitude=VALUES(source_latitude),
          source_longitude=VALUES(source_longitude), source_raw=VALUES(source_raw)`,
        {
          locationId,
          plantNo: item.plantKey,
          plantName: item.plantName,
          plantNameEn: item.plantNameEn,
          plantNameCn: item.plantNameCn,
          statusCode: item.statusCode,
          lat: item.lat,
          lng: item.lng,
          sourceRaw: JSON.stringify(item.row),
        },
      );
      await connection.execute(
        `INSERT INTO location_import_rows
         (import_batch_id,row_number,external_key,action,raw_data)
         VALUES (:batchId,:rowNumber,:plantKey,:action,:rawData)`,
        { batchId, rowNumber: index + 1, plantKey: item.plantKey, action, rawData: JSON.stringify(item.row) },
      );
      seenKeys.push(item.plantKey);
      successRows += 1;
    }

    if (seenKeys.length) {
      await connection.query(
        `UPDATE locations SET status='INACTIVE'
         WHERE source='RMR_SSO_PLANT' AND external_key NOT IN (?)`,
        [seenKeys],
      );
    }
    await connection.execute(
      `UPDATE location_import_batches SET status=:status, success_rows=:successRows,
       failed_rows=:failedRows, completed_at=UTC_TIMESTAMP(3) WHERE id=:batchId`,
      { batchId, status: failedRows ? "COMPLETED_WITH_ERRORS" : "COMPLETED", successRows, failedRows },
    );
    return { batchId, totalRows: sourceRows.length, successRows, failedRows };
  });
}
