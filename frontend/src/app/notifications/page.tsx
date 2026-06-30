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
  const mobileBackgroundClass = isWangjai ? "bg-[var(--background)]" : "bg-[var(--background)]";

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
      const targetHref = notification.postId
        ? `/safety-culture/posts/${notification.postId}`
        : notification.feedEventId
          ? `/safety-culture?activityId=${encodeURIComponent(notification.feedEventId)}`
          : notification.href && notification.href !== "/notifications"
            ? notification.href
            : null;
      if (!targetHref) return true;

      markInboxNotificationRead(notification.id);
      router.push(targetHref, { scroll: false });
      return false;
    },
    [markInboxNotificationRead, router]
  );

  return (
    <div className="page-shell-wide bg-[var(--background)]">
      <section className="hidden md:block">
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
