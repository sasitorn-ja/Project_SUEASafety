"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState, useAppActions } from "@/providers/app-providers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, X, ArrowRight } from "lucide-react";

const CHECKPOINTS = [
  { id: 1, title: "1. เบรคเท้า*" },
  { id: 2, title: "2. เบรคมือ*" },
  { id: 3, title: "3. ล้อและยาง*" },
  { id: 4, title: "4. พวงมาลัยและคันชักคันส่ง*" },
  {
    id: 5,
    title: "5. อุปกรณ์โม่และตัวโม่*",
    bullets: [
      "5.1 มีการ์ดครอบเพลาปั่นปั๊มไฮดรอลิค",
      "5.2 น๊อตฝาช่องเปิดเข้าสกัดโม่ต้องเป็นน๊อตหัวเรียบ ตามมาตรฐาน",
    ],
  },
  { id: 6, title: "6. เข็มขัดนิรภัย*" },
  {
    id: 7,
    title: "7. ระบบไฟและสัญญาณ*",
    bullets: [
      "7.1 ไฟหน้า (ไฟสูง,ไฟต่ำ) และไฟราวบนเก๋ง",
      "7.2 ไฟข้างบังโคลน",
      "7.3 ไฟหลัง",
      "7.4 ไฟเบรค : ซ้าย-ขวา",
      "7.5 ไฟเลี้ยวขวา : หน้า-หลัง-ข้างประตู-ข้างบังโคลน",
      "7.6 ไฟเลี้ยวซ้าย : หน้า-หลัง-ข้างประตู-ข้างบังโคลน",
      "7.7 ไฟฉุกเฉิน : ด้านหน้า-หลัง",
      "7.8 ไฟถอยหลัง",
      "7.9 ไฟส่องทะเบียน",
      "7.10 เสียงสัญญาณเตือนถอยหลัง",
      "7.11 สัญญาณแตรรถ",
    ],
  },
  { id: 8, title: "8. กระจกมองข้างซ้ายและขวา*" },
  { id: 9, title: "9. การ์ดข้างกันรถจักรยานยนต์*" },
  { id: 10, title: "10. บันไดท้ายโม่และราวกันตก*" },
  { id: 11, title: "11. อุปกรณ์เสริมช่วยโทรศัพท์ในขณะขับขี่*" },
  {
    id: 12,
    title: "12. เกจวัดพร้อมใช้งาน*",
    bullets: ["12.1 เกจวัดความเร็ว", "12.2 เกจวัดน้ำมันเชื้อเพลิง"],
  },
  {
    id: 13,
    title: "13. อุปกรณ์ตามมาตรฐานการขนส่งของเอส ซี จี*",
    bullets: [
      "13.1 จีพีเอสพร้อมใช้งาน",
      "13.2 กล้องบันทึกในหัวเก๋ง และกล้องส่องไปด้านหน้ารถพร้อมใช้งาน",
    ],
  },
];

export default function PreTripPage() {
  const router = useRouter();
  const { preTripData } = useAppState();
  const actions = useAppActions();
  const [mounted, setMounted] = useState(false);
  const [checkedStates, setCheckedStates] = useState<Record<number, "pass" | "fail">>(
    preTripData?.checkedStates || {}
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const animStyle = (delay: number) => ({
    animationDelay: mounted ? `${delay}s` : "0s",
    opacity: mounted ? undefined : 0,
  });

  const handleCheck = (id: number, result: "pass" | "fail") => {
    setCheckedStates((prev) => ({ ...prev, [id]: result }));
  };

  const handleCheckAll = () => {
    const next: Record<number, "pass" | "fail"> = {};
    CHECKPOINTS.forEach((pt) => (next[pt.id] = "pass"));
    setCheckedStates(next);
  };

  const allDone = Object.keys(checkedStates).length === CHECKPOINTS.length;
  const hasFailures = Object.values(checkedStates).includes("fail");

  const handleComplete = () => {
    actions.setPreTripData({ checkedStates, hasFailures });
    actions.completeSteps([4]);
    router.push("/were-ok");
  };

  const half = Math.ceil(CHECKPOINTS.length / 2);
  const leftItems = CHECKPOINTS.slice(0, half);
  const rightItems = CHECKPOINTS.slice(half);

  const renderCard = (pt: typeof CHECKPOINTS[0]) => {
    const selected = checkedStates[pt.id];
    const isChecked = selected !== undefined;
    return (
      <Card
        key={pt.id}
        className={cn(
          "p-4 md:p-4 rounded-[16px] md:rounded-3xl border-[1.5px] bg-card flex flex-col gap-3 transition-all anim-fade",
          isChecked && selected === "pass" && "bg-[var(--brand-surface)] border-[#3D9A6A]/30",
          isChecked && selected === "fail" && "bg-red-50 border-[#D9383A]/30"
        )}
        style={animStyle(0.1 + pt.id * 0.03)}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-[10px] flex items-center justify-center text-[13.5px] font-extrabold flex-shrink-0",
              isChecked && selected === "pass"
                ? "bg-[var(--brand-soft)] text-[var(--brand-accent)]"
                : isChecked && selected === "fail"
                ? "bg-red-100 text-[#D9383A]"
                : "bg-[var(--secondary)] text-foreground"
            )}
          >
            {isChecked ? (
              selected === "pass" ? (
                <Check className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )
            ) : (
              pt.id
            )}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <div className="text-sm md:text-[15px] font-bold text-foreground leading-snug">{pt.title}</div>
            {pt.bullets && (
              <div className="mt-1.5 bg-foreground/[0.03] rounded-lg px-3 py-2 flex flex-col gap-1">
                {pt.bullets.map((b, i) => (
                  <span key={i} className="text-[11px] md:text-xs text-foreground font-medium leading-snug">
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleCheck(pt.id, "pass")}
            className={cn(
              "flex-1 h-9 md:h-10 rounded-xl text-xs md:text-sm font-extrabold border-[1.5px] transition-all flex items-center justify-center gap-1",
              selected === "pass"
                ? "bg-[#3D9A6A] border-[#3D9A6A] text-white"
                : "bg-white border-[rgba(14,15,18,0.10)] text-foreground hover:border-[#3D9A6A] hover:bg-[#E6FAF1] hover:text-[#3D9A6A]"
            )}
          >
            <Check className="w-3.5 h-3.5" /> ถูกต้อง / ปกติ
          </button>
          <button
            type="button"
            onClick={() => handleCheck(pt.id, "fail")}
            className={cn(
              "flex-1 h-9 md:h-10 rounded-xl text-xs md:text-sm font-extrabold border-[1.5px] transition-all flex items-center justify-center gap-1",
              selected === "fail"
                ? "bg-[#D9383A] border-[#D9383A] text-white"
                : "bg-white border-[rgba(14,15,18,0.10)] text-foreground hover:border-[#D9383A] hover:bg-red-50 hover:text-[#D9383A]"
            )}
          >
            <X className="w-3.5 h-3.5" /> มีปัญหา / ชำรุด
          </button>
        </div>
      </Card>
    );
  };

  return (
    <>
      <div className="w-full min-h-[calc(100vh-80px)] bg-background flex justify-center items-start">
        <div className="w-full max-w-[1360px] mx-auto px-5 md:px-20 py-6 md:py-[50px] flex flex-col">
          {/* Header */}
          <header className="flex items-center gap-3 mb-2 md:mb-4 anim-fade" style={animStyle(0)}>
            <Link href="/were-ok">
              <button className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-white border-none shadow-[0_2px_6px_rgba(0,0,0,0.03)] flex items-center justify-center text-foreground transition-colors active:bg-[var(--secondary)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
              </button>
            </Link>
            <div className="flex flex-col flex-1">
              <span className="text-[11px] md:text-[13px] text-muted-foreground font-bold tracking-wide">STEP 04 · รายการจุดแดง</span>
              <h1 className="text-lg md:text-[26px] font-extrabold text-foreground">ตรวจรถโม่ก่อนออก</h1>
            </div>
            <button
              onClick={handleCheckAll}
              className="h-9 md:h-10 rounded-xl text-xs md:text-[13px] font-bold border-[1.5px] border-[#3D9A6A] text-[#3D9A6A] bg-[#E6FAF1] hover:bg-[#3D9A6A] hover:text-white px-3.5 md:px-4 flex items-center gap-1.5 transition-all active:scale-[0.97] shadow-[0_2px_6px_rgba(61,154,106,0.08)]"
              title="ปกติทุกจุดทั้ง 13 ข้อ"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>ปกติทุกจุด</span>
            </button>
          </header>

          {/* Steps bar */}
          <div className="flex gap-1 mb-4 md:mb-6 pl-1 anim-fade" style={animStyle(0.04)}>
            <div className="h-1 md:h-1.5 rounded bg-foreground w-6 md:w-9" />
            <div className="h-1 md:h-1.5 rounded bg-foreground w-6 md:w-9 ml-0.5" />
            <div className="h-1 md:h-1.5 rounded bg-[var(--brand-accent)] w-6 md:w-9 ml-0.5" />
            <div className="h-1 md:h-1.5 rounded bg-[var(--border)] w-3 md:w-4 ml-0.5" />
          </div>

          {/* Truck illustration panel */}
          <Card className="bg-card border-[var(--border)] rounded-3xl md:rounded-[16px] p-4 md:p-4 mb-5 md:mb-6 relative overflow-hidden flex flex-col items-center anim-fade" style={animStyle(0.06)}>
            <div
              className="absolute inset-0 opacity-65 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#E4E2D9 1.5px, transparent 1.5px)",
                backgroundSize: "10px 10px",
              }}
            />
            <div className="relative h-[120px] md:h-[160px] flex items-center justify-center">
              <svg width="240" height="110" viewBox="0 0 240 110" className="opacity-90 md:scale-125">
                <path d="M 20,70 L 20,40 L 45,40 L 55,52 L 55,70 Z" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinejoin="round" />
                <rect x="25" y="46" width="13" height="10" fill="none" stroke="#1A1A1A" strokeWidth="1.5" rx="1.5" />
                <line x1="55" y1="70" x2="210" y2="70" stroke="#1A1A1A" strokeWidth="2.2" />
                <circle cx="36" cy="80" r="10" fill="none" stroke="#1A1A1A" strokeWidth="2" />
                <circle cx="36" cy="80" r="2.5" fill="#1A1A1A" />
                <circle cx="165" cy="80" r="10" fill="none" stroke="#1A1A1A" strokeWidth="2" />
                <circle cx="165" cy="80" r="2.5" fill="#1A1A1A" />
                <circle cx="187" cy="80" r="10" fill="none" stroke="#1A1A1A" strokeWidth="2" />
                <circle cx="187" cy="80" r="2.5" fill="#1A1A1A" />
                <ellipse cx="120" cy="50" rx="46" ry="21" fill="none" stroke="#1A1A1A" strokeWidth="1.8" transform="rotate(-6 120 50)" />
                <path d="M 78,54 C 82,42 160,37 164,52" fill="none" stroke="#1A1A1A" strokeWidth="1" />
                <path d="M 175,44 L 202,44 L 206,62 L 184,66 Z" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </div>
          </Card>

          {/* Checkpoints grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-5">
            <div className="flex flex-col gap-3 md:gap-4">{leftItems.map(renderCard)}</div>
            <div className="flex flex-col gap-3 md:gap-4">
              {rightItems.map(renderCard)}
              {allDone && (
                <button
                  onClick={handleComplete}
                  className="w-full md:mt-4 bg-[#121214] hover:bg-[#252528] text-white font-extrabold text-[15px] md:text-base rounded-[16px] md:rounded-3xl py-4 md:py-5 shadow-[0_4px_14px_rgba(0,0,0,0.1)] flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] anim-fade"
                  style={animStyle(0.1)}
                >
                  <span>กลับไปหน้าหลักเพื่อยืนยันเข้ารับคิวงาน</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
