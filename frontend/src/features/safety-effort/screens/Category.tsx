"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/app-navigation";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  FolderOpen,
  HardHat,
  MapPin,
  ShieldCheck,
  TriangleAlert,
  Trophy,
  UsersRound,
} from "lucide-react";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSafetyPointValue } from "@/hooks/useSafetyPointValue";

type MonthlyStats = {
  count: number | null;
  loading: boolean;
};

const steps = [
  {
    title: "เลือกหมวดกิจกรรม",
    description: "เลือกกิจกรรม Linewalk หรือ Safety Contact",
    icon: FolderOpen,
  },
  {
    title: "Check-in สถานที่",
    description: "ปักหมุดเลือกจุดที่ต้องการตรวจประเมิน",
    icon: MapPin,
  },
  {
    title: "เลือกวัน",
    description: "ระบุวันที่สำหรับการเข้าตรวจความปลอดภัย",
    icon: CalendarDays,
  },
  {
    title: "Linewalk หรือ Safety Contact",
    description: "ทำข้อประเมิน Linewalk หรือบันทึกข้อมูล Safety Contact",
    icon: UsersRound,
  },
] as const;

export default function Category() {
  const navigate = useNavigate();
  const safetyEffortPoints = useSafetyPointValue("safetyEffortCompleted");
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({ count: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const to = `${toDate.getFullYear()}-${String(toDate.getMonth() + 1).padStart(2, "0")}-${String(toDate.getDate()).padStart(2, "0")}`;

    setMonthlyStats((current) => ({ ...current, loading: true }));
    fetch(`/api/safety-effort/submissions/me?from=${from}&to=${to}&pageSize=1`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled) return;
        const legacyTotals = payload?.data?.legacy?.totals || null;
        const total = Number(payload?.data?.total || 0) + Number(legacyTotals?.linewalk || 0) + Number(legacyTotals?.contact || 0);
        setMonthlyStats({ count: total, loading: false });
      })
      .catch(() => {
        if (!cancelled) setMonthlyStats({ count: 0, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-shell-wide min-h-screen pt-2.5 pb-7 font-sarabun text-[#0B2F6B]">
      <div className="flex w-full flex-col gap-2.5">
        <div className="mb-2">
          <SafetyCultureHero
            eyebrow="SAFETY EFFORT"
            title={<>Safety Effort</>}
            description="ตรวจ Linewalk และบันทึก Safety Contact เพื่อสร้างสภาพแวดล้อมการทำงานที่ปลอดภัยยิ่งขึ้น"
            variant="community"
            backgroundImage="/images/heroes/safety-effort-category-hero.png"
            backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.82) 0%, rgba(210,235,255,.60) 32%, rgba(210,235,255,.10) 56%, rgba(210,235,255,0) 74%)"
            contentFrame
            mascotSrc="/images/mascots/wangjai/5.png"
            mascotAction="announce"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          {/* Main Card */}
          <main className="min-w-0 order-1 lg:col-start-1 lg:row-start-1 lg:row-span-2">
            <Card className="h-full rounded-[14px]">
              <CardContent className="p-3 sm:p-4">
              <div className="mb-3.5 flex items-center gap-3">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#EEF7FF] text-[#0B82F0]">
                  <ShieldCheck className="h-6 w-6" strokeWidth={2.2} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[16px] font-extrabold leading-tight sm:text-[18px]">ตรวจ Linewalk / Safety Contact</h3>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0B82F0] px-3.5 py-1.5 text-[14px] font-black leading-none text-white shadow-[0_6px_14px_rgba(11,130,240,0.20)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/images/icons/STCoin.png" alt="Coin" className="h-5 w-5 object-contain" />
                      +{safetyEffortPoints} Coin
                    </span>
                  </div>
                  <p className="text-[12px] font-bold leading-relaxed text-[#55739B]">ความปลอดภัยเริ่มต้นที่นี่</p>
                </div>
              </div>

              <ol className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2 2xl:grid-cols-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.title} className="relative flex items-center gap-2.5 rounded-[10px] border border-[#D7EAFE] bg-white p-2.5 shadow-[0_4px_12px_rgba(185,223,255,0.15)] sm:min-h-[130px] sm:flex-col sm:justify-center sm:p-3 sm:text-center">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#0B82F0] text-[9.5px] font-black text-white shadow-[0_3px_8px_rgba(11,130,240,0.15)] sm:absolute sm:left-3 sm:top-3 sm:h-5.5 sm:w-5.5 sm:text-[10px]">{index + 1}</span>
                      <span className="flex h-7.5 w-7.5 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#EEF7FF] text-[#0B82F0] sm:mx-auto sm:mb-2.5 sm:mt-1 sm:h-9 sm:w-9">
                        <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0 flex-1 sm:w-full">
                        <h4 className="text-[12.5px] font-extrabold leading-tight text-[#0B2F6B] sm:text-[12.5px] sm:leading-snug">{step.title}</h4>
                        <p className="mt-0.5 text-[10px] font-bold leading-tight text-[#55739B] sm:mt-1 sm:text-[11px] sm:leading-relaxed">{step.description}</p>
                      </div>
                      {index < steps.length - 1 && <ChevronRight className="absolute -right-[14px] top-1/2 hidden h-5 w-5 -translate-y-1/2 text-[#55739B]/50 2xl:block" aria-hidden="true" />}
                    </li>
                  );
                })}
              </ol>

              <Button
                variant="brand"
                className="mt-2.5 h-10 w-full rounded-[8px] text-[16px] font-extrabold"
                type="button"
                onClick={() => navigate("/activity")}
              >
                เริ่มกิจกรรม <ArrowRight className="h-5 w-5" />
              </Button>
              </CardContent>
            </Card>
          </main>

          {/* Stats Card */}
          <div className="order-2 lg:col-start-2 lg:row-start-1">
            <Card className="rounded-[14px]">
              <CardHeader className="flex-row items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#EEF7FF] text-[#0B82F0]">
                    <Trophy className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <CardTitle className="text-[15px]">สถิติ Safety Effort ของคุณ</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3.5 pt-0">
                <div className="group relative flex items-center gap-4 overflow-hidden rounded-[12px] border border-[#E1F0FF] bg-gradient-to-r from-white via-[#F5FAFF] to-white p-2.5 shadow-[0_6px_20px_rgba(11,130,240,0.03)] transition-all duration-300 hover:border-[#BCE0FF] hover:shadow-[0_10px_25px_rgba(11,130,240,0.08)]">
                  {/* Subtle inner decorative glow */}
                  <div className="absolute right-0 top-0 -mr-6 -mt-6 h-16 w-16 rounded-full bg-[#0B82F0]/5 blur-2xl transition-all duration-500 group-hover:bg-[#0B82F0]/10 group-hover:scale-150" />
                  
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#EEF7FF] to-[#DCEFFF] text-[#0B82F0] shadow-[0_4px_12px_rgba(11,130,240,0.1)] transition-all duration-300 group-hover:scale-105 group-hover:from-[#0B82F0] group-hover:to-[#35A8FF] group-hover:text-white">
                    <ClipboardCheck className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  
                  <div className="min-w-0 flex-1">
                    <span className="block text-[9px] font-extrabold uppercase tracking-wider text-[#0B82F0]/80">สถิติเดือนนี้</span>
                    <h4 className="mt-0.5 text-[12px] font-black leading-tight text-[#0B2F6B] tracking-tight">Line Walk / Safety Contact</h4>
                  </div>
                  
                  <div className="text-right">
                    <span className="block text-[22px] font-black leading-none bg-gradient-to-r from-[#0B82F0] to-[#005DCC] bg-clip-text text-transparent">
                      {monthlyStats.loading ? "..." : monthlyStats.count?.toLocaleString("th-TH") ?? "0"}
                    </span>
                    <span className="mt-1 block text-[9px] font-extrabold text-[#55739B]">ครั้ง</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Suggestions Card */}
          <div className="order-3 lg:order-3 lg:col-start-2 lg:row-start-2">
            <Card className="rounded-[14px]">
              <CardHeader className="flex-row items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#EEF7FF] text-[#0B82F0]">
                    <Bell className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <CardTitle className="text-[15px]">ข้อเสนอแนะ &amp; แจ้งเตือนภัย</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 px-4 pb-3.5 pt-0">
                <div className="flex items-start gap-3 rounded-[12px] border border-[#D7EAFE] bg-[#F5FAFF] p-2.5">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#0B82F0] text-white shadow-[0_8px_16px_rgba(11,130,240,0.18)]">
                    <TriangleAlert className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                  <p className="text-[11.5px] font-bold leading-relaxed text-[#55739B]"><strong className="text-[#0B82F0]">ระวังลมกระโชกแรง:</strong> พยากรณ์อากาศแจ้งเตือนลมพัดแรงเป็นระยะ ขอให้จัดเก็บอุปกรณ์ภายนอกอาคารให้มิดชิด</p>
                </div>
                <div className="flex items-start gap-3 rounded-[12px] border border-[#D7EAFE] bg-[#F5FAFF] p-2.5">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#0B82F0] text-white shadow-[0_8px_16px_rgba(11,130,240,0.18)]">
                    <HardHat className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                  <p className="text-[11.5px] font-bold leading-relaxed text-[#55739B]"><strong className="text-[#0B82F0]">การดูแล PPE:</strong> หมวกนิรภัยที่ชำรุดหรือร้าวควรส่งเคลมทันทีเพื่อความปลอดภัยเต็มประสิทธิภาพ</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
