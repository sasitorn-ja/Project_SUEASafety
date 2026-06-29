import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const migrationPath = process.argv[2];

if (!migrationPath) {
  console.error("Usage: node --env-file=frontend/.env.local scripts/run-migration.mjs <migration.sql>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const sql = await fs.readFile(path.resolve(migrationPath), "utf8");
const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  charset: "utf8mb4",
  multipleStatements: true,
  namedPlaceholders: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  timezone: "Z",
});

try {
  await connection.query(sql);
  console.log(`Applied ${migrationPath}`);
} finally {
  await connection.end();
}
