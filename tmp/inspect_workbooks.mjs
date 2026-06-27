import fs from "node:fs/promises";
import path from "node:path";

import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const [, , workbookPath, outputDir] = process.argv;

if (!workbookPath || !outputDir) {
  throw new Error("Usage: node inspect_workbooks.mjs <workbookPath> <outputDir>");
}

await fs.mkdir(outputDir, { recursive: true });

const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 12000,
  tableMaxRows: 10,
  tableMaxCols: 10,
  tableMaxCellChars: 120,
});

await fs.writeFile(
  path.join(outputDir, "summary.ndjson"),
  typeof summary.ndjson === "string" ? summary.ndjson : JSON.stringify(summary.ndjson, null, 2),
  "utf8",
);

const sheets = workbook.worksheets.items.map((sheet) => sheet.name);
await fs.writeFile(path.join(outputDir, "sheets.json"), JSON.stringify(sheets, null, 2), "utf8");

for (const sheetName of sheets) {
  const blob = await workbook.render({
    sheetName,
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const safeName = sheetName.replace(/[^a-z0-9-_]+/gi, "_");
  await fs.writeFile(path.join(outputDir, `${safeName}.png`), bytes);
}

console.log(JSON.stringify({ workbookPath, outputDir, sheets }, null, 2));
