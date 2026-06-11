"use client";

import { Card } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

export default function WorkPermitPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-170 px-4">
        <Card className="flex flex-col items-center gap-2.5 rounded-2xl border-[var(--brand-text)]/15 bg-[var(--brand-surface)] p-5 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-nav)]">
            <ClipboardCheck className="h-8 w-8" strokeWidth={2.2} />
          </span>
          <h1 className="text-xl font-extrabold text-[var(--brand-nav)]">Work Permit</h1>
          <p className="max-w-105 text-sm font-medium text-[var(--brand-text)]/75">
            โมดูลใบอนุญาตทำงาน (Work Permit) กำลังอยู่ระหว่างพัฒนา เร็ว ๆ นี้
          </p>
        </Card>
      </div>
    </>
  );
}
