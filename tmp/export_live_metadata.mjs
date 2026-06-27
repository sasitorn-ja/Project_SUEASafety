import fs from "node:fs/promises";
import vm from "node:vm";

import mysql from "mysql2/promise";

const registrySource = await fs.readFile(
  "/Users/sasitorn/Project_SUEASafety/backend/components/api-catalog/registry.ts",
  "utf8",
);

const sandbox = { module: { exports: null } };
const executable = registrySource
  .replace(/^import .*$/gm, "")
  .replace(/export type ApiCatalogRoute = \{[\s\S]*?\};/m, "")
  .replace(/export const API_CATALOG_ROUTES\s*=/, "module.exports =")
  .replace(/\]\s+as const satisfies readonly ApiCatalogRoute\[\];/m, "];");
vm.runInNewContext(executable, sandbox);
const routes = sandbox.module.exports;

const conn = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  charset: "utf8mb4",
  namedPlaceholders: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  timezone: "Z",
});

const schema = "CPAC_Safety";

const [tables] = await conn.query(
  `
    SELECT t.TABLE_NAME, COUNT(c.COLUMN_NAME) AS column_count
    FROM information_schema.TABLES t
    LEFT JOIN information_schema.COLUMNS c
      ON c.TABLE_SCHEMA = t.TABLE_SCHEMA
     AND c.TABLE_NAME = t.TABLE_NAME
    WHERE t.TABLE_SCHEMA = :schema
    GROUP BY t.TABLE_NAME
    ORDER BY t.TABLE_NAME
  `,
  { schema },
);

const [columns] = await conn.query(
  `
    SELECT
      TABLE_NAME,
      COLUMN_NAME,
      COLUMN_TYPE,
      CHARACTER_MAXIMUM_LENGTH,
      IS_NULLABLE,
      COLUMN_DEFAULT,
      COLUMN_KEY,
      EXTRA
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = :schema
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `,
  { schema },
);

const [relationships] = await conn.query(
  `
    SELECT
      kcu.REFERENCED_TABLE_NAME AS parent_table,
      kcu.TABLE_NAME AS child_table,
      kcu.COLUMN_NAME AS foreign_key,
      rc.DELETE_RULE AS on_delete,
      rc.UPDATE_RULE AS on_update
    FROM information_schema.KEY_COLUMN_USAGE kcu
    JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
      ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
     AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
     AND rc.TABLE_NAME = kcu.TABLE_NAME
    WHERE kcu.TABLE_SCHEMA = :schema
      AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY parent_table, child_table, foreign_key
  `,
  { schema },
);

const [indexes] = await conn.query(
  `
    SELECT
      TABLE_NAME,
      INDEX_NAME,
      NON_UNIQUE,
      INDEX_TYPE,
      GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ', ') AS columns_or_expression
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = :schema
    GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE, INDEX_TYPE
    ORDER BY TABLE_NAME, INDEX_NAME
  `,
  { schema },
);

await conn.end();

await fs.writeFile(
  "/Users/sasitorn/Project_SUEASafety/tmp/live_api_routes.json",
  JSON.stringify(routes, null, 2),
  "utf8",
);
await fs.writeFile(
  "/Users/sasitorn/Project_SUEASafety/tmp/live_db_metadata.json",
  JSON.stringify({ tables, columns, relationships, indexes }, null, 2),
  "utf8",
);

console.log(JSON.stringify({
  routeCount: routes.length,
  tableCount: tables.length,
  columnCount: columns.length,
  relationshipCount: relationships.length,
  indexCount: indexes.length,
}, null, 2));
