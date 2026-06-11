"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useEffect, type CSSProperties } from "react";
import {
  useAppState,
  useAppActions,
  type Post,
  type Comment as CommentType,
  type SafetyCultureFeedEvent,
  getSafetyCultureEventPhase,
} from "@/providers/app-providers";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  SAFETY_CULTURE_CATEGORIES,
  COMMENT_REACTION_CHOICES,
  formatPostSubtext,
} from "@/lib/safety-culture";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Heart, ImageIcon, Sparkles, Trophy, X } from "lucide-react";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { SafetyCultureTabs } from "@/components/safety-culture/safety-culture-tabs";

function getPostComments(post: { comments: number | CommentType[] }): CommentType[] {
  if (Array.isArray(post.comments)) return post.comments;

  return Array.from({ length: post.comments || 0 }, (_, index) => ({
    id: `mock-${index}`,
    author: index % 2 === 0 ? "Anand T." : "Nattaya K.",
    avatarText: index % 2 === 0 ? "A" : "N",
    text: index % 2 === 0 ? "รับทราบครับ เป็นตัวอย่างที่ดีมาก" : "ขอบคุณที่แชร์นะคะ",
  }));
}

function getCommentCount(post: { comments: number | CommentType[] }) {
  return Array.isArray(post.comments) ? post.comments.length : post.comments || 0;
}

function LeadingTeamCard({ className, style }: { className?: string; style?: CSSProperties }) {
  const { teamStandings } = useAppState();
  const leadingTeam = teamStandings[0];
  const runnerUpTeam = teamStandings[1];
  const leadPoints = leadingTeam && runnerUpTeam ? leadingTeam.points - runnerUpTeam.points : 0;
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-[24px] p-5 text-white shadow-[0_10px_25px_rgba(0,0,0,0.12)] md:p-6 font-sarabun",
        className
      )}
      style={{ background: "linear-gradient(135deg, #3B210B, #5C3214)", ...style }}
    >
      <div className="absolute top-0 left-0 right-0 h-2 bg-[repeating-linear-gradient(-45deg,#F5BB00,#F5BB00_10px,#1A1A1A_10px,#1A1A1A_20px)]" />
      <div className="relative flex items-center gap-4">
        <div className="flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-full border-[3px] border-white text-3xl shadow-[0_0_16px_rgba(245,187,0,0.35)] md:h-[68px] md:w-[68px]" style={{ backgroundColor: leadingTeam?.color ?? "#F5BB00" }}>
          🏆
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#bcaaa4] md:text-[13px]">นำอยู่ตอนนี้</span>
          <div className="mt-0.5 text-[26px] leading-none font-black tracking-tight text-white md:text-[30px]">{leadingTeam?.name ?? "-"}</div>
          <span className="mt-1.5 block text-[13.5px] font-black md:text-[14.5px]" style={{ color: leadingTeam?.color ?? "#F5BB00" }}>+ {leadPoints.toLocaleString()} คะแนน เหนือกว่า {runnerUpTeam?.name ?? "-"}</span>
        </div>
      </div>
    </Card>
  );
}

function TeamStandingsCard({ className, style }: { className?: string; style?: CSSProperties }) {
  const { teamStandings } = useAppState();
  return (
    <Card className={cn("flex flex-col gap-3 rounded-[20px] border-[#E4D4B8] bg-[#FFFDF7] p-5 font-sarabun", className)} style={style}>
      <span className="text-[13px] font-[850] uppercase tracking-wide text-muted-foreground">TEAM RANK · YTD</span>
      <h3 className="mt-0.5 mb-2 text-[20px] font-extrabold text-[#1A1A1A]">ตารางคะแนนทีม</h3>
      <div className="flex flex-col gap-2.5">
        {teamStandings.map((team) => (
          <div key={team.id} className="flex flex-col gap-1.5 rounded-2xl border-[1.5px] border-[#DDD9CD] bg-[#FAF8F2] p-2.5 md:p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="min-w-[12px] text-[17px] font-black text-[#1A1A1A]">{team.rank}</span>
                <div className="h-4 w-4 flex-shrink-0 rounded-full border-[1.5px] border-[#1A1A1A]" style={{ backgroundColor: team.color }} />
                <div className="min-w-0">
                  <span className="block truncate text-[15.5px] font-extrabold text-[#1A1A1A]">{team.name}</span>
                  <span className="text-[11.5px] font-bold text-[#8E8A81]">{team.members} สมาชิก</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="text-[15.5px] font-black text-[#1A1A1A]">{team.points.toLocaleString()}</span>
                <span className="block text-[10px] font-bold text-[#8E8A81]">POINTS</span>
              </div>
            </div>
            <div className="h-[5px] w-full overflow-hidden rounded-full bg-[#EFEBE0]">
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-out"
                style={{ width: `${team.percent}%`, backgroundColor: team.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PersonalRankingsCard({ className, style }: { className?: string; style?: CSSProperties }) {
  const { personalRankings } = useAppState();
  return (
    <Card className={cn("flex flex-col gap-4 rounded-[24px] border-[#E4D4B8] bg-[#FFFDF7] p-5 font-sarabun", className)} style={style}>
      <span className="text-[13px] font-[850] uppercase tracking-wide text-muted-foreground">INSIDE YOUR TEAM · MONTH</span>
      <h3 className="mt-0.5 mb-2 text-[20px] font-extrabold text-[#1A1A1A]">อันดับในทีมของฉัน</h3>
      <div className="flex flex-col gap-2">
        {personalRankings.map((user) => (
          <div
            key={user.id}
            className={cn(
              "flex items-center justify-between rounded-xl border-[1.5px] px-3.5 py-2 text-[15px] font-bold text-[#1A1A1A]",
              user.active ? "border-[#F5BB00] bg-[#FFF9E6] shadow-[inset_0_0_0_1.5px_#F5BB00]" : "border-transparent bg-transparent"
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="min-w-[20px] font-extrabold text-[#8E8A81]">{user.rank}</span>
              <span className="truncate font-[750]">{user.name}</span>
            </div>
            <span className="flex-shrink-0 font-extrabold text-[15px]">{user.points} แต้ม</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SUEATipCard({ className, style, tipText }: { className?: string; style?: CSSProperties; tipText: string }) {
  return (
    <Card className={cn("flex items-start gap-3 rounded-[24px] border-2 border-[#F5BB00] bg-[#FFF9E6] p-3.5 font-sarabun", className)} style={style}>
      <span className="text-xl animate-[pulse_2s_infinite]">💡</span>
      <div className="flex flex-col gap-1">
        <span className="text-[15.5px] font-[850] text-[#1A1A1A]">เคล็ดลับจากพี่ SUEA</span>
        <span className="text-[13.5px] font-bold leading-relaxed text-[#555149]">{tipText}</span>
      </div>
    </Card>
  );
}

function getActivityStatusMeta(status: SafetyCultureFeedEvent["status"]) {
  return status === "open"
    ? {
        label: "เปิดกิจกรรม",
        badgeClass: "border-[#b8e7d2] bg-[#effff6] text-[#127a52]",
        iconClass: "text-[#18b989]",
        note: "กิจกรรมนี้ยังเปิดรับการมีส่วนร่วม",
      }
    : {
        label: "ปิดกิจกรรม",
        badgeClass: "border-[#ddd9cd] bg-[#faf8f2] text-[#6a6256]",
        iconClass: "text-[#71809c]",
        note: "กิจกรรมนี้ไม่รับการส่งข้อมูลแล้ว",
      };
}

export default function Page() {
  const { posts, safetyCultureEvent, feedEvents, isEventLive, eventNow } = useAppState();
  const { toggleLike, addComment } = useAppActions();

  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [activePhotoByPost, setActivePhotoByPost] = useState<Record<number, number>>({});
  const [expandedPhoto, setExpandedPhoto] = useState<{ src: string; alt: string; postAuthor: string; index: number; total: number } | null>(null);
  const [expandedActivity, setExpandedActivity] = useState<SafetyCultureFeedEvent | null>(null);
  const [mobileActivityStartIndex, setMobileActivityStartIndex] = useState(0);
  const [desktopActivityStartIndex, setDesktopActivityStartIndex] = useState(0);
  const [commentReactionState, setCommentReactionState] = useState<Record<string, { selected: string | null; counts: Record<string, number> }>>({});
  const [openCommentReactionPicker, setOpenCommentReactionPicker] = useState<string | null>(null);

  const animStyle = (delay: number) => ({
    animationDelay: `${delay}s`,
  });

  const filtered = activeCategory === "ทั้งหมด"
    ? posts
    : activeCategory === "ทีมของฉัน"
      ? posts.filter((post) => post.subtext.includes("BPI-04"))
      : posts.filter((post) => post.category === activeCategory);

  const getPostPhotos = useCallback((post: Post) => {
    if (Array.isArray(post.photos) && post.photos.length > 0) {
      return post.photos.filter((photo) => photo?.dataUrl);
    }
    return post.imageData ? [{ id: `${post.id}-legacy`, dataUrl: post.imageData, type: "legacy" }] : [];
  }, []);

  useEffect(() => {
    if (!expandedPhoto && !expandedActivity) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpandedPhoto(null);
        setExpandedActivity(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedActivity, expandedPhoto]);


  const handleCommentSubmit = (postId: number) => {
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;
    addComment(postId, text);
    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
  };

  const getCommentReactionKey = (postId: number, commentId: string) => `${postId}:${commentId}`;

  const getDefaultCommentReactions = () =>
    COMMENT_REACTION_CHOICES.reduce((counts, reaction) => {
      counts[reaction.id] = 0;
      return counts;
    }, {} as Record<string, number>);

  const getCommentReactionData = (postId: number, commentId: string) => {
    const key = getCommentReactionKey(postId, commentId);
    return commentReactionState[key] || { selected: null, counts: getDefaultCommentReactions() };
  };

  const eventBonusLabel = safetyCultureEvent.bonusMode === "multiplier"
    ? `x${safetyCultureEvent.multiplier}`
    : `+${safetyCultureEvent.fixedPoints} pts`;
  const tipText = `โพสต์ที่ได้รับอนุมัติ +6 แต้ม · Happy Hour ${eventBonusLabel} · คอมเมนต์และ reaction จะได้โบนัสตามช่วงอีเว้น`;

  const eventPhase = getSafetyCultureEventPhase(safetyCultureEvent, eventNow);
  const visibleFeedEvents = feedEvents.filter((event) => event.published);
  const maxMobileActivityStartIndex = Math.max(0, visibleFeedEvents.length - 1);
  const maxDesktopActivityStartIndex = Math.max(0, visibleFeedEvents.length - 3);
  const shouldShowEventBanner = safetyCultureEvent.bannerVisible && eventPhase !== "draft";
  const startAt = new Date(`${safetyCultureEvent.startDate}T${safetyCultureEvent.startTime}`);
  const endAt = new Date(`${safetyCultureEvent.endDate}T${safetyCultureEvent.endTime}`);
  const timeRangeLabel = `${startAt.toLocaleDateString("th-TH", { day: "2-digit", month: "short" })} ${safetyCultureEvent.startTime} - ${endAt.toLocaleDateString("th-TH", { day: "2-digit", month: "short" })} ${safetyCultureEvent.endTime}`;

  useEffect(() => {
    setMobileActivityStartIndex((current) => Math.min(current, Math.max(0, visibleFeedEvents.length - 1)));
  }, [visibleFeedEvents.length]);

  useEffect(() => {
    setDesktopActivityStartIndex((current) => Math.min(current, Math.max(0, visibleFeedEvents.length - 3)));
  }, [visibleFeedEvents.length]);

  let eventStatusLabel: string = safetyCultureEvent.status;
  let countdownLabel = "รอการตั้งเวลาอีเว้น";

  if (eventPhase === "live") {
    eventStatusLabel = "Live now";
    countdownLabel = `เหลือเวลาอีก ${Math.max(0, Math.ceil((endAt.getTime() - eventNow) / 60000))} นาที`;
  } else if (eventPhase === "upcoming") {
    eventStatusLabel = "Starting soon";
    countdownLabel = `เริ่มในอีก ${Math.max(0, Math.ceil((startAt.getTime() - eventNow) / 60000))} นาที`;
  } else if (eventPhase === "ended") {
    eventStatusLabel = "Ended";
    countdownLabel = "อีเว้นสิ้นสุดแล้ว";
  } else if (eventPhase === "paused") {
    eventStatusLabel = "Paused";
    countdownLabel = "อีเว้นถูกหยุดชั่วคราว";
  } else if (eventPhase === "draft") {
    eventStatusLabel = "Draft";
    countdownLabel = "ยังไม่เปิดใช้งานอีเว้น";
  }

  const handleCommentReaction = (postId: number, commentId: string, reactionId: string) => {
    const key = getCommentReactionKey(postId, commentId);

    setCommentReactionState((prev) => {



      const current = prev[key] || { selected: null, counts: getDefaultCommentReactions() };
      const nextCounts = { ...current.counts };
      let nextSelected: string | null = reactionId;

      if (current.selected === reactionId) {
        nextCounts[reactionId] = Math.max(0, (nextCounts[reactionId] || 0) - 1);
        nextSelected = null;
      } else {
        if (current.selected) {
          nextCounts[current.selected] = Math.max(0, (nextCounts[current.selected] || 0) - 1);
        }
        nextCounts[reactionId] = (nextCounts[reactionId] || 0) + 1;
      }

      return { ...prev, [key]: { selected: nextSelected, counts: nextCounts } };
    });

    setOpenCommentReactionPicker(null);
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1180px] bg-[#f1ecdf] px-3.5 pt-0 pb-8 md:px-4 font-sarabun">
        <div className="anim-fade" style={animStyle(0)}>
          <SafetyCultureHero
            eyebrow="SAFETY CULTURE COMMUNITY"
            title={<><span className="text-[#ffb000]">SUEA</span> Safety</>}
            description="พื้นที่แชร์เรื่องความปลอดภัยของทีม อ่านง่าย อบอุ่น และช่วยกันต่อยอดพฤติกรรมปลอดภัยในทุกวัน"
            mascotSrc="/images/mascots/gallery/line-walk-3.png"
            mascotAlt="SUEA Mascot"
          />
        </div>

        {shouldShowEventBanner ? (
        <Card className="mt-[13px] rounded-[20px] border border-[#e0c28a] bg-[linear-gradient(135deg,#fff3d1_0%,#fffcf4_100%)] px-4 py-3 text-[#4b2b0f] shadow-[0_8px_18px_rgba(92,50,20,0.06)] anim-fade" style={animStyle(0.01)}>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#5c3214] text-lg text-[#ffcf55]">
                ⚡
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-black">{safetyCultureEvent.headline}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
                      isEventLive ? "bg-[#daf5e6] text-[#19734a]" : "bg-[#ede2d4] text-[#6d4a22]"
                    )}
                  >
                    {eventStatusLabel}
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] font-bold leading-relaxed text-[#6d5a46]">
                  {safetyCultureEvent.supportingText}
                </p>
                <p className="mt-1 text-[11.5px] font-black text-[#9a6a24]">
                  {countdownLabel}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pl-11 md:pl-0">
              <span className="rounded-full border border-[#d4b079] bg-white px-3 py-1 text-[12px] font-black text-[#5c3214]">
                Bonus {eventBonusLabel}
              </span>
              <span className="rounded-full border border-[#d4b079] bg-white px-3 py-1 text-[12px] font-black text-[#5c3214]">
                {timeRangeLabel}
              </span>
            </div>
          </div>
        </Card>
        ) : null}

        <div className="mt-[13px] mb-[20px] anim-fade" style={animStyle(0.02)}>
          <SafetyCultureTabs />
        </div>

        {visibleFeedEvents.length > 0 ? (
          <Card className="mb-4 overflow-hidden rounded-[24px] border border-[#e4d3b3] bg-[#fffdfa] p-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)] anim-fade md:p-5" style={animStyle(0.03)}>
            <div className="mb-5 flex items-start gap-3 text-[#5c3214]">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff1c9] text-[#f0a400] shadow-[0_6px_14px_rgba(240,164,0,0.15)]">
                <Sparkles className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="flex-1 pt-0.5">
                <h2 className="text-[20px] font-black">กิจกรรมปัจจุบัน</h2>
                <p className="text-[12px] font-bold text-[#8E8A81]">Admin สามารถจัดการกิจกรรม และผู้ใช้กดดูรายละเอียดเพิ่มเติมได้ทันที</p>
              </div>
            </div>

            <div className="relative lg:hidden">
              <button
                type="button"
                onClick={() => setMobileActivityStartIndex((current) => Math.max(0, current - 1))}
                disabled={mobileActivityStartIndex === 0}
                className="absolute top-1/2 left-[-14px] z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#d7c5a7] bg-white text-[#5c3214] shadow-[0_8px_18px_rgba(62,36,13,0.08)] transition-all duration-200 hover:-translate-x-0.5 hover:bg-[#fff4df] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-x-0"
                aria-label="เลื่อนดูกิจกรรมก่อนหน้า"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>

              <button
                type="button"
                onClick={() => setMobileActivityStartIndex((current) => Math.min(maxMobileActivityStartIndex, current + 1))}
                disabled={mobileActivityStartIndex >= maxMobileActivityStartIndex}
                className="absolute top-1/2 right-[-14px] z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#d7c5a7] bg-white text-[#5c3214] shadow-[0_8px_18px_rgba(62,36,13,0.08)] transition-all duration-200 hover:translate-x-0.5 hover:bg-[#fff4df] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-x-0"
                aria-label="เลื่อนดูกิจกรรมถัดไป"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
              </button>

              <div className="overflow-hidden rounded-[24px]">
                <div
                  className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
                  style={{ transform: `translateX(-${mobileActivityStartIndex * 100}%)` }}
                >
                  {visibleFeedEvents.map((activity) => {
                const statusMeta = getActivityStatusMeta(activity.status);

                return (
                  <article
                    key={activity.id}
                    className="flex min-w-full flex-[0_0_100%] flex-col rounded-[22px] border border-[#e4d3b3] bg-white shadow-[0_10px_20px_rgba(62,36,13,0.05)]"
                  >
                    <div className="relative aspect-[1.2/1] overflow-hidden rounded-t-[22px] bg-[#f7e7cf]">
                      {activity.imageSrc ? (
                        <Image src={activity.imageSrc} alt={activity.title} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center px-6 text-center text-[18px] font-black text-[#8E8A81]">
                          {activity.imageText}
                        </div>
                      )}
                      <span className={cn("absolute top-3 right-3 rounded-full border px-3 py-1 text-[11px] font-black backdrop-blur-[2px]", statusMeta.badgeClass)}>
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="text-[18px] font-black text-[#2f261d]">{activity.title}</h3>
                      <p className="mt-2 line-clamp-3 text-[13.5px] font-bold leading-relaxed text-[#667085]">{activity.summary}</p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12px] font-black">
                        <span className="inline-flex items-center gap-1.5 text-[#7d776c]">
                          <CalendarDays className="h-4 w-4" strokeWidth={2.1} />
                          {activity.dateLabel}
                        </span>
                        <span className="text-[#18b989]">+{activity.points} คะแนน</span>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setExpandedActivity(activity)}
                        className="mt-4 h-10 rounded-[14px] border-[#d7c5a7] bg-[#faf8f2] text-[13px] font-black text-[#5c3214] hover:bg-[#fff2d8]"
                      >
                        ดูรายละเอียด
                      </Button>
                    </div>
                  </article>
                );
                  })}
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setDesktopActivityStartIndex((current) => Math.max(0, current - 1))}
                disabled={desktopActivityStartIndex === 0}
                className="absolute top-1/2 left-[-22px] z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#d7c5a7] bg-white text-[#5c3214] shadow-[0_8px_20px_rgba(62,36,13,0.08)] transition-all duration-200 hover:-translate-x-0.5 hover:bg-[#fff4df] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-x-0"
                aria-label="เลื่อนดูกิจกรรมก่อนหน้า"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>

              <button
                type="button"
                onClick={() => setDesktopActivityStartIndex((current) => Math.min(maxDesktopActivityStartIndex, current + 1))}
                disabled={desktopActivityStartIndex >= maxDesktopActivityStartIndex}
                className="absolute top-1/2 right-[-22px] z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#d7c5a7] bg-white text-[#5c3214] shadow-[0_8px_20px_rgba(62,36,13,0.08)] transition-all duration-200 hover:translate-x-0.5 hover:bg-[#fff4df] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-x-0"
                aria-label="เลื่อนดูกิจกรรมถัดไป"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
              </button>

              <div className="overflow-hidden rounded-[24px]">
                <div
                  className="flex gap-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
                  style={{ transform: `translateX(calc(-${desktopActivityStartIndex} * ((100% - 2rem) / 3 + 1rem)))` }}
                >
                  {visibleFeedEvents.map((activity) => {
                  const statusMeta = getActivityStatusMeta(activity.status);

                  return (
                    <article
                      key={activity.id}
                      className="flex min-w-[calc((100%-2rem)/3)] flex-[0_0_calc((100%-2rem)/3)] flex-col rounded-[22px] border border-[#e4d3b3] bg-white shadow-[0_10px_20px_rgba(62,36,13,0.05)] transition-transform duration-300 hover:-translate-y-1"
                    >
                      <div className="relative aspect-[1.2/1] overflow-hidden rounded-t-[22px] bg-[#f7e7cf]">
                        {activity.imageSrc ? (
                          <Image src={activity.imageSrc} alt={activity.title} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center px-6 text-center text-[18px] font-black text-[#8E8A81]">
                            {activity.imageText}
                          </div>
                        )}
                        <span className={cn("absolute top-3 right-3 rounded-full border px-3 py-1 text-[11px] font-black backdrop-blur-[2px]", statusMeta.badgeClass)}>
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="text-[18px] font-black text-[#2f261d]">{activity.title}</h3>
                        <p className="mt-2 line-clamp-3 text-[13.5px] font-bold leading-relaxed text-[#667085]">{activity.summary}</p>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12px] font-black">
                          <span className="inline-flex items-center gap-1.5 text-[#7d776c]">
                            <CalendarDays className="h-4 w-4" strokeWidth={2.1} />
                            {activity.dateLabel}
                          </span>
                          <span className="text-[#18b989]">+{activity.points} คะแนน</span>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setExpandedActivity(activity)}
                          className="mt-4 h-10 rounded-[14px] border-[#d7c5a7] bg-[#faf8f2] text-[13px] font-black text-[#5c3214] hover:bg-[#fff2d8]"
                        >
                          ดูรายละเอียด
                        </Button>
                      </div>
                    </article>
                  );
                  })}
                </div>
              </div>
            </div>
          </Card>
        ) : null}

<div className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.82fr)]">
          <div className="flex flex-col gap-3">
            <Card className="rounded-[16px] border border-[#e5d6be] bg-[#fff8eb] px-3 py-2 shadow-[0_4px_8px_rgba(62,36,13,0.03)] anim-fade md:rounded-[18px] md:px-3.5 md:py-2.5" style={animStyle(0.04)}>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                  <div className="flex h-[32px] w-[32px] flex-shrink-0 items-center justify-center rounded-full border-2 border-[#2a2118] bg-[#F5BB00] text-[16px] leading-none font-black text-[#1A1A1A] md:h-[36px] md:w-[36px] md:text-[18px]">
                    C
                  </div>
                  <Link href="/safety-culture/post" className="min-w-0 flex-1">
                    <div className="flex h-[32px] items-center rounded-full border border-[#e4cdac] bg-[#fbf1df] px-[12px] text-[13.5px] font-bold text-[#978d7c] sm:whitespace-nowrap md:h-[36px]">
                      <span className="truncate">คุณกำลังคิดอะไรอยู่</span>
                    </div>
                  </Link>
                </div>
                <Link href="/safety-culture/post" className="flex-shrink-0">
                  <button
                    className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] border border-[#e4cdac] bg-[#fff8eb] text-[#8d877b] md:h-[36px] md:w-[36px] md:rounded-[10px]"
                    aria-label="เพิ่มรูปภาพ"
                  >
                    <ImageIcon className="h-[16px] w-[16px]" strokeWidth={2} />
                  </button>
                </Link>
              </div>
            </Card>

            <div className="hidden flex-col gap-3 md:flex xl:hidden">
              <LeadingTeamCard className="anim-fade" style={animStyle(0.045)} />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <TeamStandingsCard className="anim-fade" style={animStyle(0.05)} />
                <PersonalRankingsCard className="anim-fade" style={animStyle(0.055)} />
              </div>
              <SUEATipCard className="anim-fade" style={animStyle(0.06)} tipText={tipText} />
            </div>

            <div className="scrollbar-hide flex gap-2 overflow-x-auto py-0.5 anim-fade" style={animStyle(0.05)}>
              {SAFETY_CULTURE_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "flex-shrink-0 whitespace-nowrap rounded-full border-[1.5px] px-4 py-2 text-[14px] font-extrabold transition-all md:px-[18px] md:py-[10px] md:text-[15px]",
                    activeCategory === category
                      ? "border-[#6a3f13] bg-[#6a3f13] text-white shadow-[0_4px_10px_rgba(92,53,12,0.16)]"
                      : "border-[#eadcc7] bg-white text-[#706557] hover:border-[#B78922] hover:bg-[#FFF7E8]"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>

            {filtered.map((post, idx) => {
              const postPhotos = getPostPhotos(post);
              const activePhotoIndex = activePhotoByPost[post.id] || 0;
              const activePhoto = postPhotos[activePhotoIndex] || postPhotos[0];
              const postComments = getPostComments(post);
              const visibleComments = postComments.slice(-20);
              const commentCount = getCommentCount(post);

              return (
                <Card
                  key={post.id}
                  className="anim-fade flex flex-col gap-2.5 rounded-[20px] border-[#e3d0ae] bg-[#fffdfa] p-3.5 shadow-[0_10px_24px_rgba(62,36,13,0.045)] transition-all hover:-translate-y-px hover:border-[#C49A45] hover:shadow-[0_12px_28px_rgba(62,36,13,0.08)] md:gap-3 md:p-4"
                  style={animStyle(0.05 + idx * 0.05)}
                >
                  <div className="flex items-start justify-between gap-2.5 font-sarabun">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className="flex h-[36px] w-[36px] flex-shrink-0 items-center justify-center rounded-full border-2 border-[#1A1A1A] text-[16px] font-black"
                        style={{ backgroundColor: post.avatarBg, color: post.avatarColor }}
                      >
                        {post.avatarText}
                      </div>
                      <div className="min-w-0 flex flex-col gap-0">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="truncate text-[14.5px] font-extrabold text-[#1A1A1A]">{post.author}</span>
                          {post.isYou && (
                            <span className="ml-1 rounded-md bg-[#DDD9CD] px-1.5 py-0.5 text-[9px] font-black tracking-wide text-[#555149]">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[11.5px] font-bold text-[#9f988d]">{formatPostSubtext(post)}</span>
                      </div>
                    </div>
                    <span className="mt-0.5 w-fit rounded-full border border-[#e8cda4] bg-[#fff7e8] px-2 py-0.5 text-[10.5px] font-black tracking-wide text-[#7b5625]">
                      {post.category}
                    </span>
                  </div>

                  <p className="text-[14.5px] md:text-[15.5px] font-bold leading-relaxed text-[#33271A] font-sarabun">{post.body}</p>

                  {(postPhotos.length > 0 || post.imageText) && (
                    <div className="flex flex-col gap-2 font-sarabun">
                      <div className="relative aspect-[1.34/1] w-full overflow-hidden rounded-[16px] border-[1.5px] border-[#e5cfad] bg-[#f7e7cf]">
                        {activePhoto ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedPhoto({
                                  src: activePhoto.dataUrl,
                                  alt: `Attached post scene by ${post.author}`,
                                  postAuthor: post.author,
                                  index: activePhotoIndex,
                                  total: postPhotos.length,
                                })
                              }
                              className="absolute inset-0 z-0 cursor-zoom-in"
                              aria-label="ดูรูปภาพเต็ม"
                            >
                              <Image src={activePhoto.dataUrl} alt={`Attached post scene by ${post.author}`} fill className="object-cover" />
                            </button>
                            {postPhotos.length > 1 && (
                              <span className="absolute right-3 bottom-3 z-10 rounded-full bg-[rgba(53,50,48,0.86)] px-2.5 py-1 text-[13px] font-black text-white">
                                {activePhotoIndex + 1} / {postPhotos.length}
                              </span>
                            )}
                            <span className="pointer-events-none absolute top-3 right-3 z-10 rounded-full bg-[rgba(53,50,48,0.72)] px-2.5 py-1 text-[11px] font-black text-white">
                              แตะเพื่อดูเต็มรูป
                            </span>
                          </>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2 text-[15px] font-black lowercase text-[#8E8A81]">
                            <ImageIcon className="h-8 w-8" />
                            <span>{post.imageText}</span>
                          </div>
                        )}
                      </div>

                      {postPhotos.length > 1 && (
                        <div className="flex gap-2 pt-0.5">
                          {postPhotos.map((photo, photoIndex) => (
                            <button
                              key={photo.id}
                              onClick={() => setActivePhotoByPost((prev) => ({ ...prev, [post.id]: photoIndex }))}
                              className={cn(
                                "h-[56px] w-[56px] overflow-hidden rounded-[10px] border-[1.5px] bg-[#efebe0] p-0",
                                photoIndex === activePhotoIndex ? "border-[#f3b400] shadow-[0_0_0_1px_#3b1d07]" : "border-[#ddd9cd]"
                              )}
                            >
                              <Image src={photo.dataUrl} alt="" width={56} height={56} className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-0.5 flex items-center justify-between border-t border-[rgba(228,212,184,0.82)] pt-2.5 font-sarabun">
                    <div className="flex items-center gap-2.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike(post.id)}
                        className={cn(
                          "h-auto gap-1.5 rounded-lg px-0 py-0 text-[13.5px] font-black hover:bg-transparent",
                          post.hasLiked ? "text-[#D9383A]" : "text-[#7d776c] hover:text-foreground"
                        )}
                      >
                        <span style={{ color: post.hasLiked ? "#D9383A" : "#8E8A81" }}>❤</span>
                        <span style={{ color: "#555149" }}>{post.likes}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                        className="h-auto gap-1.5 rounded-lg px-0 py-0 text-[13.5px] font-black text-[#7d776c] hover:bg-transparent hover:text-foreground"
                      >
                        <span style={{ color: "#8E8A81" }}>💬</span>
                        <span style={{ color: "#555149" }}>{commentCount}</span>
                      </Button>
                    </div>
                    <span className="w-fit rounded-full bg-[#e9fff4] px-2 py-0.5 text-[12px] font-black tracking-normal text-[#3D9A6A]">
                      + {post.points} pts
                    </span>
                  </div>

                  {expandedComments[post.id] && (
                    <div className="flex flex-col gap-2.5 border-t-[1.5px] border-[rgba(221,217,205,0.7)] pt-3 font-sarabun">
                      {postComments.length > 0 && (
                        <>
                          {postComments.length > visibleComments.length && (
                            <div className="rounded-xl border-[1.5px] border-[#DDD9CD] bg-[#FAF8F2] px-2.5 py-1.5 text-center text-[13.5px] font-[850] text-[#555149]">
                              แสดง 20 คอมเมนต์ล่าสุด จากทั้งหมด {postComments.length} คอมเมนต์
                            </div>
                          )}
                          <div className="flex max-h-[260px] flex-col gap-2 overflow-y-auto pr-1 overscroll-contain">
                            {visibleComments.map((comment) => {
                              const reactionData = getCommentReactionData(post.id, comment.id);
                              const selectedReaction = COMMENT_REACTION_CHOICES.find((reaction) => reaction.id === reactionData.selected);
                              const pickerKey = getCommentReactionKey(post.id, comment.id);

                              return (
                                <div key={comment.id} className="flex items-start gap-2">
                                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#1A1A1A] bg-[#F5BB00] text-[11px] font-black text-[#1A1A1A]">
                                    {comment.avatarText || comment.author.charAt(0) || "C"}
                                  </div>
                                  <div className="flex min-w-0 flex-col items-start gap-1">
                                    <div className="min-w-0 rounded-[12px] border-[1.5px] border-[#DDD9CD] bg-[#FAF8F2] px-2 py-1 text-[13px] font-bold leading-relaxed text-[#33312C]">
                                      <span className="mb-0.5 block text-[11.5px] font-black text-[#1A1A1A]">{comment.author}</span>
                                      {comment.text}
                                    </div>
                                    <div className="relative flex items-center gap-1 pl-0.5">
                                      <button
                                        className={cn(
                                          "inline-flex cursor-pointer items-center gap-1 rounded-full bg-transparent px-1.5 py-[3px] text-[11.5px] font-[850] leading-none text-[#555149] transition-all hover:bg-[#FAF8F2] hover:text-[#1A1A1A]",
                                          selectedReaction && "bg-[#FFF7D6] text-[#1A1A1A] shadow-[inset_0_0_0_1.5px_#F5BB00]"
                                        )}
                                        onClick={() => setOpenCommentReactionPicker((prev) => (prev === pickerKey ? null : pickerKey))}
                                      >
                                        {selectedReaction ? (
                                          <>
                                            <span>{selectedReaction.icon}</span>
                                            <span>{selectedReaction.label}</span>
                                          </>
                                        ) : (
                                          <span>แสดงความรู้สึก</span>
                                        )}
                                      </button>
                                      {openCommentReactionPicker === pickerKey && (
                                        <div className="absolute bottom-[calc(100%+6px)] left-0 z-20 flex gap-[3px] rounded-full border-[1.5px] border-[#DDD9CD] bg-white p-[5px] shadow-[0_8px_22px_rgba(0,0,0,0.12)] animate-[scaleUp_0.16s_ease-out_both]">
                                          {COMMENT_REACTION_CHOICES.map((reaction) => (
                                            <button
                                              key={reaction.id}
                                              className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-transparent text-md transition-all hover:-translate-y-0.5 hover:scale-110 hover:bg-[#FFF7D6]"
                                              onClick={() => handleCommentReaction(post.id, comment.id, reaction.id)}
                                              title={reaction.label}
                                            >
                                              {reaction.icon}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}

                      <div className="flex w-full items-center gap-2">
                        <Input
                          value={commentDrafts[post.id] || ""}
                          onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCommentSubmit(post.id);
                          }}
                          placeholder="เขียนคอมเมนต์..."
                          className="h-[34px] min-w-0 flex-1 rounded-full border border-[#2a2118] bg-white px-3.5 text-[13.5px] font-bold placeholder:text-[#9f988d] focus-visible:border-[#2a2118] focus-visible:ring-0"
                        />
                        <Button
                          size="sm"
                          className={cn(
                            "h-[34px] w-[34px] flex-shrink-0 rounded-full p-0 text-[13px] font-black text-white transition-colors duration-200",
                            (commentDrafts[post.id] || "").trim()
                              ? "bg-[#5c3214] hover:bg-[#45250f] active:bg-[#341b0b]"
                              : "bg-[#A39E96] cursor-not-allowed hover:bg-[#A39E96]"
                          )}
                          onClick={() => handleCommentSubmit(post.id)}
                          disabled={!(commentDrafts[post.id] || "").trim()}
                        >
                          ส่ง
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}

            {filtered.length === 0 && (
              <Card className="py-10 text-center font-bold text-muted-foreground text-[18px] font-sarabun">
                ยังไม่มีโพสต์ในหมวดหมู่นี้
              </Card>
            )}
          </div>

          <div className="hidden flex-col gap-4 xl:flex">
            <LeadingTeamCard className="anim-fade" style={animStyle(0.1)} />
            <TeamStandingsCard className="anim-fade" style={animStyle(0.15)} />
            <PersonalRankingsCard className="anim-fade" style={animStyle(0.2)} />
            <SUEATipCard className="anim-fade" style={animStyle(0.25)} tipText={tipText} />
          </div>
        </div>
      </div>

      {expandedPhoto ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(20,13,7,0.88)] p-4 backdrop-blur-[4px]"
          onClick={() => setExpandedPhoto(null)}
          role="dialog"
          aria-modal="true"
          aria-label="ภาพเต็มของโพสต์"
        >
          <div
            className="relative flex max-h-[92vh] w-fit max-w-[calc(100vw-2rem)] flex-col gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 text-white">
              <div className="min-w-0">
                <div className="truncate text-[15px] font-extrabold">{expandedPhoto.postAuthor}</div>
                <div className="text-[12px] font-bold text-white/70">
                  {expandedPhoto.total > 1 ? `รูปที่ ${expandedPhoto.index + 1} จาก ${expandedPhoto.total}` : "ภาพเต็ม"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpandedPhoto(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-white/10 text-white transition-colors hover:bg-white/16"
                aria-label="ปิดภาพเต็ม"
              >
                <X className="h-5 w-5" strokeWidth={2.4} />
              </button>
            </div>

            <div className="flex max-h-[calc(92vh-56px)] max-w-full items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.04)] shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              <img
                src={expandedPhoto.src}
                alt={expandedPhoto.alt}
                className="block max-h-[78vh] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}

      {expandedActivity ? (
        <div
          className="fixed inset-0 z-[92] flex items-center justify-center bg-[rgba(20,13,7,0.82)] p-3 animate-[fadeIn_0.2s_ease-out_both] md:p-5"
          onClick={() => setExpandedActivity(null)}
          role="dialog"
          aria-modal="true"
          aria-label="รายละเอียดกิจกรรม"
        >
          <div
            className="relative flex max-h-[94vh] w-full max-w-[920px] flex-col overflow-hidden rounded-[28px] border border-[#e4d3b3] bg-[#fffdfa] shadow-[0_24px_60px_rgba(0,0,0,0.28)] animate-[scaleUp_0.24s_cubic-bezier(0.175,0.885,0.32,1.12)_both]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#eee2cb] px-5 py-4 md:px-7 md:py-5">
              <div className="min-w-0">
                <h3 className="text-[26px] font-black text-[#2f261d]">{expandedActivity.title}</h3>
                <p className="mt-1 text-[13px] font-bold text-[#667085]">{expandedActivity.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedActivity(null)}
                className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#ddd9cd] bg-white text-[#667085] transition-colors hover:bg-[#faf8f2]"
                aria-label="ปิดรายละเอียดกิจกรรม"
              >
                <X className="h-5 w-5" strokeWidth={2.3} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 md:px-7 md:py-6">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
                <div className="overflow-hidden rounded-[24px] border border-[#eee2cb] bg-[#faf8f2]">
                  {expandedActivity.imageSrc ? (
                    <img src={expandedActivity.imageSrc} alt={expandedActivity.title} className="block w-full object-cover" />
                  ) : (
                    <div className="flex min-h-[320px] items-center justify-center px-8 text-center text-[22px] font-black text-[#8E8A81]">
                      {expandedActivity.imageText}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Card className="rounded-[22px] border-[#e4d3b3] bg-white p-5 shadow-none">
                    <div className="mb-3 text-[18px] font-black text-[#2f261d]">รายละเอียดของกิจกรรมนี้:</div>
                    <p className="text-[15px] font-bold leading-relaxed text-[#667085]">{expandedActivity.details}</p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#effff6] px-3 py-1.5 text-[13px] font-black text-[#18b989]">
                      <Trophy className="h-4 w-4" strokeWidth={2.2} />
                      Points: {expandedActivity.points}
                    </div>
                  </Card>

                  <Card className="rounded-[22px] border-[#e4d3b3] bg-white p-5 shadow-none">
                    <div className="mb-3 text-[18px] font-black text-[#2f261d]">สถานะกิจกรรม:</div>
                    <div className="flex flex-col items-center justify-center gap-3 rounded-[18px] border border-[#eee2cb] bg-[#faf8f2] px-4 py-5 text-center">
                      <Clock3 className={cn("h-14 w-14", getActivityStatusMeta(expandedActivity.status).iconClass)} strokeWidth={1.8} />
                      <div className="text-[20px] font-black text-[#5c3214]">{getActivityStatusMeta(expandedActivity.status).label}</div>
                      <p className="max-w-[260px] text-[14px] font-bold leading-relaxed text-[#667085]">
                        {getActivityStatusMeta(expandedActivity.status).note}
                      </p>
                      <span className="rounded-full border border-[#ddd9cd] bg-white px-3 py-1 text-[12px] font-black text-[#5c3214]">
                        {expandedActivity.dateLabel}
                      </span>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
