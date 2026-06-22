"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, FileText, Gift, Heart, MessageCircle, ShieldCheck, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppState, type SafetyCultureUserActivity } from "@/providers/app-providers";
import { useAppTheme } from "@/providers/theme-provider";
import { getSessionDisplayName, getSessionProfileImage, useSessionUser } from "@/lib/session-user";
import { cn } from "@/lib/utils";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateDaysAgo(days: number) {
  const next = new Date();
  next.setDate(next.getDate() - days);
  return formatDateInput(next);
}

function getActivityMeta(type: SafetyCultureUserActivity["type"]) {
  if (type === "post") {
    return {
      label: "โพสต์",
      icon: FileText,
      tone: "border-[#f3d28f] bg-[#fff8e6] text-[#8a5a10]",
    };
  }

  if (type === "comment") {
    return {
      label: "คอมเมนต์",
      icon: MessageCircle,
      tone: "border-[#c7ddff] bg-[#edf5ff] text-[#285ea8]",
    };
  }

  if (type === "redeem") {
    return {
      label: "แลกรางวัล",
      icon: Gift,
      tone: "border-[#c8ead6] bg-[#edf9ef] text-[#1f7a55]",
    };
  }

  if (type === "awareness") {
    return {
      label: "Awareness",
      icon: ShieldCheck,
      tone: "border-[#c9e8d5] bg-[#effaf2] text-[#1f7a55]",
    };
  }

  if (type === "safety-effort") {
    return {
      label: "Safety Effort",
      icon: CheckCircle2,
      tone: "border-[#f3d28f] bg-[#fff8e6] text-[#8a5a10]",
    };
  }

  return {
    label: "กดชอบ",
    icon: Heart,
    tone: "border-[#f0c3c8] bg-[#fff1f3] text-[#b24557]",
  };
}

function isWithinRange(activityAt: number, fromDate: string, toDate: string) {
  const time = new Date(activityAt);
  if (Number.isNaN(time.getTime())) return false;

  if (fromDate) {
    const from = new Date(`${fromDate}T00:00:00`);
    if (time < from) return false;
  }

  if (toDate) {
    const to = new Date(`${toDate}T23:59:59.999`);
    if (time > to) return false;
  }

  return true;
}

export default function ProfileActivityHistoryPage() {
  const { userActivityHistory } = useAppState();
  const { theme } = useAppTheme();
  const { user: sessionUser } = useSessionUser();
  const profileImage = getSessionProfileImage(sessionUser);
  const displayName = sessionUser ? getSessionDisplayName(sessionUser) : "ผู้ใช้งาน";
  const [fromDate, setFromDate] = useState(() => getDateDaysAgo(30));
  const [toDate, setToDate] = useState(() => formatDateInput(new Date()));
  const isWangjai = theme === "wangjai";
  const pageBackgroundClass = isWangjai
    ? "bg-[linear-gradient(180deg,#eef5fb_0%,#f8fbfe_260px,#fbfdff_100%)]"
    : "bg-[linear-gradient(180deg,#f6efe3_0%,#fdf8f0_220px,#fffdf8_100%)]";

  const filteredActivities = useMemo(
    () => userActivityHistory.filter((activity) => isWithinRange(activity.occurredAt, fromDate, toDate)),
    [fromDate, toDate, userActivityHistory]
  );

  const summary = useMemo(() => {
    return filteredActivities.reduce(
      (acc, activity) => {
        acc.total += 1;
        acc.points += activity.type === "redeem" ? 0 : Math.max(0, activity.pointsDelta);
        if (activity.type === "post") acc.posts += 1;
        if (activity.type === "comment") acc.comments += 1;
        if (activity.type === "reaction") acc.reactions += 1;
        if (activity.type === "redeem") acc.redeems += 1;
        return acc;
      },
      { total: 0, posts: 0, comments: 0, reactions: 0, redeems: 0, points: 0 }
    );
  }, [filteredActivities]);

  const applyQuickRange = (days: number) => {
    setFromDate(getDateDaysAgo(days));
    setToDate(formatDateInput(new Date()));
  };

  return (
    <div className={cn("min-h-[calc(100vh-var(--topbar-h))] px-3 pb-10 pt-2 font-sans md:px-6 md:pt-4", pageBackgroundClass)}>
      <div className="mx-auto grid w-full max-w-[1080px] gap-3 md:gap-4">
        <section className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,var(--brand-hero-start),var(--brand-hero-end))] p-4 text-white shadow-[0_18px_44px_var(--brand-shadow)] md:p-7">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[var(--brand-accent)] opacity-15 blur-3xl" />
          <div className="relative flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link href="/profile">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--brand-hero-label)]">Profile Activity</div>
                  <h1 className="text-[22px] font-black leading-tight md:text-[34px]">ประวัติกิจกรรมของผู้ใช้</h1>
                </div>
              </div>
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-white/30 bg-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.12)] md:h-14 md:w-14">
                {profileImage ? <img src={profileImage} alt={displayName} className="h-full w-full object-cover" /> : <UserRound className="h-7 w-7 text-white/80" />}
              </div>
            </div>

            <div className="rounded-[16px] border border-white/12 bg-white/10 px-3 py-2.5 text-[12px] font-bold text-white/88 backdrop-blur-sm">
              {displayName}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: "กิจกรรมทั้งหมด", value: summary.total, tone: "bg-[var(--brand-surface)]" },
            { label: "โพสต์", value: summary.posts, tone: "bg-[#fff8e6]" },
            { label: "คอมเมนต์", value: summary.comments, tone: "bg-[#edf5ff]" },
            { label: "กดชอบ", value: summary.reactions, tone: "bg-[#fff1f3]" },
            { label: "แลกรางวัล", value: summary.redeems, tone: "bg-[#edf9ef]" },
          ].map((item) => (
            <Card key={item.label} className={cn("rounded-[20px] border border-[var(--border)] p-4 shadow-[0_10px_24px_rgba(57,94,127,0.08)]", item.tone)}>
              <div className="text-[10px] font-extrabold tracking-[0.06em] text-[var(--muted-foreground)]">{item.label}</div>
              <div className="mt-2 text-[26px] font-black text-foreground">{item.value}</div>
            </Card>
          ))}
        </section>

        <Card className="rounded-[22px] border border-[var(--border)] bg-[var(--brand-surface)] p-4 shadow-[0_14px_30px_rgba(57,94,127,0.08)] md:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--brand-text)]">Filter By Date</div>
                <h2 className="mt-1 text-[18px] font-black text-foreground">เลือกช่วงเวลาที่ต้องการดู</h2>
              </div>
              <div className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-[12px] font-black text-[var(--brand-text)]">
                +{summary.points} แต้ม
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-black text-[var(--brand-text)]">ตั้งแต่วันที่</label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-12 rounded-[14px] bg-white pl-10 font-bold" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-black text-[var(--brand-text)]">ถึงวันที่</label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-12 rounded-[14px] bg-white pl-10 font-bold" />
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2 md:justify-end">
                <Button type="button" variant="outline" onClick={() => applyQuickRange(7)} className="h-10 rounded-[14px] bg-white px-3 font-black">
                  7 วัน
                </Button>
                <Button type="button" variant="outline" onClick={() => applyQuickRange(30)} className="h-10 rounded-[14px] bg-white px-3 font-black">
                  30 วัน
                </Button>
                <Button type="button" variant="outline" onClick={() => applyQuickRange(90)} className="h-10 rounded-[14px] bg-white px-3 font-black">
                  90 วัน
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <section className="grid gap-3">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => {
              const meta = getActivityMeta(activity.type);
              const Icon = meta.icon;

              return (
                <Card key={activity.id} className="rounded-[22px] border border-[var(--border)] bg-[var(--brand-surface)] p-4 shadow-[0_10px_24px_rgba(57,94,127,0.08)] md:p-5">
                  <div className="flex flex-col gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black", meta.tone)}>
                          <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
                          {meta.label}
                        </span>
                        <span className="rounded-full bg-[var(--secondary)] px-2.5 py-1 text-[11px] font-black text-[var(--brand-text)]">
                          {activity.postCategory}
                        </span>
                        <span className="text-[12px] font-bold text-[var(--muted-foreground)]">
                          {activity.type === "redeem" ? `รายการของ ${activity.postAuthor}` : `โพสต์ของ ${activity.postAuthor}`}
                        </span>
                      </div>

                      <div className="mt-3 text-[15px] font-black leading-relaxed text-foreground md:text-[16px]">{activity.postPreview}</div>

                      {activity.commentText ? (
                        <div className="mt-3 rounded-[16px] border border-[var(--border)] bg-background/80 px-3.5 py-3 text-[13.5px] font-bold leading-relaxed text-[var(--muted-foreground)]">
                          "{activity.commentText}"
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--border)] bg-background/70 px-3.5 py-3">
                      <div className="flex items-center gap-2 text-[13px] font-black text-foreground">
                        <Clock3 className="h-4 w-4 text-[var(--brand-text)]" strokeWidth={2.3} />
                        {new Date(activity.occurredAt).toLocaleString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-bold text-[var(--muted-foreground)]">
                          {activity.type === "redeem" ? "แต้มที่ใช้ไป" : "แต้มที่ได้รับ"}
                        </div>
                        <div className={cn("text-[24px] font-black", activity.type === "redeem" ? "text-[#b45309]" : "text-[#16845a]")}>
                          {activity.type === "redeem" ? `-${Math.max(0, Math.abs(activity.pointsDelta))}` : `+${Math.max(0, activity.pointsDelta)}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="rounded-[22px] border border-[var(--border)] bg-[var(--brand-surface)] p-8 text-center shadow-[0_10px_26px_var(--brand-shadow)]">
              <div className="text-[18px] font-black text-foreground">ยังไม่พบกิจกรรมในช่วงเวลาที่เลือก</div>
              <div className="mt-2 text-[13px] font-bold text-[var(--muted-foreground)]">ลองขยายช่วงวันที่เพื่อดูโพสต์ คอมเมนต์ การกดชอบ หรือการแลกรางวัลย้อนหลังเพิ่มเติม</div>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
