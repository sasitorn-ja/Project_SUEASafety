"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ImageIcon, MessageCircle, Send, ThumbsUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FullscreenImageViewer } from "@/components/safety-culture/fullscreen-image-viewer";
import { apiFetch } from "@/lib/api-client";
import { COMMENT_REACTION_CHOICES, formatPostSubtext, formatThaiDateTime } from "@/lib/safety-culture";
import { cn } from "@/lib/utils";
import { useAppState, useAppActions, type Comment as CommentType, type Post } from "@/providers/app-providers";
import { getSessionInitials, getSessionProfileImage, useSessionUser } from "@/lib/session-user";

const POINT_UNIT = "Coin";

type ApiPost = {
  id: string;
  authorId?: string;
  authorName?: string;
  authorEmail?: string | null;
  authorProfileImageUrl?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  eventId?: string | null;
  category?: string;
  content?: string;
  pointsAwarded?: number | string;
  createdAt?: string;
  likeCount?: number | string;
  commentCount?: number | string;
  hasLiked?: boolean;
  likedBy?: Array<{ userId?: string; name?: string; profileImageUrl?: string | null }>;
  photos?: Array<{ id?: string; url?: string; dataUrl?: string; type?: string }>;
};

type ApiComment = {
  id: string | number;
  authorId?: string | number;
  authorName?: string | null;
  authorProfileImageUrl?: string | null;
  content?: string;
  text?: string;
  createdAt?: string;
  reactions?: Record<string, number>;
  viewerReaction?: string | null;
};

function avatarText(name?: string | null) {
  return (name || "U").trim().charAt(0).toUpperCase() || "U";
}

function postFromApi(apiPost: ApiPost, viewerId?: string | number | null): Post {
  const author = apiPost.authorName || "Unknown user";
  const teamName = apiPost.teamName || null;
  const organizationName = apiPost.organizationName || null;
  return {
    id: Number(apiPost.id),
    apiId: String(apiPost.id),
    author,
    avatarBg: "var(--brand-accent)",
    avatarColor: "#1A1A1A",
    avatarText: avatarText(author),
    avatarImageUrl: apiPost.authorProfileImageUrl || null,
    subtext: organizationName || teamName || "Safety Culture",
    category: apiPost.category || "ทั่วไป",
    body: apiPost.content || "",
    photos: Array.isArray(apiPost.photos)
      ? apiPost.photos
          .map((photo, index) => {
            const dataUrl = photo.url || photo.dataUrl || "";
            return {
              id: String(photo.id || `${apiPost.id}-photo-${index + 1}`),
              dataUrl,
              url: dataUrl,
              type: String(photo.type || "upload"),
            };
          })
          .filter((photo) => photo.dataUrl)
      : [],
    likes: Math.max(0, Number(apiPost.likeCount) || 0),
    comments: Math.max(0, Number(apiPost.commentCount) || 0),
    points: Math.max(0, Number(apiPost.pointsAwarded) || 0),
    hasLiked: Boolean(apiPost.hasLiked),
    likedBy: Array.isArray(apiPost.likedBy)
      ? apiPost.likedBy.map((person) => ({
          userId: String(person.userId || ""),
          name: String(person.name || "ผู้ใช้งาน"),
          profileImageUrl: person.profileImageUrl || null,
        }))
      : [],
    isYou: Boolean(viewerId && apiPost.authorId && String(viewerId) === String(apiPost.authorId)),
    createdAt: apiPost.createdAt ? new Date(apiPost.createdAt).getTime() : Date.now(),
    authorId: apiPost.authorId ? String(apiPost.authorId) : undefined,
    authorEmail: apiPost.authorEmail ?? null,
    organizationId: apiPost.organizationId ? String(apiPost.organizationId) : null,
    organizationName,
    teamId: apiPost.teamId ? String(apiPost.teamId) : null,
    teamName,
    team: teamName || undefined,
    location: organizationName || undefined,
    feedEventId: apiPost.eventId ? String(apiPost.eventId) : undefined,
  };
}

function commentFromApi(comment: ApiComment, viewerId?: string | number | null): CommentType {
  const author = comment.authorName || "Unknown user";
  const authorId = comment.authorId ? String(comment.authorId) : undefined;
  return {
    id: String(comment.id),
    authorId,
    author,
    avatarText: avatarText(author),
    avatarImageUrl: comment.authorProfileImageUrl || null,
    text: comment.content || comment.text || "",
    reactions: comment.reactions || {},
    viewerReaction: comment.viewerReaction || null,
    isYou: Boolean(viewerId && authorId && String(viewerId) === authorId),
    createdAt: comment.createdAt ? new Date(comment.createdAt).getTime() : Date.now(),
  };
}

function ProfileAvatar({
  imageUrl,
  text,
  className,
}: {
  imageUrl?: string | null;
  text: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#1A1A1A] bg-[var(--brand-accent)] text-[15px] font-black text-[#173b6b]", className)}>
      {imageUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        text
      )}
    </div>
  );
}

export default function SafetyCulturePostDetailPage() {
  const params = useParams<{ postId: string }>();
  const postId = Number(params?.postId);
  const { user: sessionUser } = useSessionUser();
  const { toggleLike, addComment, fetchComments, deleteComment } = useAppActions();
  const { posts: localPosts } = useAppState();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [fullscreenPhotoIndex, setFullscreenPhotoIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentReactionState, setCommentReactionState] = useState<Record<string, { selected: string | null; counts: Record<string, number> }>>({});
  const [openCommentReactionPicker, setOpenCommentReactionPicker] = useState<string | null>(null);
  const viewerId = sessionUser?.id ?? sessionUser?.sub ?? null;

  const loadPost = useCallback(async () => {
    if (!Number.isFinite(postId) || postId <= 0) {
      setError("ไม่พบโพสต์นี้");
      setLoading(false);
      return;
    }
    setLoading(true);
    const [postResult, commentsResult] = await Promise.all([
      apiFetch<{ post: ApiPost }>(`/api/safety-culture/posts/${postId}`),
      apiFetch<{ items: ApiComment[] }>(`/api/safety-culture/posts/${postId}/comments?limit=100`),
    ]);
    if (!postResult.ok || !postResult.data?.post) {
      const localPost = localPosts.find((p) => Number(p.id) === postId);
      if (localPost) {
        setPost(localPost);
        setComments(Array.isArray(localPost.comments) ? localPost.comments : []);
        setError("");
        setLoading(false);
        return;
      }
      setError("ไม่พบโพสต์นี้ หรือโพสต์ถูกลบแล้ว");
      setLoading(false);
      return;
    }
    setPost(postFromApi(postResult.data.post, viewerId));
    setComments(Array.isArray(commentsResult.data?.items) ? commentsResult.data.items.map((item) => commentFromApi(item, viewerId)) : []);
    setError("");
    setLoading(false);
  }, [postId, viewerId]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  const photos = useMemo(() => post?.photos.filter((photo) => photo.dataUrl) ?? [], [post]);
  const selectedPhoto = photos[selectedPhotoIndex] || photos[0] || null;
  const commentCount = comments.length || (post && !Array.isArray(post.comments) ? post.comments : 0) || 0;
  const goToFullscreenPhoto = useCallback((direction: -1 | 1) => {
    setFullscreenPhotoIndex((current) => {
      if (current === null || photos.length <= 1) return current;
      return (current + direction + photos.length) % photos.length;
    });
  }, [photos.length]);

  useEffect(() => {
    setSelectedPhotoIndex(0);
  }, [post?.id]);

  useEffect(() => {
    if (selectedPhotoIndex < photos.length) return;
    setSelectedPhotoIndex(0);
  }, [photos.length, selectedPhotoIndex]);

  const handleLike = () => {
    if (!post) return;
    const nextLiked = !post.hasLiked;
    setPost({
      ...post,
      hasLiked: nextLiked,
      likes: nextLiked ? post.likes + 1 : Math.max(0, post.likes - 1),
    });
    toggleLike(post.apiId || post.id);
  };

  const handleCommentSubmit = async () => {
    if (!post) return;
    const text = commentDraft.trim();
    if (!text) return;
    const ok = await addComment(post.apiId || post.id, text);
    if (!ok) {
      window.alert("ไม่สามารถบันทึกความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    setCommentDraft("");
    const latestComments = await fetchComments(post.apiId || post.id);
    setComments(latestComments);
    setPost((current) => current ? { ...current, comments: latestComments } : current);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;
    const ok = await deleteComment(post.id, commentId);
    if (!ok) {
      window.alert("ไม่สามารถลบความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    setComments((current) => current.filter((comment) => comment.id !== commentId));
  };

  const getCommentReactionKey = (commentId: string) => `${postId}:${commentId}`;

  const getDefaultCommentReactions = () =>
    COMMENT_REACTION_CHOICES.reduce((counts, reaction) => {
      counts[reaction.id] = 0;
      return counts;
    }, {} as Record<string, number>);

  const getCommentReactionData = (comment: CommentType) => {
    const key = getCommentReactionKey(comment.id);
    return commentReactionState[key] || {
      selected: comment.viewerReaction || null,
      counts: { ...getDefaultCommentReactions(), ...(comment.reactions || {}) },
    };
  };

  const handleCommentReaction = async (comment: CommentType, reactionId: string) => {
    const key = getCommentReactionKey(comment.id);
    const current = getCommentReactionData(comment);
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
    setComments((currentComments) =>
      currentComments.map((item) =>
        item.id === comment.id
          ? { ...item, viewerReaction: nextSelected, reactions: nextCounts }
          : item
      )
    );
    setOpenCommentReactionPicker(null);

    const response = await fetch(`/api/safety-culture/comments/${comment.id}/reactions`, {
      method: nextSelected ? "POST" : "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: nextSelected ? JSON.stringify({ reactionType: nextSelected }) : undefined,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) {
      setCommentReactionState((prev) => ({ ...prev, [key]: current }));
      setComments((currentComments) =>
        currentComments.map((item) =>
          item.id === comment.id
            ? { ...item, viewerReaction: current.selected, reactions: current.counts }
            : item
        )
      );
      window.alert("ไม่สามารถบันทึกความรู้สึกได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="page-shell-wide min-h-[calc(100dvh-var(--topbar-h))] pt-2.5 pb-8 font-sarabun">
      <div className="mx-auto flex w-full max-w-[860px] flex-col gap-3">
        <Link
          href="/safety-culture"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d7e5f3] bg-white px-3.5 py-2 text-[13px] font-black text-[#173b6b] transition-colors hover:bg-[#f5faff]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          กลับไปหน้าฟีด
        </Link>

        {loading ? (
          <Card className="rounded-[18px] border-[#d8e5f3] bg-white p-8 text-center text-[14px] font-black text-[#5f7591]">กำลังโหลดโพสต์...</Card>
        ) : error || !post ? (
          <Card className="rounded-[18px] border-[#d8e5f3] bg-white p-8 text-center">
            <p className="text-[16px] font-black text-[#173b6b]">{error || "ไม่พบโพสต์นี้"}</p>
            <Link href="/safety-culture" className="mt-4 inline-flex rounded-full bg-[#0B82F0] px-4 py-2 text-[13px] font-black text-white">
              กลับไปหน้าฟีด
            </Link>
          </Card>
        ) : (
          <Card className="overflow-hidden rounded-[18px] border-[#d8e5f3] bg-white">
            <div className="flex items-start justify-between gap-3 border-b border-[#d7e6f6] bg-[#f5faff] px-4 py-3.5 md:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <ProfileAvatar imageUrl={post.avatarImageUrl || (post.isYou ? getSessionProfileImage(sessionUser) : null)} text={post.avatarText || getSessionInitials(sessionUser)} />
                <div className="min-w-0">
                  <h1 className="truncate text-[18px] font-black text-[#173b6b]">{post.author}</h1>
                  <p className="text-[11.5px] font-bold text-[#667085]">{formatPostSubtext(post)}</p>
                </div>
              </div>
              <span className="mt-1 rounded-full border border-[var(--c-e8cda4)] bg-[var(--c-fff7e8)] px-2.5 py-1 text-[11px] font-black text-[var(--c-7b5625)]">
                {post.category}
              </span>
            </div>

            <div className="flex flex-col gap-4 px-4 py-4 md:px-5">
              <p className="whitespace-pre-wrap text-[15px] font-bold leading-relaxed text-[var(--c-33271a)] md:text-[16px]">{post.body}</p>

              {photos.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="relative overflow-hidden rounded-[16px] border border-[#d8e5f3] bg-[#eef3f8]">
                    <button
                      type="button"
                      onClick={() => setFullscreenPhotoIndex(selectedPhotoIndex)}
                      className="relative flex aspect-[16/10] w-full cursor-zoom-in items-center justify-center"
                      aria-label={`ดูรูปภาพเต็ม รูปที่ ${selectedPhotoIndex + 1}`}
                    >
                      {selectedPhoto ? (
                        <Image
                          src={selectedPhoto.dataUrl}
                          alt={`Attached post scene by ${post.author}`}
                          fill
                          sizes="(max-width: 900px) 100vw, 860px"
                          className="object-cover"
                        />
                      ) : null}
                      {photos.length > 1 ? (
                        <span className="absolute right-3 top-3 rounded-full bg-[rgba(23,59,107,0.72)] px-2.5 py-1 text-[11px] font-black text-white">
                          {selectedPhotoIndex + 1}/{photos.length}
                        </span>
                      ) : null}
                    </button>
                  </div>

                  {photos.length > 1 ? (
                    <div className="scrollbar-hide grid grid-cols-4 gap-2 overflow-x-auto sm:grid-cols-5">
                      {photos.map((photo, photoIndex) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setSelectedPhotoIndex(photoIndex)}
                          className={cn(
                            "relative aspect-square overflow-hidden rounded-[14px] border-2 bg-[#eef3f8] transition-all",
                            photoIndex === selectedPhotoIndex
                              ? "border-[#0B82F0] shadow-[0_8px_18px_rgba(11,130,240,0.18)]"
                              : "border-[#d8e5f3] hover:border-[#8fc6f8]"
                          )}
                          aria-label={`เลือกรูปที่ ${photoIndex + 1}`}
                        >
                          <Image
                            src={photo.dataUrl}
                            alt={`Thumbnail ${photoIndex + 1} by ${post.author}`}
                            fill
                            sizes="(max-width: 640px) 22vw, 120px"
                            className="object-cover"
                          />
                          {photoIndex === selectedPhotoIndex ? (
                            <span className="absolute inset-x-0 bottom-0 bg-[rgba(11,130,240,0.86)] py-1 text-center text-[10px] font-black text-white">
                              กำลังดู
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : post.imageText ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-[16px] border border-[#d8e5f3] bg-[#eef3f8] text-[15px] font-black text-[#5f7591]">
                  <ImageIcon className="h-8 w-8" />
                  <span>{post.imageText}</span>
                </div>
              ) : null}

              <div className="flex items-center justify-between border-t border-[rgba(228,212,184,0.82)] pt-3">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={handleLike} className="h-auto gap-1.5 px-0 py-0 text-[14px] font-black text-[#65676b] hover:bg-transparent">
                    <ThumbsUp className={cn("h-[19px] w-[19px]", post.hasLiked && "fill-[#65676b]")} strokeWidth={2.2} />
                    <span>{post.likes}</span>
                  </Button>
                  <div className="inline-flex items-center gap-1.5 text-[14px] font-black text-[#5f7591]">
                    <MessageCircle className="h-[19px] w-[19px]" strokeWidth={2.2} />
                    <span>{commentCount}</span>
                  </div>
                </div>
                {post.isYou ? (
                  <span className="rounded-full bg-[#e9fff4] px-2.5 py-1 text-[12px] font-black text-[#3D9A6A]">+ {post.points} {POINT_UNIT}</span>
                ) : null}
              </div>
            </div>

            <div className="border-t border-[#d7e6f6] bg-white px-4 py-3 md:px-5">
              <div className="flex items-center gap-2">
                <ProfileAvatar imageUrl={getSessionProfileImage(sessionUser)} text={getSessionInitials(sessionUser)} className="h-8 w-8 text-[12px]" />
                <Input
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleCommentSubmit();
                  }}
                  placeholder="เขียนความคิดเห็น..."
                  className="h-10 rounded-full bg-white text-[13px] font-bold"
                />
                <Button type="button" onClick={() => void handleCommentSubmit()} disabled={!commentDraft.trim()} className="h-10 rounded-full bg-[#0B82F0] px-4 text-white">
                  <Send className="h-4 w-4" strokeWidth={2.4} />
                </Button>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {comments.length > 0 ? comments.map((comment) => {
                  const reactionData = getCommentReactionData(comment);
                  const selectedReaction = COMMENT_REACTION_CHOICES.find((reaction) => reaction.id === reactionData.selected);
                  const pickerKey = getCommentReactionKey(comment.id);

                  return (
                  <div key={comment.id} className="flex items-start gap-2.5">
                    <ProfileAvatar imageUrl={comment.avatarImageUrl} text={comment.avatarText || avatarText(comment.author)} className="h-8 w-8 text-[12px]" />
                    <div className="min-w-0 flex-1">
                      <div className="inline-block max-w-full rounded-[14px] border border-[#d7e6f6] bg-white px-3 py-2 text-[13px] font-bold leading-relaxed text-[#173b6b]">
                        <div className="mb-0.5 flex flex-wrap items-baseline gap-x-1.5">
                          <span className="text-[12px] font-black">{comment.author}</span>
                          {formatThaiDateTime(comment.createdAt) ? (
                            <span className="text-[10.5px] font-bold text-[#9f988d]">{formatThaiDateTime(comment.createdAt)}</span>
                          ) : null}
                        </div>
                        {comment.text}
                      </div>
                      <div className="relative mt-1 flex items-center gap-1">
                        {comment.isYou ? (
                          <button
                            type="button"
                            onClick={() => void handleDeleteComment(comment.id)}
                            className="inline-flex items-center gap-1 px-1 text-[11.5px] font-black text-[#b3271a] hover:text-[#7f1d1d]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            ลบ
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full bg-transparent px-1.5 py-[3px] text-[11.5px] font-black leading-none text-[#5f7591] transition-colors hover:bg-[#f5faff] hover:text-[#173b6b]",
                            selectedReaction && "bg-[#eaf6ff] text-[#173b6b] shadow-[inset_0_0_0_1px_#8fc8ff]"
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
                        {openCommentReactionPicker === pickerKey ? (
                          <div className="absolute bottom-[calc(100%+6px)] left-0 z-20 flex gap-[3px] rounded-full border border-[#d7e6f6] bg-white p-[5px] shadow-[0_8px_22px_rgba(0,0,0,0.12)]">
                            {COMMENT_REACTION_CHOICES.map((reaction) => (
                              <button
                                key={reaction.id}
                                type="button"
                                className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-transparent text-md transition-all hover:-translate-y-0.5 hover:scale-110 hover:bg-[#eaf6ff]"
                                onClick={() => void handleCommentReaction(comment, reaction.id)}
                                title={reaction.label}
                              >
                                {reaction.icon}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
                }) : (
                  <div className="rounded-[14px] border border-dashed border-[#d8e5f3] bg-white px-4 py-5 text-center text-[13px] font-bold text-[#5f7591]">
                    ยังไม่มีความคิดเห็น
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
      <FullscreenImageViewer
        open={fullscreenPhotoIndex !== null}
        photos={photos}
        index={fullscreenPhotoIndex ?? 0}
        alt={post ? `Attached post scene by ${post.author}` : "ภาพเต็มของโพสต์"}
        onClose={() => setFullscreenPhotoIndex(null)}
        onPrevious={() => goToFullscreenPhoto(-1)}
        onNext={() => goToFullscreenPhoto(1)}
      />
    </div>
  );
}
