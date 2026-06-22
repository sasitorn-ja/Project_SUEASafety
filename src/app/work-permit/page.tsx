"use client";

import { Card } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";
import { AppEmptyState, AppPage, AppPageHeader, AppSection } from "@/components/layout/app-page";

export default function WorkPermitPage() {
  return (
    <AppPage className="max-w-[900px]">
      <AppPageHeader title="Work Permit" description="ระบบใบอนุญาตทำงาน" icon={ClipboardCheck} />
      <AppSection>
        <Card className="border-0 bg-transparent p-0 text-center shadow-none ring-0">
          <AppEmptyState>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-nav)]">
            <ClipboardCheck className="h-8 w-8" strokeWidth={2.2} />
          </span>
          <h2 className="text-lg font-extrabold text-[var(--brand-nav)]">Work Permit</h2>
          <p className="max-w-105 text-sm font-medium text-[var(--brand-text)]/75">
            โมดูลใบอนุญาตทำงาน (Work Permit) กำลังอยู่ระหว่างพัฒนา เร็ว ๆ นี้
          </p>
          </AppEmptyState>
        </Card>
      </AppSection>
    </AppPage>
  );
}
