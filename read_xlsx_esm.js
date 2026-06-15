import XLSX from 'xlsx';
import path from 'path';

const filePath = path.join("src", "docx", "IMP_STL_Safety Effort_Mar_20260405_concretebiz.xlsx");
console.log("Reading file:", filePath);

import fs from 'fs';

try {
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  console.log("Sheet names:", sheetNames);
  
  if (sheetNames.length > 0) {
    const firstSheetName = sheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    // sheet_to_json with header: 1 returns array of arrays
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log("Total rows found:", data.length);
    const mockRecords = [];
    
    // row 0 is header: [ 'PMS', 'Year', 'เดือน', 'Name', 'E-mail', 'กิจกรรม' ]
    for (let i = 1; i <= Math.min(50, data.length - 1); i++) {
      const row = data[i];
      if (row && row.length >= 6) {
        mockRecords.push({
          pms: String(row[0] || ""),
          year: Number(row[1] || new Date().getFullYear()),
          month: Number(row[2] || (new Date().getMonth() + 1)),
          name: String(row[3] || ""),
          email: String(row[4] || ""),
          activityType: String(row[5] || "")
        });
      }
    }
    
    const outputPath = path.join("src", "features", "safety-effort", "config", "mock_excel_records.json");
    fs.writeFileSync(outputPath, JSON.stringify(mockRecords, null, 2), "utf-8");
    console.log("Wrote 50 mock records to:", outputPath);
  }
} catch (e) {
  console.error("Error reading file:", e);
}
