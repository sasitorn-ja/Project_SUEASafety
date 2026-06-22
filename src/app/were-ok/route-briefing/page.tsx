"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppActions } from "@/providers/app-providers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export default function RouteBriefingPage() {
  const router = useRouter();
  const actions = useAppActions();
  const [mounted, setMounted] = useState(false);
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [jobLoading, setJobLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCurrentJob = async () => {
      setJobLoading(true);
      try {
        const response = await fetch("/api/were-ok/jobs/current", {
          credentials: "include",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (!cancelled && response.ok && payload?.ok) setCurrentJob(payload.data?.job || null);
      } catch {
        if (!cancelled) setCurrentJob(null);
      } finally {
        if (!cancelled) setJobLoading(false);
      }
    };
    void loadCurrentJob();
    return () => {
      cancelled = true;
    };
  }, []);

  const animStyle = (delay: number) => ({
    animationDelay: mounted ? `${delay}s` : "0s",
    opacity: mounted ? undefined : 0,
  });

  const handleAcknowledge = async () => {
    if (!currentJob?.id) return;
    try {
      await fetch(`/api/were-ok/jobs/${currentJob.id}/acknowledge`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledgedAt: new Date().toISOString() }),
      });
    } catch {
      return;
    }
    actions.completeSteps([5, 6]);
    router.push("/were-ok");
  };

  const warnings = currentJob?.routeWarnings || [];
  const sleepSummary = currentJob?.sleepSummary || null;

  return (
    <>
      <div className="w-full min-h-[calc(100vh-80px)] bg-background flex justify-center items-start">
        <div className="w-full max-w-[600px] lg:max-w-full mx-auto px-5 md:px-20 py-6 md:py-[60px] flex flex-col">
          <div className="w-full max-w-[600px] lg:max-w-full mx-auto flex flex-col flex-1">
            {/* Header */}
            <header className="flex items-center gap-3 mb-2 md:mb-4 anim-fade" style={animStyle(0)}>
              <Link href="/were-ok">
                <button className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-white border-none shadow-[0_2px_6px_rgba(0,0,0,0.03)] flex items-center justify-center text-foreground transition-colors active:bg-[var(--secondary)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                  </svg>
                </button>
              </Link>
              <div className="flex flex-col">
                <span className="text-[11px] md:text-[13px] text-muted-foreground font-bold tracking-wide">
                  {currentJob ? `${currentJob.jobLabel || "งานวิ่ง"} · ${currentJob.jobCode}` : "ยังไม่มีงานวิ่งจริง"}
                </span>
                <h1 className="text-lg md:text-[26px] font-extrabold text-foreground">Route Risk Briefing</h1>
              </div>
            </header>

            {/* Steps bar */}
            <div className="flex gap-1 mb-5 md:mb-8 pl-1 anim-fade" style={animStyle(0.04)}>
              <div className="h-1 md:h-1.5 rounded bg-foreground w-6 md:w-9" />
              <div className="h-1 md:h-1.5 rounded bg-[var(--brand-accent)] w-6 md:w-9 ml-0.5" />
            </div>

            {!currentJob && (
              <Card className="bg-white border-[var(--border)] rounded-3xl p-5 md:p-6 mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)] anim-fade" style={animStyle(0.08)}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-soft)] text-[var(--brand-accent)] flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-base md:text-lg font-extrabold text-foreground">{jobLoading ? "กำลังตรวจสอบงานวิ่ง..." : "ยังไม่มีข้อมูล Route Briefing จาก API จริง"}</div>
                    <div className="text-xs md:text-sm text-muted-foreground font-semibold mt-1 leading-relaxed">
                      หน้านี้จะไม่แสดงเส้นทาง/ความเสี่ยงจำลองแล้ว ต้องเชื่อม API จ่ายงานจริงก่อนจึงจะยืนยันงานวิ่งได้
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {currentJob && (
            <>
            {/* Trip summary card */}
            <Card className="bg-white border-[var(--border)] rounded-3xl p-4 md:p-4 mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)] anim-fade" style={animStyle(0.08)}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-sm md:text-[13.5px] font-extrabold text-foreground">
                  {currentJob.startNode || "-"}
                  <span className="w-[9px] h-[9px] rounded-full bg-[#3D9A6A] inline-block" />
                </div>
                <div className="flex-1 mx-3 relative flex items-center justify-center">
                  <div className="absolute w-full h-[1.5px] bg-[var(--secondary)]" />
                  <span className="relative bg-white px-2 text-base">🚚</span>
                </div>
                <div className="flex items-center gap-2 text-sm md:text-[13.5px] font-extrabold text-foreground">
                  <span className="w-[9px] h-[9px] rounded-full bg-[#D9383A] inline-block" />
                  {currentJob.endNode || "-"}
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-[var(--secondary)] pt-4 text-left">
                <div className="border-r border-[var(--secondary)] pr-3">
                  <div className="text-[10px] font-extrabold text-muted-foreground tracking-wider uppercase mb-1">Distance</div>
                  <div className="text-2xl font-extrabold text-foreground leading-none">
                    {currentJob.distanceKm ?? "-"}<span className="text-xs font-semibold text-muted-foreground ml-1">km</span>
                  </div>
                </div>
                <div className="border-r border-[var(--secondary)] px-3">
                  <div className="text-[10px] font-extrabold text-muted-foreground tracking-wider uppercase mb-1">Est. Time</div>
                  <div className="text-2xl font-extrabold text-foreground leading-none">
                    {currentJob.estimatedMinutes ?? "-"}<span className="text-xs font-semibold text-muted-foreground ml-1">min</span>
                  </div>
                </div>
                <div className="pl-3">
                  <div className="text-[10px] font-extrabold text-muted-foreground tracking-wider uppercase mb-1">Slump</div>
                  <div className="text-2xl font-extrabold text-foreground leading-none">{currentJob.slump || "-"}</div>
                </div>
              </div>
            </Card>

            {/* Warnings section */}
            <div className="text-sm md:text-[13px] font-extrabold text-muted-foreground mb-3 pl-1 tracking-wide anim-fade" style={animStyle(0.12)}>
              คำเตือนเส้นทาง · {warnings.length} รายการ
            </div>

            <div className="flex flex-col gap-3 mb-6 anim-fade" style={animStyle(0.16)}>
              {warnings.map((w) => (
                <Card
                  key={w.id}
                  className={cn(
                    "bg-white border-[var(--border)] rounded-[16px] p-4 flex items-center gap-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.015)] overflow-hidden",
                    w.type === "danger" && "border-l-[5px] border-l-[#D9383A]",
                    w.type === "warning" && "border-l-[5px] border-l-[var(--brand-accent)]",
                    w.type === "info" && "border-l-[5px] border-l-[#0056B3]"
                  )}
                >
                  <div
                    className={cn(
                      "w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0",
                      w.type === "danger" && "bg-[#FDF2F2] text-[#D9383A]",
                      w.type === "warning" && "bg-[var(--brand-soft)] text-[var(--brand-accent)]",
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
            <Card className="bg-white border-[var(--border)] rounded-3xl p-4 flex items-center justify-between mb-6 shadow-[0_4px_12px_rgba(0,0,0,0.015)] anim-fade" style={animStyle(0.24)}>
              <div className="flex flex-col">
                <div className="text-base md:text-lg font-extrabold text-foreground">{sleepSummary?.summaryText || "ยังไม่มีข้อมูลการพักผ่อน"}</div>
                <div className="text-xs md:text-sm text-muted-foreground font-semibold mt-1">{sleepSummary?.description || "รอข้อมูลจากระบบประเมินการพักผ่อน"}</div>
              </div>
              <div className="flex items-end gap-1 h-[38px] pr-1">
                {[24, 28, 22, 32, 30, 26, 36].map((h, i) => (
                  <div
                    key={i}
                    className={cn("w-1.5 rounded", i === 6 ? "bg-[var(--brand-accent)]" : "bg-[#121214]")}
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </Card>
            </>
            )}

            {/* Acknowledge button */}
            <div className="anim-fade" style={animStyle(0.28)}>
              <button
                onClick={handleAcknowledge}
                disabled={!currentJob}
                className={cn(
                  "w-full font-extrabold text-[15px] md:text-base rounded-[16px] md:rounded-3xl py-4 md:py-5 shadow-[0_4px_14px_rgba(0,0,0,0.1)] flex items-center justify-center gap-2 transition-all active:scale-[0.99]",
                  currentJob ? "bg-[#121214] hover:bg-[#252528] text-white" : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
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
    </>
  );
}
