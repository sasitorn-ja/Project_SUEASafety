# Implementation Plan - Evaluation Report Tab & Excel Sync

Create a new menu/tab called "รายงานแบบประเมิน" (Evaluation Report) under Safety Admin. This tab will store, display, filter, and export safety assessment reports matching the exact format of the template file `src/docx/IMP_STL_Safety Effort_Mar_20260405_concretebiz.xlsx`.

## User Review Required

> [!IMPORTANT]
> - **Excel Structure Alignment**: The exported Excel file will contain exactly 6 columns: `PMS`, `Year`, `เดือน`, `Name`, `E-mail`, and `กิจกรรม` (Activity: `'Safety_Observation/Line_Walk'` or `'Safety_Contact'`).
> - **Preloaded Mock Records**: We pre-extracted 50 authentic mock records from the template Excel sheet into `mock_excel_records.json` to pre-populate the UI, giving a realistic data view right away.
> - **Customizable Exporter Info**: Since there is no real-time employee database connected, we will read the user's name, email, and PMS from the local SSO profile (or input fields on the report page) so user submissions are tagged correctly.

## Proposed Changes

### [Component Name] Safety Effort

---

#### [MODIFY] [AssessmentSummary.tsx](file:///c:/Users/Acer/Desktop/Project-SUEASAFETY/Project_SUEASafety/src/features/safety-effort/screens/AssessmentSummary.tsx)
- Modify `handleConfirmSave` to capture:
  - `pms`: read from `localStorage` under `suea-safety-user-pms` (defaults to `"24518"`)
  - `name`: read from `localStorage` under `suea-safety-user-name` (defaults to `"ศศิธร จรุงจรรยาพงศ์"`)
  - `email`: read from `localStorage` under `suea-safety-user-email` (defaults to `"SASITOJA@SCG.COM"`)
  - `year` and `month`: derived from the checklist's selected date.
  - `activityType`: `"Safety_Contact"` for safety contacts, `"Safety_Observation/Line_Walk"` for line walks.

---

#### [MODIFY] [SafetyAdmin.tsx](file:///c:/Users/Acer/Desktop/Project-SUEASAFETY/Project_SUEASafety/src/features/safety-effort/screens/SafetyAdmin.tsx)
- **Import XLSX**: Import `* as XLSX from "xlsx"`.
- **Import Mock Records**: Import `mock_excel_records.json` as initial static template records.
- **State Integration**:
  - Add `reports` to `adminTab` selections: `✏️ จัดการคำถามแบบประเมิน`, `📋 ประวัติการส่งรายงาน Linewalk / Safety Contact`, and `📊 รายงานแบบประเมิน`.
  - Add search & filtering states for the reports tab (Year filter, Month filter, Activity filter, Search query).
  - Track user Profile states (`pms`, `name`, `email`) and keep them synced with `localStorage` so users can update their identity directly in a collapsable panel.
- **Dynamic Merging**:
  - Combine local storage `submissions` (mapped to report schema) with the static preloaded mock records and any user-uploaded records in memory.
- **UI Design**:
  - Create a premium tabular view of report records using custom grid layout, with columns matching the Excel spreadsheet.
  - Add a collapsible panel for "ตั้งค่าข้อมูลผู้ส่งรายงาน" (Sender Details Settings) containing input fields for PMS, Name, and Email.
  - Add "อัปโหลดไฟล์รายงาน (Excel)" button to parse custom spreadsheets into memory.
  - Add "ดาวน์โหลดรายงาน (Excel)" button to export filtered report rows into the identical Excel schema.

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` in the workspace to make sure there are no TypeScript compile-time errors.

### Manual Verification
- Navigate to `/safety-admin` and verify the new third tab `📊 รายงานแบบประเมิน` is displayed and active.
- Verify the table renders correctly with the columns: `PMS`, `ปี (Year)`, `เดือน (Month)`, `ชื่อ-นามสกุล`, `อีเมล`, `กิจกรรม`, `สถานที่/เพิ่มเติม`.
- Verify searching by Name / Email / PMS works.
- Verify filtering by Activity Type and Month works.
- Test changing PMS, Name, and Email in the Settings panel, saving a new checklist, and verifying that the new submission shows up under the report table with the updated details.
- Verify the **"ดาวน์โหลดรายงาน (Excel)"** button saves a `.xlsx` file with the exact columns and rows matching the active filters.
- Verify the **"อัปโหลดไฟล์รายงาน (Excel)"** imports a custom Excel spreadsheet and renders its rows in the table.
