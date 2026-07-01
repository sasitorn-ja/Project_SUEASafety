import "server-only";

import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

const globalForLocationHubDb = globalThis as typeof globalThis & {
  locationHubDbPool?: Pool;
};

export function getLocationHubDatabaseUrl() {
  return process.env.LOCATION_HUB_DATABASE_URL?.trim() || "";
}

export function isLocationHubDatabaseConfigured() {
  return Boolean(getLocationHubDatabaseUrl());
}

export function getLocationHubDbPool() {
  const url = getLocationHubDatabaseUrl();
  if (!url) {
    throw new Error("LOCATION_HUB_DATABASE_URL is not configured");
  }
  if (!globalForLocationHubDb.locationHubDbPool) {
    globalForLocationHubDb.locationHubDbPool = mysql.createPool({
      uri: url,
      charset: "utf8mb4",
      connectionLimit: 3,
      waitForConnections: true,
      namedPlaceholders: true,
      supportBigNumbers: true,
      bigNumberStrings: true,
      timezone: "Z",
    });
  }
  return globalForLocationHubDb.locationHubDbPool;
}

export async function queryLocationHubRows<T extends RowDataPacket>(sql: string, params?: Record<string, unknown>) {
  const [rows] = await getLocationHubDbPool().query<T[]>(sql, params as never);
  return rows;
}
