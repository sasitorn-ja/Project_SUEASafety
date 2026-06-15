"use client";

import { LayoutDashboard } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pt-4 pb-8 md:pt-8">
      <Card className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] p-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-nav)]">
          <LayoutDashboard className="h-8 w-8" strokeWidth={2.2} />
        </span>
        <h1 className="text-2xl font-black text-[var(--brand-nav)]">Dashboard</h1>
        <p className="text-sm font-semibold text-[var(--brand-muted-text)]">พื้นที่ Dashboard สำหรับเพิ่มข้อมูลในภายหลัง</p>
      </Card>
    </div>
  );
}
