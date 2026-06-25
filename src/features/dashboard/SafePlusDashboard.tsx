"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { type SafetyCultureFeedEvent, useAppState } from "@/providers/app-providers";
import { apiFetch } from "@/lib/api-client";
import { isLocalDemoLoginHost } from "@/lib/session-user";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Flame,
  Gift,
  ShieldCheck,
  Target,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";

const HERO_MASCOT = "/images/mascots/scenes/wangjai-dashboard-hero-v2.png";
const MOBILE_HERO_MASCOT = "/images/mascots/scenes/wangjai-mobile-hero-thumbsup.png";
const ACTIVITY_MASCOT = "/images/mascots/scenes/wangjai-level-jump.png";
const HERO_BG = "/images/heroes/Home01.png";
const ACTIVITY_BANNER_BG = "/images/dashboard/cpac-activity-banner-bg.png";
const DEMO_LOGIN_SESSION_KEY = "cpac-safety-login-session";

const THAI_WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

const DEMO_ACTIVITY_EVENTS: SafetyCultureFeedEvent[] = [
  {
    id: "demo-feed-event-1",
    title: "Safety Hero Challenge",
    subtitle: "แชร์เรื่องความปลอดภัยประจำสัปดาห์",
    summary: "โพสต์ภาพหรือเรื่องเล่าความปลอดภัยในทีม เพื่อสะสมคะแนนพิเศษ",
    details: "ตัวอย่างกิจกรรมสำหรับ Demo Login",
    imageSrc: "/images/heroes/safety-culture-post-hero.png",
    imageText: "Safety Hero Challenge",
    startDate: "2026-06-25",
    endDate: "2026-06-30",
    dateLabel: "25 - 30 มิ.ย. 2569",
    points: 10,
    status: "open",
    published: true,
    bonusMode: "fixed",
    multiplier: 1,
    fixedPoints: 10,
    enabledActions: ["theme-post", "approved-post"],
  },
  {
    id: "demo-feed-event-2",
    title: "PPE Best Practice",
    subtitle: "แบ่งปันการใช้อุปกรณ์ป้องกันที่ถูกต้อง",
    summary: "อัปโหลดภาพตัวอย่างหรือเคสที่ช่วยเตือนเพื่อนร่วมงานเรื่อง PPE",
    details: "ตัวอย่างกิจกรรมสำหรับ Demo Login",
    imageSrc: "/images/heroes/safety-culture-hero.png",
    imageText: "PPE Best Practice",
    startDate: "2026-07-01",
    endDate: "2026-07-07",
    dateLabel: "1 - 7 ก.ค. 2569",
    points: 15,
    status: "open",
    published: true,
    bonusMode: "fixed",
    multiplier: 1,
    fixedPoints: 15,
    enabledActions: ["theme-post", "comment"],
  },
  {
    id: "demo-feed-event-3",
    title: "Zero Accident Story",
    subtitle: "เล่าเรื่องการป้องกันอุบัติเหตุที่ได้ผลจริง",
    summary: "แชร์วิธีลดความเสี่ยงหรือแนวคิดที่ช่วยให้ทีมทำงานปลอดภัยขึ้น",
    details: "ตัวอย่างกิจกรรมสำหรับ Demo Login",
    imageSrc: "/images/heroes/safety-culture-feed-hero.png",
    imageText: "Zero Accident Story",
    startDate: "2026-07-08",
    endDate: "2026-07-15",
    dateLabel: "8 - 15 ก.ค. 2569",
    points: 20,
    status: "open",
    published: true,
    bonusMode: "fixed",
    multiplier: 1,
    fixedPoints: 20,
    enabledActions: ["theme-post", "reaction", "comment"],
  },
];

function bangkokDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function formatThaiDate(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00+07:00`);
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function previousBangkokDateKey(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00+07:00`);
  date.setUTCDate(date.getUTCDate() - 1);
  return bangkokDateKey(date);
}

function activityBonusLabel(event: { points: number; bonusMode: string; multiplier: number; fixedPoints: number }) {
  if (event.bonusMode === "multiplier") return `x${event.multiplier}`;
  if (event.fixedPoints > 0) return `+${event.fixedPoints} คะแนน`;
  if (event.points > 0) return `+${event.points} คะแนน`;
  return "กำลังจัด";
}

export default function SafePlusDashboard() {
  const {
    currentUserPoints,
    awarenessHistory,
    awarenessHolidays,
    awarenessRequiredToday,
    awarenessStartDate,
    feedEvents,
    rewardsCatalog,
  } = useAppState();
  const [isDemoLogin, setIsDemoLogin] = useState(false);

  const activeEvents = useMemo(
    () => feedEvents.filter((event) => event.published && event.status === "open"),
    [feedEvents],
  );
  const displayedEvents = useMemo(
    () => (activeEvents.length > 0 ? activeEvents : isDemoLogin ? DEMO_ACTIVITY_EVENTS : []),
    [activeEvents, isDemoLogin],
  );

  const [, setPointTransactions] = useState<Array<{ amount: number; occurredAt: string }>>([]);

  useEffect(() => {
    try {
      const demoEnabled =
        process.env.NODE_ENV !== "production"
        && isLocalDemoLoginHost(window.location.hostname)
        && window.sessionStorage.getItem(DEMO_LOGIN_SESSION_KEY) === "true";
      setIsDemoLogin(demoEnabled);
    } catch {
      setIsDemoLogin(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void apiFetch<{ items: Array<{ amount: number; occurredAt: string }> }>("/api/safety-culture/points/me/transactions?limit=100")
      .then((result) => {
        if (!cancelled && result.ok && Array.isArray(result.data?.items)) {
          setPointTransactions(result.data.items);
        }
      });
    return () => { cancelled = true; };
  }, [currentUserPoints]);

  const dashboardData = useMemo(() => {
    const now = new Date();
    const today = bangkokDateKey(now);
    const historyByDate = new Map(awarenessHistory.map((item) => [item.date, item]));
    const holidayDates = new Set(awarenessHolidays.map((item) => item.date));
    const days = Array.from({ length: 11 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() + (index - 5));
      const dateKey = bangkokDateKey(date);
      const bkDate = new Date(`${dateKey}T00:00:00+07:00`);
      const required = ![0, 6].includes(bkDate.getDay()) && !holidayDates.has(dateKey) && dateKey >= awarenessStartDate;
      const completion = historyByDate.get(dateKey) || null;
      const isFuture = dateKey > today;
      return {
        dateKey,
        weekday: THAI_WEEKDAYS[bkDate.getDay()],
        day: String(bkDate.getDate()),
        required,
        completion,
        isFuture,
      };
    });
    const requiredDays = days.filter((day) => day.required && !day.isFuture);
    const pastRequiredDays = requiredDays.filter((day) => day.dateKey !== today);
    const done = requiredDays.filter((day) => day.completion).length;
    const pastDone = pastRequiredDays.filter((day) => day.completion).length;
    const missed = Math.max(0, pastRequiredDays.length - pastDone);
    const completionRate = pastRequiredDays.length ? Math.round((pastDone / pastRequiredDays.length) * 100) : 0;
    const latest = [...awarenessHistory].sort((a, b) => b.date.localeCompare(a.date))[0] || null;
    let streak = 0;
    let streakDate = today;
    if (!historyByDate.has(today)) {
      streakDate = previousBangkokDateKey(streakDate);
    }
    while (streakDate >= awarenessStartDate) {
      const date = new Date(`${streakDate}T00:00:00+07:00`);
      const required = ![0, 6].includes(date.getDay()) && !holidayDates.has(streakDate);
      if (required) {
        if (!historyByDate.has(streakDate)) break;
        streak += 1;
      }
      streakDate = previousBangkokDateKey(streakDate);
    }
    return { days, done, missed, completionRate, latest, streak };
  }, [awarenessHistory, awarenessHolidays, awarenessStartDate]);

  const todayKey = bangkokDateKey(new Date());
  const doneToday = awarenessHistory.some((item) => item.date === todayKey);
  const latestQuestions = (dashboardData.latest?.questions ?? []).filter((q) => q.text?.trim());

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f3f9ff] to-[#f0f7ff] pb-24 font-sarabun sm:pb-8 lg:pb-5">

      {/* ===== HERO ===== */}
      <section
        aria-label="คะแนน Safety ของฉัน"
        className="relative mx-2.5 mt-2 overflow-hidden rounded-[18px] border border-[rgba(215,234,254,.72)] text-[#0B2F6B] shadow-[0_10px_22px_rgba(185,223,255,.28)] lg:mx-6 lg:mt-3 lg:overflow-visible"
        style={{
          background: `linear-gradient(rgba(226,241,255,.26),rgba(226,241,255,.26)), url("${HERO_BG}") center 64%/cover no-repeat`,
          minHeight: 212,
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[rgba(255,255,255,0.06)]" />

        {/* desktop score block */}
        <div className="relative z-10 hidden flex-col justify-center px-5 py-4 lg:flex lg:px-7 lg:py-5" style={{ maxWidth: "26%" }}>
          <div className="inline-flex w-fit flex-col rounded-[18px] border border-white/75 bg-white/58 px-4 py-3.5 shadow-[0_12px_28px_rgba(11,130,240,.16)] backdrop-blur-[4px]">
          <div className="flex items-center gap-2 text-[11px] font-black text-[#083B84] [text-shadow:0_1px_0_rgba(255,255,255,.78)]">
            <ShieldCheck className="h-[20px] w-[20px] text-[#0077F0]" strokeWidth={2.7} />
            <span>คะแนน SAFETY ของฉัน</span>
          </div>
          <div className="mt-1 flex items-end gap-2">
            <strong className="text-[54px] font-black leading-none text-[#006CE0] [text-shadow:0_8px_16px_rgba(11,130,240,.22)]">
              {currentUserPoints.toLocaleString()}
            </strong>
            <span className="mb-1.5 text-[13px] font-black text-[#083B84] [text-shadow:0_1px_0_rgba(255,255,255,.78)]">แต้ม</span>
          </div>
          </div>
        </div>

        {/* reward panel centered (desktop) */}
        <div
          className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 flex-col gap-2.5 rounded-[16px] border border-[#D7EAFE] bg-white/92 p-3.5 backdrop-blur-sm md:flex"
          style={{ width: "clamp(280px,29vw,410px)", boxShadow: "0 14px 30px rgba(185,223,255,.5), inset 0 1px rgba(255,255,255,.85)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-[48px] w-[48px] flex-shrink-0 items-center justify-center rounded-[12px] border border-[#D7EAFE] bg-[#F5FAFF] shadow-[inset_0_1px_rgba(255,255,255,.9)]">
              <Trophy className="h-6 w-6 text-[#0B82F0]" strokeWidth={2.15} />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <strong className="text-[15px] font-black leading-tight text-[#0B2F6B]">
                {rewardsCatalog.length > 0 ? "คะแนนของคุณสามารถนำมาแลกของรางวัลได้" : "ยังไม่มีรางวัลในระบบ"}
              </strong>
              <span className="text-[10.5px] font-bold leading-snug text-[#55739B]">
                {rewardsCatalog.length > 0 ? "ใช้คะแนน Safety เพื่อรับสิทธิ์แลกรางวัล" : "เมื่อมีรางวัลในระบบ รายการจะแสดงที่นี่"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/safety-culture/rewards" className="flex min-h-[34px] items-center justify-center gap-[6px] rounded-xl border border-[#0B82F0] bg-gradient-to-r from-[#35A8FF] via-[#0B82F0] to-[#006AD6] text-[11px] font-black text-white shadow-[0_8px_20px_rgba(11,130,240,.22),inset_0_1px_rgba(255,255,255,.35)]">
              <Gift size={14} /><span>ดูของรางวัลที่นี่</span>
            </Link>
            <Link href="/safety-culture/leaderboard" className="flex min-h-[34px] items-center justify-center gap-[6px] rounded-xl border border-[#D7EAFE] bg-white text-[11px] font-black text-[#0B82F0]">
              <Trophy size={14} /><span>ดูอันดับ Leaderboard</span>
            </Link>
          </div>
        </div>

        {/* desktop mascot */}
        <Image
          src={HERO_MASCOT}
          alt="น้องวางใจ"
          width={1122}
          height={1402}
          priority
          className="home-hero-mascot mascot-motion mascot-motion-hero pointer-events-none absolute bottom-[-28px] right-[9.5%] z-[60] hidden w-[17%] max-w-[226px] object-contain object-bottom [filter:drop-shadow(0_18px_18px_rgba(4,37,86,.24))] lg:block"
        />

        {/* mobile layout */}
        <div className="relative block lg:hidden" style={{ minHeight: 246 }}>
          <div className="absolute left-[5%] top-4 z-[4] w-[56%] max-w-[230px] rounded-[18px] border border-white/70 bg-white/62 px-3.5 py-3 shadow-[0_12px_28px_rgba(0,92,180,.16)] backdrop-blur-[5px]">
            <div className="flex items-center gap-1.5 text-[11.5px] font-black leading-tight text-[#0B2F6B]">
              <ShieldCheck className="h-[18px] w-[18px] flex-shrink-0 text-[#0B82F0]" strokeWidth={2.4} />
              <span>คะแนน SAFETY ของฉัน</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <strong className="min-w-0 text-[42px] font-black leading-none text-[#087dff] [text-shadow:0_8px_18px_rgba(0,150,245,.18)]">
                {currentUserPoints.toLocaleString()}
              </strong>
              <span className="rounded-full bg-[#e4f3ff] px-2.5 py-1 text-[12px] font-black leading-none text-[#0B2F6B] shadow-[inset_0_0_0_1px_rgba(11,130,240,.12)]">แต้ม</span>
            </div>
          </div>
          <Image
            src={MOBILE_HERO_MASCOT}
            alt="น้องวางใจ"
            width={1024}
            height={1536}
            priority
            className="mascot-motion mascot-motion-hero pointer-events-none absolute bottom-[-33px] right-[-7%] z-[3] h-[238px] w-[60%] object-contain object-bottom [filter:drop-shadow(0_14px_17px_rgba(0,20,55,.42))]"
          />
          <Link
            href="/safety-culture/rewards"
            className="absolute bottom-[12px] right-[4%] z-[5] flex min-h-[39px] w-[42%] items-center justify-center gap-1.5 rounded-full border border-[#40c7ff] bg-gradient-to-b from-[#119cff] to-[#006bdf] text-[12px] font-black text-white shadow-[0_0_22px_rgba(0,166,255,.34)]"
          >
            <Gift size={15} />แลกรางวัล
          </Link>
        </div>
      </section>

      {/* ===== CONTENT GRID ===== */}
      <div className="mx-2.5 mt-2 grid gap-2 lg:mx-6 lg:mt-2.5 lg:grid-cols-[minmax(0,2.2fr)_minmax(300px,0.92fr)]">

        {/* ── Safety Awareness card ── */}
        <Card className="rounded-[18px] border border-[rgba(13,80,165,0.18)] bg-white p-2.5 shadow-[0_4px_18px_rgba(11,53,110,0.10),0_1px_4px_rgba(11,53,110,0.06)] sm:p-3 lg:p-3">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#087dff]" strokeWidth={2.4} />
              <h2 className="m-0 text-[12px] font-black text-[#0b3572] sm:text-[12.5px]">Safety Awareness</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7eafe] bg-[#f3f9ff] px-2 py-1 text-[9px] font-black text-[#0b82f0] sm:px-2.5 sm:py-[5px] sm:text-[9.5px]">
                <Flame className="h-3.5 w-3.5" strokeWidth={2.4} />
                ทำต่อเนื่อง {dashboardData.streak} วัน
              </span>
            </div>
            <span className="text-[9px] font-extrabold text-[#6c7f99] sm:text-[10px]">ย้อนหลัง 5 วัน · วันนี้ · ล่วงหน้า 5 วัน</span>
          </div>

          {/* completion row */}
          <div className="grid gap-2.5 rounded-[16px] border-[1.5px] border-[#b9d8fb] bg-gradient-to-br from-[#f8fbff] via-[#eef6ff] to-[#f5fbff] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.78)] sm:gap-2.5 sm:p-2.5 lg:grid-cols-[minmax(0,1.3fr)_auto] lg:items-center lg:p-3">
            <div className="grid grid-cols-[54px_minmax(0,1fr)] items-center gap-2.5 sm:grid-cols-[60px_minmax(0,1fr)] sm:gap-2.5">
              <div
                className="grid h-[54px] w-[54px] place-items-center rounded-full text-[#ff7b14] shadow-[0_8px_14px_rgba(0,71,140,.22)] sm:h-[52px] sm:w-[52px]"
                style={{ background: "radial-gradient(circle,white 0 30%,#1d7bd7 31% 41%,white 42% 55%,#1d62aa 56% 70%,#e7f3ff 71%)" }}
              >
                <Target className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                  <span className="block text-[10px] font-black leading-tight text-[#536e94] sm:text-[10.5px]">เปอร์เซ็นต์การเข้าร่วม Safety Awareness</span>
                  <span className="rounded-full bg-[#dff8e9] px-2.5 py-1 text-[9px] font-black leading-none text-[#118646] sm:px-3 sm:text-[9.5px]">
                    วันนี้: {!awarenessRequiredToday ? "ไม่นับ" : doneToday ? "ทำแล้ว" : "ยังไม่ได้ทำ"}
                  </span>
                </div>
                <div className="mt-1 flex items-end gap-2">
                  <strong className="text-[28px] font-black leading-none text-[#0b3572] sm:text-[24px]">{dashboardData.completionRate}%</strong>
                  <span className="pb-0.5 text-[9px] font-bold leading-tight text-[#5d7599] sm:text-[9.5px]">จากวันที่ต้องทำ</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#d8eafc]">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-[#0b6fe8] to-[#30b8ff] shadow-[0_0_8px_rgba(11,111,232,.4)]"
                    style={{ width: `${dashboardData.completionRate}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(2,minmax(110px,1fr))]">
              {([
                { value: String(dashboardData.done), label: "ทำแล้ว", danger: false },
                { value: String(dashboardData.missed), label: "ไม่ได้ทำ", danger: true },
              ] as const).map(({ value, label, danger }) => (
                <div
                  key={label}
                  className={cn(
                    "flex min-h-[58px] flex-col items-center justify-center rounded-[15px] border px-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.65)] sm:min-h-[64px] sm:rounded-[18px] sm:px-3",
                    danger
                      ? "border-[#ffc7c2] bg-[#fff3f1] text-[#da3127]"
                      : "border-[#c5dcf8] bg-[#f3f8ff] text-[#0b3572]",
                  )}
                >
                  <strong className="text-[18px] font-black leading-none sm:text-[20px]">{value}</strong>
                  <span className={cn("mt-1 text-[8.5px] font-extrabold sm:text-[9.5px]", danger ? "text-[#da3127]/85" : "text-[#4a6fa5]")}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2.5 rounded-[16px] border border-[#dbe9fa] bg-[#f9fbff] p-2">
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 xl:grid-cols-11">
            {dashboardData.days.map((day) => {
              const isToday = day.dateKey === todayKey;
              const dayStatus = day.completion
                ? "ทำแล้ว"
                : day.isFuture
                ? day.required ? "นับ" : "ไม่นับ"
                : day.required
                ? "ไม่ได้ทำ"
                : "ไม่นับ";
              return (
                <div
                  key={day.dateKey}
                  className={cn(
                    "relative flex min-h-[72px] flex-col items-center justify-center rounded-[16px] border-[1.5px] px-1.5 py-1.5 text-center transition-colors sm:min-h-[82px] sm:rounded-[18px] sm:px-2 sm:py-2",
                    isToday
                      ? "border-[3px] border-[#087dff] bg-gradient-to-b from-[#d6ecff] to-[#b9dcff] text-[#073f87] shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_0_0_3px_rgba(8,125,255,.14),0_12px_28px_rgba(8,125,255,.28)]"
                      : day.completion
                      ? "border-[#7fd7a4] bg-[#ebfbf1] text-[#13814a]"
                      : day.isFuture
                      ? day.required
                        ? "border-[#b9d9ff] bg-[#f4f9ff] text-[#1f5c9e]"
                        : "border-[#d6e4f5] bg-[#f7fbff] text-[#6c7f99]"
                      : day.required
                      ? "border-[#ffc8c2] bg-[#fff3f1] text-[#c9352b]"
                      : "border-[#d6e4f5] bg-[#f7fbff] text-[#6c7f99]",
                  )}
                >
                  <span className="text-[9px] font-extrabold opacity-70 sm:text-[10px]">{day.weekday}</span>
                  <strong className="mt-1 text-[16px] font-black leading-none sm:text-[18px]">{day.day}</strong>
                  {day.completion ? (
                    <Check className="mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-current p-[2px] sm:mt-2 sm:h-4 sm:w-4" />
                  ) : (
                    <span className="mt-1.5 text-[8.5px] font-black leading-none sm:mt-2 sm:text-[10px]">{dayStatus}</span>
                  )}
                </div>
              );
            })}
            </div>
          </div>

          {/* latest record */}
          <div className="mt-2 rounded-[12px] border-[1.5px] border-[#c5d9f5] bg-[#f7fbff] p-2 sm:p-2.5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#087dff]" strokeWidth={2.4} />
              <b className="text-[11px] font-black text-[#0b3572]">รายการล่าสุด</b>
            </div>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-3">
              <strong className="rounded-xl bg-[#eef5ff] px-3 py-1.5 text-[10.5px] font-black text-[#0b3572]">
                {dashboardData.latest
                  ? `${formatThaiDate(dashboardData.latest.date)}`
                  : "ยังไม่มีประวัติการทำ"}
              </strong>
              {!dashboardData.latest && (
                <p className="m-0 text-[9.5px] font-bold leading-snug text-[#687b96] sm:text-[10.5px]">เมื่อทำ Safety Awareness แล้ว รายการล่าสุดจะแสดงที่นี่</p>
              )}
              {dashboardData.latest && (
                <p className="m-0 text-[9.5px] font-bold leading-snug text-[#687b96] sm:text-[10.5px]">คำถามที่ทำในวันล่าสุดจะแสดงด้านล่าง</p>
              )}
            </div>
            {dashboardData.latest && latestQuestions.length > 0 && (
              <div className="mt-2 grid gap-1.5">
                {latestQuestions.map((q) => (
                  <div
                    key={q.id}
                    className={cn(
                      "flex items-start gap-2 rounded-[10px] px-2 py-2 text-[9px] font-bold sm:px-2.5 sm:text-[10px]",
                      q.correct ? "bg-[#daf5e6] text-[#19734a]" : "bg-[#fdeee9] text-[#b3271a]",
                    )}
                  >
                    {q.correct ? (
                      <CheckCircle2 className="mt-0.5 h-[15px] w-[15px] flex-shrink-0" strokeWidth={2.6} />
                    ) : (
                      <XCircle className="mt-0.5 h-[15px] w-[15px] flex-shrink-0" strokeWidth={2.6} />
                    )}
                    <span className="leading-[1.4]"><b className="mr-1 font-black">{q.category}</b>{q.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* ── Activity card ── */}
        <div className="flex flex-col">
          <Card className="flex flex-1 flex-col rounded-[18px] border border-[rgba(13,80,165,0.18)] bg-white p-2.5 shadow-[0_4px_18px_rgba(11,53,110,0.10),0_1px_4px_rgba(11,53,110,0.06)] lg:p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-[15px] w-[15px] text-[#087bff]" strokeWidth={2.4} />
                <b className="text-[13px] font-black text-[#0b3572]">กิจกรรม Safety Culture ล่าสุด</b>
              </div>
              <Link href="/safety-culture" className="flex items-center gap-0.5 text-[10.5px] font-extrabold text-[#0b3572]/70 hover:text-[#087dff]">
                ดูทั้งหมด <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
              </Link>
            </div>

            {displayedEvents.length > 0 ? (
              <div
                className="activity-viewport relative flex-1 overflow-hidden rounded-xl bg-[#d7efff] shadow-[inset_0_0_0_1px_rgba(7,125,255,.1)]"
                style={{ minHeight: 156, "--activity-count": displayedEvents.length } as CSSProperties}
              >
                <div className={cn("activity-track flex h-full", displayedEvents.length > 1 && "activity-track-auto")}>
                  {displayedEvents.map((activity) => (
                    <Link
                      key={activity.id}
                      href={`/safety-culture?activityId=${encodeURIComponent(activity.id)}`}
                      className="relative block h-full min-h-[156px] flex-[0_0_100%] overflow-hidden text-white"
                    >
                      {activity.imageSrc ? (
                        <img
                          src={activity.imageSrc}
                          alt={activity.title}
                          className="block h-full min-h-[156px] w-full object-cover object-center transition-transform duration-300 hover:scale-[1.03]"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{ background: `url("${ACTIVITY_BANNER_BG}") center 72%/cover no-repeat` }}
                        >
                          <Image src={ACTIVITY_MASCOT} alt="" width={1254} height={1254} className="absolute bottom-[-28px] right-2 h-[132px] w-[120px] object-contain" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-[rgba(10,25,58,.94)] via-[rgba(18,42,85,.72)] to-transparent px-4 pb-3 pt-12 [text-shadow:0_2px_10px_rgba(0,0,0,.42)]">
                        <strong className="line-clamp-2 text-[18px] font-black leading-tight tracking-[-0.02em] text-white">{activity.title}</strong>
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-extrabold text-white/90">
                          {[activity.dateLabel, activityBonusLabel(activity)].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                {displayedEvents.length > 1 && (
                  <div className="absolute bottom-2.5 right-3 z-10 flex gap-1.5" aria-hidden="true">
                    {displayedEvents.map((activity) => (
                      <span key={activity.id} className="h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_1px_5px_rgba(0,0,0,.35)]" />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="relative flex flex-1 items-center overflow-hidden rounded-xl p-3.5"
                style={{
                  minHeight: 112,
                  background: `url("${ACTIVITY_BANNER_BG}") center 72%/cover no-repeat`,
                }}
              >
                <div className="relative z-10 flex flex-col">
                  <strong className="text-[14px] font-black text-[#0b3572]">เร็วๆ นี้!</strong>
                  <span className="text-[10px] font-bold text-[#0b3572]/75">มีกิจกรรมสนุกๆ รอคุณอยู่</span>
                </div>
                <Image
                  src={ACTIVITY_MASCOT}
                  alt=""
                  width={1254}
                  height={1254}
                  className="absolute bottom-[-28px] right-3 h-[124px] w-[112px] object-contain"
                />
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
