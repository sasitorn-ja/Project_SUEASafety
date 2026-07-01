import "server-only";

import type { RowDataPacket } from "mysql2/promise";

import { queryLocationHubRows } from "@backend/components/core/location-hub-db";
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

function validCoordinates(lat: number | null, lng: number | null) {
  return lat !== null && lng !== null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export async function syncLocationHubPlants(importedBy: string) {
  const sourceRows = await queryLocationHubRows<PlantSourceRow>("SELECT * FROM plant");
  const normalized = sourceRows.flatMap((row) => {
    const plantKey = sourceValue(row, "PLANT_NO", "PLANT_ID", "ID", "CODE");
    const plantName = sourceValue(row, "PLANT_NAME", "NAME_TH", "NAME");
    const lat = numberValue(sourceValue(row, "LATITUDE", "LAT"));
    const lng = numberValue(sourceValue(row, "LONGITUDE", "LNG", "LON"));
    if (!plantKey || !plantName || !validCoordinates(lat, lng)) return [];
    return [{
      row,
      plantKey: String(plantKey).trim(),
      plantName: String(plantName).trim(),
      plantNameEn: sourceValue(row, "PLANT_NAME_EN", "NAME_EN"),
      plantNameCn: sourceValue(row, "PLANT_NAME_CN", "NAME_CN"),
      statusCode: String(sourceValue(row, "STATUS", "STATUS_CODE") || "A").toUpperCase(),
      divisionNo: sourceValue(row, "DIVISION_NO"),
      divisionName: sourceValue(row, "DIVISION_NAME"),
      factNo: sourceValue(row, "FACT_NO"),
      factName: sourceValue(row, "FACT_NAME"),
      sectNo: sourceValue(row, "SECT_NO"),
      sectName: sourceValue(row, "SECT_NAME"),
      plantTypeProd: sourceValue(row, "PLANT_TYPE_PROD", "PRODUCTION_TYPE"),
      plantType: sourceValue(row, "PLANT_TYPE"),
      plantNoSap: sourceValue(row, "PLANT_NO_SAP", "SAP_CODE"),
      siteMaterialCode: sourceValue(row, "SITEMATERAIL", "SITE_MATERIAL", "SITE_MATERIAL_CODE"),
      provinceName: sourceValue(row, "PROVINCE_NAME", "PROVINCE"),
      districtName: sourceValue(row, "DISTRICT_NAME", "DISTRICT"),
      lat,
      lng,
    }];
  });

  return withTransaction(async (connection) => {
    const [batchResult] = await connection.execute<import("mysql2/promise").ResultSetHeader>(
      `INSERT INTO location_import_batches
       (file_name, source, imported_by, status, total_rows)
       VALUES (:fileName, 'LOCATION_HUB_PLANT', :importedBy, 'PROCESSING', :totalRows)`,
      { fileName: `location_hub_plant_${Date.now()}`, importedBy, totalRows: sourceRows.length },
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
           (import_batch_id, \`row_number\`, action, raw_data, error_message)
           VALUES (:batchId, :rowNumber, 'ERROR', :rawData, 'missing plant key/name/GPS')`,
          { batchId, rowNumber: index + 1, rawData: JSON.stringify(sourceRows[index]) },
        );
        continue;
      }

      const status = item.statusCode === "C" ? "CLOSED" : "ACTIVE";
      const pointWkt = `POINT(${item.lng} ${item.lat})`;
      const [existing] = await connection.execute<RowDataPacket[]>(
        "SELECT id FROM locations WHERE source='LOCATION_HUB_PLANT' AND external_key=:plantKey LIMIT 1",
        { plantKey: item.plantKey },
      );
      let locationId: string;
      let action: "INSERT" | "UPDATE";
      if (existing[0]) {
        locationId = String(existing[0].id);
        action = "UPDATE";
        await connection.execute(
          `UPDATE locations SET name_th=:nameTh, name_en=:nameEn,
           name_cn=:nameCn, position=ST_GeomFromText(:pointWkt,4326,'axis-order=long-lat'),
           province_name=:provinceName, district_name=:districtName,
           plant_type=:plantType, production_type=:productionType,
           sap_code=:sapCode, site_material_code=:siteMaterialCode, status=:status,
           map_visible=1, checkin_enabled=1, deleted_at=NULL
           WHERE id=:id`,
          {
            id: locationId,
            nameTh: item.plantName,
            nameEn: item.plantNameEn,
            nameCn: item.plantNameCn,
            pointWkt,
            provinceName: item.provinceName,
            districtName: item.districtName,
            plantType: item.plantType,
            productionType: item.plantTypeProd,
            sapCode: item.plantNoSap,
            siteMaterialCode: item.siteMaterialCode,
            status,
          },
        );
      } else {
        action = "INSERT";
        const [locationResult] = await connection.execute<import("mysql2/promise").ResultSetHeader>(
          `INSERT INTO locations
           (location_type, source, external_key, code, name_th, name_en, name_cn,
            position, province_name, district_name, plant_type, production_type,
            sap_code, site_material_code, status, map_visible, checkin_enabled)
           VALUES ('PLANT','LOCATION_HUB_PLANT',:plantKey,:plantKey,:nameTh,:nameEn,:nameCn,
           ST_GeomFromText(:pointWkt,4326,'axis-order=long-lat'),:provinceName,:districtName,:plantType,
           :productionType,:sapCode,:siteMaterialCode,:status,1,1)`,
          {
            plantKey: item.plantKey,
            nameTh: item.plantName,
            nameEn: item.plantNameEn,
            nameCn: item.plantNameCn,
            pointWkt,
            provinceName: item.provinceName,
            districtName: item.districtName,
            plantType: item.plantType,
            productionType: item.plantTypeProd,
            sapCode: item.plantNoSap,
            siteMaterialCode: item.siteMaterialCode,
            status,
          },
        );
        locationId = String(locationResult.insertId);
      }
      await connection.execute(
        `INSERT INTO plant_location_details
         (location_id, division_no, division_name, fact_no, fact_name, sect_no, sect_name,
          plant_no, plant_name, plant_name_en, plant_name_cn, status_code, plant_type_prod,
          plant_type, plant_no_sap, site_material_code, source_latitude, source_longitude,
          province_name, district_name, source_raw)
         VALUES (:locationId,:divisionNo,:divisionName,:factNo,:factName,:sectNo,:sectName,
          :plantNo,:plantName,:plantNameEn,:plantNameCn,:statusCode,:plantTypeProd,
          :plantType,:plantNoSap,:siteMaterialCode,:lat,:lng,:provinceName,:districtName,:sourceRaw)
         ON DUPLICATE KEY UPDATE plant_name=VALUES(plant_name),
          plant_name_en=VALUES(plant_name_en), plant_name_cn=VALUES(plant_name_cn),
          division_no=VALUES(division_no), division_name=VALUES(division_name),
          fact_no=VALUES(fact_no), fact_name=VALUES(fact_name),
          sect_no=VALUES(sect_no), sect_name=VALUES(sect_name),
          status_code=VALUES(status_code), plant_type_prod=VALUES(plant_type_prod),
          plant_type=VALUES(plant_type), plant_no_sap=VALUES(plant_no_sap),
          site_material_code=VALUES(site_material_code),
          source_latitude=VALUES(source_latitude), source_longitude=VALUES(source_longitude),
          province_name=VALUES(province_name), district_name=VALUES(district_name),
          source_raw=VALUES(source_raw)`,
        {
          locationId,
          divisionNo: item.divisionNo,
          divisionName: item.divisionName,
          factNo: item.factNo,
          factName: item.factName,
          sectNo: item.sectNo,
          sectName: item.sectName,
          plantNo: item.plantKey,
          plantName: item.plantName,
          plantNameEn: item.plantNameEn,
          plantNameCn: item.plantNameCn,
          statusCode: item.statusCode,
          plantTypeProd: item.plantTypeProd,
          plantType: item.plantType,
          plantNoSap: item.plantNoSap,
          siteMaterialCode: item.siteMaterialCode,
          lat: item.lat,
          lng: item.lng,
          provinceName: item.provinceName,
          districtName: item.districtName,
          sourceRaw: JSON.stringify(item.row),
        },
      );
      await connection.execute(
        `INSERT INTO location_import_rows
         (import_batch_id,\`row_number\`,external_key,action,raw_data)
         VALUES (:batchId,:rowNumber,:plantKey,:action,:rawData)`,
        { batchId, rowNumber: index + 1, plantKey: item.plantKey, action, rawData: JSON.stringify(item.row) },
      );
      seenKeys.push(item.plantKey);
      successRows += 1;
    }

    if (seenKeys.length) {
      await connection.query(
        `UPDATE locations SET status='INACTIVE'
         WHERE source='LOCATION_HUB_PLANT' AND external_key NOT IN (?)`,
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
