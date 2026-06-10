"use client";

import Link from "next/link";
import { ClipboardCheck, HeartPulse, ShieldCheck, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";

const MODULES = [
  {
    href: "/category",
    title: "Safety Effort",
    description: "เริ่มกิจกรรม ตรวจประเมิน และติดตามงานด้านความปลอดภัย",
    icon: ShieldCheck,
  },
  {
    href: "/were-ok",
    title: "We're OK",
    description: "เตรียมความพร้อมก่อนขับ ตรวจสุขภาพ รถ และเส้นทาง",
    icon: HeartPulse,
  },
  {
    href: "/work-permit",
    title: "Work Permit",
    description: "จัดการใบอนุญาตทำงานและขั้นตอนก่อนเริ่มปฏิบัติงาน",
    icon: ClipboardCheck,
  },
  {
    href: "/safety-culture",
    title: "Safety Culture",
    description: "แชร์เรื่องราว ดูอันดับทีม และแลกรางวัลจากคะแนน Safety",
    icon: UsersRound,
  },
] as const;

export default function HomePage() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-8 font-sarabun">
        <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#3b1d07,#75410f)] px-6 py-8 text-white shadow-[0_16px_38px_rgba(59,29,7,0.18)] md:px-10 md:py-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#ffcf55]">SUEA Safety Home</p>
          <h1 className="mt-2 text-3xl font-black md:text-5xl">ศูนย์รวมงานความปลอดภัย</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/75 md:text-base">
            เลือกโมดูลที่ต้องการใช้งานจากหน้านี้ แต่ละเมนูมีเนื้อหาและขั้นตอนการทำงานแยกจากกัน
          </p>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          {MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.href} href={module.href} prefetch={false} className="group">
                <Card className="h-full rounded-[24px] border-[#5c3214]/15 bg-[#fffdf7] p-5 transition-all group-hover:-translate-y-0.5 group-hover:border-[#f5bb00] group-hover:shadow-[0_12px_24px_rgba(59,29,7,0.10)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1c9] text-[#6d4716]">
                    <Icon className="h-6 w-6" strokeWidth={2.3} />
                  </span>
                  <h2 className="mt-4 text-xl font-black text-[#3b1d07]">{module.title}</h2>
                  <p className="mt-1.5 text-sm font-semibold leading-6 text-[#5c3214]/70">{module.description}</p>
                </Card>
              </Link>
            );
          })}
        </section>
      </div>
    </>
  );
}
