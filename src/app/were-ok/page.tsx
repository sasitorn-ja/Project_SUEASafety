"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppState, useAppActions } from "@/providers/app-providers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getSafetyPoint } from "@/lib/point-rules";
import { Check, X, ChevronRight, AlertTriangle, Minus, Plus } from "lucide-react";

const STEPS = [
  { id: 1, key: "kyt", num: "01", title: "KYT ก่อนขับรถ", getSubtext: (d: any) => d ? `ถ่ายรูปสำเร็จ · รับ +${getSafetyPoint("safetyEffortCompleted")} แต้ม` : "ถ่ายรูปยืนยันตัวตนในจุด KYT" },
  { id: 2, key: "fit-to-drive", num: "02", title: "ตรวจความดันโลหิต", getSubtext: (d: any) => d ? `${d.systolic} / ${d.diastolic} · ${d.bpStatus}` : "วัดและบันทึกค่าความดัน" },
  { id: 3, key: "fit-to-drive", num: "03", title: "ตรวจแอลกอฮอล์", getSubtext: (d: any) => d ? `${d.alcohol?.toFixed(2)} mg% · ${d.alcStatus}` : "เป่าเครื่องวัดแอลกอฮอล์" },
  { id: 4, key: "pre-trip", num: "04", title: "ตรวจ 13 จุดแดงของรถโม่", getSubtext: (d: any) => d ? (d.hasFailures ? `ชำรุด ${Object.values(d.checkedStates).filter((s) => s === 'fail').length} จุด จาก 13 จุด` : "ปกติทุกจุด · 13 จาก 13") : "0 จาก 13" },
];

const ROUTE_STEPS = [
  { id: 5, key: "route-briefing", num: "01", title: "Route Risk Briefing", getSubtext: (d: any) => d ? "รับทราบแล้ว" : "งานแรก" },
  { id: 6, key: "route-briefing", num: "02", title: "รับทราบและยืนยันงานวิ่ง", getSubtext: (d: any) => d ? "ยืนยันเรียบร้อย" : "เปิดเมื่อครบทุกขั้นตอน" },
];

export default function WereOkPage() {
  const state = useAppState();
  const actions = useAppActions();
  const [mounted, setMounted] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [sosHours, setSosHours] = useState(8);
  const [sosReason, setSosReason] = useState("");
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [jobLoading, setJobLoading] = useState(false);

  const { completedSteps, healthData, preTripData, queueConfirmed, sosData } = state;

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
  }, [queueConfirmed]);

  const totalDone = completedSteps.filter((id) => id <= 4).length;
  const isBPFailed = healthData?.bpStatus?.includes("HIGH RISK");
  const isAlcFailed = healthData?.alcStatus?.includes("FAIL");
  const isPreTripFailed = preTripData?.hasFailures;
  const hasAnyFailure = isBPFailed || isAlcFailed || isPreTripFailed;

  let activeStepId = 1;
  for (let i = 1; i <= 4; i++) {
    if (!completedSteps.includes(i)) {
      activeStepId = i;
      break;
    }
  }
  if (completedSteps.filter((id) => id <= 4).length === 4) activeStepId = 999;

  const getProgressText = () => {
    if (completedSteps.includes(5) && completedSteps.includes(6)) return "พร้อมออกปฏิบัติงานแล้ว!";
    if (totalDone === 4) return "รับมือความเสี่ยงเส้นทางถัดไป";
    if (totalDone >= 3) return "ใกล้พร้อมเข้าคิวรับงานแล้ว";
    if (totalDone >= 1) return "กำลังจัดเตรียมความพร้อม";
    return "เริ่มเตรียมความพร้อมกันเลย";
  };

  const animStyle = (delay: number) => ({
    animationDelay: mounted ? `${delay}s` : "0s",
    opacity: mounted ? undefined : 0,
  });

  const handleSosSubmit = async () => {
    if (!sosReason) return;
    const reasonText =
      sosReason === "ป่วย"
        ? "รู้สึกไม่สบาย/เป็นไข้"
        : sosReason === "ล้า"
        ? "อ่อนเพลียสะสม/พักผ่อนน้อย"
        : "ธุระด่วนครอบครัว";
    const saved = await actions.setSosData({
      restHours: sosHours,
      restMinutes: 0,
      reason: reasonText,
      timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    });
    if (!saved) { window.alert("ส่งสัญญาณ SOS ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"); return; }
    actions.showNotification({
      message: `ส่งสัญญาณ SOS และลงทะเบียนพักกะถัดไปเป็นเวลา ${sosHours} ชั่วโมง สำเร็จแล้ว (สาเหตุ: ${reasonText}) เจ้าหน้าที่บริหารงานขนส่งได้รับการแจ้งเตือนเรียบร้อย`,
      type: "sos",
    });
    setSosOpen(false);
  };

  return (
    <>
      <div className="w-full min-h-[calc(100vh-80px)] bg-background flex justify-center items-start">
        <div className="w-full max-w-[1360px] mx-auto px-4 pb-8 md:px-10 md:pb-8 md:pt-8 pt-2">
          {/* Header */}
          <header className="flex items-start justify-between mb-5 md:mb-6 anim-fade" style={animStyle(0)}>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold mb-0.5">
                พร้อมขับ · {totalDone} / {STEPS.length} ขั้นตอน
              </span>
              <h1 className="text-2xl md:text-[32px] font-extrabold tracking-tight text-foreground">
                We&apos;re OK, We&apos;re Ready
              </h1>
            </div>
            <div className="bg-[var(--brand-accent)] text-[var(--brand-accent-contrast)] text-[11px] md:text-[13px] font-extrabold tracking-wider px-3.5 py-1.5 md:px-[18px] md:py-2 rounded-xl shadow-[0_2px_6px_rgba(var(--brand-accent-rgb),0.15)]">
              ON DUTY
            </div>
          </header>

          {!queueConfirmed ? (
            <div className="flex flex-col lg:grid lg:grid-cols-[330px_1fr] lg:gap-x-[50px] lg:gap-y-8 items-start">
              {/* Progress Panel */}
              <Card className="bg-[#121214] text-white border-none rounded-3xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.08)] mb-5 lg:mb-0 anim-fade" style={animStyle(0.06)}>
                <div className="h-2.5 w-full bg-[repeating-linear-gradient(-45deg,var(--brand-accent),var(--brand-accent)_8px,#121214_8px,#121214_16px)]" />
                <CardContent className="p-4 md:p-4 flex flex-col lg:h-[calc(100%-10px)]">
                  <div className="text-xs text-[#8E8A81] font-semibold mb-1.5 tracking-wide">
                    พร้อมขับ · {totalDone} / {STEPS.length} ขั้นตอน
                  </div>
                  <div className="text-xl md:text-[22px] font-extrabold mb-4 leading-tight">
                    {getProgressText()}
                  </div>
                  <div className="flex gap-1.5 lg:mt-auto">
                    {STEPS.map((step) => (
                      <div
                        key={step.id}
                        className={cn(
                          "flex-1 h-1.5 rounded transition-colors duration-400",
                          completedSteps.includes(step.id) ? "bg-[var(--brand-accent)]" : "bg-[#2D2D30]"
                        )}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Steps */}
              <div className="flex flex-col gap-3 lg:gap-3.5">
                {STEPS.map((step, idx) => {
                  const isDone = completedSteps.includes(step.id);
                  const isActive = step.id === activeStepId;
                  const isLocked = step.id > activeStepId;
                  const failed =
                    (step.id === 2 && isBPFailed) ||
                    (step.id === 3 && isAlcFailed) ||
                    (step.id === 4 && isPreTripFailed);

                  return (
                    <Link
                      key={step.id}
                      href={isLocked || step.id === 6 ? "#" : `/were-ok/${step.key}`}
                      className={cn(
                        "group flex items-center gap-3.5 md:gap-4 p-4 md:p-4 lg:p-4 rounded-2xl md:rounded-3xl border-[1.5px] transition-all cursor-pointer select-none active:scale-[0.98] anim-fade",
                        failed && isDone
                          ? "bg-red-50 border-[#D9383A]"
                          : isDone
                          ? "bg-card border-transparent"
                          : isActive
                          ? "bg-card border-[#1A1A1A] shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                          : "bg-[var(--secondary)] border-transparent opacity-65 cursor-not-allowed"
                      )}
                      style={animStyle(0.1 + idx * 0.05)}
                    >
                      <div
                        className={cn(
                          "w-11 h-11 md:w-[52px] md:h-[52px] rounded-xl md:rounded-[14px] flex items-center justify-center text-sm md:text-base font-extrabold flex-shrink-0",
                          failed && isDone
                            ? "bg-[#FDF2F2] text-[#D9383A]"
                            : isDone
                            ? "bg-[#E6FAF1] text-[#3D9A6A]"
                            : isActive
                            ? "bg-[var(--brand-accent)] text-[#1A1A1A]"
                            : "bg-[var(--border)] text-[#8E8A81]"
                        )}
                      >
                        {failed && isDone ? (
                          <X className="w-5 h-5 stroke-[3.2]" />
                        ) : isDone ? (
                          <Check className="w-5 h-5 stroke-[3]" />
                        ) : (
                          step.num
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          "text-[15px] md:text-lg font-extrabold mb-0.5",
                          isLocked ? "text-[#8E8A81]" : "text-foreground"
                        )}>
                          {step.title}
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground font-medium">
                          {step.id === 2 && healthData ? (
                            <span>{healthData.systolic} / {healthData.diastolic} · {healthData.bpStatus}</span>
                          ) : step.id === 3 && healthData ? (
                            <span>{healthData.alcohol?.toFixed(2)} mg% · {healthData.alcStatus}</span>
                          ) : step.id === 4 && preTripData ? (
                            <span>
                              {preTripData.hasFailures
                                ? `ชำรุด ${Object.values(preTripData.checkedStates).filter((s) => s === 'fail').length} จุด จาก 13 จุด`
                                : "ปกติทุกจุด · 13 จาก 13"}
                            </span>
                          ) : (
                            step.getSubtext(isDone)
                          )}
                        </div>
                      </div>
                      {isActive && (
                        <div className="text-foreground flex items-center justify-center w-6 h-6">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </div>
                      )}
                    </Link>
                  );
                })}

                {totalDone === 4 && (
                  <div className="mt-2 anim-fade" style={animStyle(0.35)}>
                    {hasAnyFailure ? (
                      <button
                        disabled
                        className="w-full py-4 md:py-5 rounded-[16px] md:rounded-3xl bg-[#D9383A] text-white font-extrabold text-base md:text-[16.5px] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,0,0,0.06)] cursor-not-allowed"
                      >
                        <X className="w-5 h-5" />
                        <span>ไม่สามารถเข้าคิวงานได้ เนื่องจากไม่ผ่านเกณฑ์ความปลอดภัย</span>
                      </button>
                    ) : queueConfirmed ? (
                      <button
                        disabled
                        className="w-full py-4 md:py-5 rounded-[16px] md:rounded-3xl bg-[#3D9A6A] text-white font-extrabold text-base md:text-[16.5px] flex items-center justify-center gap-2 opacity-85 cursor-default"
                      >
                        <Check className="w-5 h-5" />
                        <span>ยืนยันเข้าคิวรับงานสำเร็จแล้ว</span>
                      </button>
                    ) : (
                      <button
                        onClick={actions.confirmQueue}
                        className="w-full py-4 md:py-5 rounded-[16px] md:rounded-3xl bg-[#3D9A6A] text-white font-extrabold text-base md:text-[16.5px] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,0,0,0.06)] transition-all hover:bg-[#2F7A53] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(61,154,106,0.25)] active:translate-y-0"
                      >
                        <Check className="w-5 h-5" />
                        <span>ยืนยันเข้าคิวรับงาน</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Queue confirmed view */
            <div className="flex flex-col lg:grid lg:grid-cols-[330px_1fr] lg:gap-x-[50px] lg:gap-y-8 items-start anim-fade" style={animStyle(0.24)}>
              <Card className="bg-[#121214] text-white border-none rounded-3xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.08)] mb-5 lg:mb-0 lg:min-h-[160px]">
                <div className="h-2.5 w-full bg-[repeating-linear-gradient(-45deg,var(--brand-accent),var(--brand-accent)_8px,#121214_8px,#121214_16px)]" />
                <CardContent className="p-4 md:p-4 flex flex-col">
                  <div className="text-xs text-[#8E8A81] font-semibold mb-1.5 tracking-wide">
                    คิวงานล่าสุด · ระบบจ่ายงานอัตโนมัติ
                  </div>
                  {currentJob ? (
                    <>
                      <div className="text-lg md:text-xl font-extrabold mb-2" style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF", marginBottom: "8px" }}>
                        {(currentJob.jobLabel || "งานวิ่ง") + " · " + currentJob.jobCode}
                      </div>
                      <div className="flex flex-col gap-1.5 mt-auto">
                        <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--brand-accent)] mt-1.5">
                          <span>{currentJob.startNode || "-"}</span>
                          <span className="text-xs opacity-80">→</span>
                          <span>{currentJob.endNode || "-"}</span>
                        </div>
                        <div className="text-xs text-[#8E8A81] font-semibold">
                          {currentJob.distanceKm ?? "-"} กม. · {currentJob.estimatedMinutes ?? "-"} นาที · Slump {currentJob.slump || "-"}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg md:text-xl font-extrabold mb-2" style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF", marginBottom: "8px" }}>
                        {jobLoading ? "กำลังตรวจสอบงานวิ่ง..." : "ยังไม่มีงานวิ่งจากระบบจ่ายงานจริง"}
                      </div>
                      <div className="text-xs text-[#8E8A81] font-semibold leading-relaxed">
                        ระบบไม่แสดงเลขงาน เส้นทาง หรือค่า slump จำลอง ต้องมีงานจาก API dispatch ก่อน
                      </div>
                    </>
                  )}

                  {sosData ? (
                    <div className="mt-4 bg-[rgba(217,56,58,0.08)] border-[1.5px] border-[#D9383A] text-[#D9383A] rounded-xl px-3 py-2.5 text-[11.5px] font-extrabold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>
                        ส่ง SOS ขอพัก {sosData.restHours} ชม. {sosData.restMinutes > 0 ? `${sosData.restMinutes} นาที ` : ""}แล้ว ({sosData.reason})
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSosOpen(true)}
                      className="mt-4 w-full bg-[#D9383A] text-white border-none rounded-[14px] py-2.5 px-4 text-[12.5px] font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_12px_rgba(217,56,58,0.2)] transition-all hover:bg-[#B2292B] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(217,56,58,0.35)] active:translate-y-0 active:scale-[0.98]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      <span>SOS แจ้งขอพักกะถัดไป</span>
                    </button>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3 lg:gap-3.5">
                {ROUTE_STEPS.map((step) => {
                  const isDone = completedSteps.includes(step.id);
                  const mainDone = [1, 2, 3, 4].every((id) => completedSteps.includes(id)) && !hasAnyFailure;
                  const isLocked = step.id === 5
                    ? !mainDone || !queueConfirmed
                    : !mainDone || !queueConfirmed || !completedSteps.includes(5);
                  const isActive = step.id === 5 && mainDone && queueConfirmed && !isDone;

                  return (
                    <Link
                      key={step.id}
                      href={isLocked || step.id === 6 ? "#" : `/were-ok/${step.key}`}
                      className={cn(
                        "group flex items-center gap-3.5 md:gap-4 p-4 md:p-4 lg:p-4 rounded-2xl md:rounded-3xl border-[1.5px] transition-all select-none anim-fade",
                        isDone
                          ? "bg-card border-transparent"
                          : isActive
                          ? "bg-card border-[#1A1A1A] shadow-[0_4px_12px_rgba(0,0,0,0.04)] cursor-pointer active:scale-[0.98]"
                          : "bg-[var(--secondary)] border-transparent opacity-65 cursor-not-allowed"
                      )}
                      style={animStyle(0.3)}
                    >
                      <div
                        className={cn(
                          "w-11 h-11 md:w-[52px] md:h-[52px] rounded-xl md:rounded-[14px] flex items-center justify-center text-sm md:text-base font-extrabold flex-shrink-0",
                          isDone
                            ? "bg-[#E6FAF1] text-[#3D9A6A]"
                            : isActive
                            ? "bg-[var(--brand-accent)] text-[#1A1A1A]"
                            : "bg-[var(--border)] text-[#8E8A81]"
                        )}
                      >
                        {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : step.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] md:text-lg font-extrabold text-foreground mb-0.5">
                          {step.title}
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground font-medium">
                          {step.getSubtext(isDone)}
                        </div>
                      </div>
                      {isActive && (
                        <div className="text-foreground flex items-center justify-center w-6 h-6">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={sosOpen} onOpenChange={setSosOpen}>
        <DialogContent showCloseButton={false} className="z-[9999] flex max-h-[94vh] w-full max-w-[480px] flex-col gap-3.5 overflow-y-auto rounded-[28px] border border-[#cfe0f2] bg-[linear-gradient(180deg,#ffffff,#f8fcff)] p-4 shadow-[0_28px_80px_rgba(6,43,99,0.28)] md:p-4">
            <div className="text-[21px] font-extrabold text-[#D9383A] flex items-center justify-center gap-2.5 text-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span className="text-[22px] font-extrabold">แจ้งขอพักปฏิบัติงาน (SOS)</span>
            </div>

            {/* Hour adjuster */}
            <div className="flex items-center justify-center gap-5 py-2">
              <button
                type="button"
                onClick={() => setSosHours((h) => Math.max(1, h - 1))}
                className="w-12 h-12 rounded-full bg-white border border-[#cfe0f2] text-[#0e3e7d] text-[22px] font-extrabold flex items-center justify-center transition-all hover:bg-[#eaf4ff] active:scale-[0.92] outline-none shadow-[0_8px_20px_rgba(14,62,125,0.12)]"
              >
                −
              </button>
              <div className="min-w-[120px] text-center flex items-baseline justify-center gap-1.5">
                <span className="text-[38px] font-black text-[#D9383A]">{sosHours}</span>
                <span className="text-base font-extrabold text-[#173b6b]">ชั่วโมง</span>
              </div>
              <button
                type="button"
                onClick={() => setSosHours((h) => Math.min(48, h + 1))}
                className="w-12 h-12 rounded-full bg-white border border-[#cfe0f2] text-[#0e3e7d] text-[22px] font-extrabold flex items-center justify-center transition-all hover:bg-[#eaf4ff] active:scale-[0.92] outline-none shadow-[0_8px_20px_rgba(14,62,125,0.12)]"
              >
                +
              </button>
            </div>

            {/* Reasons */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-[13.5px] font-extrabold text-[#5f7591] text-left w-full pl-1 mb-0.5">
                สาเหตุที่ขอพัก:
              </label>
              {[
                { value: "ป่วย", label: "🤢 รู้สึกไม่สบาย" },
                { value: "ล้า", label: "😴 อ่อนเพลีย / เหนื่อยล้า" },
                { value: "ธุระด่วน", label: "🚗 มีธุระด่วน" },
              ].map((reason) => (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => setSosReason(reason.value)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border-2 text-sm font-extrabold text-left transition-all whitespace-nowrap",
                    sosReason === reason.value
                      ? "bg-[#eaf4ff] border-[#1763c0] text-[#0e3e7d] shadow-[0_4px_12px_rgba(14,62,125,0.15)]"
                      : "bg-white border-[#d7e6f6] text-[#173b6b] hover:border-[#1763c0] hover:bg-[#eaf4ff]"
                  )}
                >
                  <span
                    className={cn(
                      "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      sosReason === reason.value ? "border-[#1763c0]" : "border-[#9db2ca]"
                    )}
                  >
                    {sosReason === reason.value && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1763c0]" />
                    )}
                  </span>
                  {reason.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 mt-1.5 w-full">
              <button
                onClick={handleSosSubmit}
                className="w-full bg-[#D9383A] text-white border-none rounded-[16px] py-4 text-base font-extrabold flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(217,56,58,0.2)] transition-all hover:bg-[#B2292B] active:scale-[0.98]"
              >
                🚨 ยืนยันแจ้งขอพักปฏิบัติงาน
              </button>
              <button
                onClick={() => setSosOpen(false)}
                className="w-full bg-[#eaf4ff] text-[#0e3e7d] border border-[#cfe0f2] rounded-[16px] py-3.5 text-[15px] font-extrabold transition-all hover:bg-[#dcebff] active:scale-[0.98]"
              >
                ปิดหน้าต่างนี้ / ยกเลิก
              </button>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
