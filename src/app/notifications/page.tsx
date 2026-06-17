"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { MobileNotificationActivityView } from "@/components/notifications/mobile-notification-activity-view";
import { MobileNotificationPostView } from "@/components/notifications/mobile-notification-post-view";
import { cn } from "@/lib/utils";
import { useAppActions, useAppState, type AppInboxNotification } from "@/providers/app-providers";
import { useAppTheme } from "@/providers/theme-provider";

export default function NotificationsPage() {
  const { inboxNotifications, posts, feedEvents } = useAppState();
  const { toggleLike, addComment, markInboxNotificationRead } = useAppActions();
  const { theme } = useAppTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const isWangjai = theme === "wangjai";
  const sharedMobileHeight = "calc(100vh - var(--mobile-topbar-h) - var(--mobile-bottomnav-h))";
  const mobileBackgroundClass = isWangjai
    ? "bg-[linear-gradient(180deg,#eef4fb_0%,#f7fbff_220px,#f8fbff_100%)]"
    : "bg-[linear-gradient(180deg,#f6efe3_0%,#fdf8f0_220px,#fffdf8_100%)]";

  const selectedPostId = useMemo(() => {
    const postIdParam = searchParams?.get("postId");
    if (postIdParam) {
      const parsed = Number(postIdParam);
      if (Number.isFinite(parsed)) return parsed;
    }

    const selectedNotification = inboxNotifications.find((item) => item.id === selectedNotificationId);
    return selectedNotification?.postId ?? null;
  }, [inboxNotifications, searchParams, selectedNotificationId]);

  const selectedActivityId = useMemo(() => {
    const activityIdParam = searchParams?.get("activityId");
    if (activityIdParam) return activityIdParam;

    const selectedNotification = inboxNotifications.find((item) => item.id === selectedNotificationId);
    return selectedNotification?.feedEventId ?? null;
  }, [inboxNotifications, searchParams, selectedNotificationId]);

  const selectedPost = selectedPostId ? posts.find((post) => post.id === selectedPostId) ?? null : null;
  const selectedActivity = selectedActivityId ? feedEvents.find((event) => event.id === selectedActivityId) ?? null : null;
  const mobileDetailOpen = Boolean(selectedPost || selectedActivity);

  useEffect(() => {
    if (!mobileDetailOpen) {
      setSelectedNotificationId(null);
    }
  }, [mobileDetailOpen]);

  const closeMobileDetail = useCallback(() => {
    setSelectedNotificationId(null);
    router.replace("/notifications", { scroll: false });
  }, [router]);

  const openMobilePost = useCallback(
    (notification: AppInboxNotification) => {
      const linkedPost = notification.postId ? posts.find((post) => post.id === notification.postId) : null;
      const linkedActivity = notification.feedEventId ? feedEvents.find((event) => event.id === notification.feedEventId) : null;
      if (!linkedPost && !linkedActivity) return true;

      markInboxNotificationRead(notification.id);
      setSelectedNotificationId(notification.id);

      if (linkedPost && notification.postId) {
        router.push(`/notifications?postId=${notification.postId}`, { scroll: false });
      } else if (linkedActivity && notification.feedEventId) {
        router.push(`/notifications?activityId=${encodeURIComponent(notification.feedEventId)}`, { scroll: false });
      }
      return false;
    },
    [feedEvents, markInboxNotificationRead, posts, router]
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-0 md:px-4">
      <section className="hidden min-h-[calc(100vh-var(--mobile-topbar-h)-var(--mobile-bottomnav-h))] overflow-hidden rounded-none bg-transparent md:block md:min-h-0 md:rounded-[28px] md:border md:border-[var(--border)] md:bg-[var(--brand-surface)] md:px-2 md:py-2">
        <NotificationCenter />
      </section>

      <section className={mobileBackgroundClass}>
        <div className="overflow-hidden md:hidden" style={{ height: sharedMobileHeight }}>
          <div
            className="flex h-full w-[200%] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: mobileDetailOpen ? "translateX(-50%)" : "translateX(0%)" }}
          >
            <div className="h-full w-1/2 flex-shrink-0 overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <NotificationCenter onNotificationClick={openMobilePost} />
            </div>

            <div
              className="h-full w-1/2 flex-shrink-0 overflow-hidden"
              onTouchStart={(event) => {
                touchStartX.current = event.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                if (!mobileDetailOpen || touchStartX.current === null) return;
                const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
                if (Math.abs(endX - touchStartX.current) > 72) {
                  closeMobileDetail();
                }
                touchStartX.current = null;
              }}
            >
              {selectedPost ? (
                <MobileNotificationPostView
                  post={selectedPost}
                  onBack={closeMobileDetail}
                  onToggleLike={toggleLike}
                  onAddComment={addComment}
                />
              ) : selectedActivity ? (
                <MobileNotificationActivityView
                  activity={selectedActivity}
                  onBack={closeMobileDetail}
                />
              ) : (
                <div className={cn("flex h-full items-center justify-center px-5 text-center text-[14px] font-bold text-[#8E8A81]", mobileBackgroundClass)}>
                  เลือกการแจ้งเตือนเพื่อดูรายละเอียดแบบเต็มหน้า
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
