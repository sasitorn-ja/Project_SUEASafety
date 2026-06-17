import "server-only";

import mysql, { type Pool, type PoolConnection, type RowDataPacket } from "mysql2/promise";

const globalForDb = globalThis as typeof globalThis & {
  cpacSafetyDbPool?: Pool;
};

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured for CPAC_Safety.");
  }
  return url;
}

export function getDbPool() {
  if (!globalForDb.cpacSafetyDbPool) {
    globalForDb.cpacSafetyDbPool = mysql.createPool({
      uri: getDatabaseUrl(),
      charset: "utf8mb4",
      connectionLimit: 10,
      waitForConnections: true,
      namedPlaceholders: true,
      supportBigNumbers: true,
      bigNumberStrings: true,
      timezone: "Z",
    });
  }

  return globalForDb.cpacSafetyDbPool;
}

export async function queryRows<T extends RowDataPacket>(sql: string, params?: Record<string, unknown> | unknown[]) {
  const [rows] = await getDbPool().query<T[]>(sql, params as never);
  return rows;
}

export async function withTransaction<T>(handler: (connection: PoolConnection) => Promise<T>) {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await handler(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
