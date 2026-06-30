"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { type SafetyCultureFeedEvent, useAppState } from "@/providers/app-providers";
import { apiFetch } from "@/lib/api-client";
import { isLocalDemoLoginHost } from "@/lib/session-user";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { AppDialogBody, AppDialogContent, AppDialogDescription, AppDialogSectionHeader, AppDialogTitle } from "@/components/ui/app-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Gift,
  ShieldCheck,
  ThumbsUp,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";

const HERO_MASCOT = "/images/mascots/scenes/wangjai-dashboard-hero-v2.png";
const MOBILE_HERO_MASCOT = "/images/mascots/scenes/wangjai-mobile-hero-thumbsup.png";
const ACTIVITY_MASCOT = "/images/mascots/scenes/wangjai-level-jump.png";
const SAFETY_AWARENESS_ICON = "/images/dashboard/safety-awareness-icon.png";
const HERO_BG = "/images/heroes/Home01.png";
const HERO_ANNOUNCEMENT_BG = "/images/heroes/home-launch-announcement.png";
const ACTIVITY_BANNER_BG = "/images/dashboard/cpac-activity-banner-bg.png";
const DEMO_LOGIN_SESSION_KEY = "cpac-safety-login-session";

const THAI_WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

const DEMO_ACTIVITY_EVENTS: SafetyCultureFeedEvent[] = [
  {
    id: "demo-feed-event-1",
    title: "Safety Hero Challenge",
    subtitle: "แชร์เรื่องความปลอดภัยประจำสัปดาห์",
    summary: "โพสต์ภาพหรือเรื่องเล่าความปลอดภัยในทีม เพื่อสะสม Coin พิเศษ",
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

const HOME_HERO_SLIDES = [
  {
    id: "home-hero-news",
    imageSrc: HERO_BG,
    eyebrow: "ข่าวสารระบบ",
    title: "Safety Caring",
    description: "ศูนย์กลางสำหรับการสื่อสาร ติดตาม และยกระดับความปลอดภัยในการทำงานของทีม",
  },
  {
    id: "home-hero-launch",
    imageSrc: HERO_ANNOUNCEMENT_BG,
    eyebrow: "ประกาศเปิดตัว",
    title: "ระบบจะเปิดตัววันที่ 7 กรกฎาคม 2569",
    description: "เตรียมพบกับ Safety Caring เวอร์ชันใหม่สำหรับข่าวสาร กิจกรรม และการมีส่วนร่วมด้านความปลอดภัย",
  },
] as const;

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

function addBangkokDays(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T12:00:00+07:00`);
  date.setUTCDate(date.getUTCDate() + amount);
  return bangkokDateKey(date);
}

function startOfBangkokMonth(dateKey: string) {
  return `${dateKey.slice(0, 7)}-01`;
}

function shiftBangkokMonth(dateKey: string, amount: number) {
  const [year, month] = dateKey.slice(0, 7).split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + amount, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function formatThaiMonthYear(dateKey: string) {
  const date = new Date(`${startOfBangkokMonth(dateKey)}T00:00:00+07:00`);
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    month: "long",
    year: "numeric",
  }).format(date);
}

function activityBonusLabel(event: { points: number; bonusMode: string; multiplier: number; fixedPoints: number }) {
  if (event.bonusMode === "multiplier") return `x${event.multiplier}`;
  if (event.fixedPoints > 0) return `+${event.fixedPoints} Coin`;
  if (event.points > 0) return `+${event.points} Coin`;
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
  const currentYear = new Date().getFullYear();
  const [effortYear, setEffortYear] = useState(currentYear);
  const [effortChartData, setEffortChartData] = useState<Array<{ month: string; linewalk: number; contact: number }>>([]);
  const [effortYearOptions, setEffortYearOptions] = useState<number[]>([currentYear]);
  const [awarenessUserStartDate, setAwarenessUserStartDate] = useState<string | null>(null);
  const [awarenessCalendarMode, setAwarenessCalendarMode] = useState<"done" | "missed" | null>(null);

  const activeEvents = useMemo(
    () => feedEvents.filter((event) => event.published && event.status === "open"),
    [feedEvents],
  );
  const displayedEvents = useMemo(
    () => (activeEvents.length > 0 ? activeEvents : isDemoLogin ? DEMO_ACTIVITY_EVENTS : []),
    [activeEvents, isDemoLogin],
  );
  const heroBannerSlides = HOME_HERO_SLIDES;
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  const [pointTransactions, setPointTransactions] = useState<Array<{ amount: number; occurredAt: string }>>([]);
  const effectiveAwarenessStartDate = awarenessUserStartDate || awarenessStartDate;
  const [awarenessCalendarMonth, setAwarenessCalendarMonth] = useState(startOfBangkokMonth(effectiveAwarenessStartDate));

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
    if (heroBannerSlides.length <= 1) return;
    const intervalId = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % heroBannerSlides.length);
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [heroBannerSlides.length]);

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

  useEffect(() => {
    let cancelled = false;
    void apiFetch<{ user?: { created_at?: string | null; createdAt?: string | null } }>("/api/users/me")
      .then((result) => {
        if (cancelled || !result.ok) return;
        const rawCreatedAt = result.data?.user?.created_at || result.data?.user?.createdAt;
        if (!rawCreatedAt) return;
        const createdDateKey = bangkokDateKey(new Date(String(rawCreatedAt)));
        if (!createdDateKey || Number.isNaN(new Date(String(rawCreatedAt)).getTime())) return;
        setAwarenessUserStartDate(createdDateKey);
      })
      .catch(() => null);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setAwarenessCalendarMonth((current) => {
      const minMonth = startOfBangkokMonth(effectiveAwarenessStartDate);
      const maxMonth = startOfBangkokMonth(bangkokDateKey(new Date()));
      if (current < minMonth) return minMonth;
      if (current > maxMonth) return maxMonth;
      return current;
    });
  }, [effectiveAwarenessStartDate]);

  useEffect(() => {
    if (isDemoLogin) {
      setEffortYearOptions(Array.from({ length: 3 }, (_, i) => currentYear - i));
      return;
    }

    let cancelled = false;
    void apiFetch<{
      items?: Array<{ submissionDate?: string; submission_date?: string; date?: string; timestamp?: string }>;
      legacy?: { monthlyCounts?: Array<{ month?: string | null }> };
    }>("/api/safety-effort/submissions/me?pageSize=500")
      .then((result) => {
        if (cancelled || !result.ok) return;

        const years = new Set<number>();
        const items = Array.isArray(result.data?.items) ? result.data.items : [];
        const legacyMonthly = Array.isArray(result.data?.legacy?.monthlyCounts) ? result.data.legacy.monthlyCounts : [];

        for (const item of items) {
          const rawDate = String(item.submissionDate || item.submission_date || item.date || item.timestamp || "");
          const year = Number(rawDate.slice(0, 4));
          if (Number.isInteger(year) && year > 2000) years.add(year);
        }

        for (const item of legacyMonthly) {
          const year = Number(String(item.month || "").slice(0, 4));
          if (Number.isInteger(year) && year > 2000) years.add(year);
        }

        const nextOptions = Array.from(years).sort((left, right) => right - left);
        setEffortYearOptions(nextOptions.length > 0 ? nextOptions : [currentYear]);
      })
      .catch(() => {
        if (!cancelled) setEffortYearOptions([currentYear]);
      });

    return () => {
      cancelled = true;
    };
  }, [currentYear, isDemoLogin]);

  useEffect(() => {
    if (effortYearOptions.includes(effortYear)) return;
    setEffortYear(effortYearOptions[0] ?? currentYear);
  }, [currentYear, effortYear, effortYearOptions]);

  useEffect(() => {
    const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

    const buildMonthMap = () => {
      const map = new Map<string, { linewalk: number; contact: number }>();
      for (let m = 0; m < 12; m++) {
        const key = `${effortYear}-${String(m + 1).padStart(2, "0")}`;
        map.set(key, { linewalk: 0, contact: 0 });
      }
      return map;
    };

    const toChartData = (monthMap: Map<string, { linewalk: number; contact: number }>) =>
      Array.from(monthMap.entries()).map(([key, val]) => ({
        month: THAI_MONTHS[parseInt(key.slice(5, 7), 10) - 1],
        ...val,
      }));

    if (isDemoLogin) {
      const DEMO_POOL: Array<[number, number]> = [[3, 2], [4, 3], [2, 4], [5, 2], [3, 3], [2, 1], [4, 2], [3, 4], [5, 1], [2, 3], [4, 4], [3, 2]];
      const monthMap = buildMonthMap();
      let idx = 0;
      for (const entry of monthMap.values()) {
        const [lw, sc] = DEMO_POOL[idx++ % DEMO_POOL.length];
        entry.linewalk = lw;
        entry.contact = sc;
      }
      setEffortChartData(toChartData(monthMap));
      return;
    }

    let cancelled = false;
    const fromStr = `${effortYear}-01-01`;
    const toStr = `${effortYear}-12-31`;
    fetch(`/api/safety-effort/submissions/me?from=${fromStr}&to=${toStr}&pageSize=500`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (cancelled) return;
        const items: Array<{ activityType?: string; activity_type?: string; date?: string; timestamp?: string }> =
          Array.isArray(payload?.data?.items) ? payload.data.items : [];
        const legacyMonthly: Array<{ month?: string; linewalk?: number; contact?: number }> =
          Array.isArray(payload?.data?.legacy?.monthlyCounts) ? payload.data.legacy.monthlyCounts : [];
        const monthMap = buildMonthMap();
        for (const item of items) {
          const monthKey = String(item.date || item.timestamp || "").slice(0, 7);
          if (!monthMap.has(monthKey)) continue;
          const type = String(item.activityType || item.activity_type || "").toUpperCase();
          const entry = monthMap.get(monthKey)!;
          if (type === "LINE_WALK") entry.linewalk += 1;
          else if (type === "SAFETY_CONTACT") entry.contact += 1;
        }
        for (const item of legacyMonthly) {
          const monthKey = String(item.month || "").slice(0, 7);
          if (!monthMap.has(monthKey)) continue;
          const entry = monthMap.get(monthKey)!;
          entry.linewalk += Number(item.linewalk || 0);
          entry.contact += Number(item.contact || 0);
        }
        setEffortChartData(toChartData(monthMap));
      })
      .catch(() => { /* keep empty state */ });
    return () => { cancelled = true; };
  }, [isDemoLogin, effortYear]);

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
      const required = ![0, 6].includes(bkDate.getDay()) && !holidayDates.has(dateKey) && dateKey >= effectiveAwarenessStartDate;
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
    while (streakDate >= effectiveAwarenessStartDate) {
      const date = new Date(`${streakDate}T00:00:00+07:00`);
      const required = ![0, 6].includes(date.getDay()) && !holidayDates.has(streakDate);
      if (required) {
        if (!historyByDate.has(streakDate)) break;
        streak += 1;
      }
      streakDate = previousBangkokDateKey(streakDate);
    }
    return { days, done, missed, completionRate, latest, streak };
  }, [awarenessHistory, awarenessHolidays, effectiveAwarenessStartDate]);

  const todayKey = bangkokDateKey(new Date());
  const doneToday = awarenessHistory.some((item) => item.date === todayKey);
  const todayCalendarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    todayCalendarRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior, inline: "center", block: "nearest" });
  }, []);

  const latestQuestions = (dashboardData.latest?.questions ?? []).filter((q) => q.text?.trim());
  const latestHasWrongAnswer = latestQuestions.some((q) => !q.correct);
  const latestCorrectCount = latestQuestions.filter((q) => q.correct).length;
  const awarenessCalendarTodayKey = bangkokDateKey(new Date());
  const awarenessCalendarMinMonth = startOfBangkokMonth(effectiveAwarenessStartDate);
  const awarenessCalendarMaxMonth = startOfBangkokMonth(awarenessCalendarTodayKey);

  const awarenessCalendarDays = useMemo(() => {
    const holidayDates = new Set(awarenessHolidays.map((item) => item.date));
    const historyByDate = new Map(awarenessHistory.map((item) => [item.date, item]));
    const monthStart = startOfBangkokMonth(awarenessCalendarMonth);
    const monthStartDate = new Date(`${monthStart}T00:00:00+07:00`);
    const monthStartWeekday = monthStartDate.getDay();
    const firstGridDateKey = addBangkokDays(monthStart, -monthStartWeekday);

    return Array.from({ length: 42 }, (_, index) => {
      const dateKey = addBangkokDays(firstGridDateKey, index);
      const date = new Date(`${dateKey}T00:00:00+07:00`);
      const required = ![0, 6].includes(date.getDay()) && !holidayDates.has(dateKey) && dateKey >= effectiveAwarenessStartDate && dateKey <= awarenessCalendarTodayKey;
      const completion = historyByDate.get(dateKey) || null;
      const isCurrentMonth = dateKey.slice(0, 7) === awarenessCalendarMonth.slice(0, 7);
      const isFuture = dateKey > awarenessCalendarTodayKey;
      const isDone = Boolean(completion);
      const isMissed = required && !completion;
      return {
        dateKey,
        day: date.getDate(),
        isCurrentMonth,
        isFuture,
        required,
        isDone,
        isMissed,
        isToday: dateKey === awarenessCalendarTodayKey,
      };
    });
  }, [awarenessCalendarMaxMonth, awarenessCalendarMonth, awarenessCalendarTodayKey, awarenessHistory, awarenessHolidays, effectiveAwarenessStartDate]);

  const openAwarenessCalendar = (mode: "done" | "missed") => {
    setAwarenessCalendarMode(mode);
    setAwarenessCalendarMonth(awarenessCalendarMaxMonth);
  };

  const weeklyPoints = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return pointTransactions
      .filter((tx) => new Date(tx.occurredAt).getTime() >= cutoff)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [pointTransactions]);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 font-sarabun sm:pb-8 lg:pb-5">

      {/* ===== HERO ===== */}
      <section
        aria-label="Coin Safety ของฉัน"
        className="relative mx-2.5 mt-2 min-h-[212px] overflow-hidden rounded-[18px] border border-[rgba(215,234,254,.72)] text-[#0B2F6B] lg:mx-6 lg:mt-3 lg:min-h-[280px] xl:min-h-[300px] 2xl:min-h-[330px]"
        style={{
          background: `linear-gradient(rgba(226,241,255,.26),rgba(226,241,255,.26)), url("${HERO_BG}") center 64%/cover no-repeat`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
          <div
            className="flex h-full transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${activeHeroIndex * 100}%)` }}
          >
            {heroBannerSlides.map((slide) => (
              <div key={slide.id} className="relative h-full flex-[0_0_100%] overflow-hidden">
                <img
                  src={slide.imageSrc}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(226,241,255,.36)_0%,rgba(226,241,255,.18)_30%,rgba(226,241,255,.06)_58%,rgba(226,241,255,.2)_100%)]" />
                <div className="absolute top-5 hidden max-w-[280px] rounded-[18px] border border-white/80 bg-white/60 px-5 py-4 text-left shadow-[0_14px_30px_rgba(11,130,240,.18)] backdrop-blur-[8px] lg:block xl:max-w-[320px]" style={{ right: "clamp(250px, 24vw, 360px)" }}>
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0B82F0]">{slide.eyebrow}</div>
                  <div className="mt-1 text-[24px] font-black leading-tight text-[#0B2F6B]">{slide.title}</div>
                  <div className="mt-1.5 text-[12.5px] font-bold leading-relaxed text-[#55739B]">{slide.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[rgba(255,255,255,0.06)]" />
        {heroBannerSlides.length > 1 ? (
          <div className="pointer-events-none absolute right-4 bottom-3 z-[12] hidden gap-1.5 lg:flex" aria-hidden="true">
            {heroBannerSlides.map((slide, index) => (
              <span
                key={slide.id}
                className={cn(
                  "rounded-full ring-1 ring-[#0B82F0]/20 transition-all duration-300",
                  index === activeHeroIndex ? "h-1.5 w-5 bg-[#0B82F0]" : "h-1.5 w-1.5 bg-white/90",
                )}
              />
            ))}
          </div>
        ) : null}

        {/* desktop info rail + mascot group */}
        <div className="absolute inset-y-0 left-0 right-0 z-10 hidden items-center justify-between px-6 lg:flex xl:px-7">
          <div className="flex w-[min(320px,24vw)] flex-col gap-3">
            <div className="rounded-[18px] border border-white/75 bg-white/58 px-4 py-3.5 shadow-[0_12px_28px_rgba(11,130,240,.16)] backdrop-blur-[4px]">
              <div className="flex items-center gap-2 text-[11px] font-black text-[#083B84] [text-shadow:0_1px_0_rgba(255,255,255,.78)]">
                <ShieldCheck className="h-[20px] w-[20px] text-[#0077F0]" strokeWidth={2.7} />
                <span>Coin SAFETY ของฉัน</span>
              </div>
              <div className="mt-1 flex items-end gap-2">
                <strong className="text-[54px] font-black leading-none text-[#006CE0] [text-shadow:0_8px_16px_rgba(11,130,240,.22)]">
                  {currentUserPoints.toLocaleString()}
                </strong>
                <span className="mb-1.5 text-[13px] font-black text-[#083B84] [text-shadow:0_1px_0_rgba(255,255,255,.78)]">Coin</span>
              </div>
              {weeklyPoints > 0 && (
                <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-[#e6f9ef] px-2.5 py-1 text-[10.5px] font-black text-[#1a8c52] shadow-[inset_0_0_0_1px_rgba(26,140,82,.18)]">
                  <Zap className="h-3 w-3" />+{weeklyPoints} Coin จากสัปดาห์ที่แล้ว
                </span>
              )}
            </div>

            <div
              className="flex flex-col gap-2.5 rounded-[16px] border border-[#D7EAFE] bg-white/92 p-3.5 backdrop-blur-sm"
              style={{ boxShadow: "0 14px 30px rgba(185,223,255,.5), inset 0 1px rgba(255,255,255,.85)" }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border border-[#D7EAFE] bg-[#F5FAFF] shadow-[inset_0_1px_rgba(255,255,255,.9)]">
                  <Trophy className="h-6 w-6 text-[#0B82F0]" strokeWidth={2.15} />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <strong className="text-[15px] font-black leading-tight text-[#0B2F6B]">
                    {rewardsCatalog.length > 0 ? "Coin ของคุณสามารถนำมาแลกของรางวัลได้" : "ยังไม่มีรางวัลในระบบ"}
                  </strong>
                  <span className="text-[10.5px] font-bold leading-snug text-[#55739B]">
                    {rewardsCatalog.length > 0 ? "ใช้ Coin Safety เพื่อรับสิทธิ์แลกรางวัล" : "เมื่อมีรางวัลในระบบ รายการจะแสดงที่นี่"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/safety-culture/rewards" className="flex min-h-8.5 items-center justify-center gap-1.5 rounded-xl border border-[#0B82F0] bg-linear-to-r from-[#35A8FF] via-[#0B82F0] to-[#006AD6] text-[11px] font-black text-white shadow-[0_8px_20px_rgba(11,130,240,.22),inset_0_1px_rgba(255,255,255,.35)]">
                  <Gift size={14} /><span>ดูของรางวัลที่นี่</span>
                </Link>
                <Link href="/safety-culture/leaderboard" className="flex min-h-8.5 items-center justify-center gap-1.5 rounded-xl border border-[#D7EAFE] bg-white text-[11px] font-black text-[#0B82F0]">
                  <Trophy size={14} /><span>ดูอันดับ Leaderboard</span>
                </Link>
              </div>
            </div>
          </div>

          <Image
            src={HERO_MASCOT}
            alt="น้องวางใจ"
            width={1122}
            height={1402}
            priority
            quality={100}
            sizes="(min-width: 1600px) 380px, (min-width: 1024px) 27vw, 0px"
            className="home-hero-mascot pointer-events-none h-auto max-h-[95%] w-[clamp(240px,27vw,380px)] shrink-0 translate-y-[7%] self-end object-contain object-bottom filter-[drop-shadow(0_12px_14px_rgba(4,37,86,.18))]"
          />

        </div>

        {/* mobile layout — activity images เป็น hero background slideshow */}
        <div className="relative block min-h-[320px] overflow-hidden sm:min-h-[340px] md:min-h-[360px] lg:hidden">
          <div className="absolute inset-0">
            <div
              className="flex h-full transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${activeHeroIndex * 100}%)` }}
            >
              {heroBannerSlides.map((slide) => (
                <div key={slide.id} className="relative h-full flex-[0_0_100%] overflow-hidden">
                  <img src={slide.imageSrc} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,18,55,.55)_0%,rgba(8,28,75,.20)_45%,rgba(5,30,90,.72)_100%)]" />
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-4 left-[5%] z-[5] w-[58%] max-w-[250px] rounded-[20px] border border-white/20 bg-[linear-gradient(180deg,rgba(6,43,99,.52),rgba(11,130,240,.18))] px-4 py-3 text-white shadow-[0_12px_24px_rgba(0,24,68,.25)] backdrop-blur-[10px]">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/72">
              {heroBannerSlides[activeHeroIndex]?.eyebrow}
            </div>
            <div className="mt-1 text-[17px] font-black leading-tight [text-shadow:0_2px_10px_rgba(0,0,0,.38)] sm:text-[18px]">
              {heroBannerSlides[activeHeroIndex]?.title}
            </div>
            <div className="mt-1 text-[10.5px] font-bold leading-relaxed text-white/82 sm:text-[11px]">
              {heroBannerSlides[activeHeroIndex]?.description}
            </div>
          </div>

          {/* score card + reward button — grouped overlay */}
          <div className="absolute top-4 left-[5%] z-[4] flex w-[56%] max-w-[230px] flex-col gap-2">
            <div className="rounded-[18px] border border-white/70 bg-white/62 px-3.5 py-3 shadow-[0_12px_28px_rgba(0,92,180,.16)] backdrop-blur-[5px]">
              <div className="flex items-center gap-1.5 text-[11.5px] font-black leading-tight text-[#0B2F6B]">
                <ShieldCheck className="h-[18px] w-[18px] flex-shrink-0 text-[#0B82F0]" strokeWidth={2.4} />
                <span>Coin SAFETY ของฉัน</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <strong className="min-w-0 text-[42px] font-black leading-none text-[#087dff] [text-shadow:0_8px_18px_rgba(0,150,245,.18)]">
                  {currentUserPoints.toLocaleString()}
                </strong>
                <span className="rounded-full bg-[#e4f3ff] px-2.5 py-1 text-[12px] font-black leading-none text-[#0B2F6B] shadow-[inset_0_0_0_1px_rgba(11,130,240,.12)]">Coin</span>
              </div>
            </div>
            <Link
              href="/safety-culture/rewards"
              className="flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-full border border-[#40c7ff] bg-gradient-to-b from-[#119cff] to-[#006bdf] text-[12px] font-black text-white shadow-[0_0_22px_rgba(0,166,255,.34)]"
            >
              <Gift size={14} />แลกรางวัล
            </Link>
          </div>

          <Image
            src={MOBILE_HERO_MASCOT}
            alt="น้องวางใจ"
            width={1024}
            height={1536}
            priority
            quality={100}
            sizes="(max-width: 480px) 48vw, (max-width: 1023px) 32vw, 0px"
            className="pointer-events-none absolute right-[-2%] bottom-0 z-[3] h-[clamp(230px,42vw,340px)] w-auto max-w-[48%] translate-y-[6%] object-contain object-bottom [filter:drop-shadow(0_10px_12px_rgba(0,20,55,.28))]"
          />

          {/* dots — fixed overlay */}
          {heroBannerSlides.length > 1 && (
            <div className="absolute top-4 right-[5%] z-[6] flex gap-1.5" aria-hidden="true">
              {heroBannerSlides.map((slide, index) => (
                <span
                  key={slide.id}
                  className={cn(
                    "rounded-full bg-white/85 shadow-[0_1px_4px_rgba(0,0,0,.4)] transition-all duration-300",
                    index === activeHeroIndex ? "h-1.5 w-5" : "h-1.5 w-1.5",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== CONTENT GRID ===== */}
      <div className="mx-2.5 mt-2 grid gap-2 lg:mx-6 lg:mt-2.5 lg:grid-cols-[minmax(0,2.2fr)_minmax(300px,0.92fr)]">

        {/* ── Safety Awareness card ── */}
        <Card className="self-start gap-1.5 rounded-[18px] border border-[rgba(13,80,165,0.18)] bg-white p-2.5 shadow-[0_4px_18px_rgba(11,53,110,0.10),0_1px_4px_rgba(11,53,110,0.06)] sm:p-2 lg:p-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#087dff]" strokeWidth={2.4} />
              <h2 className="app-card-title m-0 text-[#0b3572]">Safety Awareness</h2>
              <span className="inline-flex h-8 w-[132px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#e1edf8] bg-white text-[11px] font-black text-[#ff642e] shadow-[0_3px_12px_rgba(145,174,205,0.16)] sm:h-8 sm:w-[144px] sm:text-[11px]">
                <svg
                  className="safety-streak-flame h-5 w-5"
                  viewBox="0 0 64 64"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="streak-flame-outer" x1="17" x2="49" y1="58" y2="7" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#d51f45" />
                      <stop offset="0.52" stopColor="#ff5b22" />
                      <stop offset="1" stopColor="#ff2f1c" />
                    </linearGradient>
                    <linearGradient id="streak-flame-inner" x1="28" x2="46" y1="50" y2="18" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ff9d18" />
                      <stop offset="1" stopColor="#ffe45d" />
                    </linearGradient>
                  </defs>
                  <path fill="#bd184b" d="M20.6 53.7c-3.7.1-7.3-1.8-9.2-5.1 3 .1 5.8-1 7.7-3.4 1.5-1.9 1.9-4.4 1.5-6.8 3.9 2.7 5.9 7.8 4.4 12.1-.8 2.1-2.1 3.1-4.4 3.2Z" />
                  <path
                    fill="url(#streak-flame-outer)"
                    d="M34.6 61.6c-13.9 0-24.8-8.7-24.8-22.3 0-5.8 2.5-10.5 6-14.8-.2 5.2 2.6 9.8 7 10.5 5.9.9 10-4.9 9.6-10.5-.5-7.3 2.5-15 11.1-21.6-.4 8 4.8 11.3 10 17.7 5.2 6.5 7.6 14.7 5.3 23.4 2-1.1 3.8-2.9 5.2-5.5 1.5 12.8-8.3 23.1-29.4 23.1Z"
                  />
                  <path
                    fill="url(#streak-flame-inner)"
                    d="M36.4 54.5c-7.7 0-13.5-5.4-13.5-12.8 0-8.4 7.1-14.5 12.8-20 1.4 7 8.8 10.7 9.6 20 .6 7.4-2.9 12.8-8.9 12.8Z"
                  />
                  <path fill="#ef2830" d="M51.7 49.6c2.4-2.8 5.3-3.8 7.6-2.3 2.1 1.5 1.8 5.6-1.1 8.7-2.6 2.8-6.5 3.8-8.5 2.1-1.9-1.6-.6-5.5 2-8.5Z" />
                  <path fill="#ef2830" d="M16.1 43.2c-3.1-.5-5.2-2.7-5-5.4.2-2.3 2.3-5.7 5.3-8.9-.5 4 1.2 7 4.2 8.9 2.3 1.5-.1 6.2-4.5 5.4Z" />
                  <ellipse cx="30.3" cy="40.3" fill="#251f48" rx="3.7" ry="5" transform="rotate(-8 30.3 40.3)" />
                  <ellipse cx="45.1" cy="39.6" fill="#251f48" rx="3.6" ry="4.8" transform="rotate(-22 45.1 39.6)" />
                  <circle cx="29" cy="38.4" r="1.2" fill="#fff" />
                  <circle cx="43.7" cy="37.7" r="1.1" fill="#fff" />
                  <path fill="#251f48" d="M36.2 47.2c2.9 2.2 6.8 1.3 8.4-1.8.5-.9 2-.2 1.7.8-1.1 4.1-6.4 6.2-10.8 2.7-.9-.7-.2-2.4.7-1.7Z" />
                  <circle cx="25.6" cy="46.2" r="1.7" fill="#ff7350" opacity=".78" />
                  <circle cx="48.6" cy="45.7" r="1.5" fill="#ff7350" opacity=".78" />
                  <path fill="#fff7b0" d="M49.2 27.8c1.3 1.9 2.4 4.2 3 6.5.2.7-.7 1.1-1 .4-1-2-2.2-3.9-3.8-5.4-.5-.5 1.4-2 1.8-1.5Z" opacity=".8" />
                </svg>
                ทำต่อเนื่อง {dashboardData.streak} วัน
              </span>
            </div>
            <span className="text-[9px] font-extrabold text-[#6c7f99] sm:text-[10px]">ย้อนหลัง 5 วัน · วันนี้ · ล่วงหน้า 5 วัน</span>
          </div>

          {/* completion row */}
          <div className="grid gap-1.5 rounded-[16px] border-[1.5px] border-[#b9d8fb] bg-gradient-to-br from-[#f8fbff] via-[#eef6ff] to-[#f5fbff] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.78)] sm:gap-1.5 sm:p-2 lg:grid-cols-[minmax(0,1.3fr)_auto] lg:items-center">
            <div className="grid grid-cols-[46px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[48px_minmax(0,1fr)] sm:gap-2">
              <div
                className="grid h-[46px] w-[46px] place-items-center overflow-hidden rounded-[14px] border border-[#d4e6fb] bg-white shadow-[0_8px_14px_rgba(0,71,140,.16)] sm:h-[46px] sm:w-[46px]"
              >
                <Image
                  src={SAFETY_AWARENESS_ICON}
                  alt="Safety Awareness"
                  width={256}
                  height={256}
                  quality={100}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                  <span className="block text-[9.5px] font-black leading-tight text-[#536e94] sm:text-[10px]">เปอร์เซ็นต์การเข้าร่วม Safety Awareness</span>
                  <span className="rounded-full bg-[#dff8e9] px-2.5 py-0.5 text-[9px] font-black leading-none text-[#118646] sm:px-2.5 sm:text-[9px]">
                    วันนี้: {!awarenessRequiredToday ? "ไม่นับ" : doneToday ? "ทำแล้ว" : "ยังไม่ได้ทำ"}
                  </span>
                </div>
                <div className="mt-0.5 flex items-end gap-2">
                  <strong className="text-[25px] font-black leading-none text-[#0b3572] sm:text-[22px]">{dashboardData.completionRate}%</strong>
                  <span className="pb-0.5 text-[9px] font-bold leading-tight text-[#5d7599] sm:text-[9.5px]">จากวันที่ต้องทำ</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#d8eafc]">
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
                <button
                  key={label}
                  type="button"
                  onClick={() => openAwarenessCalendar(danger ? "missed" : "done")}
                  className={cn(
                    "flex min-h-[48px] flex-col items-center justify-center rounded-[14px] border px-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.65)] transition-transform hover:-translate-y-[1px] sm:min-h-[50px] sm:rounded-[15px] sm:px-3",
                    danger
                      ? "border-[#ffc7c2] bg-[#fff3f1] text-[#da3127]"
                      : "border-[#c5dcf8] bg-[#f3f8ff] text-[#0b3572]",
                  )}
                >
                  <strong className="text-[17px] font-black leading-none sm:text-[18px]">{value}</strong>
                  <span className={cn("mt-0.5 text-[8.5px] font-extrabold sm:text-[9px]", danger ? "text-[#da3127]/85" : "text-[#4a6fa5]")}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[16px] border border-[#dbe9fa] bg-[#f9fbff] p-1.5">
            {/* mobile/tablet: horizontal scroll — desktop: full 11-column grid */}
            <div className="scrollbar-hide overflow-x-auto lg:overflow-visible">
              <div className="flex gap-1.5 lg:grid lg:grid-cols-11 lg:gap-2">
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
                      ref={isToday ? todayCalendarRef : undefined}
                      className={cn(
                        "relative flex w-[48px] flex-shrink-0 flex-col items-center justify-center rounded-[13px] border-[1.5px] py-1.5 text-center transition-colors lg:w-auto lg:min-h-[58px] lg:rounded-[15px] lg:px-2 lg:py-1",
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
                      <span className="text-[8.5px] font-extrabold opacity-70">{day.weekday}</span>
                      <strong className="mt-0.5 text-[14px] font-black leading-none lg:mt-0 lg:text-[16px]">{day.day}</strong>
                      {day.completion ? (
                        <Check className="mt-1 h-3 w-3 rounded-full border-2 border-current p-[2px] lg:mt-0.5 lg:h-3.5 lg:w-3.5" />
                      ) : (
                        <span className="mt-1 text-[7.5px] font-black leading-none lg:mt-0.5 lg:text-[8.5px]">{dayStatus}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* latest record */}
          <div className="rounded-[12px] border-[1.5px] border-[#c5d9f5] bg-[#f7fbff] p-2">
            {/* header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-[#087dff]" strokeWidth={2.4} />
                <b className="app-card-title text-[#0b3572]">รายการล่าสุด</b>
              </div>
              {dashboardData.latest && latestQuestions.length > 0 && (
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-black",
                      latestCorrectCount === latestQuestions.length
                        ? "bg-[#d1fae5] text-[#065f46]"
                        : "bg-[#fee2e2] text-[#991b1b]",
                    )}
                  >
                    ถูก {latestCorrectCount}/{latestQuestions.length}
                  </span>
                </div>
              )}
            </div>

            {/* date + subtitle */}
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="rounded-lg bg-[#eef5ff] px-2 py-0.5 text-[9.5px] font-black text-[#0b3572]">
                {dashboardData.latest ? formatThaiDate(dashboardData.latest.date) : "ยังไม่มีประวัติการทำ"}
              </span>
              {!dashboardData.latest && (
                <span className="text-[9px] font-medium text-[#687b96]">เมื่อทำ Safety Awareness แล้ว รายการล่าสุดจะแสดงที่นี่</span>
              )}
            </div>

            {/* question list */}
            {dashboardData.latest && latestQuestions.length > 0 && (
              <div className="mt-1.5 grid max-h-[90px] gap-1 overflow-y-auto pr-0.5">
                {latestQuestions.map((q) => (
                  <div
                    key={q.id}
                    className={cn(
                      "flex items-start gap-2 overflow-hidden rounded-[8px] border-l-[3px]",
                      q.correct
                        ? "border-l-[#22c55e] bg-white"
                        : "border-l-[#ef4444] bg-[#fff5f5]",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-2 py-1">
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            "shrink-0 rounded px-1 py-0 text-[8px] font-black leading-tight",
                            q.correct ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#fee2e2] text-[#b91c1c]",
                          )}
                        >
                          {q.category}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-[8px] font-bold",
                            q.correct ? "text-[#16a34a]" : "text-[#dc2626]",
                          )}
                        >
                          {q.correct ? "ตอบถูก" : "ตอบผิด"}
                        </span>
                      </div>
                      <span className="line-clamp-2 text-[8.5px] font-medium leading-[1.4] text-[#374151]">{q.text}</span>
                    </div>
                    <div className={cn("flex h-full items-center px-1.5", q.correct ? "text-[#22c55e]" : "text-[#ef4444]")}>
                      {q.correct ? (
                        <CheckCircle2 className="h-[14px] w-[14px] flex-shrink-0" strokeWidth={2.5} />
                      ) : (
                        <XCircle className="h-[14px] w-[14px] flex-shrink-0" strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* ── Activity card ── */}
        <div className="hidden flex-col self-start lg:flex">
          <Card className="flex flex-col rounded-[18px] border border-[rgba(13,80,165,0.18)] bg-white p-2.5 shadow-[0_4px_18px_rgba(11,53,110,0.10),0_1px_4px_rgba(11,53,110,0.06)] lg:p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-[15px] w-[15px] text-[#087bff]" strokeWidth={2.4} />
                <b className="app-card-title text-[#0b3572]">กิจกรรม Safety Culture ล่าสุด</b>
              </div>
              <Link href="/safety-culture" className="flex items-center gap-0.5 text-[10.5px] font-extrabold text-[#0b3572]/70 hover:text-[#087dff]">
                ดูทั้งหมด <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
              </Link>
            </div>

            {displayedEvents.length > 0 ? (
              <div
                className="activity-viewport relative overflow-hidden rounded-xl bg-[#d7efff] shadow-[inset_0_0_0_1px_rgba(7,125,255,.1)]"
                style={{ height: 300, "--activity-count": displayedEvents.length } as CSSProperties}
              >
                <div className={cn("activity-track flex h-full", displayedEvents.length > 1 && "activity-track-auto")}>
                  {displayedEvents.map((activity) => (
                    <Link
                      key={activity.id}
                      href={`/safety-culture?activityId=${encodeURIComponent(activity.id)}`}
                      className="relative block h-full flex-[0_0_100%] overflow-hidden text-white"
                    >
                      {activity.imageSrc ? (
                        <img
                          src={activity.imageSrc}
                          alt={activity.title}
                          className="block h-full w-full object-cover object-center transition-transform duration-300 hover:scale-[1.03]"
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

      {/* ── Safety Effort Chart ── */}
      <Card className="rounded-[18px] border border-[rgba(13,80,165,0.18)] bg-white p-3 shadow-[0_4px_18px_rgba(11,53,110,0.10),0_1px_4px_rgba(11,53,110,0.06)] lg:p-4">
        {/* header */}
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-[#087bff]" strokeWidth={2.4} />
            <b className="app-card-title text-[#0b3572]">ประวัติ Linewalk &amp; Safety Contact</b>
          </div>
          {/* year selector */}
          <Select value={String(effortYear)} onValueChange={(v) => setEffortYear(Number(v))}>
            <SelectTrigger className="h-7 w-22.5 rounded-[8px] border-[#d7eafe] text-[10px] font-black text-[#0b3572]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {effortYearOptions.map((y) => (
                <SelectItem key={y} value={String(y)} className="text-[11px] font-bold">
                  {y + 543}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* legend */}
        <div className="mb-2 flex items-center gap-3">
          <span className="flex items-center gap-1 text-[9.5px] font-bold text-[#687b96]">
            <span className="inline-block h-2 w-2 rounded-sm bg-[#087dff]" />Linewalk
          </span>
          <span className="flex items-center gap-1 text-[9.5px] font-bold text-[#687b96]">
            <span className="inline-block h-2 w-2 rounded-sm bg-[#0bb4a0]" />Safety Contact
          </span>
        </div>

        {effortChartData.length > 0 ? (
          <div className="-mx-1 overflow-x-auto overflow-y-visible px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="h-[210px] min-w-[640px] sm:h-[190px] sm:min-w-0 lg:h-[184px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={effortChartData} barCategoryGap="24%" barGap={3} margin={{ top: 28, right: 8, left: 0, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(13,80,165,0.08)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#687b96", fontWeight: 800 }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />
                  <YAxis
                    allowDecimals={false}
                    domain={[0, (dataMax: number) => Math.max(8, dataMax + 1)]}
                    tick={{ fontSize: 11, fill: "#687b96", fontWeight: 800 }}
                    tickLine={false}
                    axisLine={false}
                    width={24}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(13,80,165,0.05)" }}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid rgba(13,80,165,0.14)",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#0b3572",
                      boxShadow: "0 4px 12px rgba(11,53,110,0.12)",
                    }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === "linewalk" ? "Linewalk" : "Safety Contact",
                    ]}
                  />
                  <Bar dataKey="linewalk" fill="#087dff" stackId="a" maxBarSize={34}>
                    <LabelList
                      dataKey="linewalk"
                      position="center"
                      formatter={(v: number) => (v > 0 ? v : "")}
                      style={{ fill: "#fff", fontSize: 10, fontWeight: 900 }}
                    />
                  </Bar>
                  <Bar dataKey="contact" fill="#0bb4a0" stackId="a" radius={[5, 5, 0, 0]} maxBarSize={34}>
                    <LabelList
                      dataKey="contact"
                      position="center"
                      formatter={(v: number) => (v > 0 ? v : "")}
                      style={{ fill: "#fff", fontSize: 10, fontWeight: 900 }}
                    />
                    <LabelList
                      dataKey="contact"
                      position="insideTop"
                      content={({ x, y, width, value, index }) => {
                        const total = (effortChartData[index as number]?.linewalk ?? 0) + (value as number);
                        if (!total) return null;
                        return (
                          <text
                            x={(x as number) + (width as number) / 2}
                            y={(y as number) - 10}
                            textAnchor="middle"
                            fill="#0b3572"
                            fontSize={10}
                            fontWeight={900}
                          >
                            {total}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center">
            <p className="text-[10px] font-bold text-[#687b96]">ยังไม่มีข้อมูล เมื่อทำ Linewalk หรือ Safety Contact แล้ว กราฟจะแสดงที่นี่</p>
          </div>
        )}
      </Card>

      </div>

      <Dialog open={awarenessCalendarMode !== null} onOpenChange={(open) => !open && setAwarenessCalendarMode(null)}>
        <AppDialogContent size="md" className="max-w-[560px]">
          <AppDialogSectionHeader className="border-[#d7e6f6] bg-[linear-gradient(135deg,#ffffff_0%,#f4f9ff_56%,#eaf4ff_100%)]">
            <AppDialogTitle className="text-[#0b3572]">
              {awarenessCalendarMode === "done" ? "ปฏิทินวันที่ทำ Safety Awareness แล้ว" : "ปฏิทินวันที่ไม่ได้ทำ Safety Awareness"}
            </AppDialogTitle>
            <AppDialogDescription>
              ดูย้อนหลังได้ตั้งแต่วันเริ่มใช้งาน {formatThaiDate(effectiveAwarenessStartDate)}
            </AppDialogDescription>
          </AppDialogSectionHeader>

          <AppDialogBody className="gap-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setAwarenessCalendarMonth((current) => shiftBangkokMonth(current, -1))}
                disabled={awarenessCalendarMonth <= awarenessCalendarMinMonth}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#cfe0f2] bg-white text-[#0b82f0] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="เดือนก่อนหน้า"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.6} />
              </button>
              <div className="text-center">
                <div className="text-[16px] font-black text-[#0b3572]">{formatThaiMonthYear(awarenessCalendarMonth)}</div>
                <div className="text-[11px] font-bold text-[#6c7f99]">แสดงตั้งแต่เริ่มใช้งานจนถึงปัจจุบัน</div>
              </div>
              <button
                type="button"
                onClick={() => setAwarenessCalendarMonth((current) => shiftBangkokMonth(current, 1))}
                disabled={awarenessCalendarMonth >= awarenessCalendarMaxMonth}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#cfe0f2] bg-white text-[#0b82f0] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="เดือนถัดไป"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.6} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {THAI_WEEKDAYS.map((weekday) => (
                <div key={weekday} className="py-1 text-[11px] font-black text-[#6c7f99]">
                  {weekday}
                </div>
              ))}
              {awarenessCalendarDays.map((day) => {
                const emphasized = awarenessCalendarMode === "done" ? day.isDone : day.isMissed;
                return (
                  <div
                    key={day.dateKey}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-[12px] border text-[12px] font-black transition-colors",
                      !day.isCurrentMonth && "opacity-35",
                      day.isToday
                        ? "border-[#0b82f0] bg-[#e8f4ff] text-[#0b3572]"
                        : emphasized
                          ? awarenessCalendarMode === "done"
                            ? "border-[#7fd7a4] bg-[#ebfbf1] text-[#13814a]"
                            : "border-[#ffc8c2] bg-[#fff3f1] text-[#c9352b]"
                          : day.required
                            ? "border-[#dbe9fa] bg-[#f8fbff] text-[#6c7f99]"
                            : "border-[#edf2f8] bg-[#fafcff] text-[#b0bccd]"
                    )}
                    title={`${formatThaiDate(day.dateKey)}${day.isDone ? " · ทำแล้ว" : day.isMissed ? " · ไม่ได้ทำ" : day.required ? " · ต้องทำ" : " · ไม่นับ"}`}
                  >
                    {day.day}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] font-bold text-[#5d7599]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ebfbf1] px-2.5 py-1 text-[#13814a]">
                <span className="h-2 w-2 rounded-full bg-[#2fbf69]" />ทำแล้ว
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3f1] px-2.5 py-1 text-[#c9352b]">
                <span className="h-2 w-2 rounded-full bg-[#f26a5d]" />ไม่ได้ทำ
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f8fbff] px-2.5 py-1 text-[#6c7f99]">
                <span className="h-2 w-2 rounded-full bg-[#b8cde5]" />ต้องทำแต่ยังไม่เลือก filter นี้
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fafcff] px-2.5 py-1 text-[#94a3b8]">
                <span className="h-2 w-2 rounded-full bg-[#d9e3ef]" />วันไม่นับ
              </span>
            </div>
          </AppDialogBody>
        </AppDialogContent>
      </Dialog>
    </div>
  );
}
