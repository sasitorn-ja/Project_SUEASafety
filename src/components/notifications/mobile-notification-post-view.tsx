"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronLeft, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { COMMENT_REACTION_CHOICES, formatPostSubtext } from "@/lib/safety-culture";
import { type Comment as CommentType, type Post } from "@/providers/app-providers";
import { useAppTheme } from "@/providers/theme-provider";

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

type MobileNotificationPostViewProps = {
  post: Post;
  onBack: () => void;
  onToggleLike: (postId: number) => void;
  onAddComment: (postId: number, text: string) => void;
};

export function MobileNotificationPostView({
  post,
  onBack,
  onToggleLike,
  onAddComment,
}: MobileNotificationPostViewProps) {
  const { theme } = useAppTheme();
  const [commentDraft, setCommentDraft] = useState("");
  const [expandedComments, setExpandedComments] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [commentReactionState, setCommentReactionState] = useState<Record<string, { selected: string | null; counts: Record<string, number> }>>({});
  const [openCommentReactionPicker, setOpenCommentReactionPicker] = useState<string | null>(null);

  const isWangjai = theme === "wangjai";
  const pageBackgroundClass = isWangjai
    ? "bg-[linear-gradient(180deg,#eef4fb_0%,#f7fbff_220px,#f8fbff_100%)]"
    : "bg-[linear-gradient(180deg,#f6efe3_0%,#fdf8f0_220px,#fffdf8_100%)]";
  const headerBorderClass = isWangjai ? "border-[#dbe8f7]" : "border-[var(--c-eee2cb)]";
  const headerSurfaceClass = isWangjai ? "bg-[rgba(247,251,255,0.96)]" : "bg-[rgba(255,253,248,0.96)]";
  const headerButtonClass = isWangjai
    ? "border-[#cfe0f4] bg-white text-[#42698d]"
    : "border-[var(--c-ddd9cd)] bg-white text-[#667085]";
  const cardBorderClass = isWangjai ? "border-[#dbe8f7] bg-white" : "border-[var(--c-e4d3b3)] bg-[var(--c-fffdfa)]";
  const metaTextClass = isWangjai ? "text-[#6483a3]" : "text-[#667085]";
  const titleTextClass = isWangjai ? "text-[#183b5e]" : "text-[var(--c-2f261d)]";
  const bodyTextClass = isWangjai ? "text-[#31506d]" : "text-[var(--c-33271a)]";
  const tagClass = isWangjai
    ? "border-[#cfe1f7] bg-[#edf6ff] text-[#2f69a3]"
    : "border-[var(--c-e8cda4)] bg-[var(--c-fff7e8)] text-[var(--c-7b5625)]";
  const imageFrameClass = isWangjai ? "border-[#d7e7f8] bg-[#edf6ff]" : "border-[var(--c-e5cfad)] bg-[var(--c-f7e7cf)]";
  const thumbBaseClass = isWangjai ? "border-[#cfe0f4] bg-[#edf6ff]" : "border-[var(--c-ddd9cd)] bg-[var(--c-efebe0)]";
  const thumbActiveClass = isWangjai ? "border-[#69b7f2] shadow-[0_0_0_1px_#2f69a3]" : "border-[var(--c-f3b400)] shadow-[0_0_0_1px_var(--c-3b1d07)]";
  const dividerClass = isWangjai ? "border-[#dbe8f7]" : "border-[rgba(228,212,184,0.82)]";
  const commentDividerClass = isWangjai ? "border-[#dbe8f7]" : "border-[rgba(221,217,205,0.7)]";
  const commentBubbleClass = isWangjai
    ? "border-[#d7e7f8] bg-[#f5faff] text-[#28445f]"
    : "border-[var(--c-ddd9cd)] bg-[var(--c-faf8f2)] text-[#33312C]";
  const reactionActiveClass = isWangjai
    ? "bg-[#edf6ff] text-[#1f5f95] shadow-[inset_0_0_0_1.5px_#69b7f2]"
    : "bg-[var(--c-fff7d6)] text-[#1A1A1A] shadow-[inset_0_0_0_1.5px_var(--c-f5bb00)]";
  const inputBorderClass = isWangjai ? "border-[#7fa8d0]" : "border-[var(--c-2a2118)]";
  const primaryButtonClass = isWangjai
    ? "bg-[#2f69a3] hover:bg-[#275988] active:bg-[#214a72]"
    : "bg-[var(--c-5c3214)] hover:bg-[var(--c-45250f)] active:bg-[var(--c-341b0b)]";

  const postPhotos = useMemo(() => {
    if (Array.isArray(post.photos) && post.photos.length > 0) {
      return post.photos.filter((photo) => photo?.dataUrl);
    }
    return post.imageData ? [{ id: `${post.id}-legacy`, dataUrl: post.imageData, type: "legacy" }] : [];
  }, [post.id, post.imageData, post.photos]);

  const activePhoto = postPhotos[activePhotoIndex] || postPhotos[0];
  const postComments = useMemo(() => getPostComments(post), [post]);
  const commentCount = getCommentCount(post);

  const getCommentReactionKey = (commentId: string) => `${post.id}:${commentId}`;

  const getDefaultCommentReactions = () =>
    COMMENT_REACTION_CHOICES.reduce((counts, reaction) => {
      counts[reaction.id] = 0;
      return counts;
    }, {} as Record<string, number>);

  const getCommentReactionData = (commentId: string) => {
    const key = getCommentReactionKey(commentId);
    return commentReactionState[key] || { selected: null, counts: getDefaultCommentReactions() };
  };

  const handleCommentReaction = (commentId: string, reactionId: string) => {
    const key = getCommentReactionKey(commentId);

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

  const handleCommentSubmit = () => {
    const text = commentDraft.trim();
    if (!text) return;
    onAddComment(post.id, text);
    setCommentDraft("");
    setExpandedComments(true);
  };

  return (
    <div className={cn("flex h-full flex-col overflow-hidden font-sarabun", pageBackgroundClass)}>
      <div className={cn("sticky top-0 z-10 border-b px-3 py-3 backdrop-blur-sm", headerBorderClass, headerSurfaceClass)}>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className={cn("inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border", headerButtonClass)}
            aria-label="กลับไปหน้าการแจ้งเตือน"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.4} />
          </button>
          <div className="min-w-0">
            <div className={cn("text-[16px] font-black", titleTextClass)}>โพสต์จากการแจ้งเตือน</div>
            <div className={cn("truncate text-[11.5px] font-bold", isWangjai ? "text-[#6f8ba7]" : "text-[#8E8A81]")}>{post.author}</div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <article className={cn("flex flex-col gap-3.5 rounded-[24px] border p-3.5 shadow-[0_18px_34px_rgba(62,36,13,0.08)]", cardBorderClass)}>
          <div className="flex items-start gap-2.5">
            <div
              className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full border-2 border-[#1A1A1A] text-[16px] font-black"
              style={{ backgroundColor: post.avatarBg, color: post.avatarColor }}
            >
              {post.avatarText}
            </div>
            <div className="min-w-0 flex-1">
              <div className={cn("truncate text-[15px] font-black", titleTextClass)}>{post.author}</div>
              <div className={cn("text-[11px] font-bold", metaTextClass)}>{formatPostSubtext(post)}</div>
            </div>
            <span className={cn("rounded-full border px-2 py-0.5 text-[10.5px] font-black tracking-wide", tagClass)}>{post.category}</span>
          </div>

          <p className={cn("text-[14px] font-bold leading-relaxed", bodyTextClass)}>{post.body}</p>

          {(postPhotos.length > 0 || post.imageText) && (
            <div className="flex flex-col gap-2">
              <div className={cn("relative aspect-[1.08/1] w-full overflow-hidden rounded-[18px] border-[1.5px]", imageFrameClass)}>
                {activePhoto ? (
                  <>
                    <Image src={activePhoto.dataUrl} alt={`Attached post scene by ${post.author}`} fill sizes="(max-width: 768px) 100vw, 480px" className="object-cover" />
                    {postPhotos.length > 1 ? (
                      <span className="absolute right-3 bottom-3 z-10 rounded-full bg-[rgba(53,50,48,0.86)] px-2.5 py-1 text-[12px] font-black text-white">
                        {activePhotoIndex + 1} / {postPhotos.length}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <div className={cn("flex h-full flex-col items-center justify-center gap-2 text-[15px] font-black", isWangjai ? "text-[#6f8ba7]" : "text-[#8E8A81]")}>
                    <ImageIcon className="h-8 w-8" />
                    <span>{post.imageText}</span>
                  </div>
                )}
              </div>

              {postPhotos.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto pt-0.5">
                  {postPhotos.map((photo, photoIndex) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setActivePhotoIndex(photoIndex)}
                      className={cn("h-[58px] w-[58px] overflow-hidden rounded-[10px] border-[1.5px] p-0", thumbBaseClass, photoIndex === activePhotoIndex ? thumbActiveClass : "")}
                    >
                      <Image src={photo.dataUrl} alt="" width={58} height={58} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          <div className={cn("flex items-center justify-between border-t pt-3", dividerClass)}>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleLike(post.id)}
                className={cn(
                  "h-auto gap-1.5 rounded-lg px-0 py-0 text-[13.5px] font-black hover:bg-transparent",
                  post.hasLiked ? "text-[#D9383A]" : isWangjai ? "text-[#54738f] hover:text-[#183b5e]" : "text-[#7d776c] hover:text-foreground"
                )}
              >
                <span style={{ color: post.hasLiked ? "#D9383A" : "#8E8A81" }}>❤</span>
                <span style={{ color: isWangjai ? "#3e5f7d" : "#555149" }}>{post.likes}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedComments((current) => !current)}
                className={cn(
                  "h-auto gap-1.5 rounded-lg px-0 py-0 text-[13.5px] font-black hover:bg-transparent",
                  isWangjai ? "text-[#54738f] hover:text-[#183b5e]" : "text-[#7d776c] hover:text-foreground"
                )}
              >
                <span style={{ color: isWangjai ? "#69b7f2" : "#8E8A81" }}>💬</span>
                <span style={{ color: isWangjai ? "#3e5f7d" : "#555149" }}>{commentCount}</span>
              </Button>
            </div>
            <span className={cn("rounded-full px-2 py-0.5 text-[12px] font-black", isWangjai ? "bg-[#edf6ff] text-[#2f69a3]" : "bg-[#e9fff4] text-[#3D9A6A]")}>
              + {post.points} pts
            </span>
          </div>

          {expandedComments ? (
            <div className={cn("flex flex-col gap-2.5 border-t-[1.5px] pt-3", commentDividerClass)}>
              {postComments.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {postComments.map((comment) => {
                    const reactionData = getCommentReactionData(comment.id);
                    const selectedReaction = COMMENT_REACTION_CHOICES.find((reaction) => reaction.id === reactionData.selected);
                    const pickerKey = getCommentReactionKey(comment.id);

                    return (
                      <div key={comment.id} className="flex items-start gap-2">
                        <div className={cn("flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] text-[11px] font-black", isWangjai ? "border-[#2f69a3] bg-[#69b7f2] text-[#0d2740]" : "border-[#1A1A1A] bg-[var(--c-f5bb00)] text-[#1A1A1A]")}>
                          {comment.avatarText || comment.author.charAt(0) || "C"}
                        </div>
                        <div className="flex min-w-0 flex-col items-start gap-1">
                          <div className={cn("min-w-0 rounded-[12px] border-[1.5px] px-2.5 py-1.5 text-[13px] font-bold leading-relaxed", commentBubbleClass)}>
                            <span className={cn("mb-0.5 block text-[11.5px] font-black", isWangjai ? "text-[#183b5e]" : "text-[#1A1A1A]")}>{comment.author}</span>
                            {comment.text}
                          </div>
                          <div className="relative flex items-center gap-1 pl-0.5">
                            <button
                              type="button"
                              className={cn(
                                "inline-flex cursor-pointer items-center gap-1 rounded-full bg-transparent px-1.5 py-[3px] text-[11.5px] font-[850] leading-none transition-all",
                                isWangjai ? "text-[#54738f] hover:bg-[#edf6ff] hover:text-[#183b5e]" : "text-[#555149] hover:bg-[var(--c-faf8f2)] hover:text-[#1A1A1A]",
                                selectedReaction && reactionActiveClass
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
                              <div className={cn("absolute bottom-[calc(100%+6px)] left-0 z-20 flex gap-[3px] rounded-full border-[1.5px] bg-white p-[5px] shadow-[0_8px_22px_rgba(0,0,0,0.12)] animate-[scaleUp_0.16s_ease-out_both]", isWangjai ? "border-[#d7e7f8]" : "border-[var(--c-ddd9cd)]")}>
                                {COMMENT_REACTION_CHOICES.map((reaction) => (
                                  <button
                                    key={reaction.id}
                                    type="button"
                                    className={cn("flex h-[28px] w-[28px] items-center justify-center rounded-full bg-transparent text-md transition-all hover:-translate-y-0.5 hover:scale-110", isWangjai ? "hover:bg-[#edf6ff]" : "hover:bg-[var(--c-fff7d6)]")}
                                    onClick={() => handleCommentReaction(comment.id, reaction.id)}
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
                  })}
                </div>
              ) : null}

              <div className="flex w-full items-center gap-2">
                <Input
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleCommentSubmit();
                  }}
                  placeholder="เขียนคอมเมนต์..."
                  className={cn("h-[42px] min-w-0 flex-1 rounded-full border bg-white px-4 text-[14px] font-bold placeholder:text-[var(--c-9f988d)] focus-visible:ring-0", inputBorderClass)}
                />
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    "h-[42px] min-w-[52px] rounded-full px-4 text-[13px] font-black text-white transition-colors duration-200",
                    commentDraft.trim() ? primaryButtonClass : "cursor-not-allowed bg-[#A39E96] hover:bg-[#A39E96]"
                  )}
                  onClick={handleCommentSubmit}
                  disabled={!commentDraft.trim()}
                >
                  ส่ง
                </Button>
              </div>
            </div>
          ) : null}
        </article>
      </div>
    </div>
  );
}
