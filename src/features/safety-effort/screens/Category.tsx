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
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({ count: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const to = `${toDate.getFullYear()}-${String(toDate.getMonth() + 1).padStart(2, "0")}-${String(toDate.getDate()).padStart(2, "0")}`;

    setMonthlyStats((current) => ({ ...current, loading: true }));
    fetch(`/api/safety-effort/submissions/me?from=${from}&to=${to}&pageSize=500`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled) return;
        const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
        const countedItems = items.filter((item) => {
          const activityType = String(item?.activityType || item?.activity_type || "").toUpperCase();
          return activityType === "LINE_WALK" || activityType === "SAFETY_CONTACT";
        });
        const total = countedItems.length;
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
    <div className="min-h-screen bg-[#EEF7FF] px-3 py-4 text-[#0B2F6B] sm:px-4 lg:px-6">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-3">
        <div className="mb-3">
          <SafetyCultureHero
            eyebrow="SAFETY EFFORT"
            title={<>Safety <span>Effort</span></>}
            description="ตรวจ Linewalk และบันทึก Safety Contact เพื่อสร้างสภาพแวดล้อมการทำงานที่ปลอดภัยยิ่งขึ้น"
            variant="community"
            backgroundImage="/images/heroes/safety-effort-category-hero.png"
            backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.82) 0%, rgba(210,235,255,.60) 32%, rgba(210,235,255,.10) 56%, rgba(210,235,255,0) 74%)"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <main className="min-w-0">
            <Card className="h-full rounded-[14px]">
              <CardContent className="p-4 sm:p-5">
              <div className="mb-5 flex items-start gap-4">
                <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[14px] bg-[#EEF7FF] text-[#0B82F0]">
                  <ShieldCheck className="h-9 w-9" strokeWidth={2.3} />
                </span>
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="text-[18px] font-extrabold leading-tight sm:text-[20px]">ตรวจ Linewalk / Safety Contact</h3>
                    <span className="rounded-full bg-[#0B82F0] px-3 py-1 text-[12px] font-black text-white shadow-[0_6px_14px_rgba(11,130,240,0.20)]">+10 pts</span>
                  </div>
                  <p className="text-[12.5px] font-bold leading-relaxed text-[#55739B]">เลือกหมวดกิจกรรม &gt; Check-in สถานที่ &gt; เลือกวัน &gt; Linewalk หรือ Safety Contact</p>
                </div>
              </div>

              <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.title} className="relative min-h-[174px] rounded-[10px] border border-[#D7EAFE] bg-white p-4 shadow-[0_6px_18px_rgba(185,223,255,0.26)]">
                      <span className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#0B82F0] text-[12px] font-black text-white shadow-[0_6px_14px_rgba(11,130,240,0.20)]">{index + 1}</span>
                      <span className="mx-auto mb-5 mt-3 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#EEF7FF] text-[#0B82F0]">
                        <Icon className="h-7 w-7" strokeWidth={2.3} />
                      </span>
                      <div className="text-center">
                        <h4 className="text-[14px] font-extrabold leading-snug">{step.title}</h4>
                        <p className="mt-2 text-[12px] font-bold leading-relaxed text-[#55739B]">{step.description}</p>
                      </div>
                      {index < steps.length - 1 && <ChevronRight className="absolute -right-[18px] top-1/2 hidden h-6 w-6 -translate-y-1/2 text-[#55739B]/50 xl:block" aria-hidden="true" />}
                    </li>
                  );
                })}
              </ol>

              <Button
                variant="brand"
                className="mt-5 h-12 w-full rounded-[9px] text-[18px] font-extrabold"
                type="button"
                onClick={() => navigate("/activity")}
              >
                เริ่มกิจกรรม <ArrowRight className="h-6 w-6" />
              </Button>
              </CardContent>
            </Card>
          </main>

          <aside className="grid min-w-0 grid-cols-1 gap-3">
            <Card className="rounded-[14px]">
              <CardHeader className="flex-row items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EEF7FF] text-[#0B82F0]">
                    <Trophy className="h-6 w-6" strokeWidth={2.3} />
                  </span>
                  <CardTitle className="text-[17px]">สถิติ Safety Effort ของคุณ</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <div className="flex min-h-[70px] items-center gap-4 rounded-[12px] border border-[#D7EAFE] bg-[#F5FAFF] px-4">
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[12px] bg-[#EEF7FF] text-[#0B82F0]">
                    <ClipboardCheck className="h-7 w-7" strokeWidth={2.3} />
                  </span>
                  <strong className="min-w-0 flex-1 text-[13px] font-extrabold">จำนวน Line Walk / Safety Contact เดือนนี้</strong>
                  <b className="whitespace-nowrap text-[22px] font-black text-[#0B82F0]">{monthlyStats.loading ? "..." : monthlyStats.count?.toLocaleString("th-TH") ?? "0"} ครั้ง</b>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[14px]">
              <CardHeader className="flex-row items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EEF7FF] text-[#0B82F0]">
                    <Bell className="h-6 w-6" strokeWidth={2.3} />
                  </span>
                  <CardTitle className="text-[17px]">ข้อเสนอแนะ &amp; แจ้งเตือนภัย</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 px-5 pb-5 pt-0">
                <div className="flex items-start gap-3 rounded-[12px] border border-[#D7EAFE] bg-[#F5FAFF] p-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0B82F0] text-white shadow-[0_8px_16px_rgba(11,130,240,0.18)]">
                    <TriangleAlert className="h-5 w-5" strokeWidth={2.35} />
                  </span>
                  <p className="text-[12.5px] font-bold leading-relaxed text-[#55739B]"><strong className="text-[#0B82F0]">ระวังลมกระโชกแรง:</strong> พยากรณ์อากาศแจ้งเตือนลมพัดแรงเป็นระยะ ขอให้จัดเก็บอุปกรณ์ภายนอกอาคารให้มิดชิด</p>
                </div>
                <div className="flex items-start gap-3 rounded-[12px] border border-[#D7EAFE] bg-[#F5FAFF] p-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0B82F0] text-white shadow-[0_8px_16px_rgba(11,130,240,0.18)]">
                    <HardHat className="h-5 w-5" strokeWidth={2.35} />
                  </span>
                  <p className="text-[12.5px] font-bold leading-relaxed text-[#55739B]"><strong className="text-[#0B82F0]">การดูแล PPE:</strong> หมวกนิรภัยที่ชำรุดหรือร้าวควรส่งเคลมทันทีเพื่อความปลอดภัยเต็มประสิทธิภาพ</p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
