"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/providers/app-providers";
import { apiFetch } from "@/lib/api-client";
import {
  Award,
  CalendarDays,
  Check,
  ChevronRight,
  Flame,
  Gift,
  ShieldCheck,
  Target,
  Trophy,
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

export default function SafePlusDashboard() {
  const {
    currentUserPoints,
    awarenessHistory,
    awarenessHolidays,
    awarenessRequiredToday,
    awarenessStartDate,
  } = useAppState();
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
  const trend = useMemo(() => {
    const now = new Date();
    const weeks = Array.from({ length: 8 }, (_, index) => {
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      end.setDate(now.getDate() - ((7 - 1 - index) * 7));
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end, delta: 0 };
    });
    for (const transaction of pointTransactions) {
      const occurredAt = new Date(transaction.occurredAt);
      const week = weeks.find((item) => occurredAt >= item.start && occurredAt <= item.end);
      if (week) week.delta += Number(transaction.amount || 0);
    }
    let running = currentUserPoints - weeks.reduce((sum, item) => sum + item.delta, 0);
    const values = weeks.map((item) => {
      running += item.delta;
      return running;
    });
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const range = Math.max(1, max - min);
    const points = values.map((value, index) => ({
      value,
      x: 20 + index * 80,
      y: 104 - ((value - min) / range) * 70,
    }));
    return {
      points,
      line: points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" "),
    };
  }, [currentUserPoints, pointTransactions]);

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

        <div className={styles.trendCard}>
          <div className={styles.trendHeader}>
            <h2>แนวโน้มคะแนน 8 สัปดาห์</h2>
          </div>
          <div className={styles.chart}>
            <svg viewBox="0 0 620 130" role="img" aria-label="กราฟคะแนน 8 สัปดาห์">
              <defs>
                <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0aa8ff" stopOpacity=".48" />
                  <stop offset="100%" stopColor="#0aa8ff" stopOpacity=".02" />
                </linearGradient>
              </defs>
              <path d="M20 108H600M20 70H600M20 32H600" className={styles.gridLine} />
              <path d={`${trend.line} L580 108 L20 108 Z`} fill="url(#areaFill)" />
              <path d={trend.line} className={styles.chartLine} />
              {trend.points.map((point) => (
                <circle key={point.x} cx={point.x} cy={point.y} r="6" className={styles.chartDot} />
              ))}
            </svg>
            <div className={styles.weekLabels}>
              {Array.from({ length: 8 }, (_, index) => <span key={index}>สัปดาห์ {index + 1}</span>)}
            </div>
          </div>
          <div className={styles.trendStats}>
            <div><Award /><b>{currentUserPoints.toLocaleString()}</b><span>คะแนนปัจจุบัน</span></div>
            <div><Flame /><b>{dashboardData.done}</b><span>ทำ KPI ใน 14 วัน</span></div>
          </div>
        </div>

        <div className={styles.rewardPanel}>
          <div><Award /><span>ยังไม่มีรางวัลในระบบ</span></div>
          <Link href="/safety-culture/rewards"><Gift />แลกรางวัล</Link>
          <Link href="/safety-culture/leaderboard" className={styles.outlineButton}><Trophy />ดูอันดับ</Link>
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
              <p>{dashboardData.latest ? `ทำ Safety Awareness ${dashboardData.latest.total} ข้อ เมื่อ ${formatThaiDate(dashboardData.latest.date)}` : "เมื่อทำ Safety Awareness แล้ว รายการล่าสุดจะแสดงที่นี่"}</p>
              <ChevronRight />
            </div>
          </div>
        </section>

        <aside className={styles.sideColumn}>
          <section className={styles.activityCard}>
            <header><div><Zap /><b>กิจกรรมที่กำลังจัด</b></div><Link href="/safety-culture">ดูทั้งหมด <ChevronRight /></Link></header>
            <div className={styles.activityBanner}>
              <div><strong>เร็วๆ นี้!</strong><span>มีกิจกรรมสนุกๆ รอคุณอยู่</span></div>
              <Image src={ACTIVITY_MASCOT} alt="" width={1254} height={1254} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
