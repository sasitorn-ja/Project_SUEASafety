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
  Flame,
  Gift,
  Medal,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UsersRound,
  XCircle,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAppState } from "@/providers/app-providers";
import { useAppTheme } from "@/providers/theme-provider";
import SafePlusDashboard from "@/features/dashboard/SafePlusDashboard";

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

function getDateTimestamp(date?: string, endOfDay = false) {
  if (!date) return null;
  const parsed = new Date(`${date}T${endOfDay ? "23:59:59" : "00:00:00"}+07:00`);
  const timestamp = parsed.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function LegacyHomePage() {
  const { mascot } = useAppTheme();
  const {
    currentUserPoints,
    rewardsCatalog,
    personalRankings,
    teamStandings,
    feedEvents,
    eventNow,
    awarenessDoneToday,
    awarenessHistory,
    awarenessHolidays,
    awarenessRequiredToday,
    awarenessStartDate,
    userActivityHistory,
  } = useAppState();

  const me = personalRankings.find((person) => person.active);
  const myTeam = me ? teamStandings.find((team) => team.name === me.team) : undefined;

  // ความคืบหน้าสู่รางวัล
  const sortedRewards = useMemo(
    () => [...rewardsCatalog].sort((a, b) => a.points - b.points),
    [rewardsCatalog]
  );
  const hasRewards = sortedRewards.length > 0;
  const redeemableCount = sortedRewards.filter((reward) => reward.points <= currentUserPoints).length;
  const nextReward = sortedRewards.find((reward) => reward.points > currentUserPoints);
  const progress = nextReward
    ? Math.min(100, Math.round((currentUserPoints / nextReward.points) * 100))
    : hasRewards ? 100 : 0;
  const remaining = nextReward ? nextReward.points - currentUserPoints : 0;

  // อีเวนต์ที่กำลังจัด: ใช้ชุดเดียวกับ Feed เพื่อสะท้อนข้อมูลที่ Admin เพิ่งบันทึกทันที
  const activeFeedEvents = feedEvents
    .filter((event) => {
      if (!event.published || event.status !== "open") return false;
      return true;
    })
    .sort((left, right) => (getDateTimestamp(right.startDate, false) ?? 0) - (getDateTimestamp(left.startDate, false) ?? 0));
  const activeEvent = activeFeedEvents[0] ?? null;
  const activeEventEndAt = getDateTimestamp(activeEvent?.endDate, true);
  const eventBonusLabel = activeEvent
    ? activeEvent.bonusMode === "multiplier"
      ? `x${activeEvent.multiplier}`
      : activeEvent.fixedPoints > 0
        ? `+${activeEvent.fixedPoints} pts`
        : activeEvent.points > 0
          ? `+${activeEvent.points} pts`
          : "OPEN"
    : "";
  const countdownLabel = activeEventEndAt
    ? `เหลือเวลาอีก ${Math.max(0, Math.ceil((activeEventEndAt - eventNow) / 60000))} นาที`
    : "กำลังเปิดรับกิจกรรม";
  const timeRangeLabel = activeEvent?.dateLabel || "ไม่ระบุช่วงเวลา";
  const showEvent = Boolean(activeEvent);
  const today = bangkokDate(eventNow);
  const todayDateKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
  const awarenessDays = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (13 - index));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    const holiday = awarenessHolidays.find((item) => item.date === key);
    const beforeStart = key < awarenessStartDate;
    const excludedReason = beforeStart
      ? "ก่อนเริ่มใช้งาน"
      : [0, 6].includes(date.getUTCDay())
        ? "วันหยุดสุดสัปดาห์"
        : holiday?.name;
    return { key, date, completion: awarenessHistory.find((item) => item.date === key), excludedReason };
  });
  const awarenessCountedDays = awarenessDays.filter((item) => !item.excludedReason);
  const awarenessCompletedCount = awarenessCountedDays.filter((item) => item.completion).length;
  const awarenessPastDays = awarenessCountedDays.filter((item) => item.key !== todayDateKey);
  const awarenessMissedCount = awarenessPastDays.filter((item) => !item.completion).length;
  const awarenessPastCompletedCount = awarenessPastDays.filter((item) => item.completion).length;
  // คิด completion rate จากเฉพาะวันที่ผ่านมาแล้ว (ไม่รวมวันนี้ที่ยังรอทำ)
  // ผู้ใช้ใหม่ที่ยังไม่มีวันนับได้ในอดีต -> ไม่มีค่า (แสดงเป็น "–")
  const hasAwarenessRate = awarenessPastDays.length > 0;
  const awarenessRate = hasAwarenessRate
    ? Math.round((awarenessPastCompletedCount / awarenessPastDays.length) * 100)
    : 0;
  const latestAwareness = [...awarenessHistory].sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];

  // ===== Derived gamification data (real where available, see TODOs) =====
  // Consecutive completed KPI days (streak), walking back over counted days.
  const awarenessStreak = (() => {
    let streak = 0;
    for (let i = awarenessDays.length - 1; i >= 0; i -= 1) {
      const day = awarenessDays[i];
      if (day.excludedReason) continue;        // weekends/holidays don't break streak
      if (day.completion) streak += 1;
      else if (day.key === todayDateKey) continue; // today not done yet — not a miss
      else break;
    }
    return streak;
  })();

  // จำนวนครั้งร่วมกิจกรรม (จาก activity history จริง)
  const activityCount = Array.isArray(userActivityHistory) ? userActivityHistory.length : 0;

  // เทรนด์คะแนน 8 สัปดาห์ — รวม pointsDelta จาก userActivityHistory ตามสัปดาห์ (ของจริง)
  // TODO(API): ถ้ามี endpoint สรุปคะแนนรายสัปดาห์โดยตรง ให้ใช้แทนการ derive ฝั่ง client
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const currentWeekStart = (() => {
    const d = bangkokDate(eventNow);
    const dayOfWeek = d.getUTCDay(); // 0 = Sunday
    const startUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - dayOfWeek * 24 * 60 * 60 * 1000;
    return startUtc - BANGKOK_OFFSET_MS; // convert back to real epoch for comparison with occurredAt
  })();
  const weeklyTrend = (() => {
    const buckets = new Array(8).fill(0);
    for (const activity of userActivityHistory || []) {
      const ts = Number(activity?.occurredAt) || 0;
      if (!ts) continue;
      const weeksAgo = Math.floor((currentWeekStart + WEEK_MS - ts) / WEEK_MS);
      if (weeksAgo < 0 || weeksAgo > 7) continue;
      buckets[7 - weeksAgo] += Math.max(0, Number(activity?.pointsDelta) || 0);
    }
    return buckets;
  })();
  const weeklyTrendMax = Math.max(1, ...weeklyTrend);
  const hasWeeklyTrend = weeklyTrend.some((value) => value > 0);
  // เลเวล/XP — derive จากคะแนนรวมจริง (currentUserPoints)
  // TODO(API): ถ้ามีระบบ XP/level จริงใน backend ให้ผูกแทนสูตร derive นี้
  const LEVEL_TITLES = ["Safety Rookie", "Safety Cadet", "Safety Guard", "Safety Pro", "Safety Master", "Safety Legend"];
  const XP_PER_LEVEL = 2000;
  const totalXp = Math.max(0, currentUserPoints);
  const level = Math.min(LEVEL_TITLES.length, Math.floor(totalXp / XP_PER_LEVEL) + 1);
  const levelTitle = LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, level - 1)];
  const levelFloorXp = (level - 1) * XP_PER_LEVEL;
  const levelCeilXp = level * XP_PER_LEVEL;
  const xpIntoLevel = totalXp - levelFloorXp;
  const xpToNext = Math.max(0, levelCeilXp - totalXp);
  const levelProgress = Math.min(100, Math.round((xpIntoLevel / XP_PER_LEVEL) * 100));

  // Hero "เลื่อนระดับ" meter — points within the current 100-point tier (matches mockup 35/100).
  const TIER_SIZE = 100;
  const tierInto = totalXp % TIER_SIZE;
  const tierToNext = TIER_SIZE - tierInto;
  const tierProgress = Math.round((tierInto / TIER_SIZE) * 100);

  // mascot น้องวางใจ (CPAC) — ใช้ asset ที่มีอยู่ ให้ตรงกับดีไซน์ที่ส่งมา
  const NONG = "/images/mascots/wangjai/scenes";

  return (
    <div className="mx-auto w-full max-w-[1500px] px-3.5 pt-0 pb-8 font-sarabun sm:px-5 lg:px-8 2xl:px-10">
      {/* ===== HERO: แดชบอร์ดคะแนน ===== */}
      <section className="relative overflow-hidden rounded-[16px] bg-[linear-gradient(135deg,var(--brand-hero-start),var(--brand-hero-end))] px-3.5 py-3.5 text-white shadow-[0_12px_28px_var(--brand-shadow)] md:px-7 md:py-6 xl:px-8">
        <div className="absolute inset-x-0 top-0 h-2 bg-[repeating-linear-gradient(-45deg,var(--brand-accent),var(--brand-accent)_10px,#1a1a1a_10px,#1a1a1a_20px)]" />

        {/* cyan glow ตามดีไซน์ CPAC */}
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(39,215,255,0.32),transparent_70%)]" />

        <div className="relative md:hidden">
          <Image
            src={`${NONG}/thumbsup-cool.png`}
            alt="น้องวางใจ"
            width={120}
            height={130}
            className="pointer-events-none absolute -top-2 -right-1 h-[112px] w-[104px] object-contain object-top drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]"
          />
          <p className="flex items-center gap-1.5 pr-[112px] text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[var(--brand-hero-label)]">
            <ShieldCheck className="h-4 w-4" strokeWidth={2.4} />
            คะแนน Safety ของฉัน
          </p>

          <div className="mt-1 flex items-end gap-1.5 pr-[112px]">
            <span className="text-[46px] font-black leading-none tracking-tight">
              {currentUserPoints.toLocaleString()}
            </span>
            <span className="mb-1.5 text-[13px] font-extrabold text-white/75">แต้ม</span>
          </div>

          <div className="mt-3 pr-[100px]">
            <div className="flex items-center justify-between gap-2 text-[10.5px] font-bold text-white/80">
              <span>ทำต่ออีก <span className="font-black text-white">{tierToNext}</span> แต้ม เพื่อเลื่อนระดับ</span>
              <span className="font-black text-white/85">{tierInto} / {TIER_SIZE}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-[var(--brand-accent)] transition-[width] duration-700" style={{ width: `${tierProgress}%` }} />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-black">
              <Flame className="h-3.5 w-3.5 text-[#ff9f43]" strokeWidth={2.5} />
              ทำต่อเนื่อง {awarenessStreak} วัน
            </span>
            <Link
              href="/safety-culture/rewards"
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-accent)] px-4 py-2 text-[12px] font-black text-[var(--brand-accent-contrast)] shadow-[0_8px_18px_rgba(var(--brand-accent-rgb),0.3)]"
            >
              <Gift className="h-4 w-4" strokeWidth={2.5} />
              แลกรางวัล
            </Link>
          </div>
        </div>

        <div className="relative hidden gap-4 md:grid md:grid-cols-[minmax(220px,0.9fr)_minmax(260px,1fr)_minmax(260px,330px)] md:items-stretch xl:grid-cols-[minmax(260px,0.85fr)_minmax(380px,1.1fr)_minmax(340px,420px)] xl:gap-6">
          {/* คะแนน + เลื่อนระดับ */}
          <div className="flex flex-col justify-center">
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
            <p className="mt-2 text-[12px] font-bold text-white/80">
              ทำต่ออีก <span className="font-black text-white">{tierToNext.toLocaleString()}</span> แต้ม เพื่อเลื่อนระดับ
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-[var(--brand-accent)] transition-[width] duration-700" style={{ width: `${tierProgress}%` }} />
              </div>
              <span className="text-[11px] font-black text-white/80">{tierInto} / {TIER_SIZE}</span>
            </div>
            <Link
              href="/safety-culture/rewards"
              className="mt-3 inline-flex h-8 w-fit items-center gap-1.5 rounded-xl bg-white/12 px-3 text-[12px] font-black text-white transition-colors hover:bg-white/20"
            >
              <Gift className="h-3.5 w-3.5 text-[var(--brand-hero-label)]" strokeWidth={2.5} />
              แลกได้แล้ว {redeemableCount} รางวัล
            </Link>
          </div>

          <div className="flex flex-col justify-center border-white/10 md:border-l md:pl-4 xl:pl-6">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-[10px] border border-white/20 bg-white/10 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[15px] font-black">
                  <Medal className="h-4 w-4 text-[var(--brand-hero-label)]" strokeWidth={2.4} />
                  {currentUserPoints.toLocaleString()}
                </div>
                <p className="mt-0.5 text-[10px] font-bold text-white/65">คะแนนปัจจุบัน</p>
              </div>
              <div className="rounded-[10px] border border-white/20 bg-white/10 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[15px] font-black">
                  <Flame className="h-4 w-4 text-[#ff9f43]" strokeWidth={2.4} />
                  {awarenessStreak}
                </div>
                <p className="mt-0.5 text-[10px] font-bold text-white/65">ทำต่อเนื่อง KPI (วัน)</p>
              </div>
            </div>
          </div>

          {/* ความคืบหน้าสู่รางวัล + น้องวางใจ */}
          <div className="flex items-end gap-1">
            <div className="flex-1 rounded-[14px] border border-white/15 bg-white/10 p-3 md:rounded-[16px] md:p-4 xl:p-5">
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
            ) : !hasRewards ? (
              <div className="flex items-center gap-2.5">
                <Award className="h-7 w-7 flex-shrink-0 text-[var(--brand-hero-label)]" strokeWidth={2.2} />
                <p className="text-[14px] font-extrabold leading-snug">
                  ยังไม่มีรางวัลในระบบ
                </p>
              </div>
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
            <Image
              src={`${NONG}/thumbsup-cool.png`}
              alt="น้องวางใจ"
              width={150}
              height={170}
              className="pointer-events-none -mb-2 hidden h-[150px] w-[118px] flex-shrink-0 object-contain object-bottom drop-shadow-[0_10px_22px_rgba(0,0,0,0.3)] lg:block xl:h-[172px] xl:w-[138px]"
            />
          </div>
        </div>
      </section>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
      {/* ===== Safety Awareness KPI ===== */}
      <section>
        <div className="mb-2 flex items-center justify-between md:mb-2.5">
          <h2 className="flex items-center gap-1.5 text-[15px] font-black text-[var(--brand-nav)] md:gap-2 md:text-[17px]">
            <ShieldCheck className="h-4 w-4 text-[var(--brand-accent-strong)] md:h-5 md:w-5" strokeWidth={2.5} />
            Safety Awareness KPI
          </h2>
          <span className="text-[10.5px] font-extrabold text-[var(--brand-muted-text)] md:text-[12px]">ย้อนหลัง 14 วัน</span>
        </div>

        <Card className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] p-0 shadow-[0_10px_26px_var(--brand-shadow)]">
          <div className="grid gap-3 border-b border-[var(--border)] p-3.5 md:grid-cols-[1fr_auto] md:items-center md:p-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-nav)] text-[var(--brand-accent)]">
                  <Target className="h-5 w-5" strokeWidth={2.5} />
                </span>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--brand-muted-text)]">Completion rate</p>
                  <p className="text-[22px] font-black leading-none text-[var(--brand-nav)] md:text-[28px]">{hasAwarenessRate ? `${awarenessRate}%` : "–"}</p>
                </div>
                <span className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-black md:ml-2 ${!awarenessRequiredToday ? "bg-[var(--secondary)] text-[var(--brand-muted-text)]" : awarenessDoneToday ? "bg-[#daf5e6] text-[#19734a]" : "bg-[#fff0d8] text-[#a45b00]"}`}>
                  วันนี้: {!awarenessRequiredToday ? "ไม่นับ KPI" : awarenessDoneToday ? "ทำแล้ว" : "รอดำเนินการ"}
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--secondary)]">
                <div className="h-full rounded-full bg-[var(--brand-accent-strong)]" style={{ width: `${awarenessRate}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 xl:gap-3">
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

          <div className="p-3.5 md:p-5 xl:p-6">
            <div className="grid grid-cols-7 gap-1.5 md:gap-2 xl:grid-cols-14 xl:gap-2.5">
              {awarenessDays.map(({ key, date, completion, excludedReason }) => {
                const isToday = key === todayDateKey;
                const status = excludedReason ? "excluded" : completion ? "done" : isToday ? "pending" : "missed";
                return (
                  <div
                    key={key}
                    title={`${formatThaiDate(date, true)}: ${status === "excluded" ? `ไม่นับ KPI (${excludedReason})` : status === "done" ? "ทำแล้ว" : status === "pending" ? "รอดำเนินการ" : "ไม่ได้ทำ"}`}
                    className={`grid min-h-[58px] place-items-center rounded-xl border px-1 py-2 text-center xl:min-h-[72px] ${
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
                    {status === "excluded" ? <span className="text-[8px] font-black">ไม่นับ KPI</span> : status === "done" ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.8} /> : status === "pending" ? <Clock3 className="h-3.5 w-3.5" strokeWidth={2.6} /> : <XCircle className="h-3.5 w-3.5" strokeWidth={2.6} />}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-[14px] border border-[var(--border)] bg-background/70 p-3 xl:p-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[var(--brand-accent-strong)]" strokeWidth={2.5} />
                <p className="text-[12px] font-black text-[var(--brand-nav)]">รายการล่าสุด</p>
              </div>
              {latestAwareness ? (
                <div className="mt-2 grid gap-2 md:grid-cols-[auto_1fr] md:items-start xl:grid-cols-[220px_1fr] xl:gap-3">
                  <div className="rounded-xl bg-[var(--brand-soft)] px-3 py-2 text-[11px] font-black text-[var(--brand-text)] xl:text-center">
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
        </div>

        <aside className="grid gap-3 lg:content-start">
          <Card className="relative overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--brand-surface)] p-3.5 shadow-[0_8px_20px_var(--brand-shadow)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-black text-[var(--brand-nav)]">เลเวลของฉัน</h2>
              <span className="text-[10px] font-black text-[var(--brand-accent-strong)]">Lv.{level} {levelTitle}</span>
            </div>

            <div className="mt-2.5 flex items-center gap-3">
              <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-nav)] text-[var(--brand-accent)] shadow-[0_6px_14px_var(--brand-shadow)]">
                <ShieldCheck className="h-6 w-6" strokeWidth={2.4} />
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-[var(--brand-accent)] px-1.5 text-[9px] font-black text-[var(--brand-accent-contrast)]">{level}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-[var(--secondary)]">
                  <div className="h-full rounded-full bg-[var(--brand-accent-strong)] transition-[width] duration-700" style={{ width: `${levelProgress}%` }} />
                </div>
                <p className="mt-1 text-[10px] font-black text-[var(--brand-nav)]">
                  {xpIntoLevel.toLocaleString()} / {XP_PER_LEVEL.toLocaleString()} XP
                </p>
                <p className="text-[9.5px] font-bold text-[var(--brand-muted-text)]">
                  {level >= LEVEL_TITLES.length ? "ถึงระดับสูงสุดแล้ว!" : `ใกล้เลื่อนระดับ! ทำอีก ${xpToNext.toLocaleString()} XP`}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {[
                { label: "ทำต่อเนื่อง", value: `${awarenessStreak} วัน`, Icon: Trophy },
                { label: "คะแนนรวม", value: `${currentUserPoints.toLocaleString()} แต้ม`, Icon: Medal },
                { label: "แบบทดสอบ", value: hasAwarenessRate ? `${awarenessRate}%` : "–", Icon: ShieldCheck },
                { label: "ร่วมกิจกรรม", value: `${activityCount} ครั้ง`, Icon: UsersRound },
              ].map(({ label, value, Icon }) => (
                <div key={label} className="rounded-xl border border-[var(--border)] bg-background px-1.5 py-2 text-center">
                  <Icon className="mx-auto h-4 w-4 text-[var(--brand-accent-strong)]" strokeWidth={2.4} />
                  <div className="mt-1 truncate text-[10px] font-black text-[var(--brand-nav)]">{value}</div>
                  <div className="text-[8.5px] font-bold text-[var(--brand-muted-text)]">{label}</div>
                </div>
              ))}
            </div>
          </Card>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-[13px] font-black text-[var(--brand-nav)]">
                <Zap className="h-4 w-4 text-[var(--brand-accent-strong)]" strokeWidth={2.4} />
                กิจกรรมที่กำลังจัด
              </h2>
              <Link
                href="/safety-culture"
                className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-[var(--brand-text)]/70 hover:text-[var(--brand-accent-strong)]"
              >
                ดูทั้งหมด
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            </div>

            {showEvent ? (
              <Link href="/safety-culture" className="group block">
                <Card className="rounded-[16px] border border-[var(--border)] bg-[var(--brand-surface)] p-3.5 shadow-[0_8px_20px_var(--brand-shadow)] transition-all group-hover:-translate-y-0.5 group-hover:border-[var(--brand-accent)]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-accent-strong)]">
                      <Zap className="h-5 w-5" strokeWidth={2.4} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[12.5px] font-black text-[var(--brand-nav)]">
                          {activeEvent?.title}
                        </span>
                        <span className="rounded-full bg-[var(--brand-accent)] px-2 py-0.5 text-[8.5px] font-black text-[var(--brand-accent-contrast)]">
                          {eventBonusLabel}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[10.5px] font-bold leading-relaxed text-[var(--brand-text)]/75">
                        {activeEvent?.summary || activeEvent?.details}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[var(--brand-soft)] px-2 py-1 text-[9.5px] font-black text-[var(--brand-text)]">
                          กำลังจัด
                        </span>
                        <span className="text-[9.5px] font-black text-[var(--brand-accent-strong)]">{countdownLabel}</span>
                      </div>
                      <p className="mt-2 text-[9.5px] font-bold text-[var(--brand-muted-text)]">{timeRangeLabel}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ) : (
              <Card className="relative overflow-hidden rounded-[16px] border border-[var(--border)] bg-[linear-gradient(135deg,var(--brand-hero-start),var(--brand-hero-end))] px-4 py-4 text-white shadow-[0_8px_20px_var(--brand-shadow)]">
                <div className="relative z-10 max-w-[62%]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[9.5px] font-black text-[var(--brand-hero-label)]">
                    <Zap className="h-3 w-3" strokeWidth={2.6} />
                    เร็วๆ นี้!
                  </span>
                  <p className="mt-2 text-[14px] font-black leading-snug">มีกิจกรรมสนุกๆ รอคุณอยู่</p>
                  <p className="mt-1 text-[10.5px] font-bold text-white/75">ติดตามกิจกรรม Safety Culture เพื่อรับแต้มและรางวัลพิเศษ</p>
                </div>
                <Image
                  src={`${NONG}/cheer.png`}
                  alt="น้องวางใจ"
                  width={120}
                  height={120}
                  className="pointer-events-none absolute -bottom-2 right-1 h-[110px] w-[110px] object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.3)]"
                />
              </Card>
            )}
          </section>
        </aside>
      </div>

    </div>
  );
}

export default function HomePage() {
  return <SafePlusDashboard />;
}
