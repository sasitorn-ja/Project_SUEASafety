"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gift,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UsersRound,
  XCircle,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAppState, getSafetyCultureEventPhase } from "@/providers/app-providers";
import { useAppTheme } from "@/providers/theme-provider";

const THAI_WEEKDAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

function bangkokDate(timestamp: number) {
  return new Date(timestamp + BANGKOK_OFFSET_MS);
}

function formatThaiDate(date: Date, includeYear = false) {
  const day = date.getUTCDate();
  const month = THAI_MONTHS_SHORT[date.getUTCMonth()];
  return includeYear ? `${day} ${month} ${date.getUTCFullYear() + 543}` : `${String(day).padStart(2, "0")} ${month}`;
}

export default function HomePage() {
  const { mascot } = useAppTheme();
  const {
    currentUserPoints,
    rewardsCatalog,
    personalRankings,
    teamStandings,
    safetyCultureEvent,
    eventNow,
    awarenessDoneToday,
    awarenessHistory,
    awarenessHolidays,
    awarenessRequiredToday,
  } = useAppState();

  const me = personalRankings.find((person) => person.active);
  const myTeam = me ? teamStandings.find((team) => team.name === me.team) : undefined;

  // ความคืบหน้าสู่รางวัล
  const sortedRewards = useMemo(
    () => [...rewardsCatalog].sort((a, b) => a.points - b.points),
    [rewardsCatalog]
  );
  const redeemableCount = sortedRewards.filter((reward) => reward.points <= currentUserPoints).length;
  const nextReward = sortedRewards.find((reward) => reward.points > currentUserPoints);
  const progress = nextReward
    ? Math.min(100, Math.round((currentUserPoints / nextReward.points) * 100))
    : 100;
  const remaining = nextReward ? nextReward.points - currentUserPoints : 0;

  // อีเวนต์ที่กำลังจัด
  const eventPhase = getSafetyCultureEventPhase(safetyCultureEvent, eventNow);
  const startAt = new Date(`${safetyCultureEvent.startDate}T${safetyCultureEvent.startTime}+07:00`);
  const endAt = new Date(`${safetyCultureEvent.endDate}T${safetyCultureEvent.endTime}+07:00`);
  const eventBonusLabel =
    safetyCultureEvent.bonusMode === "multiplier"
      ? `x${safetyCultureEvent.multiplier}`
      : `+${safetyCultureEvent.fixedPoints} pts`;
  const timeRangeLabel = `${formatThaiDate(bangkokDate(startAt.getTime()))} ${safetyCultureEvent.startTime} - ${formatThaiDate(bangkokDate(endAt.getTime()))} ${safetyCultureEvent.endTime}`;

  const isLive = eventPhase === "live";
  let eventStatusLabel = "Draft";
  let countdownLabel = "ยังไม่มีกิจกรรมในตอนนี้";
  if (eventPhase === "live") {
    eventStatusLabel = "กำลังจัด";
    countdownLabel = `เหลือเวลาอีก ${Math.max(0, Math.ceil((endAt.getTime() - eventNow) / 60000))} นาที`;
  } else if (eventPhase === "upcoming") {
    eventStatusLabel = "ใกล้เริ่ม";
    countdownLabel = `เริ่มในอีก ${Math.max(0, Math.ceil((startAt.getTime() - eventNow) / 60000))} นาที`;
  } else if (eventPhase === "ended") {
    eventStatusLabel = "จบแล้ว";
    countdownLabel = "กิจกรรมสิ้นสุดแล้ว";
  } else if (eventPhase === "paused") {
    eventStatusLabel = "หยุดชั่วคราว";
    countdownLabel = "กิจกรรมถูกหยุดชั่วคราว";
  }
  const showEvent = eventPhase !== "draft";
  const today = bangkokDate(eventNow);
  const todayDateKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
  const awarenessDays = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (13 - index));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    const holiday = awarenessHolidays.find((item) => item.date === key);
    const excludedReason = [0, 6].includes(date.getUTCDay()) ? "วันหยุดสุดสัปดาห์" : holiday?.name;
    return { key, date, completion: awarenessHistory.find((item) => item.date === key), excludedReason };
  });
  const awarenessCountedDays = awarenessDays.filter((item) => !item.excludedReason);
  const awarenessCompletedCount = awarenessCountedDays.filter((item) => item.completion).length;
  const awarenessPastDays = awarenessCountedDays.filter((item) => item.key !== todayDateKey);
  const awarenessRate = awarenessCountedDays.length > 0 ? Math.round((awarenessCompletedCount / awarenessCountedDays.length) * 100) : 100;
  const latestAwareness = [...awarenessHistory].sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];

  return (
    <div className="mx-auto w-full max-w-[1100px] px-3.5 pt-2 pb-8 font-sarabun md:px-4">
      {/* ===== HERO: แดชบอร์ดคะแนน ===== */}
      <section className="relative overflow-hidden rounded-[16px] bg-[linear-gradient(135deg,var(--brand-hero-start),var(--brand-hero-end))] px-3.5 py-3.5 text-white shadow-[0_12px_28px_var(--brand-shadow)] md:px-7 md:py-6">
        <div className="absolute inset-x-0 top-0 h-2 bg-[repeating-linear-gradient(-45deg,var(--brand-accent),var(--brand-accent)_10px,#1a1a1a_10px,#1a1a1a_20px)]" />
        <Image
          src={mascot("big")}
          alt=""
          width={150}
          height={150}
          className="pointer-events-none absolute -bottom-3 right-3 hidden h-[150px] w-[150px] object-contain opacity-90 md:block"
        />

        <div className="relative md:hidden">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--brand-hero-label)]">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
            คะแนน Safety ของฉัน
          </p>

          <div className="mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
            <div className="flex items-end gap-1.5">
              <span className="text-[40px] font-black leading-none tracking-tight">
                {currentUserPoints.toLocaleString()}
              </span>
              <span className="mb-1 text-[12px] font-extrabold text-white/75">แต้ม</span>
            </div>

            {nextReward && (
              <div className="min-w-0 border-l border-white/15 pl-3">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-extrabold text-[var(--brand-hero-label)]">รางวัลถัดไป</span>
                  <span className="text-[9px] font-black text-white/75">{nextReward.points} แต้ม</span>
                </div>
                <p className="truncate text-[12px] font-black">{nextReward.name}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-[var(--brand-accent)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center gap-1.5">
            {me && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-2 py-0.5 text-[9.5px] font-black">
                <Trophy className="h-3 w-3 text-[var(--brand-hero-label)]" strokeWidth={2.5} />
                #{me.rank} ในทีม
              </span>
            )}
            {myTeam && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-2 py-0.5 text-[9.5px] font-black">
                <UsersRound className="h-3 w-3 text-[var(--brand-hero-label)]" strokeWidth={2.5} />
                {myTeam.name}
              </span>
            )}
            <Link
              href="/safety-culture/rewards"
              className="ml-auto inline-flex h-6 items-center gap-1 rounded-lg bg-[var(--brand-accent)] px-2 text-[9.5px] font-black text-[var(--brand-accent-contrast)]"
            >
              <Gift className="h-3 w-3" strokeWidth={2.5} />
              แลกรางวัล
            </Link>
          </div>
        </div>

        <div className="relative hidden gap-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(260px,330px)] md:items-center">
          {/* คะแนน */}
          <div>
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand-hero-label)]">
              <Sparkles className="h-4 w-4" strokeWidth={2.4} />
              คะแนน Safety ของฉัน
            </p>
            <div className="mt-1.5 flex items-end gap-2">
              <span className="text-[44px] font-black leading-none tracking-tight md:text-[58px]">
                {currentUserPoints.toLocaleString()}
              </span>
              <span className="mb-1.5 text-base font-extrabold text-white/75">แต้ม</span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {me && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11.5px] font-black md:px-3 md:text-[12.5px]">
                  <Trophy className="h-3.5 w-3.5 text-[var(--brand-hero-label)]" strokeWidth={2.5} />
                  อันดับ {me.rank} ในทีม
                </span>
              )}
              {myTeam && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11.5px] font-black md:px-3 md:text-[12.5px]">
                  <UsersRound className="h-3.5 w-3.5 text-[var(--brand-hero-label)]" strokeWidth={2.5} />
                  {myTeam.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11.5px] font-black md:px-3 md:text-[12.5px]">
                <Gift className="h-3.5 w-3.5 text-[var(--brand-hero-label)]" strokeWidth={2.5} />
                แลกได้แล้ว {redeemableCount} รางวัล
              </span>
            </div>
          </div>

          {/* ความคืบหน้าสู่รางวัล */}
          <div className="rounded-[14px] border border-white/15 bg-white/10 p-3 backdrop-blur-[6px] md:rounded-[16px] md:p-4">
            {nextReward ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-extrabold uppercase tracking-wide text-[var(--brand-hero-label)]">
                    รางวัลถัดไป
                  </span>
                  <span className="rounded-full bg-[var(--brand-accent)] px-2.5 py-0.5 text-[11px] font-black text-[var(--brand-accent-contrast)]">
                    {nextReward.points.toLocaleString()} แต้ม
                  </span>
                </div>
                <p className="mt-1 truncate text-[16px] font-black md:mt-1.5 md:text-[17px]">{nextReward.name}</p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/20 md:mt-3 md:h-2.5">
                  <div
                    className="h-full rounded-full bg-[var(--brand-accent)] transition-[width] duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[12px] font-bold text-white/80 md:mt-2 md:text-[12.5px]">
                  อีก <span className="font-black text-white">{remaining.toLocaleString()}</span> แต้ม ก็แลกได้ ({progress}%)
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <Award className="h-7 w-7 flex-shrink-0 text-[var(--brand-hero-label)]" strokeWidth={2.2} />
                <p className="text-[14px] font-extrabold leading-snug">
                  เยี่ยมมาก! คะแนนของคุณแลกได้ทุกรางวัลในตอนนี้แล้ว
                </p>
              </div>
            )}

            <div className="mt-2.5 grid grid-cols-2 gap-2 md:mt-3">
              <Link
                href="/safety-culture/rewards"
                className="flex h-8 items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-accent)] text-[12px] font-black text-[var(--brand-accent-contrast)] transition-transform hover:scale-[1.02] md:h-9 md:text-[13px]"
              >
                <Gift className="h-4 w-4" strokeWidth={2.5} />
                แลกรางวัล
              </Link>
              <Link
                href="/safety-culture/leaderboard"
                className="flex h-8 items-center justify-center gap-1.5 rounded-xl border border-white/30 bg-white/10 text-[12px] font-black text-white transition-colors hover:bg-white/20 md:h-9 md:text-[13px]"
              >
                <Trophy className="h-4 w-4" strokeWidth={2.5} />
                ดูอันดับ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Safety Awareness KPI ===== */}
      <section className="mt-3 md:mt-4">
        <div className="mb-2 flex items-center justify-between md:mb-2.5">
          <h2 className="flex items-center gap-1.5 text-[15px] font-black text-[var(--brand-nav)] md:gap-2 md:text-[17px]">
            <ShieldCheck className="h-4 w-4 text-[var(--brand-accent-strong)] md:h-5 md:w-5" strokeWidth={2.5} />
            Safety Awareness KPI
          </h2>
          <span className="text-[10.5px] font-extrabold text-[var(--brand-muted-text)] md:text-[12px]">ย้อนหลัง 14 วัน</span>
        </div>

        <Card className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] p-0 shadow-[0_10px_26px_var(--brand-shadow)]">
          <div className="grid gap-3 border-b border-[var(--border)] p-3.5 md:grid-cols-[1fr_auto] md:items-center md:p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-nav)] text-[var(--brand-accent)]">
                  <Target className="h-5 w-5" strokeWidth={2.5} />
                </span>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--brand-muted-text)]">Completion rate</p>
                  <p className="text-[22px] font-black leading-none text-[var(--brand-nav)] md:text-[28px]">{awarenessRate}%</p>
                </div>
                <span className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-black md:ml-2 ${!awarenessRequiredToday ? "bg-[var(--secondary)] text-[var(--brand-muted-text)]" : awarenessDoneToday ? "bg-[#daf5e6] text-[#19734a]" : "bg-[#fff0d8] text-[#a45b00]"}`}>
                  วันนี้: {!awarenessRequiredToday ? "ไม่นับ KPI" : awarenessDoneToday ? "ทำแล้ว" : "รอดำเนินการ"}
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--secondary)]">
                <div className="h-full rounded-full bg-[var(--brand-accent-strong)]" style={{ width: `${awarenessRate}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-[var(--brand-soft)] px-3 py-2 text-center">
                <p className="text-[18px] font-black text-[var(--brand-nav)]">{awarenessCompletedCount}</p>
                <p className="text-[9px] font-extrabold text-[var(--brand-muted-text)]">ทำแล้ว</p>
              </div>
              <div className="rounded-xl bg-[#fdeee9] px-3 py-2 text-center">
                <p className="text-[18px] font-black text-[#b3271a]">{awarenessPastDays.filter((item) => !item.completion).length}</p>
                <p className="text-[9px] font-extrabold text-[#b3271a]/70">ไม่ได้ทำ</p>
              </div>
              <div className="rounded-xl bg-[var(--secondary)] px-3 py-2 text-center">
                <p className="text-[18px] font-black text-[var(--brand-nav)]">{latestAwareness?.total ? `${latestAwareness.score}/${latestAwareness.total}` : "-"}</p>
                <p className="text-[9px] font-extrabold text-[var(--brand-muted-text)]">คะแนนล่าสุด</p>
              </div>
            </div>
          </div>

          <div className="p-3.5 md:p-5">
            <div className="grid grid-cols-7 gap-1.5 md:gap-2">
              {awarenessDays.map(({ key, date, completion, excludedReason }) => {
                const isToday = key === todayDateKey;
                const status = excludedReason ? "excluded" : completion ? "done" : isToday ? "pending" : "missed";
                return (
                  <div
                    key={key}
                    title={`${formatThaiDate(date, true)}: ${status === "excluded" ? `ไม่นับ KPI (${excludedReason})` : status === "done" ? "ทำแล้ว" : status === "pending" ? "รอดำเนินการ" : "ไม่ได้ทำ"}`}
                    className={`grid min-h-[58px] place-items-center rounded-xl border px-1 py-2 text-center ${
                      status === "excluded"
                        ? "border-[var(--border)] bg-[var(--secondary)] text-[var(--brand-muted-text)]"
                        : status === "done"
                        ? "border-[#9eddbb] bg-[#eafaf1] text-[#19734a]"
                        : status === "pending"
                          ? "border-[var(--brand-accent)] bg-[var(--brand-soft)] text-[var(--brand-text)]"
                          : "border-[#f2c6bd] bg-[#fff5f2] text-[#b3271a]"
                    }`}
                  >
                    <span className="text-[8.5px] font-extrabold opacity-65">{THAI_WEEKDAYS_SHORT[date.getUTCDay()]}</span>
                    <span className="text-[13px] font-black">{date.getUTCDate()}</span>
                    {status === "excluded" ? <span className="text-[8px] font-black">ไม่นับ</span> : status === "done" ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.8} /> : status === "pending" ? <Clock3 className="h-3.5 w-3.5" strokeWidth={2.6} /> : <XCircle className="h-3.5 w-3.5" strokeWidth={2.6} />}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-[14px] border border-[var(--border)] bg-background/70 p-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[var(--brand-accent-strong)]" strokeWidth={2.5} />
                <p className="text-[12px] font-black text-[var(--brand-nav)]">รายการล่าสุด</p>
              </div>
              {latestAwareness ? (
                <div className="mt-2 grid gap-2 md:grid-cols-[auto_1fr] md:items-start">
                  <div className="rounded-xl bg-[var(--brand-soft)] px-3 py-2 text-[11px] font-black text-[var(--brand-text)]">
                    {formatThaiDate(bangkokDate(new Date(latestAwareness.completedAt).getTime()), true)}
                    {latestAwareness.total > 0 && ` · ${latestAwareness.score}/${latestAwareness.total} คะแนน`}
                  </div>
                  <div className="grid gap-1.5">
                    {latestAwareness.questions.length > 0 ? latestAwareness.questions.map((question) => (
                      <div key={question.id} className={`flex items-start gap-2 rounded-xl px-2.5 py-2 text-[10px] font-bold ${question.correct ? "bg-[#daf5e6] text-[#19734a]" : "bg-[#fdeee9] text-[#b3271a]"}`}>
                        {question.correct ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.8} /> : <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.8} />}
                        <span>
                          <strong className="font-black">{question.category}:</strong> {question.text}
                        </span>
                      </div>
                    )) : (
                      <span className="text-[10.5px] font-bold text-[var(--brand-muted-text)]">มีประวัติการทำแล้ว แต่ยังไม่มีรายละเอียดคำถามจากระบบเวอร์ชันเดิม</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-[11px] font-bold text-[var(--brand-muted-text)]">ยังไม่มีประวัติ Safety Awareness เริ่มทำวันนี้เพื่อสร้างข้อมูล KPI</p>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* ===== กิจกรรม/อีเวนต์ที่กำลังจัด ===== */}
      <section className="mt-3 md:mt-4">
        <div className="mb-2 flex items-center justify-between md:mb-2.5">
          <h2 className="flex items-center gap-1.5 text-[15px] font-black text-[var(--brand-nav)] md:gap-2 md:text-[17px]">
            <Zap className="h-4 w-4 text-[var(--brand-accent-strong)] md:h-5 md:w-5" strokeWidth={2.4} />
            กิจกรรมที่กำลังจัด
          </h2>
          <Link
            href="/safety-culture"
            className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-[var(--brand-text)]/70 hover:text-[var(--brand-accent-strong)] md:text-[13px]"
          >
            ดูทั้งหมด
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>

        {showEvent ? (
          <Link href="/safety-culture" className="group block">
            <Card className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--brand-surface)] p-0 shadow-[0_8px_20px_var(--brand-shadow)] transition-all group-hover:-translate-y-0.5 group-hover:border-[var(--brand-accent)]">
              <div className="flex items-center gap-2 p-2.5 md:flex-row md:items-center md:justify-between md:gap-3 md:p-4">
                <div className="flex items-start gap-2.5 md:gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--brand-nav)] text-[var(--brand-accent)] md:h-12 md:w-12 md:rounded-2xl">
                    <Zap className="h-4.5 w-4.5 md:h-6 md:w-6" strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                      <span className="text-[13px] font-black text-[var(--brand-nav)] md:text-[16px]">
                        {safetyCultureEvent.headline}
                      </span>
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-[8.5px] font-black uppercase tracking-[0.1em] md:px-2.5 md:text-[10px] md:tracking-[0.14em] " +
                          (isLive
                            ? "bg-[#daf5e6] text-[#19734a]"
                            : "bg-[var(--brand-soft)] text-[var(--brand-text)]")
                        }
                      >
                        {isLive && (
                          <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#19734a] align-middle" />
                        )}
                        {eventStatusLabel}
                      </span>
                    </div>
                    <p className="mt-1 hidden text-[13px] font-bold leading-relaxed text-[var(--brand-text)]/80 md:block">
                      {safetyCultureEvent.supportingText}
                    </p>
                    <p className="mt-0.5 text-[10px] font-black text-[var(--brand-accent-strong)] md:mt-1 md:text-[12px]">
                      {countdownLabel}
                    </p>
                  </div>
                </div>
                <div className="ml-auto flex flex-shrink-0 flex-wrap items-center gap-1.5 md:ml-0 md:flex-col md:items-end md:gap-2">
                  <span className="rounded-full bg-[var(--brand-accent)] px-2 py-0.5 text-[9px] font-black text-[var(--brand-accent-contrast)] md:px-3 md:py-1 md:text-[12.5px]">
                    โบนัส {eventBonusLabel}
                  </span>
                  <span className="hidden rounded-full border border-[var(--border)] px-3 py-1 text-[12px] font-bold text-[var(--brand-text)]/75 md:inline-flex">
                    {timeRangeLabel}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ) : (
          <Card className="rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-5 py-5 text-center">
            <Zap className="mx-auto h-8 w-8 text-[var(--brand-muted-text)]" strokeWidth={1.8} />
            <p className="mt-2 text-[14px] font-extrabold text-[var(--brand-text)]/70">
              ยังไม่มีกิจกรรมในตอนนี้
            </p>
            <p className="mt-0.5 text-[12.5px] font-bold text-[var(--brand-muted-text)]">
              ติดตามกิจกรรมและโบนัสคะแนนได้ที่หน้า Safety Culture
            </p>
          </Card>
        )}
      </section>

    </div>
  );
}
