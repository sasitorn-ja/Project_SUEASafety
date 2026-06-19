import "server-only";

import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

const globalForRmrDb = globalThis as typeof globalThis & {
  rmrSsoDbPool?: Pool;
};

export function getRmrSsoDatabaseUrl() {
  return (
    process.env.RMC_SSO_DATABASE_URL?.trim() ||
    process.env.RMR_SSO_DATABASE_URL?.trim() ||
    ""
  );
}

export function isRmrSsoDatabaseConfigured() {
  return Boolean(getRmrSsoDatabaseUrl());
}

export function getRmrSsoDbPool() {
  const url = getRmrSsoDatabaseUrl();
  if (!url) {
    throw new Error("RMC_SSO_DATABASE_URL (or legacy RMR_SSO_DATABASE_URL) is not configured");
  }
  if (!globalForRmrDb.rmrSsoDbPool) {
    globalForRmrDb.rmrSsoDbPool = mysql.createPool({
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
  return globalForRmrDb.rmrSsoDbPool;
}

export async function queryRmrSsoRows<T extends RowDataPacket>(sql: string, params?: Record<string, unknown>) {
  const [rows] = await getRmrSsoDbPool().query<T[]>(sql, params as never);
  return rows;
}
