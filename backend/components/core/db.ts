import "server-only";

import mysql, { type Pool, type PoolConnection, type RowDataPacket } from "mysql2/promise";

const globalForDb = globalThis as typeof globalThis & {
  cpacSafetyDbPool?: Pool;
};

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || "";
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function isDbConfigured() {
  return isDatabaseConfigured();
}

export function getDbPool(): Pool {
  if (!isDbConfigured()) {
    // Return a dummy pool if DB is not configured
    return {
      query: async () => [[]],
      getConnection: async () => ({
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {},
        query: async () => [[]],
        execute: async () => [{}],
      } as any),
    } as any;
  }

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
  if (!isDbConfigured()) {
    console.log("Database not configured. Bypassing queryRows:", sql);
    return [] as T[];
  }
  const [rows] = await getDbPool().query<T[]>(sql, params as never);
  return rows;
}

export async function withTransaction<T>(handler: (connection: PoolConnection) => Promise<T>) {
  if (!isDbConfigured()) {
    console.log("Database not configured. Bypassing withTransaction.");
    const dummyConnection = {
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
      execute: async () => [{}],
      query: async () => [[]],
    } as any;
    return await handler(dummyConnection);
  }

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
