"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { useAppState } from "@/providers/app-providers";
import { apiFetch } from "@/lib/api-client";
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

const THAI_WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

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

  const activeEvents = useMemo(
    () => feedEvents.filter((event) => event.published && event.status === "open"),
    [feedEvents],
  );

  const [, setPointTransactions] = useState<Array<{ amount: number; occurredAt: string }>>([]);

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
    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (13 - index));
      const dateKey = bangkokDateKey(date);
      const bkDate = new Date(`${dateKey}T00:00:00+07:00`);
      const required = ![0, 6].includes(bkDate.getDay()) && !holidayDates.has(dateKey) && dateKey >= awarenessStartDate;
      const completion = historyByDate.get(dateKey) || null;
      return {
        dateKey,
        weekday: THAI_WEEKDAYS[bkDate.getDay()],
        day: String(bkDate.getDate()),
        required,
        completion,
      };
    });
    const requiredDays = days.filter((day) => day.required);
    const pastRequiredDays = requiredDays.filter((day) => day.dateKey !== today);
    const done = requiredDays.filter((day) => day.completion).length;
    const pastDone = pastRequiredDays.filter((day) => day.completion).length;
    const missed = Math.max(0, pastRequiredDays.length - pastDone);
    const completionRate = pastRequiredDays.length ? Math.round((pastDone / pastRequiredDays.length) * 100) : 0;
    const latest = [...awarenessHistory].sort((a, b) => b.date.localeCompare(a.date))[0] || null;
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i -= 1) {
      const day = days[i];
      if (!day.required) continue;
      if (day.completion) { streak += 1; continue; }
      if (day.dateKey === today) continue;
      break;
    }
    return { days, done, missed, completionRate, latest, streak };
  }, [awarenessHistory, awarenessHolidays, awarenessStartDate]);

  const todayKey = bangkokDateKey(new Date());
  const doneToday = awarenessHistory.some((item) => item.date === todayKey);
  const latestScore = dashboardData.latest ? `${dashboardData.latest.score}/${dashboardData.latest.total}` : "-";
  const latestQuestions = (dashboardData.latest?.questions ?? []).filter((q) => q.text?.trim());

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f3f9ff] to-[#f0f7ff] pb-6 font-sarabun">

      {/* ===== HERO ===== */}
      <section
        aria-label="คะแนน Safety ของฉัน"
        className="relative mx-2.5 mt-2.5 overflow-hidden rounded-[20px] border border-[#D7EAFE] text-[#0B2F6B] shadow-[0_14px_34px_rgba(185,223,255,.45),inset_0_1px_0_rgba(255,255,255,.75)] lg:mx-6 lg:mt-5"
        style={{
          background: `linear-gradient(90deg,rgba(210,235,255,.82) 0%,rgba(210,235,255,.62) 30%,rgba(210,235,255,.18) 55%,rgba(210,235,255,.04) 72%), url("${HERO_BG}") center 55%/cover no-repeat`,
          minHeight: 238,
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[.42]" style={{ background: "linear-gradient(180deg,rgba(255,255,255,.42),rgba(220,239,255,.08)), radial-gradient(circle at 78% 32%,rgba(24,216,244,.20),transparent 24rem)" }} />

        {/* desktop score block */}
        <div className="relative z-10 hidden flex-col justify-center px-6 py-5 lg:flex lg:px-8 lg:py-6" style={{ maxWidth: "28%" }}>
          <div className="flex items-center gap-2 text-[12px] font-black text-[#0B2F6B]">
            <ShieldCheck className="h-[22px] w-[22px] text-[#0B82F0]" strokeWidth={2.4} />
            <span>คะแนน SAFETY ของฉัน</span>
          </div>
          <div className="mt-0.5 flex items-end gap-3">
            <strong className="text-[56px] font-black leading-none text-[#0B82F0] [text-shadow:0_8px_18px_rgba(11,130,240,.16)]">
              {currentUserPoints.toLocaleString()}
            </strong>
            <span className="mb-2 text-[13px] font-black text-[#0B2F6B]">แต้ม</span>
          </div>
          <p className="m-0 mt-2 text-[13px] font-bold text-[#55739b]">สะสมอีก 49 แต้ม เพื่อให้ครบเป้าหมาย 200 แต้ม</p>
          <div className="mt-4 h-2.5 w-full max-w-[310px] overflow-hidden rounded-full bg-[#D7EAFE]">
            <span className="block h-full rounded-full bg-gradient-to-r from-[#0B82F0] to-[#35A8FF]" style={{ width: `${Math.min(100, (currentUserPoints / 200) * 100)}%` }} />
          </div>
          <div className="mt-4 inline-flex items-center gap-[7px] self-start rounded-full border border-[#D7EAFE] bg-white/85 px-[14px] py-[7px] text-[10.5px] font-black text-[#0B82F0] shadow-[0_8px_20px_rgba(185,223,255,.45)]">
            <Flame className="text-[#0B82F0]" size={14} />
            <span>ทำต่อเนื่อง <b>{dashboardData.streak} วัน</b></span>
          </div>
        </div>

        {/* reward panel centered (desktop) */}
        <div
          className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-[18px] border border-[#D7EAFE] bg-white/92 p-4 backdrop-blur-sm md:flex"
          style={{ width: "clamp(300px,31vw,440px)", boxShadow: "0 16px 34px rgba(185,223,255,.55), inset 0 1px rgba(255,255,255,.85)" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-[54px] w-[54px] flex-shrink-0 items-center justify-center rounded-[14px] border border-[#D7EAFE] bg-[#F5FAFF] shadow-[inset_0_1px_rgba(255,255,255,.9)]">
              <Trophy className="h-7 w-7 text-[#0B82F0]" strokeWidth={2.15} />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <strong className="text-[17px] font-black leading-tight text-[#0B2F6B]">
                {rewardsCatalog.length > 0 ? "คะแนนของคุณสามารถนำมาแลกของรางวัลได้" : "ยังไม่มีรางวัลในระบบ"}
              </strong>
              <span className="text-[11.5px] font-bold leading-snug text-[#55739B]">
                {rewardsCatalog.length > 0 ? "ใช้คะแนน Safety เพื่อรับสิทธิ์แลกรางวัล" : "เมื่อมีรางวัลในระบบ รายการจะแสดงที่นี่"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/safety-culture/rewards" className="flex min-h-[38px] items-center justify-center gap-[7px] rounded-xl border border-[#0B82F0] bg-gradient-to-r from-[#35A8FF] via-[#0B82F0] to-[#006AD6] text-[12.5px] font-black text-white shadow-[0_8px_20px_rgba(11,130,240,.22),inset_0_1px_rgba(255,255,255,.35)]">
              <Gift size={16} /><span>ดูของรางวัลที่นี่</span>
            </Link>
            <Link href="/safety-culture/leaderboard" className="flex min-h-[38px] items-center justify-center gap-[7px] rounded-xl border border-[#D7EAFE] bg-white text-[12.5px] font-black text-[#0B82F0]">
              <Trophy size={16} /><span>ดูอันดับ Leaderboard</span>
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
          className="mascot-motion mascot-motion-hero pointer-events-none absolute bottom-[-59px] right-0 z-[3] hidden w-[23%] max-w-[280px] object-contain object-bottom [filter:drop-shadow(0_16px_18px_rgba(11,130,240,.22))] lg:block"
        />

        {/* mobile layout */}
        <div className="relative block lg:hidden" style={{ minHeight: 290 }}>
          <div className="absolute left-[7%] top-4 w-[44%]">
            <div className="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-black text-[#0B2F6B]">
              <ShieldCheck className="h-[19px] w-[19px] text-[#0B82F0]" strokeWidth={2.4} />
              <span>คะแนน SAFETY ของฉัน</span>
            </div>
            <div className="mt-2.5 flex items-end gap-2">
              <strong className="text-[47px] font-black leading-none text-[#168cff] [text-shadow:0_8px_18px_rgba(0,150,245,.18)]">
                {currentUserPoints.toLocaleString()}
              </strong>
              <span className="mb-1.5 text-[13px] font-black text-[#0B2F6B]">แต้ม</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-[#D7EAFE] bg-white/85 px-3 py-1.5 text-[11px] font-black text-[#0B82F0]">
              <Flame className="text-[#0B82F0]" size={13} />
              <span>ทำต่อเนื่อง <b>{dashboardData.streak} วัน</b></span>
            </div>
          </div>
          <Image
            src={MOBILE_HERO_MASCOT}
            alt="น้องวางใจ"
            width={1024}
            height={1536}
            priority
            className="mascot-motion mascot-motion-hero pointer-events-none absolute bottom-[-35px] right-[-7%] z-[3] h-[280px] w-[63%] object-contain object-bottom [filter:drop-shadow(0_14px_17px_rgba(0,20,55,.42))]"
          />
          <Link
            href="/safety-culture/rewards"
            className="absolute bottom-[13px] right-[4%] z-[5] flex min-h-[42px] w-[42%] items-center justify-center gap-1.5 rounded-full border border-[#40c7ff] bg-gradient-to-b from-[#119cff] to-[#006bdf] text-[12px] font-black text-white shadow-[0_0_22px_rgba(0,166,255,.34)]"
          >
            <Gift size={15} />แลกรางวัล
          </Link>
        </div>
      </section>

      {/* ===== CONTENT GRID ===== */}
      <div className="mx-2.5 mt-2.5 grid gap-2.5 lg:mx-6 lg:mt-3 lg:grid-cols-[minmax(0,2.12fr)_minmax(350px,1fr)]">

        {/* ── Safety Awareness KPI card ── */}
        <Card className="rounded-[18px] border border-[rgba(13,80,165,0.18)] bg-white p-3 shadow-[0_4px_18px_rgba(11,53,110,0.10),0_1px_4px_rgba(11,53,110,0.06)] lg:p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#087dff]" strokeWidth={2.4} />
              <h2 className="m-0 text-[12.5px] font-black text-[#0b3572]">Safety Awareness KPI</h2>
            </div>
            <span className="text-[10px] font-extrabold text-[#6c7f99]">ย้อนหลัง 14 วัน</span>
          </div>

          {/* completion row */}
          <div className="grid items-center gap-x-3 gap-y-1 rounded-[15px] border-[1.5px] border-[#c8dff8] bg-gradient-to-r from-[#f5f9ff] to-[#edf5ff] p-2.5 [grid-template-columns:72px_1fr_auto] [grid-template-rows:auto_9px]">
            <div
              className="row-span-2 grid h-[60px] w-[60px] place-items-center rounded-full text-[#ff7b14] shadow-[0_8px_12px_rgba(0,71,140,.2)]"
              style={{ background: "radial-gradient(circle,white 0 30%,#1d7bd7 31% 41%,white 42% 55%,#1d62aa 56% 70%,#e7f3ff 71%)" }}
            >
              <Target className="h-8 w-8" strokeWidth={2.2} />
            </div>
            <div>
              <span className="block text-[10.5px] font-black tracking-[.04em] text-[#536e94]">COMPLETION RATE</span>
              <strong className="text-[24px] font-black leading-none text-[#0b3572]">{dashboardData.completionRate}%</strong>
            </div>
            <span className="rounded-[15px] bg-[#dff8e9] px-[11px] py-[5px] text-[9.5px] font-black text-[#118646]">
              วันนี้: {!awarenessRequiredToday ? "ไม่นับ KPI" : doneToday ? "ทำแล้ว" : "ยังไม่ได้ทำ"}
            </span>
            <div className="col-start-2 h-2 overflow-hidden rounded-full bg-[#d8eafc]">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-[#0b6fe8] to-[#30b8ff] shadow-[0_0_8px_rgba(11,111,232,.4)]"
                style={{ width: `${dashboardData.completionRate}%` }}
              />
            </div>
            <div className="col-span-3 mt-1.5 grid grid-cols-3 gap-1.5 sm:col-span-1 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:grid-cols-[repeat(3,minmax(94px,1fr))]">
              {([
                { value: String(dashboardData.done), label: "ทำแล้ว", danger: false },
                { value: String(dashboardData.missed), label: "ไม่ได้ทำ", danger: true },
                { value: latestScore, label: "คะแนนล่าสุด", danger: false },
              ] as const).map(({ value, label, danger }) => (
                <div
                  key={label}
                  className={cn(
                    "flex min-h-[64px] flex-col items-center justify-center rounded-xl border",
                    danger
                      ? "border-[#f8c5c5] bg-[#fff0f0] text-[#d91a1a]"
                      : "border-[#c5dcf8] bg-[#e8f3ff] text-[#0b3572]",
                  )}
                >
                  <strong className="text-[15px] font-black">{value}</strong>
                  <span className={cn("text-[9px] font-extrabold", danger ? "text-[#d91a1a]/80" : "text-[#4a6fa5]")}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* day grid */}
          <div className="mt-2 grid grid-cols-7 gap-1 xl:grid-cols-14 xl:gap-1.5">
            {dashboardData.days.map((day) => {
              const isToday = day.dateKey === todayKey;
              return (
                <div
                  key={day.dateKey}
                  className={cn(
                    "flex min-h-[54px] flex-col items-center justify-center rounded-xl border-[1.5px] text-center",
                    day.completion
                      ? "border-[#6dd0a0] bg-[#e4faf0] text-[#0a8a44]"
                      : !day.required
                      ? "border-[#b8d5f2] bg-[#f0f7ff] text-[#2d5a96]"
                      : isToday
                      ? "border-[#b8d5f2] bg-[#f0f7ff] text-[#2d5a96]"
                      : "border-[#f8c5c5] bg-[#fff0f0] text-[#c0271a]",
                  )}
                >
                  <span className="text-[9px] font-extrabold opacity-65">{day.weekday}</span>
                  <strong className="text-[13px] font-black leading-tight">{day.day}</strong>
                  {day.completion ? (
                    <Check className="h-4 w-4 rounded-full border-2 border-current p-[2px]" />
                  ) : (
                    <small className="text-[8px] font-black leading-none">{day.required ? "ไม่ได้ทำ" : "ไม่นับ KPI"}</small>
                  )}
                </div>
              );
            })}
          </div>

          {/* latest record */}
          <div className="mt-2 rounded-[12px] border-[1.5px] border-[#c5d9f5] bg-[#f7fbff] p-2 lg:p-2.5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#087dff]" strokeWidth={2.4} />
              <b className="text-[11px] font-black text-[#0b3572]">รายการล่าสุด</b>
            </div>
            <div className="mt-1.5 grid grid-cols-[auto_1fr] items-center gap-3">
              <strong className="rounded-xl bg-[#eef5ff] px-3 py-1.5 text-[10.5px] font-black text-[#0b3572]">
                {dashboardData.latest
                  ? `${formatThaiDate(dashboardData.latest.date)} · ${latestScore} คะแนน`
                  : "ยังไม่มีประวัติการทำ"}
              </strong>
              {!dashboardData.latest && (
                <p className="m-0 text-[10.5px] font-bold text-[#687b96]">เมื่อทำ Safety Awareness แล้ว รายการล่าสุดจะแสดงที่นี่</p>
              )}
            </div>
            {dashboardData.latest && latestQuestions.length > 0 && (
              <div className="mt-2 grid gap-1.5">
                {latestQuestions.slice(0, 3).map((q) => (
                  <div
                    key={q.id}
                    className={cn(
                      "flex items-start gap-2 rounded-[10px] px-2.5 py-2 text-[10px] font-bold",
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
          <Card className="flex flex-1 flex-col rounded-[18px] border border-[rgba(13,80,165,0.18)] bg-white p-3 shadow-[0_4px_18px_rgba(11,53,110,0.10),0_1px_4px_rgba(11,53,110,0.06)] lg:p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-[15px] w-[15px] text-[#087bff]" strokeWidth={2.4} />
                <b className="text-[13px] font-black text-[#0b3572]">กิจกรรมที่กำลังจัด</b>
              </div>
              <Link href="/safety-culture" className="flex items-center gap-0.5 text-[10.5px] font-extrabold text-[#0b3572]/70 hover:text-[#087dff]">
                ดูทั้งหมด <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
              </Link>
            </div>

            {activeEvents.length > 0 ? (
              <div
                className="activity-viewport relative flex-1 overflow-hidden rounded-xl bg-[#d7efff] shadow-[inset_0_0_0_1px_rgba(7,125,255,.1)]"
                style={{ minHeight: 180, "--activity-count": activeEvents.length } as CSSProperties}
              >
                <div className={cn("activity-track flex h-full", activeEvents.length > 1 && "activity-track-auto")}>
                  {activeEvents.map((activity) => (
                    <Link
                      key={activity.id}
                      href={`/safety-culture?activityId=${encodeURIComponent(activity.id)}`}
                      className="relative block h-full min-h-[180px] flex-[0_0_100%] overflow-hidden text-white"
                    >
                      {activity.imageSrc ? (
                        <img
                          src={activity.imageSrc}
                          alt={activity.title}
                          className="block h-full min-h-[180px] w-full object-cover object-center transition-transform duration-300 hover:scale-[1.03]"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{ background: `url("${ACTIVITY_BANNER_BG}") center 72%/cover no-repeat` }}
                        >
                          <Image src={ACTIVITY_MASCOT} alt="" width={1254} height={1254} className="absolute bottom-[-38px] right-3 h-[156px] w-[142px] object-contain" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-[rgba(0,18,43,.92)] via-[rgba(0,28,64,.76)] to-transparent px-4 pb-4 pt-12 [text-shadow:0_2px_10px_rgba(0,0,0,.42)]">
                        <strong className="line-clamp-2 text-[16px] font-black leading-tight">{activity.title}</strong>
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[10.5px] font-extrabold text-white/85">
                          {[activity.dateLabel, activityBonusLabel(activity)].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                {activeEvents.length > 1 && (
                  <div className="absolute bottom-2.5 right-3 z-10 flex gap-1.5" aria-hidden="true">
                    {activeEvents.map((activity) => (
                      <span key={activity.id} className="h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_1px_5px_rgba(0,0,0,.35)]" />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="relative flex flex-1 items-center overflow-hidden rounded-xl p-4"
                style={{
                  minHeight: 126,
                  background: `url("${ACTIVITY_BANNER_BG}") center 72%/cover no-repeat`,
                }}
              >
                <div className="relative z-10 flex flex-col">
                  <strong className="text-[15px] font-black text-[#0b3572]">เร็วๆ นี้!</strong>
                  <span className="text-[10.5px] font-bold text-[#0b3572]/75">มีกิจกรรมสนุกๆ รอคุณอยู่</span>
                </div>
                <Image
                  src={ACTIVITY_MASCOT}
                  alt=""
                  width={1254}
                  height={1254}
                  className="absolute bottom-[-37px] right-3.5 h-[142px] w-[128px] object-contain"
                />
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
