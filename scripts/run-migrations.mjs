import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const migrationsDir = path.resolve("scripts/migrations");
const files = (await fs.readdir(migrationsDir))
  .filter((file) => file.endsWith(".sql"))
  .sort();

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
  for (const file of files) {
    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await connection.query(sql);
    console.log(`Applied scripts/migrations/${file}`);
  }
} finally {
  await connection.end();
}
