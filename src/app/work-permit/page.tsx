"use client";

import { Card } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

export default function WorkPermitPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-170 px-4">
        <Card className="flex flex-col items-center gap-3 rounded-3xl border-[#5c3214]/15 bg-[#FFFDF7] p-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff4cf] text-[#3b1d07]">
            <ClipboardCheck className="h-8 w-8" strokeWidth={2.2} />
          </span>
          <h1 className="text-xl font-extrabold text-[#3b1d07]">Work Permit</h1>
          <p className="max-w-105 text-sm font-medium text-[#5c3214]/75">
            โมดูลใบอนุญาตทำงาน (Work Permit) กำลังอยู่ระหว่างพัฒนา เร็ว ๆ นี้
          </p>
        </Card>
      </div>
    </>
  );
}
