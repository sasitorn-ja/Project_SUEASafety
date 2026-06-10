"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppActions } from "@/providers/app-providers";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, AlertTriangle, Check } from "lucide-react";

const MOCK_JOB_DATA = {
  jobCode: "DP-2410",
  jobLabel: "งานแรก",
  startNode: "BPI-04",
  endNode: "OBK-C2",
  distance: 38.4,
  estTime: 62,
  slump: "10±2",
  warningsCount: 3,
  sleepText: "คุณนอน 7 ชม. 12 น.",
  sleepDesc: "พักผ่อนเพียงพอ · แนะนำดื่มน้ำให้พอ",
};

const WARNINGS = [
  {
    id: 1,
    type: "danger" as const,
    title: "จุดเกิดเหตุซ้ำ · ทางโค้งหักศอก",
    desc: "3 ครั้งใน 6 เดือน · ใช้ความเร็วไม่เกิน 30 km/h",
    km: "KM 12.4",
  },
  {
    id: 2,
    type: "warning" as const,
    title: "ก่อสร้างทาง · ช่องจราจร 2 → 1",
    desc: "08:00 – 17:00 · เลี่ยงเส้นทางหากเป็นไปได้",
    km: "KM 22.0",
  },
  {
    id: 3,
    type: "info" as const,
    title: "เข้าหน่วยงานต้องสวมเสื้อสะท้อนแสง",
    desc: "เซ็นชื่อที่จุดรักษาความปลอดภัย",
    km: "KM 34.2",
  },
];

export default function RouteBriefingPage() {
  const router = useRouter();
  const actions = useAppActions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const animStyle = (delay: number) => ({
    animationDelay: mounted ? `${delay}s` : "0s",
    opacity: mounted ? undefined : 0,
  });

  const handleAcknowledge = () => {
    actions.completeSteps([5, 6]);
    router.push("/were-ok");
  };

  return (
    <AppShell>
      <div className="w-full min-h-[calc(100vh-80px)] bg-background flex justify-center items-start">
        <div className="w-full max-w-[600px] lg:max-w-full mx-auto px-5 md:px-20 py-6 md:py-[60px] flex flex-col">
          <div className="w-full max-w-[600px] lg:max-w-full mx-auto flex flex-col flex-1">
            {/* Header */}
            <header className="flex items-center gap-3 mb-2 md:mb-4 anim-fade" style={animStyle(0)}>
              <Link href="/were-ok">
                <button className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-white border-none shadow-[0_2px_6px_rgba(0,0,0,0.03)] flex items-center justify-center text-foreground transition-colors active:bg-[#EFEBE0]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                  </svg>
                </button>
              </Link>
              <div className="flex flex-col">
                <span className="text-[11px] md:text-[13px] text-muted-foreground font-bold tracking-wide">
                  {MOCK_JOB_DATA.jobLabel} · {MOCK_JOB_DATA.jobCode}
                </span>
                <h1 className="text-lg md:text-[26px] font-extrabold text-foreground">Route Risk Briefing</h1>
              </div>
            </header>

            {/* Steps bar */}
            <div className="flex gap-1 mb-5 md:mb-8 pl-1 anim-fade" style={animStyle(0.04)}>
              <div className="h-1 md:h-1.5 rounded bg-foreground w-6 md:w-9" />
              <div className="h-1 md:h-1.5 rounded bg-[#F5BB00] w-6 md:w-9 ml-0.5" />
            </div>

            {/* Trip summary card */}
            <Card className="bg-white border-[#E4DFD3] rounded-3xl p-5 md:p-6 mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)] anim-fade" style={animStyle(0.08)}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-sm md:text-[13.5px] font-extrabold text-foreground">
                  {MOCK_JOB_DATA.startNode}
                  <span className="w-[9px] h-[9px] rounded-full bg-[#3D9A6A] inline-block" />
                </div>
                <div className="flex-1 mx-3 relative flex items-center justify-center">
                  <div className="absolute w-full h-[1.5px] bg-[#EFEBE0]" />
                  <span className="relative bg-white px-2 text-base">🚚</span>
                </div>
                <div className="flex items-center gap-2 text-sm md:text-[13.5px] font-extrabold text-foreground">
                  <span className="w-[9px] h-[9px] rounded-full bg-[#D9383A] inline-block" />
                  {MOCK_JOB_DATA.endNode}
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-[#F3EFE3] pt-4 text-left">
                <div className="border-r border-[#F3EFE3] pr-3">
                  <div className="text-[10px] font-extrabold text-muted-foreground tracking-wider uppercase mb-1">Distance</div>
                  <div className="text-2xl font-extrabold text-foreground leading-none">
                    {MOCK_JOB_DATA.distance}<span className="text-xs font-semibold text-muted-foreground ml-1">km</span>
                  </div>
                </div>
                <div className="border-r border-[#F3EFE3] px-3">
                  <div className="text-[10px] font-extrabold text-muted-foreground tracking-wider uppercase mb-1">Est. Time</div>
                  <div className="text-2xl font-extrabold text-foreground leading-none">
                    {MOCK_JOB_DATA.estTime}<span className="text-xs font-semibold text-muted-foreground ml-1">min</span>
                  </div>
                </div>
                <div className="pl-3">
                  <div className="text-[10px] font-extrabold text-muted-foreground tracking-wider uppercase mb-1">Slump</div>
                  <div className="text-2xl font-extrabold text-foreground leading-none">{MOCK_JOB_DATA.slump}</div>
                </div>
              </div>
            </Card>

            {/* Warnings section */}
            <div className="text-sm md:text-[13px] font-extrabold text-muted-foreground mb-3 pl-1 tracking-wide anim-fade" style={animStyle(0.12)}>
              คำเตือนเส้นทาง · {MOCK_JOB_DATA.warningsCount} รายการ
            </div>

            <div className="flex flex-col gap-3 mb-6 anim-fade" style={animStyle(0.16)}>
              {WARNINGS.map((w) => (
                <Card
                  key={w.id}
                  className={cn(
                    "bg-white border-[#E4DFD3] rounded-[20px] p-4 flex items-center gap-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.015)] overflow-hidden",
                    w.type === "danger" && "border-l-[5px] border-l-[#D9383A]",
                    w.type === "warning" && "border-l-[5px] border-l-[#F5BB00]",
                    w.type === "info" && "border-l-[5px] border-l-[#0056B3]"
                  )}
                >
                  <div
                    className={cn(
                      "w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0",
                      w.type === "danger" && "bg-[#FDF2F2] text-[#D9383A]",
                      w.type === "warning" && "bg-[#FFF9E6] text-[#F5BB00]",
                      w.type === "info" && "bg-[#E6F0FA] text-[#0056B3]"
                    )}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 pr-12 relative">
                    <div className="text-sm md:text-[14px] font-extrabold text-foreground leading-snug">{w.title}</div>
                    <div className="text-[11px] md:text-[11.5px] text-muted-foreground font-semibold mt-0.5">{w.desc}</div>
                    <span className="absolute top-0 right-0 text-[11px] font-extrabold text-muted-foreground font-mono">
                      {w.km}
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Sleep evaluation */}
            <div className="text-sm md:text-[13px] font-extrabold text-muted-foreground mb-3 pl-1 tracking-wide anim-fade" style={animStyle(0.2)}>
              ประเมินการพักผ่อน
            </div>
            <Card className="bg-white border-[#E4DFD3] rounded-3xl p-5 flex items-center justify-between mb-6 shadow-[0_4px_12px_rgba(0,0,0,0.015)] anim-fade" style={animStyle(0.24)}>
              <div className="flex flex-col">
                <div className="text-base md:text-lg font-extrabold text-foreground">{MOCK_JOB_DATA.sleepText}</div>
                <div className="text-xs md:text-sm text-muted-foreground font-semibold mt-1">{MOCK_JOB_DATA.sleepDesc}</div>
              </div>
              <div className="flex items-end gap-1 h-[38px] pr-1">
                {[24, 28, 22, 32, 30, 26, 36].map((h, i) => (
                  <div
                    key={i}
                    className={cn("w-1.5 rounded", i === 6 ? "bg-[#F5BB00]" : "bg-[#121214]")}
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </Card>

            {/* Acknowledge button */}
            <div className="anim-fade" style={animStyle(0.28)}>
              <button
                onClick={handleAcknowledge}
                className="w-full bg-[#121214] hover:bg-[#252528] text-white font-extrabold text-[15px] md:text-base rounded-[20px] md:rounded-3xl py-4 md:py-5 shadow-[0_4px_14px_rgba(0,0,0,0.1)] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <span>รับทราบ · ยืนยันงานวิ่ง</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
