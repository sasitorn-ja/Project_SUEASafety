"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect, type CSSProperties } from "react";
import {
  useAppState,
  useAppActions,
  type Post,
  type Comment as CommentType,
  type SafetyCultureFeedEvent,
} from "@/providers/app-providers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSessionUser, getSessionProfileImage, getSessionInitials } from "@/lib/session-user";
import {
  SAFETY_CULTURE_CATEGORIES,
  COMMENT_REACTION_CHOICES,
  formatPostSubtext,
  formatThaiDateTime,
} from "@/lib/safety-culture";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, ImageIcon, MessageCircle, ThumbsUp, Pencil, Sparkles, Trash2, Trophy, UsersRound, X } from "lucide-react";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { SafetyCultureTabs } from "@/components/safety-culture/safety-culture-tabs";
import { useAppTheme } from "@/providers/theme-provider";
import styles from "./safety-culture-community.module.css";

function getPostComments(post: { comments: number | CommentType[] }): CommentType[] {
  if (Array.isArray(post.comments)) return post.comments;
  return [];
}

function getCommentCount(post: { comments: number | CommentType[] }) {
  return Array.isArray(post.comments) ? post.comments.length : post.comments || 0;
}

function ProfileAvatar({
  imageUrl,
  text,
  sizeClassName = "h-[36px] w-[36px]",
  textClassName = "text-[16px]",
}: {
  imageUrl?: string | null;
  text: string;
  sizeClassName?: string;
  textClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;
  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#1A1A1A] bg-[var(--brand-accent)] font-black text-[#173b6b]",
        sizeClassName,
        textClassName,
      )}
    >
      {showImage ? (
        // Plain img (images are unoptimized) so a failed SSO/LINE photo falls back to initials.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl as string} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        text
      )}
    </div>
  );
}

function LeadingTeamCard({ className, style }: { className?: string; style?: CSSProperties }) {
  const { teamStandings } = useAppState();
  const leadingTeam = teamStandings[0];
  const runnerUpTeam = teamStandings[1];
  const leadPoints = leadingTeam && runnerUpTeam ? leadingTeam.points - runnerUpTeam.points : 0;
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-[16px] p-3 text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] md:p-3.5 font-sarabun",
        className
      )}
      style={{ background: "linear-gradient(135deg, var(--c-3b210b), var(--c-5c3214))", ...style }}
    >
      <div className="absolute top-0 left-0 right-0 h-2 bg-[repeating-linear-gradient(-45deg,var(--c-f5bb00),var(--c-f5bb00)_10px,#1A1A1A_10px,#1A1A1A_20px)]" />
      <div className="relative flex items-center gap-3">
        <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full border-2 border-white text-xl shadow-[0_0_14px_rgba(45,174,255,0.3)]" style={{ backgroundColor: leadingTeam?.color ?? "var(--c-f5bb00)" }}>
          🏆
        </div>
        <div className="min-w-0 flex-1">
          {leadingTeam ? (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/65">นำอยู่ตอนนี้</span>
              <div className="mt-0.5 text-[17px] leading-none font-black tracking-tight text-white">{leadingTeam.name}</div>
              <span className="mt-1 block text-[11px] font-black" style={{ color: leadingTeam.color ?? "var(--c-f5bb00)" }}>+ {leadPoints.toLocaleString()} คะแนน เหนือกว่า {runnerUpTeam?.name ?? "-"}</span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/65">ลำดับทีม</span>
              <div className="mt-0.5 text-[17px] leading-none font-black tracking-tight text-white">ยังไม่มีข้อมูลทีม</div>
              <span className="mt-1 block text-[11px] font-bold text-white/70">ข้อมูลอันดับทีมจะแสดงที่นี่เมื่อมีคะแนน</span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function TeamStandingsCard({ className, style }: { className?: string; style?: CSSProperties }) {
  const { teamStandings } = useAppState();
  const { themedColor } = useAppTheme();
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[18px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.62))] shadow-[0_10px_24px_var(--brand-shadow)] backdrop-blur-sm font-sarabun",
        className
      )}
      style={style}
    >
      <div className="border-b border-[var(--border)] px-3 py-3">
        <p className="text-[11px] font-black tracking-[0.01em] text-[var(--foreground)]">ลำดับทีม · YTD</p>
      </div>

      <div className="space-y-2 p-2.5 xl:space-y-2.5 xl:p-3">
        {teamStandings.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-4 py-7 text-center">
            <p className="text-[13.5px] font-black text-[var(--foreground)]">ยังไม่มีข้อมูลทีม</p>
            <p className="mt-1 text-[11.5px] font-bold text-[var(--brand-muted-text)]">ยังไม่มีข้อมูลทีมในขณะนี้</p>
          </div>
        ) : teamStandings.map((team, idx) => (
          <article
            key={team.id}
            className="rounded-[14px] border border-[var(--border)] bg-[var(--brand-surface)] px-2.5 py-2 shadow-[0_8px_22px_var(--brand-shadow)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[rgba(var(--brand-accent-rgb),0.45)] xl:px-3 xl:py-2.5"
          >
            <div className="flex items-center gap-2.5 xl:gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5 xl:gap-3.5">
                <div className="flex w-6 flex-shrink-0 items-center justify-center text-[17px] font-black text-[var(--foreground)] xl:w-7 xl:text-[20px]">
                  {team.rank}
                </div>
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] xl:h-12 xl:w-12 xl:rounded-[14px]"
                  style={{ background: `linear-gradient(180deg, ${themedColor(team.color)}, color-mix(in srgb, ${themedColor(team.color)} 76%, white))` }}
                >
                  <UsersRound className="h-5 w-5 text-white xl:h-6 xl:w-6" strokeWidth={2.2} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 xl:gap-2">
                    <h4 className="truncate text-[14px] font-black text-[var(--foreground)] xl:text-[16.5px]">{team.name}</h4>
                    {idx === 0 ? (
                      <span className="rounded-full bg-[var(--brand-soft)] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.12em] text-[var(--brand-text)] xl:px-2 xl:text-[9px]">
                        Leader
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-[10px] font-bold text-[var(--brand-muted-text)] xl:text-[11.5px]">{team.members} สมาชิก</p>
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                <p className="text-[15px] leading-none font-black text-[var(--foreground)] xl:text-[17px]">{team.points.toLocaleString()}</p>
                <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--brand-muted-text)] xl:text-[9px] xl:tracking-[0.12em]">คะแนน</p>
              </div>
            </div>

            <div className="mt-2.5 xl:mt-3">
              <div className="mb-1 flex items-center justify-between text-[9px] font-bold text-[var(--brand-muted-text)] xl:mb-1.5 xl:text-[10px]">
                <span>ภาพรวมทีม</span>
                <span>{team.percent}%</span>
              </div>
              <div className="h-[6px] w-full overflow-hidden rounded-full bg-[var(--secondary)] xl:h-[7px]">
                <div
                  className="h-full rounded-full transition-[width] duration-1000 ease-out"
                  style={{ width: `${team.percent}%`, backgroundColor: themedColor(team.color) }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}

function PersonalRankingsCard({ className, style }: { className?: string; style?: CSSProperties }) {
  const { personalRankings } = useAppState();
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[18px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.70))] shadow-[0_10px_24px_var(--brand-shadow)] backdrop-blur-sm font-sarabun",
        className
      )}
      style={style}
    >
      <div className="border-b border-[var(--border)] px-3 py-3">
        <p className="text-[11px] font-black tracking-[0.01em] text-[var(--foreground)]">อันดับในทีมของฉัน · เดือนนี้</p>
      </div>

      <div className="space-y-2 p-3">
        {personalRankings.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-4 py-7 text-center">
            <p className="text-[13.5px] font-black text-[var(--foreground)]">ยังไม่มีอันดับในทีม</p>
            <p className="mt-1 text-[11.5px] font-bold text-[var(--brand-muted-text)]">ยังไม่มีคะแนนในขณะนี้</p>
          </div>
        ) : personalRankings.map((user) => (
          <article
            key={user.id}
            className={cn(
              "flex items-center justify-between gap-3 rounded-[14px] border px-3 py-2.5 shadow-[0_8px_22px_var(--brand-shadow)] transition-all duration-200",
              user.active
                ? "border-[rgba(var(--brand-accent-rgb),0.55)] bg-[linear-gradient(180deg,rgba(var(--brand-accent-rgb),0.10),rgba(var(--brand-accent-rgb),0.03))]"
                : "border-[var(--border)] bg-[var(--brand-surface)] hover:border-[rgba(var(--brand-accent-rgb),0.4)]"
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={cn(
                  "flex h-9 min-w-9 items-center justify-center rounded-full border text-[13px] font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
                  user.active
                    ? "border-[rgba(var(--brand-accent-rgb),0.36)] bg-[var(--brand-soft)] text-[var(--brand-text)]"
                    : "border-[var(--border)] bg-[rgba(255,255,255,0.8)] text-[var(--brand-muted-text)]"
                )}
              >
                {user.rank}
              </div>

              <div className="min-w-0">
                <p className="truncate text-[15px] leading-tight font-black text-[var(--foreground)]">{user.name}</p>
                <p className="mt-0.5 text-[10.5px] font-bold text-[var(--brand-muted-text)]">
                  {user.active ? "ลำดับของคุณในทีม" : "สมาชิกในทีม"}
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 text-right">
              <p className="text-[20px] leading-none font-black text-[var(--foreground)]">{user.points}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--brand-muted-text)]">แต้ม</p>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}

function SUEATipCard({ className, style, tipText }: { className?: string; style?: CSSProperties; tipText: string }) {
  return (
    <Card className={cn("flex items-start gap-2.5 rounded-[16px] border-2 border-[var(--c-f5bb00)] bg-[var(--c-fff9e6)] p-3 font-sarabun", className)} style={style}>
      <span className="text-xl animate-[pulse_2s_infinite]">💡</span>
      <div className="flex flex-col gap-1">
        <span className="text-[13.5px] font-[850] text-[#173b6b]">เคล็ดลับจาก Safety Caring</span>
        <span className="text-[11.5px] font-bold leading-relaxed text-[#5f7591]">{tipText}</span>
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
        badgeClass: "border-[var(--c-ddd9cd)] bg-[var(--c-faf8f2)] text-[var(--c-6a6256)]",
        iconClass: "text-[#71809c]",
        note: "กิจกรรมนี้ไม่รับการส่งข้อมูลแล้ว",
      };
}

function getActivityCardCopy(activity: Pick<SafetyCultureFeedEvent, "details" | "summary">) {
  return activity.details?.trim() || activity.summary?.trim() || "รายละเอียดกิจกรรมจะแสดงที่นี่";
}

export default function Page() {
  const { posts, feedEvents } = useAppState();
  const { toggleLike, addComment, fetchComments, fetchPosts, updatePost, deletePost, updateComment, deleteComment } = useAppActions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: sessionUser } = useSessionUser();

  // แสดงชิปทีมเมื่อมี session แล้วให้ backend เป็นผู้ตัดสินว่าผู้ใช้มีทีมจริงหรือไม่
  const hasTeam = Boolean(sessionUser?.id);
  const visibleCategories = SAFETY_CULTURE_CATEGORIES.filter(
    (category) => category !== "ทีมของฉัน" || hasTeam
  );

  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [myTeamPosts, setMyTeamPosts] = useState<Post[]>([]);
  const [myTeamLoading, setMyTeamLoading] = useState(false);
  const [myTeamLoaded, setMyTeamLoaded] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<{ postId: number; commentId: string } | null>(null);
  const [commentEditDraft, setCommentEditDraft] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [activePhotoByPost, setActivePhotoByPost] = useState<Record<number, number>>({});
  const [expandedPhoto, setExpandedPhoto] = useState<{
    photos: Array<{ id: string; dataUrl: string; type: string }>;
    alt: string;
    postAuthor: string;
    index: number;
  } | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [likedByPostId, setLikedByPostId] = useState<number | null>(null);
  const [liveExpandedPost, setLiveExpandedPost] = useState<Post | null>(null);
  const [expandedActivity, setExpandedActivity] = useState<SafetyCultureFeedEvent | null>(null);
  const [mobileActivityStartIndex, setMobileActivityStartIndex] = useState(0);
  const [desktopActivityStartIndex, setDesktopActivityStartIndex] = useState(0);
  const [commentReactionState, setCommentReactionState] = useState<Record<string, { selected: string | null; counts: Record<string, number> }>>({});
  const [openCommentReactionPicker, setOpenCommentReactionPicker] = useState<string | null>(null);
  const expandedPost = expandedPostId
    ? (liveExpandedPost && liveExpandedPost.id === expandedPostId
        ? liveExpandedPost
        : posts.find((post) => post.id === expandedPostId) ?? null)
    : null;
  const isNotificationPostPopup = Boolean(searchParams?.get("postId"));
  const likedByPost = likedByPostId == null
    ? null
    : posts.find((post) => post.id === likedByPostId)
      ?? myTeamPosts.find((post) => post.id === likedByPostId)
      ?? (liveExpandedPost?.id === likedByPostId ? liveExpandedPost : null);

  const animStyle = (delay: number) => ({
    animationDelay: `${delay}s`,
  });

  // ถ้าหมวดที่เลือกอยู่ถูกซ่อน (เช่น "ทีมของฉัน" ตอนไม่มีหน่วยงาน) ให้กลับไป "ทั้งหมด"
  useEffect(() => {
    if (!visibleCategories.includes(activeCategory as (typeof visibleCategories)[number])) {
      setActiveCategory("ทั้งหมด");
    }
  }, [visibleCategories, activeCategory]);

  useEffect(() => {
    if (activeCategory !== "ทีมของฉัน" || !sessionUser?.id) return;
    let cancelled = false;
    setMyTeamLoading(true);
    fetchPosts({ scope: "my-team", limit: 50 })
      .then((items) => {
        if (!cancelled) {
          setMyTeamPosts(items);
          setMyTeamLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMyTeamPosts([]);
          setMyTeamLoaded(true);
        }
      })
      .finally(() => {
        if (!cancelled) setMyTeamLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeCategory, fetchPosts, sessionUser?.id]);

  useEffect(() => {
    setMyTeamPosts((current) =>
      current.map((teamPost) => {
        const syncedPost = posts.find((post) => post.id === teamPost.id);
        return syncedPost ? { ...teamPost, ...syncedPost } : teamPost;
      }),
    );
  }, [posts]);

  const filtered = activeCategory === "ทั้งหมด"
    ? posts
    : activeCategory === "ทีมของฉัน"
      ? myTeamPosts
      : posts.filter((post) => post.category === activeCategory);

  const getPostPhotos = useCallback((post: Post) => {
    if (Array.isArray(post.photos) && post.photos.length > 0) {
      return post.photos.filter((photo) => photo?.dataUrl);
    }
    return post.imageData ? [{ id: `${post.id}-legacy`, dataUrl: post.imageData, type: "legacy" }] : [];
  }, []);

  const showExpandedPhotoAt = useCallback(
    (post: Post, index: number) => {
      const postPhotos = getPostPhotos(post);
      if (postPhotos.length === 0) return;

      const boundedIndex = Math.max(0, Math.min(index, postPhotos.length - 1));
      setExpandedPhoto({
        photos: postPhotos,
        alt: `Attached post scene by ${post.author}`,
        postAuthor: post.author,
        index: boundedIndex,
      });
    },
    [getPostPhotos]
  );

  const goToExpandedPhoto = useCallback((direction: -1 | 1) => {
    setExpandedPhoto((current) => {
      if (!current || current.photos.length <= 1) return current;
      const nextIndex = (current.index + direction + current.photos.length) % current.photos.length;
      return { ...current, index: nextIndex };
    });
  }, []);

  useEffect(() => {
    if (!expandedPhoto && !expandedActivity && !expandedPost) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpandedPhoto(null);
        setExpandedActivity(null);
        setExpandedPostId(null);
        return;
      }

      if (expandedPhoto && expandedPhoto.photos.length > 1) {
        if (event.key === "ArrowLeft") {
          goToExpandedPhoto(-1);
        } else if (event.key === "ArrowRight") {
          goToExpandedPhoto(1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedActivity, expandedPhoto, expandedPost, goToExpandedPhoto]);

  useEffect(() => {
    const postIdParam = searchParams?.get("postId");
    const activityIdParam = searchParams?.get("activityId");

    if (postIdParam) {
      const numericPostId = Number(postIdParam);
      if (Number.isFinite(numericPostId)) {
        const targetPost = posts.find((post) => post.id === numericPostId);
        if (targetPost) {
          setExpandedPostId(targetPost.id);
          setExpandedActivity(null);
        }
        void (async () => {
          try {
            const [postRes, comments] = await Promise.all([
              fetch(`/api/safety-culture/posts/${numericPostId}`, {
                credentials: "include",
                cache: "no-store",
              }).then((response) => response.ok ? response.json() : null),
              fetchComments(numericPostId).catch(() => []),
            ]);

            const apiPost = postRes?.data?.post;
            if (!apiPost) return;

            const latestPost: Post = {
              id: Number(apiPost.id),
              author: String(apiPost.authorName || targetPost?.author || "Unknown user"),
              avatarBg: targetPost?.avatarBg || "var(--brand-accent)",
              avatarColor: targetPost?.avatarColor || "#1A1A1A",
              avatarText: String(apiPost.authorName || targetPost?.author || "U").charAt(0).toUpperCase(),
              avatarImageUrl: apiPost.authorProfileImageUrl || targetPost?.avatarImageUrl || null,
              subtext: targetPost?.subtext || "",
              category: String(apiPost.category || targetPost?.category || "ทั่วไป"),
              body: String(apiPost.content || targetPost?.body || ""),
              photos: Array.isArray(apiPost.photos)
                ? apiPost.photos.map((photo: { id?: string; url?: string; dataUrl?: string; type?: string }, index: number) => ({
                    id: String(photo.id || `${apiPost.id}-photo-${index + 1}`),
                    dataUrl: photo.url || photo.dataUrl || "",
                    type: String(photo.type || "upload"),
                  })).filter((photo: { dataUrl: string }) => photo.dataUrl)
                : (targetPost?.photos || []),
              likes: Math.max(0, Number(apiPost.likeCount) || 0),
              comments: Array.isArray(comments) && comments.length > 0 ? comments : Math.max(0, Number(apiPost.commentCount) || 0),
              points: Math.max(0, Number(apiPost.pointsAwarded) || targetPost?.points || 0),
              hasLiked: Boolean(apiPost.hasLiked),
              likedBy: Array.isArray(apiPost.likedBy)
                ? apiPost.likedBy.map((person: { userId?: string; name?: string; profileImageUrl?: string | null }) => ({
                    userId: String(person.userId || ""),
                    name: String(person.name || "ผู้ใช้งาน"),
                    profileImageUrl: person.profileImageUrl || null,
                  }))
                : [],
              isYou: targetPost?.isYou,
              createdAt: new Date(apiPost.createdAt).getTime() || targetPost?.createdAt,
              imageData: targetPost?.imageData || null,
              feedEventId: apiPost.eventId ? String(apiPost.eventId) : targetPost?.feedEventId,
              authorId: apiPost.authorId ? String(apiPost.authorId) : targetPost?.authorId,
              authorEmail: apiPost.authorEmail ?? targetPost?.authorEmail ?? null,
              organizationId: apiPost.organizationId ? String(apiPost.organizationId) : targetPost?.organizationId ?? null,
              organizationName: apiPost.organizationName || targetPost?.organizationName || null,
              teamId: apiPost.teamId ? String(apiPost.teamId) : targetPost?.teamId ?? null,
              teamName: apiPost.teamName || targetPost?.teamName || null,
              location: targetPost?.location,
              team: targetPost?.team,
            };
            setLiveExpandedPost(latestPost);
          } catch {
            // Keep the currently rendered post if the refresh fails.
          }
        })();
      }
    } else if (activityIdParam) {
      const targetActivity = feedEvents.find((event) => event.id === activityIdParam);
      if (targetActivity) {
        setExpandedActivity(targetActivity);
        setExpandedPostId(null);
      }
      setLiveExpandedPost(null);
    } else {
      setLiveExpandedPost(null);
    }
  }, [feedEvents, fetchComments, posts, searchParams]);

  useEffect(() => {
    if (!expandedPostId) return;
    const syncedPost = posts.find((post) => post.id === expandedPostId);
    if (!syncedPost) return;
    setLiveExpandedPost((current) => current && current.id === expandedPostId ? { ...current, ...syncedPost } : current);
  }, [expandedPostId, posts]);

  useEffect(() => {
    if (!expandedPostId) return;
    setExpandedComments((prev) => ({ ...prev, [expandedPostId]: true }));
  }, [expandedPostId]);

  const closeExpandedPost = useCallback(() => {
    setExpandedPostId(null);
    if (searchParams?.get("postId")) {
      router.replace("/safety-culture", { scroll: false });
    }
  }, [router, searchParams]);

  const closeExpandedActivity = useCallback(() => {
    setExpandedActivity(null);
    if (searchParams?.get("activityId")) {
      router.replace("/safety-culture", { scroll: false });
    }
  }, [router, searchParams]);


  const handleToggleComments = (post: Post) => {
    const nextOpen = !expandedComments[post.id];
    setExpandedComments((prev) => ({ ...prev, [post.id]: nextOpen }));
    if (nextOpen) void fetchComments(post.id);
  };

  const handleCommentSubmit = async (postId: number) => {
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;
    const ok = await addComment(postId, text);
    if (!ok) {
      window.alert("ไม่สามารถบันทึกความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
  };

  const startEditComment = (postId: number, comment: CommentType) => {
    setEditingComment({ postId, commentId: comment.id });
    setCommentEditDraft(comment.text);
  };

  const cancelEditComment = () => {
    setEditingComment(null);
    setCommentEditDraft("");
  };

  const handleSaveComment = async () => {
    if (!editingComment || commentSaving) return;
    const text = commentEditDraft.trim();
    if (!text) return;
    setCommentSaving(true);
    const ok = await updateComment(editingComment.postId, editingComment.commentId, text);
    setCommentSaving(false);
    if (ok) {
      cancelEditComment();
    } else {
      window.alert("ไม่สามารถแก้ไขความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleDeleteComment = async (postId: number, commentId: string) => {
    const ok = await deleteComment(postId, commentId);
    if (!ok) window.alert("ไม่สามารถลบความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง");
  };

  const startEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditDraft(post.body || "");
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setEditDraft("");
  };

  const handleSaveEditPost = async (postId: number) => {
    const text = editDraft.trim();
    if (!text || editSaving) return;
    setEditSaving(true);
    const ok = await updatePost(postId, text);
    setEditSaving(false);
    if (ok) {
      setEditingPostId(null);
      setEditDraft("");
    } else {
      window.alert("ไม่สามารถแก้ไขโพสได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleConfirmDeletePost = async () => {
    if (deletingPostId == null) return;
    const ok = await deletePost(deletingPostId);
    setDeletingPostId(null);
    if (!ok) window.alert("ไม่สามารถลบโพสได้ กรุณาลองใหม่อีกครั้ง");
  };

  const getCommentReactionKey = (postId: number, commentId: string) => `${postId}:${commentId}`;

  const getDefaultCommentReactions = () =>
    COMMENT_REACTION_CHOICES.reduce((counts, reaction) => {
      counts[reaction.id] = 0;
      return counts;
    }, {} as Record<string, number>);

  const getCommentReactionData = (postId: number, commentId: string) => {
    const key = getCommentReactionKey(postId, commentId);
    const comment = posts.find((post) => post.id === postId)?.comments;
    const persisted = Array.isArray(comment) ? comment.find((item) => item.id === commentId) : null;
    return commentReactionState[key] || {
      selected: persisted?.viewerReaction || null,
      counts: { ...getDefaultCommentReactions(), ...(persisted?.reactions || {}) },
    };
  };

  const tipText = "โพสต์เรื่องความปลอดภัยให้ชัดเจน กระชับ และถ้าเข้ากิจกรรมแบบ Card อย่าลืมเลือกกิจกรรมก่อนโพสต์";
  const visibleFeedEvents = feedEvents.filter((event) => event.published && event.status === "open");
  const maxMobileActivityStartIndex = Math.max(0, visibleFeedEvents.length - 1);
  const maxDesktopActivityStartIndex = Math.max(0, visibleFeedEvents.length - 3);
  const expandedPostPhotos = expandedPost ? getPostPhotos(expandedPost) : [];
  const expandedPostActivePhotoIndex = expandedPost ? activePhotoByPost[expandedPost.id] || 0 : 0;
  const expandedPostActivePhoto = expandedPostPhotos[expandedPostActivePhotoIndex] || expandedPostPhotos[0];
  const expandedPostComments = expandedPost ? getPostComments(expandedPost) : [];
  const expandedPostCommentCount = expandedPost ? getCommentCount(expandedPost) : 0;

  useEffect(() => {
    setMobileActivityStartIndex((current) => Math.min(current, Math.max(0, visibleFeedEvents.length - 1)));
  }, [visibleFeedEvents.length]);

  useEffect(() => {
    setDesktopActivityStartIndex((current) => Math.min(current, Math.max(0, visibleFeedEvents.length - 3)));
  }, [visibleFeedEvents.length]);

  const handleCommentReaction = async (postId: number, commentId: string, reactionId: string) => {
    const key = getCommentReactionKey(postId, commentId);
    const current = getCommentReactionData(postId, commentId);
    let nextSelected: string | null = reactionId;
    const nextCounts = { ...current.counts };
    if (current.selected === reactionId) {
      nextCounts[reactionId] = Math.max(0, (nextCounts[reactionId] || 0) - 1);
      nextSelected = null;
    } else {
      if (current.selected) nextCounts[current.selected] = Math.max(0, (nextCounts[current.selected] || 0) - 1);
      nextCounts[reactionId] = (nextCounts[reactionId] || 0) + 1;
    }
    setCommentReactionState((prev) => ({ ...prev, [key]: { selected: nextSelected, counts: nextCounts } }));
    setOpenCommentReactionPicker(null);
    const response = await fetch(`/api/safety-culture/comments/${commentId}/reactions`, {
      method: nextSelected ? "POST" : "DELETE", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: nextSelected ? JSON.stringify({ reactionType: nextSelected }) : undefined,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) {
      setCommentReactionState((prev) => ({ ...prev, [key]: current }));
      window.alert("ไม่สามารถบันทึกความรู้สึกได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <>
      <div className={cn("mx-auto w-full max-w-[1480px] px-3.5 pt-2.5 pb-7 md:px-5 font-sarabun", styles.page)}>
        <div className="mb-3 anim-fade" style={animStyle(0)}>
          <SafetyCultureHero
            eyebrow="SAFETY CULTURE COMMUNITY"
            title={<>Safety Culture</>}
            description="พื้นที่แชร์เรื่องความปลอดภัย และช่วยกันต่อยอดพฤติกรรมปลอดภัยในทุกวัน"
            mascotSrc="/images/safety-culture-mascot.png"
            mascotAlt="น้องวางใจถือโทรโข่งและมือถือโซเชียล"
            mascotAction="announce"
            variant="community"
            backgroundImage="/images/safety-culture-hero.png"
            backgroundOverlay="linear-gradient(90deg, rgba(2, 26, 66, .82) 0%, rgba(3, 33, 78, .5) 34%, rgba(3, 33, 78, .16) 56%, rgba(3, 33, 78, 0) 70%)"
          />
        </div>

        <div className={cn("mt-[13px] mb-[20px] anim-fade", styles.topTabs)} style={animStyle(0.02)}>
          <SafetyCultureTabs />
        </div>

        {visibleFeedEvents.length > 0 ? (
          <Card className="mb-3 overflow-hidden rounded-[18px] border border-[var(--c-e4d3b3)] bg-[var(--c-fffdfa)] p-3 shadow-[0_8px_18px_rgba(62,36,13,0.04)] anim-fade md:p-4" style={animStyle(0.03)}>
            <div className="mb-1 flex items-start gap-3 text-[var(--c-5c3214)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--c-fff1c9)] text-[var(--c-f0a400)] shadow-[0_6px_14px_rgba(240,164,0,0.15)]">
                <Sparkles className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="flex-1 pt-0.5">
                <h2 className="text-[17px] font-black">กิจกรรมปัจจุบัน</h2>
              </div>
            </div>

            <div className="relative lg:hidden">
              <button
                type="button"
                onClick={() => setMobileActivityStartIndex((current) => Math.max(0, current - 1))}
                disabled={mobileActivityStartIndex === 0}
                className="absolute top-1/2 left-[-14px] z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--c-d7c5a7)] bg-white text-[var(--c-5c3214)] shadow-[0_8px_18px_rgba(62,36,13,0.08)] transition-all duration-200 hover:-translate-x-0.5 hover:bg-[var(--c-fff4df)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-x-0"
                aria-label="เลื่อนดูกิจกรรมก่อนหน้า"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>

              <button
                type="button"
                onClick={() => setMobileActivityStartIndex((current) => Math.min(maxMobileActivityStartIndex, current + 1))}
                disabled={mobileActivityStartIndex >= maxMobileActivityStartIndex}
                className="absolute top-1/2 right-[-14px] z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--c-d7c5a7)] bg-white text-[var(--c-5c3214)] shadow-[0_8px_18px_rgba(62,36,13,0.08)] transition-all duration-200 hover:translate-x-0.5 hover:bg-[var(--c-fff4df)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-x-0"
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
                    className="flex min-w-full flex-[0_0_100%] flex-col rounded-[16px] border border-[var(--c-e4d3b3)] bg-white shadow-[0_10px_20px_rgba(62,36,13,0.05)]"
                  >
                      <div className="relative aspect-[1.42/1] overflow-hidden rounded-t-[22px] bg-[var(--c-f7e7cf)] sm:aspect-[1.3/1]">
                        {activity.imageSrc ? (
                        <Image src={activity.imageSrc} alt={activity.title} fill sizes="(max-width: 1023px) 100vw, 33vw" className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center px-6 text-center text-[18px] font-black text-[#5f7591]">
                            {activity.imageText}
                        </div>
                      )}
                      <span className={cn("absolute top-3 right-3 rounded-full border px-3 py-1 text-[11px] font-black backdrop-blur-[2px]", statusMeta.badgeClass)}>
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col px-4 pt-4 pb-3">
                      <h3 className="text-[15.5px] font-black text-[var(--c-2f261d)]">{activity.title}</h3>
                      <p className="mt-1.5 line-clamp-2 text-[12px] font-bold leading-relaxed text-[#667085]">{getActivityCardCopy(activity)}</p>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] font-black">
                        <span className="inline-flex items-center gap-1.5 text-[#5f7591]">
                          <CalendarDays className="h-4 w-4" strokeWidth={2.1} />
                          {activity.dateLabel}
                        </span>
                        <span className="text-[#18b989]">+{activity.points} คะแนน</span>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setExpandedActivity(activity)}
                        className="mt-3 h-10 rounded-[14px] border-[var(--c-d7c5a7)] bg-[var(--c-faf8f2)] text-[13px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff2d8)]"
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
                className="absolute top-1/2 left-[-22px] z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--c-d7c5a7)] bg-white text-[var(--c-5c3214)] shadow-[0_8px_20px_rgba(62,36,13,0.08)] transition-all duration-200 hover:-translate-x-0.5 hover:bg-[var(--c-fff4df)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-x-0"
                aria-label="เลื่อนดูกิจกรรมก่อนหน้า"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>

              <button
                type="button"
                onClick={() => setDesktopActivityStartIndex((current) => Math.min(maxDesktopActivityStartIndex, current + 1))}
                disabled={desktopActivityStartIndex >= maxDesktopActivityStartIndex}
                className="absolute top-1/2 right-[-22px] z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--c-d7c5a7)] bg-white text-[var(--c-5c3214)] shadow-[0_8px_20px_rgba(62,36,13,0.08)] transition-all duration-200 hover:translate-x-0.5 hover:bg-[var(--c-fff4df)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-x-0"
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
                      className="flex min-w-[calc((100%-1.5rem)/3)] flex-[0_0_calc((100%-1.5rem)/3)] flex-col rounded-[16px] border border-[var(--c-e4d3b3)] bg-white shadow-[0_10px_20px_rgba(62,36,13,0.05)] transition-transform duration-300 hover:-translate-y-1"
                    >
                      <div className="relative aspect-[1.2/1] overflow-hidden rounded-t-[22px] bg-[var(--c-f7e7cf)]">
                        {activity.imageSrc ? (
                          <Image src={activity.imageSrc} alt={activity.title} fill sizes="(max-width: 1023px) 100vw, 33vw" className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center px-6 text-center text-[18px] font-black text-[#5f7591]">
                            {activity.imageText}
                          </div>
                        )}
                        <span className={cn("absolute top-3 right-3 rounded-full border px-3 py-1 text-[11px] font-black backdrop-blur-[2px]", statusMeta.badgeClass)}>
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-3">
                        <h3 className="text-[15.5px] font-black text-[var(--c-2f261d)]">{activity.title}</h3>
                        <p className="mt-2 line-clamp-2 text-[13.5px] font-bold leading-relaxed text-[#667085]">{getActivityCardCopy(activity)}</p>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12px] font-black">
                          <span className="inline-flex items-center gap-1.5 text-[#5f7591]">
                            <CalendarDays className="h-4 w-4" strokeWidth={2.1} />
                            {activity.dateLabel}
                          </span>
                          <span className="text-[#18b989]">+{activity.points} คะแนน</span>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setExpandedActivity(activity)}
                          className="mt-4 h-10 rounded-[14px] border-[var(--c-d7c5a7)] bg-[var(--c-faf8f2)] text-[13px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff2d8)]"
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

<div className={cn("grid grid-cols-1 gap-3 md:gap-4 xl:grid-cols-[minmax(0,1.82fr)_minmax(310px,0.88fr)]", styles.communityGrid)}>
          <div className="flex flex-col gap-3">
            <Card className={cn("rounded-[16px] px-3 py-2 anim-fade md:rounded-[18px] md:px-3.5 md:py-2.5", styles.composer)} style={animStyle(0.04)}>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                  <ProfileAvatar
                    imageUrl={getSessionProfileImage(sessionUser)}
                    text={getSessionInitials(sessionUser)}
                    sizeClassName="h-[32px] w-[32px] md:h-[36px] md:w-[36px]"
                    textClassName="text-[16px] md:text-[18px]"
                  />
                  <Link href="/safety-culture/post" className="min-w-0 flex-1">
                    <div className={cn("flex h-[32px] items-center rounded-full border px-[12px] text-[13.5px] font-bold sm:whitespace-nowrap md:h-[36px]", styles.composerInput)}>
                      <span className="truncate">คุณกำลังคิดอะไรอยู่</span>
                    </div>
                  </Link>
                </div>
                <Link href="/safety-culture/post" className="flex-shrink-0">
                  <button
                    className={cn("flex h-[32px] w-[32px] items-center justify-center rounded-[8px] border md:h-[36px] md:w-[36px] md:rounded-[10px]", styles.composerImage)}
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

            <div className={cn("scrollbar-hide flex gap-2 overflow-x-auto py-0.5 anim-fade", styles.categories)} style={animStyle(0.05)}>
              {visibleCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "flex-shrink-0 whitespace-nowrap rounded-full border-[1.5px] px-4 py-2 text-[14px] font-extrabold transition-all outline-none focus:outline-none focus-visible:outline-none md:px-[18px] md:py-[10px] md:text-[15px]",
                    styles.categoryButton,
                    activeCategory === category
                      ? styles.categoryActive
                      : styles.categoryIdle
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
                  className={cn("anim-fade flex flex-col gap-2 rounded-[16px] p-3 transition-all hover:-translate-y-px md:gap-2.5 md:p-3.5", styles.postCard)}
                  style={animStyle(0.05 + idx * 0.05)}
                >
                  <div className="flex items-start justify-between gap-2.5 font-sarabun">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <ProfileAvatar imageUrl={post.avatarImageUrl || (post.isYou ? getSessionProfileImage(sessionUser) : null)} text={post.avatarText} />
                      <div className="min-w-0 flex flex-col gap-0">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="truncate text-[14.5px] font-extrabold text-[#173b6b]">{post.author}</span>
                          {post.isYou && (
                            <span className="ml-1 rounded-md bg-[var(--c-ddd9cd)] px-1.5 py-0.5 text-[9px] font-black tracking-wide text-[#5f7591]">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[11.5px] font-bold text-[var(--c-9f988d)]">{formatPostSubtext(post)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="mt-0.5 w-fit rounded-full border border-[var(--c-e8cda4)] bg-[var(--c-fff7e8)] px-2 py-0.5 text-[10.5px] font-black tracking-wide text-[var(--c-7b5625)]">
                        {post.category}
                      </span>
                      {post.isYou && editingPostId !== post.id && (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditPost(post)}
                            title="แก้ไขโพส"
                            aria-label="แก้ไขโพส"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--c-9f988d)] transition-colors hover:bg-[var(--c-f1e7d4)] hover:text-[var(--c-7b5625)]"
                          >
                            <Pencil className="h-[15px] w-[15px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingPostId(post.id)}
                            title="ลบโพส"
                            aria-label="ลบโพส"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--c-9f988d)] transition-colors hover:bg-[#fbe9e4] hover:text-[#c73a21]"
                          >
                            <Trash2 className="h-[15px] w-[15px]" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingPostId === post.id ? (
                    <div className="flex flex-col gap-2 font-sarabun">
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        rows={4}
                        autoFocus
                        className="w-full resize-y rounded-[14px] border-[1.5px] border-[var(--c-e3d0ae)] bg-white p-3 text-[14.5px] font-bold leading-relaxed text-[var(--c-33271a)] outline-none focus:border-[var(--c-c49a45)]"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelEditPost}
                          disabled={editSaving}
                          className="rounded-full border border-[var(--c-e3d0ae)] bg-white px-4 py-1.5 text-[13px] font-extrabold text-[var(--c-706557)] hover:bg-[var(--c-fff7e8)] disabled:opacity-50"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditPost(post.id)}
                          disabled={editSaving || !editDraft.trim()}
                          className="rounded-full bg-[var(--c-6a3f13)] px-4 py-1.5 text-[13px] font-extrabold text-white hover:bg-[var(--c-7b5625)] disabled:opacity-50"
                        >
                          {editSaving ? "กำลังบันทึก..." : "บันทึก"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[13px] md:text-[14px] font-bold leading-relaxed text-[var(--c-33271a)] font-sarabun">{post.body}</p>
                  )}

                  {(postPhotos.length > 0 || post.imageText) && (
                    <div className="flex flex-col gap-2 font-sarabun">
                      <div className="relative aspect-[1.34/1] w-full overflow-hidden rounded-[16px] border-[1.5px] border-[var(--c-e5cfad)] bg-[var(--c-f7e7cf)]">
                        {activePhoto ? (
                          <>
                            <button
                              type="button"
                              onClick={() => showExpandedPhotoAt(post, activePhotoIndex)}
                              className="absolute inset-0 z-0 cursor-zoom-in"
                              aria-label="ดูรูปภาพเต็ม"
                            >
                              <Image src={activePhoto.dataUrl} alt={`Attached post scene by ${post.author}`} fill sizes="(max-width: 1023px) 100vw, 640px" className="object-cover" />
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
                          <div className="flex h-full flex-col items-center justify-center gap-2 text-[15px] font-black lowercase text-[#5f7591]">
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
                                "h-[56px] w-[56px] overflow-hidden rounded-[10px] border-[1.5px] bg-[var(--c-efebe0)] p-0",
                                photoIndex === activePhotoIndex ? "border-[var(--c-f3b400)] shadow-[0_0_0_1px_var(--c-3b1d07)]" : "border-[var(--c-ddd9cd)]"
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
                        className="h-auto gap-1.5 rounded-lg px-0 py-0 text-[13.5px] font-black text-[#65676b] hover:bg-transparent hover:text-[#65676b] active:translate-y-0!"
                      >
                        <ThumbsUp className={cn("h-[18px] w-[18px] text-[#65676b]", post.hasLiked && "fill-[#65676b]")} strokeWidth={2.2} />
                      </Button>
                      <button
                        type="button"
                        onClick={() => setLikedByPostId(post.id)}
                        className="-ml-1.5 tabular-nums text-[13.5px] font-black text-[#5f7591] hover:underline"
                        aria-label={`ดูผู้กดถูกใจ ${post.likes} คน`}
                      >
                        {post.likes}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleComments(post)}
                        className="h-auto gap-1.5 rounded-lg px-0 py-0 text-[13.5px] font-black text-[#5f7591] hover:bg-transparent hover:text-foreground"
                      >
                        <MessageCircle className="h-[18px] w-[18px] text-[#5f7591]" strokeWidth={2.2} />
                        <span style={{ color: "#5f7591" }}>{commentCount}</span>
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
                            <div className="rounded-xl border-[1.5px] border-[var(--c-ddd9cd)] bg-[var(--c-faf8f2)] px-2.5 py-1.5 text-center text-[13.5px] font-[850] text-[#5f7591]">
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
                                  <ProfileAvatar
                                    imageUrl={comment.avatarImageUrl}
                                    text={comment.avatarText || comment.author.charAt(0) || "C"}
                                    sizeClassName="h-6 w-6"
                                    textClassName="text-[11px]"
                                  />
                                  <div className="flex min-w-0 flex-col items-start gap-1">
                                    <div className="min-w-0 rounded-[12px] border-[1.5px] border-[var(--c-ddd9cd)] bg-[var(--c-faf8f2)] px-2 py-1 text-[13px] font-bold leading-relaxed text-[#173b6b]">
                                      <span className="mb-0.5 flex flex-wrap items-baseline gap-x-1.5 text-[11.5px] font-black text-[#173b6b]">
                                        {comment.author}
                                        {formatThaiDateTime(comment.createdAt) && (
                                          <span className="text-[10.5px] font-bold text-[var(--c-9f988d)]">{formatThaiDateTime(comment.createdAt)}</span>
                                        )}
                                      </span>
                                      {editingComment?.postId === post.id && editingComment.commentId === comment.id ? (
                                        <div className="flex min-w-[220px] flex-col gap-1.5">
                                          <Input
                                            value={commentEditDraft}
                                            onChange={(event) => setCommentEditDraft(event.target.value)}
                                            onKeyDown={(event) => {
                                              if (event.key === "Enter") void handleSaveComment();
                                              if (event.key === "Escape") cancelEditComment();
                                            }}
                                            className="h-8 rounded-lg bg-white text-[13px] font-bold"
                                            autoFocus
                                          />
                                          <div className="flex gap-1.5">
                                            <button type="button" onClick={cancelEditComment} className="text-[11px] font-black text-[#5f7591]">ยกเลิก</button>
                                            <button type="button" disabled={commentSaving || !commentEditDraft.trim()} onClick={() => void handleSaveComment()} className="text-[11px] font-black text-[#0b69c7] disabled:opacity-50">บันทึก</button>
                                          </div>
                                        </div>
                                      ) : (
                                        comment.text
                                      )}
                                    </div>
                                    <div className="relative flex items-center gap-1 pl-0.5">
                                      {comment.isYou && !(editingComment?.postId === post.id && editingComment.commentId === comment.id) && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => startEditComment(post.id, comment)}
                                            className="px-1.5 py-[3px] text-[11.5px] font-[850] text-[#5f7591] hover:text-[#173b6b]"
                                          >
                                            แก้ไข
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => void handleDeleteComment(post.id, comment.id)}
                                            className="px-1.5 py-[3px] text-[11.5px] font-[850] text-[#b3271a] hover:text-[#7f1d1d]"
                                          >
                                            ลบ
                                          </button>
                                        </>
                                      )}
                                      <button
                                        className={cn(
                                          "inline-flex cursor-pointer items-center gap-1 rounded-full bg-transparent px-1.5 py-[3px] text-[11.5px] font-[850] leading-none text-[#5f7591] transition-all hover:bg-[var(--c-faf8f2)] hover:text-[#173b6b]",
                                          selectedReaction && "bg-[var(--c-fff7d6)] text-[#173b6b] shadow-[inset_0_0_0_1.5px_var(--c-f5bb00)]"
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
                                        <div className="absolute bottom-[calc(100%+6px)] left-0 z-20 flex gap-[3px] rounded-full border-[1.5px] border-[var(--c-ddd9cd)] bg-white p-[5px] shadow-[0_8px_22px_rgba(0,0,0,0.12)] animate-[scaleUp_0.16s_ease-out_both]">
                                          {COMMENT_REACTION_CHOICES.map((reaction) => (
                                            <button
                                              key={reaction.id}
                                              className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-transparent text-md transition-all hover:-translate-y-0.5 hover:scale-110 hover:bg-[var(--c-fff7d6)]"
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
                            if (e.key === "Enter") void handleCommentSubmit(post.id);
                          }}
                          placeholder="เขียนคอมเมนต์..."
                          className="h-[34px] min-w-0 flex-1 rounded-full border border-[var(--c-2a2118)] bg-white px-3.5 text-[13.5px] font-bold placeholder:text-[var(--c-9f988d)] focus-visible:border-[var(--c-2a2118)] focus-visible:ring-0"
                        />
                        <Button
                          size="sm"
                          className={cn(
                            "h-[34px] w-[34px] flex-shrink-0 rounded-full p-0 text-[13px] font-black text-white transition-colors duration-200",
                            (commentDrafts[post.id] || "").trim()
                              ? "bg-[var(--c-5c3214)] hover:bg-[var(--c-45250f)] active:bg-[var(--c-341b0b)]"
                              : "bg-[#A39E96] cursor-not-allowed hover:bg-[#A39E96]"
                          )}
                          onClick={() => void handleCommentSubmit(post.id)}
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
                {activeCategory === "ทีมของฉัน"
                  ? myTeamLoading
                    ? "กำลังโหลดโพสต์ทีมของฉัน..."
                    : myTeamLoaded
                      ? "ยังไม่มีโพสต์ในทีมของฉัน หรือบัญชียังไม่ได้ผูกทีม"
                      : "เลือกทีมของฉันเพื่อโหลดโพสต์จากทีม"
                  : "ยังไม่มีโพสต์ในหมวดหมู่นี้"}
              </Card>
            )}
          </div>

          <div className={cn("hidden flex-col gap-3 xl:flex", styles.sidebar)}>
            <LeadingTeamCard className={cn("anim-fade", styles.leadingCard)} style={animStyle(0.1)} />
            <TeamStandingsCard className={cn("anim-fade", styles.rankingCard)} style={animStyle(0.15)} />
            <PersonalRankingsCard className={cn("anim-fade", styles.rankingCard)} style={animStyle(0.2)} />
            <SUEATipCard className={cn("anim-fade", styles.tipCard)} style={animStyle(0.25)} tipText={tipText} />
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
                  {expandedPhoto.photos.length > 1 ? `รูปที่ ${expandedPhoto.index + 1} จาก ${expandedPhoto.photos.length}` : "ภาพเต็ม"}
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

            <div className="relative flex max-h-[calc(92vh-56px)] max-w-full items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.04)] shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              {expandedPhoto.photos.length > 1 ? (
                <button
                  type="button"
                  onClick={() => goToExpandedPhoto(-1)}
                  className="absolute top-1/2 left-3 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-white/10 text-white transition-all duration-200 hover:-translate-x-0.5 hover:bg-white/16"
                  aria-label="ดูรูปก่อนหน้า"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2.4} />
                </button>
              ) : null}
              <img
                src={expandedPhoto.photos[expandedPhoto.index]?.dataUrl}
                alt={expandedPhoto.alt}
                className="block max-h-[78vh] max-w-full object-contain"
              />
              {expandedPhoto.photos.length > 1 ? (
                <button
                  type="button"
                  onClick={() => goToExpandedPhoto(1)}
                  className="absolute top-1/2 right-3 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-white/10 text-white transition-all duration-200 hover:translate-x-0.5 hover:bg-white/16"
                  aria-label="ดูรูปถัดไป"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={2.4} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {expandedPost ? (
        <div
          className="fixed inset-0 z-[91] flex items-center justify-center bg-[rgba(20,13,7,0.82)] p-4 animate-[fadeIn_0.2s_ease-out_both] md:p-6"
          onClick={closeExpandedPost}
          role="dialog"
          aria-modal="true"
          aria-label="รายละเอียดโพสต์"
        >
          <div
            className="relative flex max-h-[86vh] w-full max-w-[430px] flex-col overflow-hidden rounded-[24px] border border-[var(--c-e4d3b3)] bg-[var(--c-fffdfa)] shadow-[0_24px_60px_rgba(0,0,0,0.28)] animate-[scaleUp_0.24s_cubic-bezier(0.175,0.885,0.32,1.12)_both] sm:max-w-[560px] md:max-h-[82vh] md:max-w-[620px] md:rounded-[24px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--c-eee2cb)] px-4 py-3 md:gap-4 md:px-5 md:py-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 md:gap-3">
                  <ProfileAvatar
                    imageUrl={expandedPost.avatarImageUrl || (expandedPost.isYou ? getSessionProfileImage(sessionUser) : null)}
                    text={expandedPost.avatarText}
                    sizeClassName="h-[40px] w-[40px] md:h-[36px] md:w-[36px]"
                    textClassName="text-[15px] md:text-[14px]"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-[16px] font-black text-[var(--c-2f261d)] md:text-[18px]">{expandedPost.author}</h3>
                    <p className="text-[11px] font-bold text-[#667085] md:text-[11px]">{formatPostSubtext(expandedPost)}</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeExpandedPost}
                className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--c-ddd9cd)] bg-white text-[#667085] transition-colors hover:bg-[var(--c-faf8f2)] md:h-9 md:w-9"
                aria-label="ปิดรายละเอียดโพสต์"
              >
                <X className="h-5 w-5" strokeWidth={2.3} />
              </button>
            </div>

            <div
              className="overflow-y-auto px-4 py-3.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-5 md:py-4"
            >
              <div className="flex flex-col gap-3.5 font-sarabun md:gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="w-fit rounded-full border border-[var(--c-e8cda4)] bg-[var(--c-fff7e8)] px-2 py-0.5 text-[10.5px] font-black tracking-wide text-[var(--c-7b5625)]">
                    {expandedPost.category}
                  </span>
                  <span className="w-fit rounded-full bg-[#e9fff4] px-2 py-0.5 text-[12px] font-black tracking-normal text-[#3D9A6A]">
                    + {expandedPost.points} pts
                  </span>
                </div>

                <p className="text-[14px] md:text-[14px] font-bold leading-relaxed text-[var(--c-33271a)]">{expandedPost.body}</p>

                {(expandedPostPhotos.length > 0 || expandedPost.imageText) && (
                  <div className="flex flex-col gap-2">
                    <div className="relative aspect-[1.18/1] w-full overflow-hidden rounded-[16px] border-[1.5px] border-[var(--c-e5cfad)] bg-[var(--c-f7e7cf)] md:aspect-[1.52/1]">
                      {expandedPostActivePhoto ? (
                        <>
                          {isNotificationPostPopup ? (
                            <div className="absolute inset-0 z-0">
                              <Image src={expandedPostActivePhoto.dataUrl} alt={`Attached post scene by ${expandedPost.author}`} fill sizes="(max-width: 1023px) 100vw, 640px" className="object-cover" />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => showExpandedPhotoAt(expandedPost, expandedPostActivePhotoIndex)}
                              className="absolute inset-0 z-0 cursor-zoom-in"
                              aria-label="ดูรูปภาพเต็ม"
                            >
                              <Image src={expandedPostActivePhoto.dataUrl} alt={`Attached post scene by ${expandedPost.author}`} fill sizes="(max-width: 1023px) 100vw, 640px" className="object-cover" />
                            </button>
                          )}
                          {expandedPostPhotos.length > 1 && (
                            <span className="absolute right-3 bottom-3 z-10 rounded-full bg-[rgba(53,50,48,0.86)] px-2.5 py-1 text-[13px] font-black text-white">
                              {expandedPostActivePhotoIndex + 1} / {expandedPostPhotos.length}
                            </span>
                          )}
                          {!isNotificationPostPopup ? (
                            <span className="pointer-events-none absolute top-3 right-3 z-10 rounded-full bg-[rgba(53,50,48,0.72)] px-2.5 py-1 text-[11px] font-black text-white">
                              แตะเพื่อดูเต็มรูป
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-[15px] font-black lowercase text-[#5f7591]">
                          <ImageIcon className="h-8 w-8" />
                          <span>{expandedPost.imageText}</span>
                        </div>
                      )}
                    </div>

                    {expandedPostPhotos.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pt-0.5">
                        {expandedPostPhotos.map((photo, photoIndex) => (
                          <button
                            key={photo.id}
                            onClick={() => setActivePhotoByPost((prev) => ({ ...prev, [expandedPost.id]: photoIndex }))}
                            className={cn(
                              "h-[56px] w-[56px] overflow-hidden rounded-[10px] border-[1.5px] bg-[var(--c-efebe0)] p-0",
                              photoIndex === expandedPostActivePhotoIndex ? "border-[var(--c-f3b400)] shadow-[0_0_0_1px_var(--c-3b1d07)]" : "border-[var(--c-ddd9cd)]"
                            )}
                          >
                            <Image src={photo.dataUrl} alt="" width={56} height={56} className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-0.5 flex items-center justify-between border-t border-[rgba(228,212,184,0.82)] pt-3">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(expandedPost.id)}
                      className="h-auto gap-1.5 rounded-lg px-0 py-0 text-[13.5px] font-black text-[#65676b] hover:bg-transparent hover:text-[#65676b] active:translate-y-0!"
                    >
                      <ThumbsUp className={cn("h-[18px] w-[18px] text-[#65676b]", expandedPost.hasLiked && "fill-[#65676b]")} strokeWidth={2.2} />
                    </Button>
                    <button
                      type="button"
                      onClick={() => setLikedByPostId(expandedPost.id)}
                      className="-ml-2 tabular-nums text-[13.5px] font-black text-[#5f7591] hover:underline"
                      aria-label={`ดูผู้กดถูกใจ ${expandedPost.likes} คน`}
                    >
                      {expandedPost.likes}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleComments(expandedPost)}
                      className="h-auto gap-1.5 rounded-lg px-0 py-0 text-[13.5px] font-black text-[#5f7591] hover:bg-transparent hover:text-foreground"
                    >
                      <MessageCircle className="h-[18px] w-[18px] text-[#5f7591]" strokeWidth={2.2} />
                      <span style={{ color: "#5f7591" }}>{expandedPostCommentCount}</span>
                    </Button>
                  </div>
                </div>

                {expandedComments[expandedPost.id] ? (
                  <div className="flex flex-col gap-2.5 border-t-[1.5px] border-[rgba(221,217,205,0.7)] pt-3">
                    {expandedPostComments.length > 0 && (
                      <div className="flex flex-col gap-2.5">
                        {expandedPostComments.map((comment) => {
                          const reactionData = getCommentReactionData(expandedPost.id, comment.id);
                          const selectedReaction = COMMENT_REACTION_CHOICES.find((reaction) => reaction.id === reactionData.selected);
                          const pickerKey = getCommentReactionKey(expandedPost.id, comment.id);

                          return (
                            <div key={comment.id} className="flex items-start gap-2">
                              <ProfileAvatar
                                imageUrl={comment.avatarImageUrl}
                                text={comment.avatarText || comment.author.charAt(0) || "C"}
                                sizeClassName="h-6 w-6"
                                textClassName="text-[11px]"
                              />
                              <div className="flex min-w-0 flex-col items-start gap-1">
                                <div className="min-w-0 rounded-[12px] border-[1.5px] border-[var(--c-ddd9cd)] bg-[var(--c-faf8f2)] px-2.5 py-1.5 text-[13px] font-bold leading-relaxed text-[#173b6b]">
                                  <span className="mb-0.5 flex flex-wrap items-baseline gap-x-1.5 text-[11.5px] font-black text-[#173b6b]">
                                    {comment.author}
                                    {formatThaiDateTime(comment.createdAt) && (
                                      <span className="text-[10.5px] font-bold text-[var(--c-9f988d)]">{formatThaiDateTime(comment.createdAt)}</span>
                                    )}
                                  </span>
                                  {editingComment?.postId === expandedPost.id && editingComment.commentId === comment.id ? (
                                    <div className="flex min-w-[220px] flex-col gap-1.5">
                                      <Input
                                        value={commentEditDraft}
                                        onChange={(event) => setCommentEditDraft(event.target.value)}
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter") void handleSaveComment();
                                          if (event.key === "Escape") cancelEditComment();
                                        }}
                                        className="h-8 rounded-lg bg-white text-[13px] font-bold"
                                        autoFocus
                                      />
                                      <div className="flex gap-1.5">
                                        <button type="button" onClick={cancelEditComment} className="text-[11px] font-black text-[#5f7591]">ยกเลิก</button>
                                        <button type="button" disabled={commentSaving || !commentEditDraft.trim()} onClick={() => void handleSaveComment()} className="text-[11px] font-black text-[#0b69c7] disabled:opacity-50">บันทึก</button>
                                      </div>
                                    </div>
                                  ) : (
                                    comment.text
                                  )}
                                </div>
                                <div className="relative flex items-center gap-1 pl-0.5">
                                  {comment.isYou && !(editingComment?.postId === expandedPost.id && editingComment.commentId === comment.id) && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => startEditComment(expandedPost.id, comment)}
                                        className="px-1.5 py-[3px] text-[11.5px] font-[850] text-[#5f7591] hover:text-[#173b6b]"
                                      >
                                        แก้ไข
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void handleDeleteComment(expandedPost.id, comment.id)}
                                        className="px-1.5 py-[3px] text-[11.5px] font-[850] text-[#b3271a] hover:text-[#7f1d1d]"
                                      >
                                        ลบ
                                      </button>
                                    </>
                                  )}
                                  <button
                                    className={cn(
                                      "inline-flex cursor-pointer items-center gap-1 rounded-full bg-transparent px-1.5 py-[3px] text-[11.5px] font-[850] leading-none text-[#5f7591] transition-all hover:bg-[var(--c-faf8f2)] hover:text-[#173b6b]",
                                      selectedReaction && "bg-[var(--c-fff7d6)] text-[#173b6b] shadow-[inset_0_0_0_1.5px_var(--c-f5bb00)]"
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
                                    <div className="absolute bottom-[calc(100%+6px)] left-0 z-20 flex gap-[3px] rounded-full border-[1.5px] border-[var(--c-ddd9cd)] bg-white p-[5px] shadow-[0_8px_22px_rgba(0,0,0,0.12)] animate-[scaleUp_0.16s_ease-out_both]">
                                      {COMMENT_REACTION_CHOICES.map((reaction) => (
                                        <button
                                          key={reaction.id}
                                          className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-transparent text-md transition-all hover:-translate-y-0.5 hover:scale-110 hover:bg-[var(--c-fff7d6)]"
                                          onClick={() => handleCommentReaction(expandedPost.id, comment.id, reaction.id)}
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
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-[var(--c-eee2cb)] bg-[var(--c-fffdfa)] px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] md:px-5 md:py-3">
              <div className="flex w-full items-center gap-2">
                <Input
                  value={commentDrafts[expandedPost.id] || ""}
                  onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [expandedPost.id]: e.target.value }))}
                  onFocus={() => setExpandedComments((prev) => ({ ...prev, [expandedPost.id]: true }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleCommentSubmit(expandedPost.id);
                  }}
                  placeholder="เขียนคอมเมนต์..."
                  className="h-[44px] min-w-0 flex-1 rounded-full border border-[var(--c-2a2118)] bg-white px-4 text-[14px] font-bold placeholder:text-[var(--c-9f988d)] focus-visible:border-[var(--c-2a2118)] focus-visible:ring-0"
                />
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    "h-[44px] min-w-[52px] rounded-full px-4 text-[13px] font-black text-white transition-colors duration-200",
                    (commentDrafts[expandedPost.id] || "").trim()
                      ? "bg-[var(--c-5c3214)] hover:bg-[var(--c-45250f)] active:bg-[var(--c-341b0b)]"
                      : "bg-[#A39E96] cursor-not-allowed hover:bg-[#A39E96]"
                  )}
                  onClick={() => void handleCommentSubmit(expandedPost.id)}
                  disabled={!(commentDrafts[expandedPost.id] || "").trim()}
                >
                  ส่ง
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {likedByPostId != null ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-[rgba(20,13,7,0.55)] p-4 animate-[fadeIn_0.2s_ease-out_both]"
          onClick={() => setLikedByPostId(null)}
          role="dialog"
          aria-modal="true"
          aria-label="ผู้ที่กดถูกใจ"
        >
          <div
            className="w-full max-w-[380px] overflow-hidden rounded-[22px] bg-white shadow-[0_20px_48px_rgba(34,25,11,0.2)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--c-eee2cb)] px-5 py-4">
              <div>
                <h3 className="text-[18px] font-black text-[var(--c-2f261d)]">ผู้ที่กดถูกใจ</h3>
                <p className="text-[12px] font-bold text-[#5f7591]">ทั้งหมด {likedByPost?.likes ?? 0} คน</p>
              </div>
              <button type="button" onClick={() => setLikedByPostId(null)} aria-label="ปิด" className="p-2 text-[#667085]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-3">
              {(likedByPost?.likedBy || []).length > 0 ? (
                (likedByPost?.likedBy || []).map((person) => (
                  <div key={person.userId} className="flex items-center gap-3 rounded-[14px] px-2 py-2.5">
                    <ProfileAvatar imageUrl={person.profileImageUrl} text={person.name.charAt(0)} sizeClassName="h-10 w-10" textClassName="text-[14px]" />
                    <span className="min-w-0 truncate text-[14px] font-black text-[var(--c-33271a)]">{person.name}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-[13px] font-bold text-[#5f7591]">ยังไม่มีผู้กดถูกใจโพสต์นี้</div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {deletingPostId != null ? (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-[rgba(20,13,7,0.55)] p-4 animate-[fadeIn_0.2s_ease-out_both]"
          onClick={() => setDeletingPostId(null)}
        >
          <div
            className="w-full max-w-[360px] rounded-[20px] bg-white p-6 shadow-[0_20px_48px_rgba(34,25,11,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[17px] font-black text-[#c73a21]">ยืนยันการลบโพส</h3>
            <p className="mt-2 text-[14px] font-bold leading-relaxed text-[var(--c-33271a)]">
              คุณแน่ใจหรือไม่ว่าต้องการลบโพสนี้? การลบจะไม่สามารถกู้คืนได้
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingPostId(null)}
                className="rounded-full border border-[var(--c-e3d0ae)] bg-white px-4 py-2 text-[13px] font-extrabold text-[var(--c-706557)] hover:bg-[var(--c-fff7e8)]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePost}
                className="rounded-full bg-[#c73a21] px-4 py-2 text-[13px] font-extrabold text-white hover:bg-[#a82e19]"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {expandedActivity ? (
        <div
          className="fixed inset-0 z-[92] flex items-center justify-center bg-[rgba(20,13,7,0.82)] p-3 animate-[fadeIn_0.2s_ease-out_both] md:p-5"
          onClick={closeExpandedActivity}
          role="dialog"
          aria-modal="true"
          aria-label="รายละเอียดกิจกรรม"
        >
          <div
            className="relative flex max-h-[94vh] w-full max-w-[920px] flex-col overflow-hidden rounded-[28px] border border-[var(--c-e4d3b3)] bg-[var(--c-fffdfa)] shadow-[0_24px_60px_rgba(0,0,0,0.28)] animate-[scaleUp_0.24s_cubic-bezier(0.175,0.885,0.32,1.12)_both]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--c-eee2cb)] px-5 py-4 md:px-7 md:py-5">
              <div className="min-w-0">
                <h3 className="text-[26px] font-black text-[var(--c-2f261d)]">{expandedActivity.title}</h3>
                <p className="mt-1 text-[13px] font-bold text-[#667085]">{expandedActivity.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={closeExpandedActivity}
                className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center bg-transparent text-[#667085] transition-colors hover:text-[#173b6b]"
                aria-label="ปิดรายละเอียดกิจกรรม"
              >
                <X className="h-5 w-5" strokeWidth={2.3} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 md:px-7 md:py-6">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
                <div className="self-start overflow-hidden rounded-[24px] border border-[var(--c-eee2cb)] bg-[var(--c-faf8f2)]">
                  {expandedActivity.imageSrc ? (
                    <img
                      src={expandedActivity.imageSrc}
                      alt={expandedActivity.title}
                      className="block aspect-[4/3] max-h-[520px] min-h-[260px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] min-h-[260px] items-center justify-center px-8 text-center text-[22px] font-black text-[#5f7591]">
                      {expandedActivity.imageText}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Card className="rounded-[22px] border-[var(--c-e4d3b3)] bg-white p-5 shadow-none">
                    <div className="mb-3 text-[18px] font-black text-[var(--c-2f261d)]">รายละเอียดของกิจกรรมนี้:</div>
                    <p className="text-[15px] font-bold leading-relaxed text-[#667085]">{expandedActivity.details}</p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#effff6] px-3 py-1.5 text-[13px] font-black text-[#18b989]">
                      <Trophy className="h-4 w-4" strokeWidth={2.2} />
                      Points: {expandedActivity.points}
                    </div>
                  </Card>

                  <Card className="rounded-[22px] border-[var(--c-e4d3b3)] bg-white p-5 shadow-none">
                    <div className="mb-3 text-[18px] font-black text-[var(--c-2f261d)]">สถานะกิจกรรม:</div>
                    <div className="flex flex-col items-center justify-center gap-3 rounded-[18px] border border-[var(--c-eee2cb)] bg-[var(--c-faf8f2)] px-4 py-5 text-center">
                      <Clock3 className={cn("h-14 w-14", getActivityStatusMeta(expandedActivity.status).iconClass)} strokeWidth={1.8} />
                      <div className="text-[20px] font-black text-[var(--c-5c3214)]">{getActivityStatusMeta(expandedActivity.status).label}</div>
                      <p className="max-w-[260px] text-[14px] font-bold leading-relaxed text-[#667085]">
                        {getActivityStatusMeta(expandedActivity.status).note}
                      </p>
                      <span className="rounded-full border border-[var(--c-ddd9cd)] bg-white px-3 py-1 text-[12px] font-black text-[var(--c-5c3214)]">
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
    </>
  );
}
