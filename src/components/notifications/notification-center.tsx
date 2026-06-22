"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { Bell, CalendarClock, Gift, Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppActions, useAppState, type AppInboxNotification } from "@/providers/app-providers";
import { useAppTheme } from "@/providers/theme-provider";

type NotificationCenterProps = {
  compact?: boolean;
  onItemClick?: () => void;
  onNotificationClick?: (notification: AppInboxNotification) => boolean | void;
};

type NotificationTab = "all" | "unread";

type NotificationGroup = {
  id: string;
  label: string;
  items: AppInboxNotification[];
};

const TH = {
  justNow: "\u0e40\u0e21\u0e37\u0e48\u0e2d\u0e2a\u0e31\u0e01\u0e04\u0e23\u0e39\u0e48",
  minutesAgo: "\u0e19\u0e32\u0e17\u0e35\u0e17\u0e35\u0e48\u0e41\u0e25\u0e49\u0e27",
  hoursAgo: "\u0e0a\u0e31\u0e48\u0e27\u0e42\u0e21\u0e07\u0e17\u0e35\u0e48\u0e41\u0e25\u0e49\u0e27",
  daysAgo: "\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48\u0e41\u0e25\u0e49\u0e27",
  activity: "\u0e01\u0e34\u0e08\u0e01\u0e23\u0e23\u0e21",
  comment: "\u0e04\u0e2d\u0e21\u0e40\u0e21\u0e19\u0e15\u0e4c",
  like: "\u0e16\u0e39\u0e01\u0e43\u0e08",
  reward: "\u0e41\u0e25\u0e01\u0e23\u0e32\u0e07\u0e27\u0e31\u0e25",
  today: "\u0e27\u0e31\u0e19\u0e19\u0e35\u0e49",
  yesterday: "\u0e40\u0e21\u0e37\u0e48\u0e2d\u0e27\u0e32\u0e19",
  earlier: "\u0e01\u0e48\u0e2d\u0e19\u0e2b\u0e19\u0e49\u0e32\u0e19\u0e35\u0e49",
  title: "\u0e01\u0e32\u0e23\u0e41\u0e08\u0e49\u0e07\u0e40\u0e15\u0e37\u0e2d\u0e19",
  tabAll: "\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14",
  tabUnread: "\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49\u0e2d\u0e48\u0e32\u0e19",
  emptyTitle: "\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e01\u0e32\u0e23\u0e41\u0e08\u0e49\u0e07\u0e40\u0e15\u0e37\u0e2d\u0e19",
  emptyBody:
    "\u0e40\u0e21\u0e37\u0e48\u0e2d\u0e21\u0e35\u0e04\u0e19\u0e21\u0e32\u0e01\u0e14\u0e16\u0e39\u0e01\u0e43\u0e08 \u0e04\u0e2d\u0e21\u0e40\u0e21\u0e19\u0e15\u0e4c \u0e2b\u0e23\u0e37\u0e2d\u0e21\u0e35\u0e01\u0e34\u0e08\u0e01\u0e23\u0e23\u0e21\u0e43\u0e2b\u0e21\u0e48 \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e08\u0e30\u0e41\u0e2a\u0e14\u0e07\u0e17\u0e35\u0e48\u0e19\u0e35\u0e48",
} as const;

const HIDE_SCROLLBAR_STYLE: CSSProperties = {
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

function formatRelativeTime(createdAt: number) {
  const diffMinutes = Math.max(0, Math.round((Date.now() - createdAt) / 60000));
  if (diffMinutes < 1) return TH.justNow;
  if (diffMinutes < 60) return `${diffMinutes} ${TH.minutesAgo}`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ${TH.hoursAgo}`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} ${TH.daysAgo}`;
}

function getNotificationMeta(kind: AppInboxNotification["kind"], isWangjai: boolean) {
  if (kind === "activity") {
    return {
      icon: CalendarClock,
      label: TH.activity,
      badgeTone: isWangjai ? "bg-[#e5f1ff] text-[#2f69a3]" : "bg-[#fff1d8] text-[#8a531c]",
      iconTone: isWangjai ? "bg-[#edf6ff] text-[#2f69a3]" : "bg-[#fff5e6] text-[#8a531c]",
    };
  }

  if (kind === "comment") {
    return {
      icon: MessageCircle,
      label: TH.comment,
      badgeTone: isWangjai ? "bg-[#eaf2ff] text-[#355fa0]" : "bg-[#fff4e5] text-[#8f5b24]",
      iconTone: isWangjai ? "bg-[#eef4ff] text-[#2d5ea5]" : "bg-[#fff7eb] text-[#8a531c]",
    };
  }

  if (kind === "reward") {
    return {
      icon: Gift,
      label: TH.reward,
      badgeTone: isWangjai ? "bg-[#e7f8ef] text-[#1c7a53]" : "bg-[#edf9ef] text-[#1f7a55]",
      iconTone: isWangjai ? "bg-[#edfdf4] text-[#1c7a53]" : "bg-[#f3fcf4] text-[#1f7a55]",
    };
  }

  return {
    icon: Heart,
    label: TH.like,
    badgeTone: isWangjai ? "bg-[#fff0f2] text-[#bf5262]" : "bg-[#fff1ea] text-[#c56c32]",
    iconTone: isWangjai ? "bg-[#fff4f5] text-[#bf5262]" : "bg-[#fff6ef] text-[#c56c32]",
  };
}

function getDateBucket(createdAt: number) {
  const current = new Date();
  const today = new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime();
  const yesterday = today - 24 * 60 * 60 * 1000;
  const createdDate = new Date(createdAt);
  const itemDay = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate()).getTime();

  if (itemDay === today) return "today";
  if (itemDay === yesterday) return "yesterday";
  return "older";
}

function groupNotifications(items: AppInboxNotification[]) {
  const groups: NotificationGroup[] = [];

  for (const notification of items) {
    const bucket = getDateBucket(notification.createdAt);
    const existing = groups.find((group) => group.id === bucket);

    if (existing) {
      existing.items.push(notification);
      continue;
    }

    groups.push({
      id: bucket,
      label: bucket === "today" ? TH.today : bucket === "yesterday" ? TH.yesterday : TH.earlier,
      items: [notification],
    });
  }

  return groups;
}

export function NotificationCenter({ compact = false, onItemClick, onNotificationClick }: NotificationCenterProps) {
  const { inboxNotifications } = useAppState();
  const { markInboxNotificationRead } = useAppActions();
  const { mascot, theme } = useAppTheme();
  const [tab, setTab] = useState<NotificationTab>("all");
  const isWangjai = theme === "wangjai";
  const accentTextClass = isWangjai ? "text-[#2f69a3]" : "text-[#8a531c]";
  const mutedHeadingClass = isWangjai ? "text-[#335a80]" : "text-[#7b4b22]";
  const actorTextClass = isWangjai ? "text-[#50708d]" : "text-[#8b6b52]";
  const bodyTextClass = isWangjai ? "text-[#6a8097]" : "text-[#7b695b]";
  const titleTextClass = isWangjai ? "text-[#183b5e]" : "text-[#5c3517]";
  const unreadDotClass = isWangjai ? "bg-[#69b7f2]" : "bg-[#d89a2b]";
  const activeTabClass = isWangjai ? "bg-[#69b7f2] text-[#173d62]" : "bg-[#f3c74a] text-[#553215]";
  const inactiveTabClass = isWangjai ? "bg-white text-[#49637d]" : "bg-[#fffaf3] text-[#765133]";
  const cardBorderClass = isWangjai ? "border-[#dbe8f7]" : "border-[#eedfca]";
  const cardReadBorderClass = isWangjai ? "border-white/70 bg-white/92" : "border-[#f3e8d8] bg-[#fffdfa]";
  const pageBackgroundClass = isWangjai
    ? "bg-[linear-gradient(180deg,#eef4fb_0%,#f7fbff_220px,#f8fbff_100%)]"
    : "bg-[linear-gradient(180deg,#f6efe3_0%,#fdf8f0_220px,#fffdf8_100%)]";
  const heroEyebrowClass = isWangjai ? "text-[#a9d2f5]" : "text-[#ffd36f]";
  const actorDividerClass = isWangjai ? "text-[#9bb0c5]" : "text-[#cfad84]";
  const emptyStateClass = isWangjai
    ? "rounded-[24px] border border-white/60 bg-white/92 text-center shadow-[0_10px_24px_rgba(15,34,56,0.08)]"
    : "rounded-[24px] border border-[#f0e2cf] bg-[#fffdfa] text-center shadow-[0_10px_24px_rgba(59,29,7,0.08)]";
  const compactHeaderClass = isWangjai
    ? "rounded-[18px] bg-white px-2 py-1"
    : "rounded-[18px] bg-white px-2 py-1";
  const compactGroupLabelClass = isWangjai
    ? "px-1 text-[12px] font-black text-[#1f2937]"
    : "px-1 text-[12px] font-black text-[#1f2937]";
  const compactCardClass = isWangjai
    ? ""
    : "";
  const compactReadCardClass = isWangjai
    ? ""
    : "";
  const compactTitleClass = "text-[18px] font-black tracking-tight text-[#111827]";
  const compactAccentClass = "text-[#1168d8]";
  const compactActiveTabClass = "bg-[#e8f1ff] text-[#1168d8]";
  const compactInactiveTabClass = "bg-[#f3f4f6] text-[#374151]";

  const visibleNotifications = useMemo(() => {
    return tab === "unread" ? inboxNotifications.filter((item) => !item.read) : inboxNotifications;
  }, [inboxNotifications, tab]);
  const groupedNotifications = useMemo(() => groupNotifications(visibleNotifications), [visibleNotifications]);
  const mobileMode = !compact;

  return (
    <div
      className={cn(
        "flex flex-col",
        compact
          ? "max-h-[min(560px,calc(100vh-112px))] gap-3 overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:hidden"
          : cn("min-h-[calc(100vh-var(--mobile-topbar-h))] gap-5 px-3 pb-24 pt-4", pageBackgroundClass)
      )}
      style={compact ? HIDE_SCROLLBAR_STYLE : undefined}
    >
      <section
        className={cn(
          compact
            ? compactHeaderClass
            : cn(
                "overflow-hidden rounded-[28px] border border-white/10 px-4 pb-3.5 pt-4 text-white shadow-[0_14px_32px_rgba(18,52,87,0.16)]",
                isWangjai
                  ? "bg-[linear-gradient(135deg,rgba(var(--brand-nav-rgb),0.98)_0%,rgba(41,120,188,0.96)_100%)]"
                  : "bg-[linear-gradient(135deg,#51301a_0%,#70411d_48%,#9f641f_100%)]"
              )
        )}
      >
        {mobileMode ? (
          <div className="relative">
            <div className="min-w-0 pr-22">
              <div className={cn("text-[10px] font-black uppercase tracking-[0.22em]", heroEyebrowClass)}>Notification Center</div>
              <div className="mt-1 text-[24px] font-black tracking-tight text-white">{TH.title}</div>
            </div>
            <div className="absolute right-0 top-0 flex h-24 w-24 items-end justify-center">
              <div className="absolute inset-x-2 bottom-1 h-10 rounded-full bg-white/10 blur-md" />
              <Image
                src={mascot("cheer2")}
                alt="Safety mascot"
                width={108}
                height={108}
                className="mascot-motion mascot-motion-compact relative h-auto w-[108px] max-w-none object-contain drop-shadow-[0_12px_24px_rgba(7,22,40,0.28)]"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 px-1 py-1">
            <div className="min-w-0">
              <div className={compactTitleClass}>{TH.title}</div>
            </div>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f4f6] text-[#6b7280] transition-colors hover:bg-[#e5e7eb]"
              aria-label="Notification options"
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
        )}

        <div className={cn("flex gap-2", compact ? "mt-3.5" : "mt-3")}>
          {[
            { id: "all" as const, label: TH.tabAll },
            { id: "unread" as const, label: TH.tabUnread },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-full font-black transition-colors",
                compact ? "px-3.5 py-1.5 text-[11px]" : "px-4 py-2 text-[12px]",
                compact
                  ? tab === item.id
                    ? compactActiveTabClass
                    : compactInactiveTabClass
                  : tab === item.id
                    ? activeTabClass
                    : inactiveTabClass
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <div
        className={cn(
          "flex flex-col [&::-webkit-scrollbar]:hidden",
          compact ? "gap-3" : "gap-4"
        )}
        style={compact ? undefined : HIDE_SCROLLBAR_STYLE}
      >
        {groupedNotifications.length > 0 ? (
          groupedNotifications.map((group) => (
            <section key={group.id} className={cn(compact ? "space-y-2" : "space-y-2.5")}>
              {compact ? (
                <div className="flex items-center justify-between px-1">
                  <div className={compactGroupLabelClass}>{group.label}</div>
                  {group.id === "today" ? (
                    <Link
                      href="/notifications"
                      onClick={() => onItemClick?.()}
                      className="text-[11px] font-black text-[#1168d8] transition-opacity hover:opacity-75"
                    >
                      ดูทั้งหมด
                    </Link>
                  ) : null}
                </div>
              ) : (
                <div className={cn("px-1 font-black text-[12px]", mutedHeadingClass)}>{group.label}</div>
              )}

              <div className={cn(compact ? "space-y-0.5" : "space-y-3")}>
                {group.items.map((item) => {
                  const meta = getNotificationMeta(item.kind, isWangjai);
                  const Icon = meta.icon;

                  return (
                    <Link
                      key={item.id}
                      href={item.href || "/notifications"}
                      onClick={(event) => {
                        markInboxNotificationRead(item.id);
                        const shouldContinue = onNotificationClick?.(item);
                        if (shouldContinue === false) {
                          event.preventDefault();
                        }
                        onItemClick?.();
                      }}
                      className={cn(
                        "group relative block overflow-hidden transition-all",
                        compact ? "rounded-[14px] p-2.5 hover:bg-[#e8edf5]" : "rounded-[26px] border p-4.5 shadow-[0_10px_24px_rgba(15,34,56,0.08)]",
                        compact
                          ? item.read
                            ? compactReadCardClass
                            : compactCardClass
                          : item.read
                            ? cardReadBorderClass
                            : cn(cardBorderClass, "bg-white")
                      )}
                    >
                      {!item.read ? <span className={cn("absolute rounded-full", compact ? "right-2 top-1/2 h-2 w-2 -translate-y-1/2 bg-[#1168d8]" : `${unreadDotClass} right-4 top-4 h-2.5 w-2.5`)} /> : null}

                      <div className={cn("flex items-start", compact ? "gap-2.5 pr-4" : "gap-3")}>
                        <span className={cn("mt-0.5 flex flex-shrink-0 items-center justify-center rounded-full", meta.iconTone, compact ? "h-9 w-9" : "h-11 w-11")}>
                          <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5")} strokeWidth={2.1} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className={cn("flex items-center gap-2", compact ? "pr-2" : "pr-4")}>
                            <span className={cn("rounded-full font-black", meta.badgeTone, compact ? "px-2 py-0.5 text-[8.5px]" : "px-2.5 py-1 text-[10px]")}>{meta.label}</span>
                            {item.actorName ? <span className={cn("truncate font-bold", compact ? "max-w-[92px] text-[10px] text-[#6b7280]" : actorTextClass, compact ? "" : "text-[11px]")}>{item.actorName}</span> : null}
                          </div>

                          <div className={cn("font-black leading-snug", compact ? "mt-1 line-clamp-1 text-[12.5px] text-[#111827]" : titleTextClass, compact ? "" : "mt-2 text-[14px]")}>{item.title}</div>
                          <div className={cn("font-semibold", compact ? "mt-0.5 line-clamp-2 text-[10.5px] leading-[1.45] text-[#4b5563]" : bodyTextClass, compact ? "" : "mt-1.5 text-[12.5px] leading-6")}>{item.body}</div>

                          <div className={cn("flex flex-wrap items-center gap-1.5 font-black", compact ? "mt-1.5 text-[10px] text-[#1168d8]" : accentTextClass, compact ? "" : "mt-3 text-[10.5px]")}>
                            <span>{formatRelativeTime(item.createdAt)}</span>
                            {item.actorName ? (
                              <>
                                <span className={compact ? "text-[#9ca3af]" : actorDividerClass}>•</span>
                                <span className={cn("truncate", compact ? "max-w-[120px] text-[#1168d8]" : accentTextClass)}>{item.actorName}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <div className={cn(compact ? "rounded-[18px] border border-[#e5e7eb] bg-[#fafafa] p-5 text-center" : emptyStateClass, compact ? "" : "p-8")}>
            <div className={cn("mx-auto flex h-14 w-14 items-center justify-center rounded-full", isWangjai ? "bg-[#edf5ff] text-[#2f69a3]" : "bg-[#fff3df] text-[#8a531c]")}>
              <Bell className="h-6 w-6" strokeWidth={2.2} />
            </div>
            <div className={cn("mt-4 text-[18px] font-black", titleTextClass)}>{TH.emptyTitle}</div>
            <div className={cn("mt-2 text-[12.5px] font-bold", bodyTextClass)}>{TH.emptyBody}</div>
          </div>
        )}
      </div>
    </div>
  );
}


