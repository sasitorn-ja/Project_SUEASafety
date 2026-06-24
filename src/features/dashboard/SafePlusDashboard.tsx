"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { useAppState } from "@/providers/app-providers";
import { apiFetch } from "@/lib/api-client";
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
import styles from "./safe-plus-dashboard.module.css";

const HERO_MASCOT = "/images/dashboard/wangjai-dashboard-hero-v2.png";
const MOBILE_HERO_MASCOT = "/images/dashboard/wangjai-mobile-hero-thumbsup.png";
const ACTIVITY_MASCOT = "/images/dashboard/wangjai-level-jump.png";

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

function StatTile({
  value,
  label,
  danger = false,
}: {
  value: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <div className={`${styles.statTile} ${danger ? styles.statTileDanger : ""}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
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
  const [pointTransactions, setPointTransactions] = useState<Array<{ amount: number; occurredAt: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    void apiFetch<{ items: Array<{ amount: number; occurredAt: string }> }>("/api/safety-culture/points/me/transactions?limit=100")
      .then((result) => {
        if (!cancelled && result.ok && Array.isArray(result.data?.items)) {
          setPointTransactions(result.data.items);
        }
      });
    return () => {
      cancelled = true;
    };
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
      const bangkokDate = new Date(`${dateKey}T00:00:00+07:00`);
      const required = ![0, 6].includes(bangkokDate.getDay()) && !holidayDates.has(dateKey) && dateKey >= awarenessStartDate;
      const completion = historyByDate.get(dateKey) || null;
      return {
        dateKey,
        weekday: THAI_WEEKDAYS[bangkokDate.getDay()],
        day: String(bangkokDate.getDate()),
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
    const latest = [...awarenessHistory].sort((left, right) => right.date.localeCompare(left.date))[0] || null;
    let streak = 0;
    for (let index = days.length - 1; index >= 0; index -= 1) {
      const day = days[index];
      if (!day.required) continue;
      if (day.completion) {
        streak += 1;
        continue;
      }
      if (day.dateKey === today) continue;
      break;
    }
    return { days, done, missed, completionRate, latest, streak };
  }, [awarenessHistory, awarenessHolidays, awarenessStartDate]);

  const pointsTarget = Math.max(100, Math.ceil(Math.max(currentUserPoints, 1) / 100) * 100);
  const remainingPoints = Math.max(0, pointsTarget - currentUserPoints);
  const todayKey = bangkokDateKey(new Date());
  const doneToday = awarenessHistory.some((item) => item.date === todayKey);
  const latestScore = dashboardData.latest
    ? `${dashboardData.latest.score}/${dashboardData.latest.total}`
    : "-";
  const latestQuestions = (dashboardData.latest?.questions ?? []).filter((question) => question.text?.trim());

  return (
    <div className={styles.dashboard}>
      <section className={styles.hero} aria-label="คะแนน Safety ของฉัน">
        <div className={styles.heroBackdrop} />

        <div className={styles.scoreBlock}>
          <div className={styles.eyebrow}>
            <ShieldCheck />
            <span>คะแนน SAFETY ของฉัน</span>
          </div>
          <div className={styles.score}>
            <strong>{currentUserPoints.toLocaleString()}</strong>
            <span>แต้ม</span>
          </div>
          <p>สะสมอีก {remainingPoints.toLocaleString()} แต้ม เพื่อให้ครบเป้าหมาย {pointsTarget.toLocaleString()} แต้ม</p>
          <div className={styles.scoreProgress}>
            <span style={{ width: `${Math.max(0, Math.min(100, (currentUserPoints / pointsTarget) * 100))}%` }} />
          </div>
          <div className={styles.progressCaption}>
            <span />
            <b>{currentUserPoints.toLocaleString()} / {pointsTarget.toLocaleString()}</b>
          </div>
          <div className={styles.desktopStreak}>
            <Flame />
            <span>ทำต่อเนื่อง <b>{dashboardData.streak} วัน</b></span>
          </div>
        </div>

        <div className={styles.rewardPanel}>
          <div className={styles.rewardTop}>
            <div className={styles.rewardTrophy}><Trophy /></div>
            <div className={styles.rewardInfo}>
              <span className={styles.rewardBadge}>รางวัลพร้อมแลก</span>
              <strong className={styles.rewardTitle}>
                {rewardsCatalog.length > 0 ? `มี ${rewardsCatalog.length} รางวัลให้แลก` : "ยังไม่มีรางวัลในระบบ"}
              </strong>
              <span className={styles.rewardSub}>
                {rewardsCatalog.length > 0 ? "ใช้คะแนน Safety เพื่อรับสิทธิ์แลกรางวัล" : "เมื่อมีรางวัลในระบบ รายการจะแสดงที่นี่"}
              </span>
            </div>
          </div>
          <div className={styles.rewardActions}>
            <Link href="/safety-culture/rewards"><Gift />แลกรางวัล</Link>
            <Link href="/safety-culture/leaderboard" className={styles.outlineButton}><Trophy />ดูอันดับ</Link>
          </div>
        </div>

        <Image
          src={HERO_MASCOT}
          alt="น้องวางใจถือมือถือและชูนิ้วโป้ง"
          width={1122}
          height={1402}
          priority
          className={`${styles.heroMascot} mascot-motion mascot-motion-hero`}
        />
        <Image
          src={MOBILE_HERO_MASCOT}
          alt="น้องวางใจถือมือถือและชูนิ้วโป้ง"
          width={1024}
          height={1536}
          priority
          className={`${styles.mobileHeroMascot} mascot-motion mascot-motion-hero`}
        />
        <Link href="/safety-culture/rewards" className={styles.mobileRewardButton}>
          <Gift />แลกรางวัล
        </Link>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.awarenessCard}>
          <header className={styles.sectionHeader}>
            <div><ShieldCheck /><h2>Safety Awareness KPI</h2></div>
            <span>ย้อนหลัง 14 วัน</span>
          </header>

          <div className={styles.completion}>
            <div className={styles.targetIcon}><Target /></div>
            <div className={styles.completionMain}>
              <span>COMPLETION RATE</span>
              <strong>{dashboardData.completionRate}%</strong>
            </div>
            <span className={styles.doneToday}>วันนี้: {!awarenessRequiredToday ? "ไม่นับ KPI" : doneToday ? "ทำแล้ว" : "ยังไม่ได้ทำ"}</span>
            <div className={styles.completionBar}><span style={{ width: `${dashboardData.completionRate}%` }} /></div>
            <div className={styles.completionStats}>
              <StatTile value={String(dashboardData.done)} label="ทำแล้ว" />
              <StatTile value={String(dashboardData.missed)} label="ไม่ได้ทำ" danger />
              <StatTile value={latestScore} label="คะแนนล่าสุด" />
            </div>
          </div>

          <div className={styles.dayGrid}>
            {dashboardData.days.map((day) => (
              <div key={day.dateKey} className={`${styles.day} ${day.completion ? styles.dayDone : ""}`}>
                <span>{day.weekday}</span>
                <strong>{day.day}</strong>
                {day.completion ? <Check /> : <small>{day.required ? "ไม่ได้ทำ" : "ไม่นับ KPI"}</small>}
              </div>
            ))}
          </div>

          <div className={styles.latest}>
            <div className={styles.latestTitle}><CalendarDays /><b>รายการล่าสุด</b></div>
            <div className={styles.latestRow}>
              <strong>{dashboardData.latest ? `${formatThaiDate(dashboardData.latest.date)} · ${latestScore} คะแนน` : "ยังไม่มีประวัติการทำ"}</strong>
              {!dashboardData.latest ? <p>เมื่อทำ Safety Awareness แล้ว รายการล่าสุดจะแสดงที่นี่</p> : null}
            </div>
            {dashboardData.latest && latestQuestions.length > 0 ? (
              <div className={styles.latestQuestions}>
                {latestQuestions.slice(0, 3).map((question) => (
                  <div
                    key={question.id}
                    className={`${styles.latestQuestion} ${question.correct ? styles.latestQuestionCorrect : styles.latestQuestionWrong}`}
                  >
                    {question.correct ? <CheckCircle2 /> : <XCircle />}
                    <span>
                      <b>{question.category}</b> {question.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <aside className={styles.sideColumn}>
          <section className={styles.activityCard}>
            <header><div><Zap /><b>กิจกรรมที่กำลังจัด</b></div><Link href="/safety-culture">ดูทั้งหมด <ChevronRight /></Link></header>
            {activeEvents.length > 0 ? (
              <div
                className={styles.activityViewport}
                style={{ "--activity-count": activeEvents.length } as CSSProperties}
              >
                <div className={`${styles.activityTrack} ${activeEvents.length > 1 ? styles.activityTrackAuto : ""}`}>
                  {activeEvents.map((activity) => (
                    <Link
                      key={activity.id}
                      href={`/safety-culture?activityId=${encodeURIComponent(activity.id)}`}
                      className={styles.activitySlide}
                    >
                      {activity.imageSrc ? (
                        <img src={activity.imageSrc} alt={activity.title} className={styles.activityImage} />
                      ) : (
                        <div className={styles.activityFallbackImage}>
                          <Image src={ACTIVITY_MASCOT} alt="" width={1254} height={1254} />
                        </div>
                      )}
                      <div className={styles.activityOverlay}>
                        <strong>{activity.title}</strong>
                        <span>{[activity.dateLabel, activityBonusLabel(activity)].filter(Boolean).join(" · ")}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                {activeEvents.length > 1 ? (
                  <div className={styles.activityDots} aria-hidden="true">
                    {activeEvents.map((activity) => <span key={activity.id} />)}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className={styles.activityBanner}>
                <div><strong>เร็วๆ นี้!</strong><span>มีกิจกรรมสนุกๆ รอคุณอยู่</span></div>
                <Image src={ACTIVITY_MASCOT} alt="" width={1254} height={1254} />
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
