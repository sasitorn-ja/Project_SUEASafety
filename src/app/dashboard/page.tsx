"use client";

// /dashboard ใช้ legacy shell เพื่อให้แสดง Safety Effort Dashboard โดยตรง
// (เดิมแยกอยู่ที่ /dashboard-safety-effort) — route ถูก map ไว้ใน src/App.tsx
import LegacyShell from "../LegacyShell";

export default function DashboardPage() {
  return <LegacyShell />;
}
