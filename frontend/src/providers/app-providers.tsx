"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";
import {
  DEFAULT_REWARD_CATEGORIES,
  type RewardCategoryConfig,
  type RewardItem,
} from "@/lib/safety-culture";
import {
  type SafetyAwarenessQuestion,
  createDefaultAwarenessQuestions,
  normalizeAwarenessQuestions,
  todayKey,
} from "@/lib/safety-awareness";
import { getSafetyPoint } from "@/lib/point-rules";
import { apiFetch, apiJson } from "@/lib/api-client";
import {
  DEMO_ADMIN_USER,
  DEMO_LOGIN_SESSION_KEY,
  getSessionDisplayName,
  getSessionInitials,
  isLocalDemoLoginHost,
  type SessionUser,
} from "@/lib/session-user";

export type PostPhoto = {
  id: string;
  dataUrl: string;
  type: string;
  url?: string;
};

export type Comment = {
  id: string;
  authorId?: string;
  author: string;
  avatarText: string;
  avatarImageUrl?: string | null;
  text: string;
  reactions?: Record<string, number>;
  viewerReaction?: string | null;
  isYou?: boolean;
  createdAt?: number;
};

export type Post = {
  id: number;
  author: string;
  avatarBg: string;
  avatarColor: string;
  avatarText: string;
  avatarImageUrl?: string | null;
  subtext: string;
  category: string;
  body: string;
  photos: PostPhoto[];
  imageText?: string;
  likes: number;
  comments: number | Comment[];
  points: number;
  hasLiked: boolean;
  likedBy?: Array<{
    userId: string;
    name: string;
    profileImageUrl?: string | null;
  }>;
  isYou?: boolean;
  createdAt?: number;
  imageData?: string | null;
  feedEventId?: string;
  feedEventTitle?: string;
  authorId?: string;
  authorEmail?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  location?: string;
  team?: string;
};

export type SafetyCultureUserActivityType = "post" | "reaction" | "comment" | "redeem" | "awareness" | "safety-effort";

export type SafetyCultureUserActivity = {
  id: string;
  type: SafetyCultureUserActivityType;
  occurredAt: number;
  postId: number;
  postAuthor: string;
  postCategory: string;
  postPreview: string;
  pointsDelta: number;
  commentText?: string;
};

export type NotificationType = {
  message: string;
  type: "sos" | "info" | "success";
} | null;

export type AppInboxNotificationKind = "activity" | "like" | "comment" | "reward";

export type AppInboxNotification = {
  id: string;
  kind: AppInboxNotificationKind;
  title: string;
  body: string;
  actorName?: string;
  createdAt: number;
  read: boolean;
  postId?: number;
  feedEventId?: string;
  href?: string;
};

export type SafetyCultureEventStatus = "draft" | "scheduled" | "live" | "paused";
export type SafetyCultureBonusMode = "multiplier" | "fixed";
export type SafetyCultureEventAction = "approved-post" | "comment" | "reaction" | "theme-post";

export type SafetyCultureEventConfig = {
  eventName: string;
  eventCode: string;
  headline: string;
  supportingText: string;
  bannerNote: string;
  bannerVisible: boolean;
  status: SafetyCultureEventStatus;
  bonusMode: SafetyCultureBonusMode;
  multiplier: number;
  fixedPoints: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  enabledActions: SafetyCultureEventAction[];
};

export type SafetyCultureEventPhase = "draft" | "upcoming" | "live" | "ended" | "paused";
export type SafetyCultureFeedEventStatus = "open" | "closed";

export type SafetyCultureFeedEvent = {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  details: string;
  imageSrc: string | null;
  imageText: string;
  startDate?: string;
  endDate?: string;
  dateLabel: string;
  points: number;
  status: SafetyCultureFeedEventStatus;
  published: boolean;
  bonusMode: SafetyCultureBonusMode;
  multiplier: number;
  fixedPoints: number;
  enabledActions: SafetyCultureEventAction[];
};

export type LeaderboardTeam = {
  id: string;
  rank: number;
  name: string;
  leaderUserId?: string;
  leaderEmail?: string;
  leaderProfileImageUrl?: string | null;
  leader: string;
  members: number;
  color: string;
  points: number;
  percent: number;
  streak: number;
  awards: number;
};

export type LeaderboardPerson = {
  id: string;
  rank: string;
  name: string;
  points: number;
  team: string;
  active?: boolean;
};

export type RewardCatalogItem = RewardItem;
export type RewardCategory = RewardCategoryConfig;
export type RewardRedemptionRecord = {
  id: string;
  rewardId: number;
  rewardName: string;
  rewardCategory: string;
  pointsSpent: number;
  redeemedAt: string;
  redeemedBy: string;
};

export type AwarenessCompletion = {
  date: string;
  completedAt: string;
  score: number;
  total: number;
  questions: Array<{ id: string; category: string; text: string; correct: boolean }>;
};

export type AwarenessHoliday = {
  id?: string;
  date: string;
  name: string;
};

type AppState = {
  posts: Post[];
  userActivityHistory: SafetyCultureUserActivity[];
  notification: NotificationType;
  inboxNotifications: AppInboxNotification[];
  currentUserPoints: number;
  safetyCultureEvent: SafetyCultureEventConfig;
  feedEvents: SafetyCultureFeedEvent[];
  teamStandings: LeaderboardTeam[];
  personalRankings: LeaderboardPerson[];
  rewardsCatalog: RewardCatalogItem[];
  rewardCategories: RewardCategory[];
  rewardRedemptions: RewardRedemptionRecord[];
  awarenessQuestions: SafetyAwarenessQuestion[];
  /** true once the user has completed today's Safety Awareness popup. */
  awarenessDoneToday: boolean;
  awarenessHistory: AwarenessCompletion[];
  awarenessHolidays: AwarenessHoliday[];
  awarenessRequiredToday: boolean;
  awarenessEnabled: boolean;
  awarenessWeekdays: number[];
  awarenessActiveStartTime: string;
  awarenessActiveEndTime: string;
  /** วันแรกที่ผู้ใช้เริ่มใช้งาน (YYYY-MM-DD). วันก่อนหน้านี้จะไม่ถูกนับใน KPI. */
  awarenessStartDate: string;
  isEventLive: boolean;
  eventNow: number;
};

type AppActions = {
  showNotification: (notification: NotificationType) => void;
  dismissNotification: () => void;
  markInboxNotificationRead: (notificationId: string) => void;
  markAllInboxNotificationsRead: () => void;
  addPost: (post: Post) => Promise<Post>;
  fetchPosts: (options?: { scope?: "all" | "my-team" | "mine"; category?: string | null; limit?: number }) => Promise<Post[]>;
  toggleLike: (postId: number) => void;
  addComment: (postId: number, text: string) => Promise<boolean>;
  fetchComments: (postId: number) => Promise<Comment[]>;
  updateComment: (postId: number, commentId: string, text: string) => Promise<boolean>;
  deleteComment: (postId: number, commentId: string) => Promise<boolean>;
  updatePost: (postId: number, content: string) => Promise<boolean>;
  deletePost: (postId: number) => Promise<boolean>;
  updateSafetyCultureEvent: (data: SafetyCultureEventConfig) => void;
  updateFeedEvents: (events: SafetyCultureFeedEvent[]) => Promise<boolean>;
  sendFeedEventNotification: (feedEventId: string) => boolean;
  updateTeamStandings: (teams: LeaderboardTeam[]) => Promise<boolean>;
  updatePersonalRankings: (rankings: LeaderboardPerson[]) => Promise<boolean>;
  updateRewardsCatalog: (rewards: RewardCatalogItem[]) => Promise<boolean>;
  updateRewardCategories: (categories: RewardCategory[]) => Promise<boolean>;
  updateAwarenessQuestions: (questions: SafetyAwarenessQuestion[]) => void;
  updateAwarenessHolidays: (holidays: AwarenessHoliday[]) => void;
  updateAwarenessEnabled: (enabled: boolean) => Promise<boolean>;
  updateAwarenessWeekdays: (weekdays: number[]) => Promise<boolean>;
  updateAwarenessTimeWindow: (startTime: string, endTime: string) => Promise<boolean>;
  /** Mark today's Safety Awareness popup as completed. */
  markAwarenessDone: (completion: Omit<AwarenessCompletion, "date" | "completedAt">) => Promise<boolean>;
  awardSafetyEffortCompletion: (sourceId: string, label?: string) => void;
  redeemPoints: (
    rewardId: number,
    points: number
  ) => Promise<{
    ok: boolean;
    reason?: "not-found" | "insufficient-points" | "not-started" | "expired" | "out-of-stock" | "api-error";
  }>;
};

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppActionsContext = createContext<AppActions | undefined>(undefined);

const INITIAL_POSTS: Post[] = [];

function getDefaultCurrentUserName() {
  return "ผู้ใช้งาน";
}

const DEFAULT_CURRENT_USER_NAME = getDefaultCurrentUserName();

const INITIAL_USER_ACTIVITY_HISTORY: SafetyCultureUserActivity[] = [];

const INITIAL_INBOX_NOTIFICATIONS: AppInboxNotification[] = [];

const DEFAULT_SAFETY_CULTURE_EVENT: SafetyCultureEventConfig = {
  eventName: "",
  eventCode: "",
  headline: "",
  supportingText: "",
  bannerNote: "",
  bannerVisible: false,
  status: "draft",
  bonusMode: "fixed",
  multiplier: 1,
  fixedPoints: 0,
  startDate: "1970-01-01",
  startTime: "00:00",
  endDate: "1970-01-01",
  endTime: "00:00",
  enabledActions: [],
};

const DEFAULT_FEED_EVENTS: SafetyCultureFeedEvent[] = [];

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function repairMojibakeText(value?: string | null) {
  if (!value) return value ?? "";
  if (!/[ÃÂà]/.test(value)) return value;

  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
}

function buildNotificationHref(
  notification: Pick<AppInboxNotification, "postId" | "feedEventId" | "href" | "kind">,
) {
  if (notification.postId) return `/safety-culture/posts/${notification.postId}`;
  if (notification.feedEventId) return `/safety-culture?activityId=${encodeURIComponent(notification.feedEventId)}`;
  if (notification.href) return notification.href;
  // Send each notification kind to its relevant area instead of looping back to
  // the notifications menu when no specific target is attached.
  switch (notification.kind) {
    case "reward":
      return "/safety-culture/rewards";
    case "activity":
    case "like":
    case "comment":
      return "/safety-culture";
    default:
      return "/notifications";
  }
}

function createDefaultSafetyCultureEvent(): SafetyCultureEventConfig {
  const startDate = "1970-01-01";
  const endDate = "1970-01-01";
  const startTime = DEFAULT_SAFETY_CULTURE_EVENT.startTime;
  const endTime = DEFAULT_SAFETY_CULTURE_EVENT.endTime;

  return {
    ...DEFAULT_SAFETY_CULTURE_EVENT,
    eventName: "",
    eventCode: "",
    headline: "",
    supportingText: "",
    bannerNote: "",
    bannerVisible: false,
    status: "draft",
    enabledActions: [],
    startDate,
    endDate,
    startTime,
    endTime,
  };
}

function normalizePosts(posts: Post[]) {
  return posts.map((post, index) => ({
    ...post,
    id: Number.isFinite(post.id) ? post.id : index + 1,
    author: repairMojibakeText(post.author) || "Unknown author",
    avatarText: repairMojibakeText(post.avatarText) || "U",
    subtext: repairMojibakeText(post.subtext) || "Safety Culture",
    category: repairMojibakeText(post.category) || "ทั่วไป",
    body: repairMojibakeText(post.body) || "รายละเอียดโพสต์จะแสดงที่นี่",
    imageText: repairMojibakeText(post.imageText) || undefined,
    comments: Array.isArray(post.comments)
      ? post.comments.map((comment, commentIndex) => ({
          ...comment,
          id: comment.id || `comment-${post.id}-${commentIndex + 1}`,
          authorId: comment.authorId ? String(comment.authorId) : undefined,
          author: repairMojibakeText(comment.author) || "Unknown author",
          avatarText: repairMojibakeText(comment.avatarText) || "C",
          avatarImageUrl: comment.avatarImageUrl || null,
          text: repairMojibakeText(comment.text) || "",
          isYou: Boolean(comment.isYou),
          createdAt: parseTimestamp(comment.createdAt) ?? undefined,
        }))
      : Math.max(0, Number(post.comments) || 0),
    likes: Math.max(0, Number(post.likes) || 0),
    points: Math.max(0, Number(post.points) || 0),
    hasLiked: Boolean(post.hasLiked),
    likedBy: Array.isArray(post.likedBy) ? post.likedBy : [],
    photos: Array.isArray(post.photos)
      ? post.photos
          .filter((photo) => photo?.dataUrl)
          .map((photo, photoIndex) => {
            const photoUrl = String(photo.dataUrl);
            const normalizedPhotoUrl = photoUrl.startsWith("/images/mascots/") && !photoUrl.includes("/images/mascots/wangjai/")
              ? "/images/mascots/scenes/safety-culture-mascot-new.png"
              : photo.dataUrl;

            return {
              ...photo,
              dataUrl: normalizedPhotoUrl,
              id: photo.id || `photo-${post.id}-${photoIndex + 1}`,
              type: photo.type || "sample",
            };
          })
      : [],
  }));
}

function mergePostsWithSeed(posts: Post[]) {
  return normalizePosts(posts).sort((left, right) => right.id - left.id);
}

function normalizeStoredSafetyCultureEvent(parsedEvent: Partial<SafetyCultureEventConfig>) {
  const defaultEvent = createDefaultSafetyCultureEvent();
  return {
    ...defaultEvent,
    ...parsedEvent,
    eventName: repairMojibakeText(parsedEvent.eventName ?? defaultEvent.eventName),
    eventCode: repairMojibakeText(parsedEvent.eventCode ?? defaultEvent.eventCode),
    headline: repairMojibakeText(parsedEvent.headline ?? defaultEvent.headline),
    supportingText: repairMojibakeText(parsedEvent.supportingText ?? defaultEvent.supportingText),
    bannerNote: repairMojibakeText(parsedEvent.bannerNote ?? defaultEvent.bannerNote),
  };
}

function getEventTimestamp(date: string, time: string) {
  if (!date || !time) return null;

  const parsed = new Date(`${date}T${time}`);
  const timestamp = parsed.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function formatFeedEventDateLabel(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return "TBD";

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "TBD";
  }

  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function getSafetyCultureEventPhase(event: SafetyCultureEventConfig, now = Date.now()): SafetyCultureEventPhase {
  if (event.status === "draft") return "draft";
  if (event.status === "paused") return "paused";
  if (event.status === "live") return "live";

  const start = getEventTimestamp(event.startDate, event.startTime);
  const end = getEventTimestamp(event.endDate, event.endTime);
  if (start === null || end === null) return "draft";

  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "live";
}

function isSafetyCultureEventLive(event: SafetyCultureEventConfig, now = Date.now()) {
  return getSafetyCultureEventPhase(event, now) === "live";
}

function getFeedEventTimestamp(date?: string, endOfDay = false) {
  if (!date) return null;
  const parsed = new Date(`${date}T${endOfDay ? "23:59" : "00:00"}`);
  const timestamp = parsed.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isFeedEventLive(event: SafetyCultureFeedEvent, now = Date.now()) {
  if (!event.published || event.status !== "open") return false;
  const start = getFeedEventTimestamp(event.startDate, false);
  const end = getFeedEventTimestamp(event.endDate, true);
  if (start === null || end === null) return false;
  return now >= start && now <= end;
}

function serializePostsForStorage(posts: Post[]) {
  return posts.map((post) => ({
    ...post,
    imageData: post.photos?.length ? null : post.imageData ?? null,
  }));
}

function calculateAwardedPoints(basePoints: number, action: SafetyCultureEventAction, event: SafetyCultureEventConfig) {
  if (!event.enabledActions.includes(action) || !isSafetyCultureEventLive(event)) {
    return basePoints;
  }

  if (event.bonusMode === "multiplier") {
    return Math.max(basePoints, Math.round(basePoints * event.multiplier));
  }

  return basePoints + event.fixedPoints;
}

function calculateFeedEventAwardedPoints(basePoints: number, action: SafetyCultureEventAction, event: SafetyCultureFeedEvent, now = Date.now()) {
  if (!event.enabledActions.includes(action) || !isFeedEventLive(event, now)) {
    return basePoints;
  }

  if (action === "theme-post") {
    const eventPoints = Math.max(0, Number(event.points) || 0);
    const eventBonus = event.bonusMode === "multiplier"
      ? Math.round(eventPoints * Math.max(1, Number(event.multiplier) || 1))
      : eventPoints + Math.max(0, Number(event.fixedPoints) || 0);
    return basePoints + eventBonus;
  }

  if (event.bonusMode === "multiplier") {
    return Math.max(basePoints, Math.round(basePoints * event.multiplier));
  }

  return basePoints + event.fixedPoints;
}

function normalizeTeamStandings(teams: LeaderboardTeam[]) {
  const sanitized = teams.map((team, index) => ({
    ...team,
    id: team.id || `team-${index + 1}`,
    leader: team.leader || "Team Leader",
    leaderUserId: team.leaderUserId ? String(team.leaderUserId) : "",
    leaderEmail: team.leaderEmail || "",
    members: Math.max(0, Number(team.members) || 0),
    points: Math.max(0, Number(team.points) || 0),
    streak: Math.max(0, Number(team.streak) || 0),
    awards: Math.max(0, Number(team.awards) || 0),
  }));
  const highestPoints = sanitized.reduce((max, team) => Math.max(max, team.points), 0);

  return sanitized
    .sort((left, right) => right.points - left.points)
    .map((team, index) => ({
      ...team,
      rank: index + 1,
      percent: highestPoints > 0 ? Math.max(8, Math.round((team.points / highestPoints) * 1000) / 10) : 0,
    }));
}

function normalizePersonalRankings(rankings: LeaderboardPerson[]) {
  return rankings
    .map((person, index) => ({
      ...person,
      id: person.id || `person-${index + 1}`,
      team: person.team || "Safety Team",
      points: Math.max(0, Number(person.points) || 0),
    }))
    .sort((left, right) => right.points - left.points)
    .map((person, index) => ({
      ...person,
      rank: `#${index + 1}`,
    }));
}

function createDefaultTeamStandings(): LeaderboardTeam[] {
  return [];
}

function createDefaultPersonalRankings(): LeaderboardPerson[] {
  return [];
}

function normalizeRewardsCatalog(rewards: RewardCatalogItem[]): RewardCatalogItem[] {
  return rewards.map((reward, index) => {
    const stockMode: RewardCatalogItem["stockMode"] = reward.stockMode === "limited" ? "limited" : "unlimited";
    const stockTotal = stockMode === "limited" ? Math.max(0, Number(reward.stockTotal) || 0) : null;
    const parsedRemaining = Number(reward.stockRemaining);
    const stockRemaining =
      stockMode === "limited"
        ? Math.max(0, Math.min(stockTotal ?? 0, Number.isNaN(parsedRemaining) ? stockTotal ?? 0 : parsedRemaining))
        : null;

    return {
      id: Math.max(1, Number(reward.id) || index + 1),
      name: reward.name || `Reward ${index + 1}`,
      category: reward.category || "merch",
      description: reward.description || "Reward description",
      imageText: reward.imageText || "// merch",
      imageSrc: reward.imageSrc ?? null,
      points: Math.max(0, Number(reward.points) || 0),
      isHot: Boolean(reward.isHot),
      redeemStartAt: reward.redeemStartAt || null,
      redeemEndAt: reward.redeemEndAt || null,
      stockMode,
      stockTotal,
      stockRemaining,
    };
  });
}

function rewardFromApi(item: Record<string, unknown>, index: number): RewardCatalogItem {
  const metadata = metadataRecord(item.metadata);
  const stockQty = Number(item.stock_qty ?? item.stockQty ?? metadata.stockQty ?? 0);
  const stockMode = metadata.stockMode === "unlimited" ? "unlimited" : "limited";
  return normalizeRewardsCatalog([
    {
      id: Number(item.id) || index + 1,
      name: String(metadata.name || item.name || ""),
      category: String(metadata.category || "merch"),
      description: String(metadata.description || ""),
      imageText: String(metadata.imageText || item.code || item.name || ""),
      imageSrc: typeof metadata.imageSrc === "string" ? metadata.imageSrc : null,
      points: Number(metadata.points ?? item.points_required ?? item.pointsRequired ?? 0),
      isHot: Boolean(metadata.isHot),
      redeemStartAt: metadata.redeemStartAt || null,
      redeemEndAt: metadata.redeemEndAt || null,
      stockMode,
      stockTotal: stockMode === "limited" ? Number(metadata.stockTotal ?? stockQty) : null,
      // `stock_qty` is the live remaining inventory in DB. Metadata may contain
      // the original admin-edited snapshot, so prefer the column value here.
      stockRemaining: stockMode === "limited" ? Number(stockQty) : null,
    },
  ])[0];
}

function getRewardAvailabilityState(reward: RewardCatalogItem, now = Date.now()) {
  const startAt = reward.redeemStartAt ? Date.parse(reward.redeemStartAt) : NaN;
  const endAt = reward.redeemEndAt ? Date.parse(reward.redeemEndAt) : NaN;
  const hasStarted = Number.isNaN(startAt) || startAt <= now;
  const hasEnded = !Number.isNaN(endAt) && endAt < now;
  const inStock =
    reward.stockMode !== "limited" ||
    Math.max(0, Number(reward.stockRemaining) || 0) > 0;

  return {
    hasStarted,
    hasEnded,
    inStock,
  };
}

function createDefaultRewardsCatalog() {
  return [];
}

function normalizeRewardCategories(categories: RewardCategory[]) {
  const seen = new Set<string>();
  const normalizedDefaults = DEFAULT_REWARD_CATEGORIES.map((category) => ({
    ...category,
    value: category.value.trim().toLowerCase(),
  }));
  const fallbackHint = "หมวดหมู่ที่สร้างเพิ่มโดยผู้ดูแล";

  const normalized = categories
    .map((category) => {
      const rawValue = (category.value || category.label || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-\u0E00-\u0E7F]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const matchedDefault = normalizedDefaults.find((item) => item.value === rawValue);
      const rawLabel = category.label?.trim();
      const rawHint = category.hint?.trim();

      return {
        value: rawValue,
        label:
          rawLabel && rawLabel !== "New Category"
            ? rawLabel
            : matchedDefault?.label || "New Category",
        hint:
          rawHint && rawHint !== fallbackHint
            ? rawHint
            : matchedDefault?.hint || fallbackHint,
        icon: category.icon || matchedDefault?.icon || "gift",
      };
    })
    .filter((category) => {
      if (!category.value || seen.has(category.value)) return false;
      seen.add(category.value);
      return true;
    });

  normalizedDefaults.forEach((category) => {
    if (seen.has(category.value)) return;
    normalized.push(category);
    seen.add(category.value);
  });

  return normalized;
}

function createDefaultRewardCategories() {
  return normalizeRewardCategories(DEFAULT_REWARD_CATEGORIES.map((category) => ({ ...category })));
}

function normalizeRewardRedemptions(records: RewardRedemptionRecord[]): RewardRedemptionRecord[] {
  return records
    .map((record, index) => ({
      id: record.id || `reward-redemption-${index + 1}`,
      rewardId: Math.max(1, Number(record.rewardId) || 1),
      rewardName: record.rewardName || `Reward ${index + 1}`,
      rewardCategory: record.rewardCategory || "merch",
      pointsSpent: Math.max(0, Number(record.pointsSpent) || 0),
      redeemedAt: record.redeemedAt || new Date().toISOString(),
      redeemedBy: record.redeemedBy?.trim() || DEFAULT_CURRENT_USER_NAME,
    }))
    .sort((left, right) => right.redeemedAt.localeCompare(left.redeemedAt));
}

function createDefaultRewardRedemptions() {
  return [];
}

function mergeRewardRedemptionsWithSeed(records: RewardRedemptionRecord[]) {
  return normalizeRewardRedemptions(records);
}

function normalizeFeedEvents(events: SafetyCultureFeedEvent[]): SafetyCultureFeedEvent[] {
  return events.map((event, index) => ({
    id: event.id || `activity-${index + 1}`,
    title: repairMojibakeText(event.title) || `กิจกรรม ${index + 1}`,
    subtitle: repairMojibakeText(event.subtitle) || "Activity Details and Submission",
    summary: repairMojibakeText(event.summary) || "รายละเอียดกิจกรรมจะแสดงที่นี่",
    details: repairMojibakeText(event.details || event.summary) || "รายละเอียดกิจกรรมจะแสดงที่นี่",
    imageSrc: event.imageSrc ?? null,
    imageText: repairMojibakeText(event.imageText || event.title) || `Activity ${index + 1}`,
    startDate: event.startDate || "",
    endDate: event.endDate || "",
    dateLabel:
      formatFeedEventDateLabel(event.startDate, event.endDate) !== "TBD"
        ? formatFeedEventDateLabel(event.startDate, event.endDate)
        : event.dateLabel || "TBD",
    points: Math.max(0, Number(event.points) || 0),
    status: event.status === "closed" ? "closed" : "open",
    published: event.published !== false,
    bonusMode: event.bonusMode === "multiplier" ? "multiplier" : "fixed",
    multiplier: Math.max(1, Number(event.multiplier) || 1),
    fixedPoints: Math.max(0, Number(event.fixedPoints) || 0),
    enabledActions: Array.isArray(event.enabledActions) && event.enabledActions.length > 0
      ? event.enabledActions.filter((action): action is SafetyCultureEventAction =>
          ["approved-post", "comment", "reaction", "theme-post"].includes(action)
        )
      : ["theme-post"],
  }));
}

function metadataRecord(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function dateOnly(value: unknown) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function feedEventFromApi(item: Record<string, unknown>, index: number): SafetyCultureFeedEvent {
  const metadata = metadataRecord(item.metadata);
  const dbStatus = String(item.status || "").toUpperCase();
  const metadataStatus = metadata.status === "closed" || metadata.status === "open" ? metadata.status : undefined;
  const status: SafetyCultureFeedEventStatus = dbStatus === "ACTIVE" ? (metadataStatus || "open") : "closed";
  const published =
    typeof metadata.published === "boolean"
      ? metadata.published
      : dbStatus !== "DRAFT";

  return normalizeFeedEvents([
    {
      id: String(item.id || metadata.id || `activity-${index + 1}`),
      title: String(metadata.title || item.title || ""),
      subtitle: String(metadata.subtitle || item.location_text || ""),
      summary: String(metadata.summary || item.description || ""),
      details: String(metadata.details || metadata.summary || item.description || ""),
      imageSrc: typeof metadata.imageSrc === "string" ? metadata.imageSrc : null,
      imageText: String(metadata.imageText || metadata.title || item.title || "EVENT"),
      startDate: dateOnly(metadata.startDate || item.event_start_at),
      endDate: dateOnly(metadata.endDate || item.event_end_at),
      dateLabel: String(metadata.dateLabel || ""),
      points: Number(metadata.points || 0),
      status,
      published,
      bonusMode: metadata.bonusMode === "multiplier" ? "multiplier" : "fixed",
      multiplier: Number(metadata.multiplier || 1),
      fixedPoints: Number(metadata.fixedPoints || 0),
      enabledActions: Array.isArray(metadata.enabledActions) ? metadata.enabledActions : [],
    },
  ])[0];
}

function createDefaultFeedEvents() {
  return normalizeFeedEvents(DEFAULT_FEED_EVENTS);
}

function normalizeUserActivityHistory(history: SafetyCultureUserActivity[]) {
  return history
    .filter((item) => item && item.id && item.type && Number.isFinite(item.occurredAt) && Number.isFinite(item.postId))
    .map((item) => ({
      ...item,
      postAuthor: repairMojibakeText(item.postAuthor) || "Unknown author",
      postCategory: repairMojibakeText(item.postCategory) || "General",
      postPreview: repairMojibakeText(item.postPreview) || "ไม่มีรายละเอียดโพสต์",
      pointsDelta: Number(item.pointsDelta) || 0,
      commentText: repairMojibakeText(item.commentText)?.trim() || undefined,
    }))
    .sort((a, b) => b.occurredAt - a.occurredAt);
}

function createDefaultUserActivityHistory() {
  return normalizeUserActivityHistory(INITIAL_USER_ACTIVITY_HISTORY);
}

function normalizeInboxNotifications(notifications: AppInboxNotification[]) {
  return notifications
    .filter((item) => item && item.id && item.title && item.body && Number.isFinite(item.createdAt))
    .map((item) => ({
      ...item,
      title: repairMojibakeText(item.title),
      body: repairMojibakeText(item.body),
      actorName: repairMojibakeText(item.actorName)?.trim() || undefined,
      read: Boolean(item.read),
      href: buildNotificationHref(item),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

function mergeInboxNotificationsWithSeed(notifications: AppInboxNotification[]) {
  return normalizeInboxNotifications(notifications);
}
function createDefaultInboxNotifications() {
  return mergeInboxNotificationsWithSeed(INITIAL_INBOX_NOTIFICATIONS);
}

function inboxNotificationFromApi(
  item: Record<string, unknown>,
  backendFeedEvents: SafetyCultureFeedEvent[] = [],
): AppInboxNotification {
  const metadata = metadataRecord(item.metadata);
  const type = String(item.notification_type || "").toUpperCase();
  const kind: AppInboxNotificationKind = type === "LIKE" || type === "COMMENT_REACTION"
    ? "like" : type === "COMMENT" ? "comment" : type === "REWARD" ? "reward" : "activity";
  const postId = Number(metadata.postId ?? metadata.post_id);
  const rawEventId = metadata.eventId ?? metadata.event_id ?? metadata.activityId ?? metadata.feedEventId ?? item.target_event_id;
  const notificationTitle = String(item.title || "Notification");
  const fallbackEvent = kind === "activity"
    ? backendFeedEvents.find((event) => event.title.trim() === notificationTitle.trim())
    : undefined;
  const feedEventId = rawEventId != null && String(rawEventId).length > 0 ? String(rawEventId) : fallbackEvent?.id;
  const resolvedPostId = Number.isFinite(postId) && postId > 0 ? postId : undefined;
  const metadataHref = metadata.href && String(metadata.href) !== "/notifications" ? String(metadata.href) : undefined;
  return {
    id: String(item.id),
    kind,
    title: notificationTitle,
    body: String(item.body || ""),
    actorName: metadata.actorName ? String(metadata.actorName) : undefined,
    createdAt: new Date(String(item.created_at || Date.now())).getTime(),
    read: Boolean(item.read_at),
    postId: resolvedPostId,
    feedEventId,
    href: buildNotificationHref({ postId: resolvedPostId, feedEventId, href: metadataHref, kind }),
  };
}

type ApiPost = {
  id: string;
  authorId?: string;
  authorName: string;
  authorEmail?: string | null;
  authorProfileImageUrl?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  eventId?: string | null;
  category?: string | null;
  content: string;
  pointsAwarded?: number;
  status?: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  likeCount: number;
  commentCount: number;
  hasLiked: boolean;
  likedBy?: Array<{ userId: string; name: string; profileImageUrl?: string | null }>;
  photos?: Array<{ id: string; dataUrl?: string; url?: string; type?: string }>;
};

type ApiComment = {
  id: string | number;
  postId?: string | number;
  authorId?: string | number;
  authorName?: string | null;
  authorProfileImageUrl?: string | null;
  content?: string;
  text?: string;
  createdAt?: string;
  reactions?: Record<string, number>;
  viewerReaction?: string | null;
};

type ApiAwarenessAttempt = {
  id: string | number;
  attempt_date?: string;
  attemptDate?: string;
  completed_at?: string;
  completedAt?: string;
  score?: string | number;
  answers?: Array<{ id?: string | number; category?: string; text?: string; correct?: boolean }>;
};

function normalizeDateKey(value: unknown) {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return todayKey(parsed);
}

function awarenessCompletionFromApi(item: ApiAwarenessAttempt): AwarenessCompletion | null {
  const date = normalizeDateKey(item.attempt_date || item.attemptDate || item.completed_at || item.completedAt);
  if (!date) return null;
  const percent = Math.max(0, Math.min(100, Math.round(Number(item.score || 0))));
  const completedAt = item.completed_at || item.completedAt || `${date}T00:00:00.000Z`;
  const questions = Array.isArray(item.answers)
    ? item.answers.map((answer) => ({
        id: String(answer.id ?? ""),
        category: String(answer.category ?? ""),
        text: String(answer.text ?? ""),
        correct: Boolean(answer.correct),
      }))
    : [];
  if (questions.length === 0) return null;
  return {
    date,
    completedAt: String(completedAt),
    score: percent,
    total: 100,
    questions,
  };
}

function userDisplayName(user?: SessionUser | null) {
  return user ? getSessionDisplayName(user) : DEFAULT_CURRENT_USER_NAME;
}

function postFromApi(post: ApiPost): Post {
  const idNumber = Number(post.id);
  const authorName = repairMojibakeText(post.authorName) || "Unknown user";
  const createdAt = new Date(post.createdAt).getTime() || Date.now();
  const teamName = repairMojibakeText(post.teamName || "") || null;
  const organizationName = repairMojibakeText(post.organizationName || "") || null;
  const photos = Array.isArray(post.photos)
    ? post.photos
        .map((photo, index) => {
          const url = photo.url || photo.dataUrl || "";
          return {
            id: String(photo.id || `${post.id}-photo-${index + 1}`),
            dataUrl: url,
            url,
            type: String(photo.type || "upload"),
          };
        })
        .filter((photo) => photo.dataUrl)
    : [];

  return {
    id: Number.isFinite(idNumber) ? idNumber : Date.now(),
    author: authorName,
    avatarBg: "var(--brand-accent)",
    avatarColor: "#1A1A1A",
    avatarText: authorName.charAt(0).toUpperCase(),
    avatarImageUrl: post.authorProfileImageUrl || null,
    subtext: organizationName || teamName || "Safety Culture",
    category: repairMojibakeText(post.category || "") || "ทั่วไป",
    body: repairMojibakeText(post.content) || "",
    photos,
    likes: Math.max(0, Number(post.likeCount) || 0),
    comments: Math.max(0, Number(post.commentCount) || 0),
    points: Math.max(0, Number(post.pointsAwarded) || getSafetyPoint("safetyPostApproved")),
    hasLiked: Boolean(post.hasLiked),
    likedBy: Array.isArray(post.likedBy)
      ? post.likedBy.map((person) => ({
          userId: String(person.userId || ""),
          name: repairMojibakeText(person.name) || "ผู้ใช้งาน",
          profileImageUrl: person.profileImageUrl || null,
        }))
      : [],
    createdAt,
    authorId: post.authorId ? String(post.authorId) : undefined,
    authorEmail: post.authorEmail ?? null,
    organizationId: post.organizationId ? String(post.organizationId) : null,
    organizationName,
    teamId: post.teamId ? String(post.teamId) : null,
    teamName,
    team: teamName || undefined,
    location: organizationName || undefined,
    feedEventId: post.eventId ? String(post.eventId) : undefined,
  };
}

function commentFromApi(comment: ApiComment, viewerId?: string | null): Comment {
  const authorName = repairMojibakeText(comment.authorName || "") || "Unknown user";
  const authorId = comment.authorId ? String(comment.authorId) : undefined;
  return {
    id: String(comment.id),
    authorId,
    author: authorName,
    avatarText: authorName.charAt(0).toUpperCase() || "C",
    avatarImageUrl: comment.authorProfileImageUrl || null,
    text: repairMojibakeText(comment.content || comment.text || "") || "",
    reactions: comment.reactions || {},
    viewerReaction: comment.viewerReaction || null,
    isYou: Boolean(viewerId && authorId && String(authorId) === String(viewerId)),
    createdAt: parseTimestamp(comment.createdAt) ?? Date.now(),
  };
}

function parseTimestamp(value?: string | number | null) {
  if (value == null) return null;
  const time = typeof value === "number" ? value : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

const DEMO_SAFETY_CULTURE_TEAM_ID = "team-demo-safety";
const DEMO_SAFETY_CULTURE_ORG = "ศูนย์ Safety Excellence";

function createDemoSessionUser(): SessionUser {
  return {
    ...DEMO_ADMIN_USER,
    id: DEMO_ADMIN_USER.id || DEMO_ADMIN_USER.sub,
    name: "อนันต์ ใจดี (Demo)",
    firstNameTh: "อนันต์",
    lastNameTh: "ใจดี",
    division: "Safety Excellence",
  };
}

function filterDemoPosts(
  posts: Post[],
  currentUserId: string,
  options: { scope?: "all" | "my-team" | "mine"; category?: string | null; limit?: number } = {},
) {
  const scope = options.scope || "all";
  const category = options.category?.trim();
  let filtered = posts;

  if (scope === "mine") {
    filtered = filtered.filter((post) => String(post.authorId || "") === currentUserId);
  } else if (scope === "my-team") {
    filtered = filtered.filter((post) => String(post.teamId || "") === DEMO_SAFETY_CULTURE_TEAM_ID);
  }

  if (category && category !== "ทั้งหมด" && category !== "ทีมของฉัน") {
    filtered = filtered.filter((post) => post.category === category);
  }

  return filtered.slice(0, options.limit || 50);
}

function createDemoSafetyCultureSnapshot(demoUser: SessionUser, now = Date.now()) {
  const currentUserId = String(demoUser.id || demoUser.sub || "demo-admin");
  const currentUserName = getSessionDisplayName(demoUser);
  const currentUserInitials = getSessionInitials(demoUser);
  const makePhoto = (id: string, dataUrl: string): PostPhoto => ({ id, dataUrl, type: "demo" });
  const makeComment = (
    id: string,
    author: string,
    text: string,
    createdAtOffsetHours: number,
    options: Partial<Comment> = {},
  ): Comment => ({
    id,
    author,
    authorId: options.authorId,
    avatarText: options.avatarText || author.slice(0, 1),
    avatarImageUrl: options.avatarImageUrl || null,
    text,
    isYou: Boolean(options.isYou),
    createdAt: now - createdAtOffsetHours * 60 * 60 * 1000,
    reactions: options.reactions || {},
    viewerReaction: options.viewerReaction || null,
  });

  const feedEvents = normalizeFeedEvents([
    {
      id: "demo-event-kyt-week",
      title: "KYT Mission Week",
      subtitle: "ชวนทีมแชร์ภาพการชี้จุดเสี่ยงก่อนเริ่มงาน",
      summary: "โพสต์ภาพหรือแนวคิด KYT พร้อมแนบสิ่งที่ทีมตัดสินใจป้องกันความเสี่ยง",
      details: "ผู้เข้าร่วมที่โพสต์พร้อมภาพประกอบจะได้รับ Coin พิเศษ และโพสต์เด่นจะถูกปักหมุดบนฟีด Safety Culture",
      imageSrc: "/images/dashboard/cpac-activity-banner-bg.png",
      imageText: "KYT Mission",
      startDate: formatLocalDate(addDays(new Date(now), -2)),
      endDate: formatLocalDate(addDays(new Date(now), 5)),
      dateLabel: "",
      points: 25,
      status: "open",
      published: true,
      bonusMode: "fixed",
      multiplier: 1,
      fixedPoints: 10,
      enabledActions: ["theme-post", "comment", "reaction"],
    },
    {
      id: "demo-event-ppe-focus",
      title: "PPE Focus แชร์การใช้งานที่ถูกต้อง",
      subtitle: "ก่อนเริ่มงานวันนี้ ทีมคุณเช็ก PPE กันหรือยัง",
      summary: "แบ่งปันเคล็ดลับ PPE ที่ทำให้ทีมทำงานปลอดภัยขึ้นจริง",
      details: "โพสต์ที่มีรูป before/after หรือ checklist PPE จะช่วยให้ทีมอื่นเอาไปใช้ต่อได้ง่าย",
      imageSrc: "/images/heroes/admin-awareness-hero.png",
      imageText: "PPE Focus",
      startDate: formatLocalDate(addDays(new Date(now), -1)),
      endDate: formatLocalDate(addDays(new Date(now), 7)),
      dateLabel: "",
      points: 20,
      status: "open",
      published: true,
      bonusMode: "multiplier",
      multiplier: 2,
      fixedPoints: 0,
      enabledActions: ["theme-post", "reaction"],
    },
    {
      id: "demo-event-linewalk",
      title: "Line Walk แชร์จุดปรับปรุงหน้างาน",
      subtitle: "บอกสิ่งที่เห็นและแนวทางแก้ให้ทีมอื่นต่อยอดได้",
      summary: "โพสต์จุดเสี่ยงหรือไอเดียปรับปรุงที่พบจากการทำ Line Walk",
      details: "เหมาะกับหัวข้อหน้างานจริง เช่น ทางเดิน วัสดุ กั้นพื้นที่ หรือการติดป้ายเตือน",
      imageSrc: "/images/heroes/safety-report-history-hero.png",
      imageText: "Line Walk",
      startDate: formatLocalDate(addDays(new Date(now), -3)),
      endDate: formatLocalDate(addDays(new Date(now), 3)),
      dateLabel: "",
      points: 15,
      status: "open",
      published: true,
      bonusMode: "fixed",
      multiplier: 1,
      fixedPoints: 5,
      enabledActions: ["theme-post", "comment"],
    },
  ]);

  const posts = normalizePosts([
    {
      id: 9001,
      author: currentUserName,
      authorId: currentUserId,
      authorEmail: demoUser.email || "demo.admin@localhost",
      avatarBg: "var(--brand-accent)",
      avatarColor: "#173b6b",
      avatarText: currentUserInitials,
      avatarImageUrl: null,
      subtext: `${DEMO_SAFETY_CULTURE_ORG} · Safety Culture Champions`,
      category: "KYT",
      body: "เช้านี้ทีมลองทำ KYT หน้าเครื่องผสมก่อนเริ่มเดินเครื่อง พบว่าจุดเสี่ยงหลักคือสายไฟชาร์จวิทยุที่พาดข้ามทางเดิน เลยย้ายตำแหน่งและติด cable cover ทันที",
      photos: [makePhoto("demo-post-1-photo-1", "/images/heroes/safety-culture-post-hero.png")],
      likes: 18,
      comments: [
        makeComment("demo-comment-1", "พงศธร ทีมผลิต", "ชอบวิธีสรุปสั้น ๆ แบบนี้มาก เอาไปใช้กับกะบ่ายได้เลย", 1.8, {
          authorId: "user-prod-1",
          avatarText: "พ",
          reactions: { useful: 2, like: 1 },
        }),
        makeComment("demo-comment-2", "อรทัย EHS", "ดีเลยค่ะ ถ้ามีรูป after เพิ่มอีกมุมจะช่วยให้ทีมอื่นทำตามง่ายขึ้น", 1.3, {
          authorId: "user-ehs-1",
          avatarText: "อ",
          reactions: { like: 3 },
        }),
      ],
      points: 35,
      hasLiked: true,
      likedBy: [
        { userId: "user-ehs-1", name: "อรทัย EHS" },
        { userId: "user-prod-1", name: "พงศธร ทีมผลิต" },
        { userId: currentUserId, name: currentUserName },
      ],
      isYou: true,
      createdAt: now - 2 * 60 * 60 * 1000,
      feedEventId: "demo-event-kyt-week",
      feedEventTitle: "KYT Mission Week",
      organizationId: "org-demo",
      organizationName: DEMO_SAFETY_CULTURE_ORG,
      teamId: DEMO_SAFETY_CULTURE_TEAM_ID,
      teamName: "Safety Culture Champions",
      location: DEMO_SAFETY_CULTURE_ORG,
      team: "Safety Culture Champions",
    },
    {
      id: 9002,
      author: "สุชาดา หน่วยงานผลิต",
      authorId: "user-prod-2",
      avatarBg: "#DFF1FF",
      avatarColor: "#173b6b",
      avatarText: "ส",
      avatarImageUrl: null,
      subtext: "โรงงานสระบุรี · Green Kiln Team",
      category: "PPE",
      body: "แชร์วิธีจัดมุมตรวจ PPE ก่อนเข้าพื้นที่งานร้อน ทีมตั้ง check point หน้าโซนพร้อมตัวอย่างอุปกรณ์ที่ใส่ถูกต้อง ทำให้คนหน้างานหยิบใส่ครบมากขึ้น",
      photos: [makePhoto("demo-post-2-photo-1", "/images/heroes/safety-culture-rewards-hero.png")],
      likes: 26,
      comments: [
        makeComment("demo-comment-3", "วิชัย Maintenance", "ชอบที่มีตัวอย่าง PPE จริงให้ดู เทียบก่อนเข้าพื้นที่ได้เลย", 3.4, {
          authorId: "user-mtn-1",
          avatarText: "ว",
          reactions: { like: 2, wow: 1 },
        }),
      ],
      points: 28,
      hasLiked: false,
      likedBy: [
        { userId: "user-mtn-1", name: "วิชัย Maintenance" },
        { userId: "user-qc-1", name: "ชลธิชา QC" },
      ],
      createdAt: now - 5 * 60 * 60 * 1000,
      feedEventId: "demo-event-ppe-focus",
      organizationId: "org-saraburi",
      organizationName: "โรงงานสระบุรี",
      teamId: "team-green-kiln",
      teamName: "Green Kiln Team",
      location: "โรงงานสระบุรี",
      team: "Green Kiln Team",
    },
    {
      id: 9003,
      author: "ธีรภัทร วิศวกรรม",
      authorId: "user-eng-1",
      avatarBg: "#EAF6FF",
      avatarColor: "#173b6b",
      avatarText: "ธ",
      avatarImageUrl: null,
      subtext: `${DEMO_SAFETY_CULTURE_ORG} · Safety Culture Champions`,
      category: "Line Walk",
      body: "จากการ Line Walk รอบบ่าย เจอจุดวางวัสดุชิดทางหนีไฟเกินระยะที่กำหนด เลยทำ floor marking ใหม่และติดป้ายเตือนระยะ clear zone ให้ชัดขึ้น",
      photos: [makePhoto("demo-post-3-photo-1", "/images/heroes/safety-report-history-hero.png")],
      likes: 14,
      comments: [
        makeComment("demo-comment-4", currentUserName, "ดีมากครับ แบบนี้ทีมอื่นเห็นแล้วเอาไปเทียบพื้นที่ตัวเองได้เลย", 6.5, {
          authorId: currentUserId,
          avatarText: currentUserInitials,
          isYou: true,
          reactions: { useful: 1 },
        }),
      ],
      points: 22,
      hasLiked: true,
      likedBy: [
        { userId: currentUserId, name: currentUserName },
        { userId: "user-ehs-1", name: "อรทัย EHS" },
      ],
      createdAt: now - 8 * 60 * 60 * 1000,
      feedEventId: "demo-event-linewalk",
      organizationId: "org-demo",
      organizationName: DEMO_SAFETY_CULTURE_ORG,
      teamId: DEMO_SAFETY_CULTURE_TEAM_ID,
      teamName: "Safety Culture Champions",
      location: DEMO_SAFETY_CULTURE_ORG,
      team: "Safety Culture Champions",
    },
    {
      id: 9004,
      author: "วรางคณา Office Support",
      authorId: "user-office-1",
      avatarBg: "#EFF7FF",
      avatarColor: "#173b6b",
      avatarText: "ว",
      avatarImageUrl: null,
      subtext: "สำนักงานใหญ่ · Office Safety Squad",
      category: "5S",
      body: "ทีมลองปรับมุมเก็บเอกสารและสายชาร์จใต้โต๊ะประชุมใหม่ตาม 5S ทำให้พื้นที่โล่งขึ้นมาก เวลาเดินตรวจหรือประชุมด่วนไม่สะดุดสายอีกแล้ว",
      photos: [makePhoto("demo-post-4-photo-1", "/images/heroes/admin-users-hero.png")],
      likes: 9,
      comments: [],
      points: 16,
      hasLiked: false,
      likedBy: [],
      createdAt: now - 26 * 60 * 60 * 1000,
      organizationId: "org-hq",
      organizationName: "สำนักงานใหญ่",
      teamId: "team-office-safety",
      teamName: "Office Safety Squad",
      location: "สำนักงานใหญ่",
      team: "Office Safety Squad",
    },
    {
      id: 9005,
      author: "อรทัย EHS",
      authorId: "user-ehs-1",
      avatarBg: "#DFF1FF",
      avatarColor: "#173b6b",
      avatarText: "อ",
      avatarImageUrl: null,
      subtext: "ศูนย์ฝึกอบรม · Safety Coach",
      category: "เคล็ดลับ",
      body: "เคล็ดลับสั้น ๆ สำหรับโพสต์ Safety Culture ให้คนอยากอ่านต่อ: 1) เริ่มจากสิ่งที่พบจริง 2) บอกว่าทำอะไรแก้ 3) ปิดท้ายด้วยสิ่งที่ทีมอื่นเอาไปใช้ต่อได้",
      photos: [],
      imageText: "Safety Tips",
      likes: 31,
      comments: [
        makeComment("demo-comment-5", "สุชาดา หน่วยงานผลิต", "ข้อ 3 สำคัญมากค่ะ ถ้าเอาไปใช้ต่อไม่ได้คนจะอ่านจบยาก", 20, {
          authorId: "user-prod-2",
          avatarText: "ส",
          reactions: { like: 4, useful: 2 },
        }),
      ],
      points: 18,
      hasLiked: false,
      likedBy: [
        { userId: "user-prod-2", name: "สุชาดา หน่วยงานผลิต" },
        { userId: "user-mtn-1", name: "วิชัย Maintenance" },
      ],
      createdAt: now - 32 * 60 * 60 * 1000,
      organizationId: "org-training",
      organizationName: "ศูนย์ฝึกอบรม",
      teamId: "team-safety-coach",
      teamName: "Safety Coach",
      location: "ศูนย์ฝึกอบรม",
      team: "Safety Coach",
    },
  ]);

  const teamStandings = normalizeTeamStandings([
    {
      id: DEMO_SAFETY_CULTURE_TEAM_ID,
      rank: 1,
      name: "Safety Culture Champions",
      leader: "อนันต์ ใจดี",
      leaderUserId: currentUserId,
      leaderEmail: demoUser.email || "demo.admin@localhost",
      members: 12,
      color: "#0B82F0",
      points: 420,
      percent: 100,
      streak: 9,
      awards: 5,
    },
    {
      id: "team-green-kiln",
      rank: 2,
      name: "Green Kiln Team",
      leader: "สุชาดา หน่วยงานผลิต",
      leaderUserId: "user-prod-2",
      leaderEmail: "suchada@example.com",
      members: 15,
      color: "#18B989",
      points: 385,
      percent: 92,
      streak: 7,
      awards: 4,
    },
    {
      id: "team-office-safety",
      rank: 3,
      name: "Office Safety Squad",
      leader: "วรางคณา Office Support",
      leaderUserId: "user-office-1",
      leaderEmail: "office@example.com",
      members: 9,
      color: "#F59E0B",
      points: 344,
      percent: 82,
      streak: 4,
      awards: 3,
    },
    {
      id: "team-safety-coach",
      rank: 4,
      name: "Safety Coach",
      leader: "อรทัย EHS",
      leaderUserId: "user-ehs-1",
      leaderEmail: "orathai@example.com",
      members: 8,
      color: "#8B5CF6",
      points: 298,
      percent: 71,
      streak: 5,
      awards: 2,
    },
  ]);

  const personalRankings = normalizePersonalRankings([
    { id: currentUserId, rank: "#1", name: currentUserName, points: 185, team: "Safety Culture Champions", active: true },
    { id: "user-ehs-1", rank: "#2", name: "อรทัย EHS", points: 176, team: "Safety Coach" },
    { id: "user-prod-2", rank: "#3", name: "สุชาดา หน่วยงานผลิต", points: 168, team: "Green Kiln Team" },
    { id: "user-eng-1", rank: "#4", name: "ธีรภัทร วิศวกรรม", points: 154, team: "Safety Culture Champions" },
    { id: "user-office-1", rank: "#5", name: "วรางคณา Office Support", points: 149, team: "Office Safety Squad" },
    { id: "user-mtn-1", rank: "#6", name: "วิชัย Maintenance", points: 132, team: "Green Kiln Team" },
  ]);

  const rewardsCatalog = normalizeRewardsCatalog([
    {
      id: 701,
      name: "แก้วน้ำ Safety Caring",
      category: "merch",
      description: "แก้วเก็บอุณหภูมิพร้อมลาย Safety Caring รุ่น Demo",
      imageText: "Safety Mug",
      imageSrc: "/images/heroes/safety-culture-rewards-hero.png",
      points: 120,
      isHot: true,
      stockMode: "limited",
      stockTotal: 50,
      stockRemaining: 18,
    },
    {
      id: 702,
      name: "Voucher Coffee Shop",
      category: "voucher",
      description: "คูปองเครื่องดื่มสำหรับผู้ทำกิจกรรมต่อเนื่อง",
      imageText: "Coffee Voucher",
      imageSrc: "/images/heroes/admin-reward-hero.png",
      points: 150,
      stockMode: "limited",
      stockTotal: 100,
      stockRemaining: 42,
    },
    {
      id: 703,
      name: "ชุด PPE Premium",
      category: "ppe",
      description: "เซ็ตหมวกนิรภัยและถุงมือสำหรับใช้งานหน้างาน",
      imageText: "PPE Set",
      imageSrc: "/images/heroes/admin-awareness-hero.png",
      points: 220,
      stockMode: "limited",
      stockTotal: 20,
      stockRemaining: 6,
    },
    {
      id: 704,
      name: "Team Lunch Reward",
      category: "team",
      description: "สิทธิ์เลี้ยงอาหารกลางวันทีมสำหรับทีมที่ทำ Coin สูง",
      imageText: "Team Lunch",
      imageSrc: "/images/heroes/safety-culture-leaderboard-hero.png",
      points: 300,
      stockMode: "unlimited",
      stockTotal: null,
      stockRemaining: null,
    },
  ]);

  const rewardRedemptions = normalizeRewardRedemptions([
    {
      id: "demo-redemption-1",
      rewardId: 701,
      rewardName: "แก้วน้ำ Safety Caring",
      rewardCategory: "merch",
      pointsSpent: 120,
      redeemedAt: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
      redeemedBy: currentUserName,
    },
  ]);

  const inboxNotifications = normalizeInboxNotifications([
    {
      id: "demo-noti-1",
      kind: "like",
      title: "อรทัย EHS กดถูกใจโพสต์ของคุณ",
      body: "โพสต์ KYT หน้าเครื่องผสมได้รับความสนใจจากทีม EHS",
      actorName: "อรทัย EHS",
      createdAt: now - 35 * 60 * 1000,
      read: false,
      postId: 9001,
    },
    {
      id: "demo-noti-2",
      kind: "comment",
      title: "มีคอมเมนต์ใหม่บนโพสต์ของคุณ",
      body: "สุชาดา หน่วยงานผลิต ฝากความคิดเห็นเกี่ยวกับแนวทาง PPE ที่คุณแชร์",
      actorName: "สุชาดา หน่วยงานผลิต",
      createdAt: now - 75 * 60 * 1000,
      read: false,
      postId: 9001,
    },
    {
      id: "demo-noti-3",
      kind: "activity",
      title: "กิจกรรมใหม่ KYT Mission Week เริ่มแล้ว",
      body: "แชร์ตัวอย่าง KYT หรือภาพจุดเสี่ยงเพื่อรับ Coin เพิ่ม",
      createdAt: now - 3 * 60 * 60 * 1000,
      read: true,
      feedEventId: "demo-event-kyt-week",
    },
    {
      id: "demo-noti-4",
      kind: "reward",
      title: "Coin ของคุณพร้อมแลกรางวัลแล้ว",
      body: "ตอนนี้คุณมี 185 Coin ลองแวะดู reward catalog ได้เลย",
      createdAt: now - 5 * 60 * 60 * 1000,
      read: true,
      href: "/safety-culture/rewards",
    },
  ]);

  const userActivityHistory = normalizeUserActivityHistory([
    {
      id: "demo-activity-1",
      type: "post",
      occurredAt: now - 2 * 60 * 60 * 1000,
      postId: 9001,
      postAuthor: currentUserName,
      postCategory: "KYT",
      postPreview: "เช้านี้ทีมลองทำ KYT หน้าเครื่องผสมก่อนเริ่มเดินเครื่อง...",
      pointsDelta: 35,
    },
    {
      id: "demo-activity-2",
      type: "reaction",
      occurredAt: now - 90 * 60 * 1000,
      postId: 9003,
      postAuthor: "ธีรภัทร วิศวกรรม",
      postCategory: "Line Walk",
      postPreview: "จากการ Line Walk รอบบ่าย เจอจุดวางวัสดุชิดทางหนีไฟ...",
      pointsDelta: 5,
    },
    {
      id: "demo-activity-3",
      type: "comment",
      occurredAt: now - 80 * 60 * 1000,
      postId: 9002,
      postAuthor: "สุชาดา หน่วยงานผลิต",
      postCategory: "PPE",
      postPreview: "แชร์วิธีจัดมุมตรวจ PPE ก่อนเข้าพื้นที่งานร้อน...",
      pointsDelta: 5,
      commentText: "ทีมเราจะลองทำมุมเช็ก PPE แบบนี้บ้าง",
    },
  ]);

  const awarenessHistory = [
    {
      date: todayKey(new Date(now)),
      completedAt: new Date(now - 45 * 60 * 1000).toISOString(),
      score: 100,
      total: 100,
      questions: [
        { id: "demo-aw-1", category: "PPE", text: "หมวกนิรภัยต้องรัดสายคางเมื่ออยู่ในพื้นที่เสี่ยง", correct: true },
      ],
    },
    {
      date: todayKey(addDays(new Date(now), -1)),
      completedAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      score: 80,
      total: 100,
      questions: [
        { id: "demo-aw-2", category: "KYT", text: "ควรทำ KYT ก่อนเริ่มงานทุกครั้ง", correct: true },
      ],
    },
  ];

  return {
    user: demoUser,
    currentUserPoints: 185,
    posts,
    feedEvents,
    teamStandings,
    personalRankings,
    rewardsCatalog,
    rewardCategories: createDefaultRewardCategories(),
    rewardRedemptions,
    inboxNotifications,
    userActivityHistory,
    awarenessQuestions: createDefaultAwarenessQuestions(),
    awarenessHistory,
    awarenessDoneDate: todayKey(new Date(now)),
    awarenessHolidays: [],
    safetyCultureEvent: createDefaultSafetyCultureEvent(),
  };
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [userActivityHistory, setUserActivityHistory] = useState<SafetyCultureUserActivity[]>([]);
  const [notification, setNotification] = useState<NotificationType>(null);
  const [inboxNotifications, setInboxNotifications] = useState<AppInboxNotification[]>([]);
  const [currentUserPoints, setCurrentUserPoints] = useState(0);
  // NOTE: Must be a deterministic, static seed (no `new Date()`), otherwise the
  // server (UTC) and client (local TZ) compute different dates and React throws
  // a hydration mismatch (#418). The today-based default is applied on the
  // client inside the load effect below.
  const [safetyCultureEvent, setSafetyCultureEvent] = useState<SafetyCultureEventConfig>(() => createDefaultSafetyCultureEvent());
  const [feedEvents, setFeedEvents] = useState<SafetyCultureFeedEvent[]>([]);
  const [teamStandings, setTeamStandings] = useState<LeaderboardTeam[]>([]);
  const [personalRankings, setPersonalRankings] = useState<LeaderboardPerson[]>([]);
  const [rewardsCatalog, setRewardsCatalog] = useState<RewardCatalogItem[]>([]);
  const [rewardCategories, setRewardCategories] = useState<RewardCategory[]>(() => createDefaultRewardCategories());
  const [rewardRedemptions, setRewardRedemptions] = useState<RewardRedemptionRecord[]>([]);
  const [awarenessQuestions, setAwarenessQuestions] = useState<SafetyAwarenessQuestion[]>([]);
  const [awarenessDoneDate, setAwarenessDoneDate] = useState<string>("");
  const [awarenessHistory, setAwarenessHistory] = useState<AwarenessCompletion[]>([]);
  const [awarenessHolidays, setAwarenessHolidays] = useState<AwarenessHoliday[]>([]);
  const [awarenessEnabled, setAwarenessEnabledState] = useState<boolean>(true);
  const [awarenessWeekdays, setAwarenessWeekdaysState] = useState<number[]>([1, 2, 3, 4, 5]);
  const [awarenessActiveStartTime, setAwarenessActiveStartTimeState] = useState<string>("08:00");
  const [awarenessActiveEndTime, setAwarenessActiveEndTimeState] = useState<string>("17:00");
  const [eventNow, setEventNow] = useState(0);
  const postsRef = useRef<Post[]>([]);
  const demoModeRef = useRef(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const getLinkedFeedEvent = useCallback(
    (feedEventId?: string) => {
      if (!feedEventId) return null;
      return feedEvents.find((event) => event.id === feedEventId) ?? null;
    },
    [feedEvents]
  );

  // true เมื่อมี session (ล็อกอินแล้ว) ใช้กันไม่ให้ยิง API ที่ต้องล็อกอินตอนยังไม่ล็อกอิน -> ไม่มี error 401 ใน console
  const isAuthenticatedRef = useRef(false);
  const currentUserRef = useRef<SessionUser | null>(null);

  const loadPostComments = useCallback(async (postId: number | string, viewerId?: string | null) => {
    const result = await apiFetch<{ items: ApiComment[] }>(`/api/safety-culture/posts/${postId}/comments?limit=100`);
    if (!result.ok || !Array.isArray(result.data?.items)) return null;
    return result.data.items.map((item) => commentFromApi(item, viewerId ?? currentUserRef.current?.id ?? null));
  }, []);

  const refreshInboxNotifications = useCallback(async (events: SafetyCultureFeedEvent[] = feedEvents) => {
    if (!isAuthenticatedRef.current) return;
    const notificationsResult = await apiFetch<{ items: Array<Record<string, unknown>> }>("/api/notifications?limit=100");
    if (!notificationsResult.ok || !Array.isArray(notificationsResult.data?.items)) return;
    setInboxNotifications(notificationsResult.data.items.map((item) => inboxNotificationFromApi(item, events)));
  }, [feedEvents]);

  const refreshPostsSnapshot = useCallback(async () => {
    if (!isAuthenticatedRef.current) return;
    const viewerId = currentUserRef.current?.id ? String(currentUserRef.current.id) : null;
    const result = await apiFetch<{ items: ApiPost[] }>("/api/safety-culture/posts?limit=50&scope=all");
    if (!result.ok || !Array.isArray(result.data?.items)) return;

    const mappedPosts = result.data.items.map((item) => {
      const mapped = postFromApi(item);
      return { ...mapped, isYou: Boolean(viewerId && mapped.authorId && mapped.authorId === viewerId) };
    });

    const currentPosts = postsRef.current;
    const postsWithComments = await Promise.all(
      mappedPosts.map(async (post) => {
        const existing = currentPosts.find((item) => item.id === post.id);
        if (!Array.isArray(existing?.comments)) return post;
        const comments = await loadPostComments(post.id, viewerId).catch(() => null);
        return comments ? { ...post, comments } : post;
      }),
    );

    setPosts(postsWithComments);
  }, [loadPostComments]);

  const refreshPointBalance = useCallback(async () => {
    const balance = await apiFetch<{ balance: { balance: number } }>("/api/safety-culture/points/me");
    if (balance.ok && typeof balance.data?.balance?.balance === "number") {
      setCurrentUserPoints(Math.max(0, balance.data.balance.balance));
    }
  }, []);

  const refreshRewardsState = useCallback(async () => {
    const [rewardsResult, rewardCategoriesResult] = await Promise.all([
      apiFetch<{ items: Array<Record<string, unknown>> }>("/api/safety-culture/rewards?pageSize=100"),
      apiFetch<{ setting: { setting_value?: unknown } | null }>("/api/safety-settings?key=safety_reward_categories"),
    ]);

    if (rewardsResult.ok && Array.isArray(rewardsResult.data?.items)) {
      setRewardsCatalog(rewardsResult.data.items.map(rewardFromApi));
    }

    if (rewardCategoriesResult.ok) {
      const settingValue = rewardCategoriesResult.data?.setting?.setting_value;
      const parsed = metadataRecord(settingValue);
      const categories = Array.isArray(parsed.categories) ? parsed.categories : Array.isArray(settingValue) ? settingValue : [];
      if (categories.length > 0) {
        setRewardCategories(normalizeRewardCategories(categories as RewardCategory[]));
      }
    }

    return rewardsResult.ok && rewardCategoriesResult.ok;
  }, []);

  const refreshLeaderboardState = useCallback(async (sessionUser?: SessionUser | null) => {
    const [leaderboardResult, teamsResult] = await Promise.all([
      apiFetch<{ items: Array<Record<string, unknown>> }>("/api/safety-culture/leaderboard"),
      apiFetch<{ items: Array<Record<string, unknown>> }>("/api/safety-culture/teams"),
    ]);

    if (leaderboardResult.ok && Array.isArray(leaderboardResult.data?.items)) {
      setPersonalRankings(leaderboardResult.data.items.map((item, index) => ({
        id: String(item.user_id || item.userId || item.id),
        rank: `#${index + 1}`,
        name: String(item.name_th || item.nameTh || item.name || "Unknown user"),
        points: Number(item.points || 0),
        team: String(item.team || item.team_name || item.teamName || ""),
        active: Boolean(sessionUser?.id && String(item.user_id || item.userId || item.id) === String(sessionUser.id)),
      })));
    }

    if (teamsResult.ok && Array.isArray(teamsResult.data?.items)) {
      const maxPoints = Math.max(1, ...teamsResult.data.items.map((item) => Number(item.points || 0)));
      setTeamStandings(teamsResult.data.items.map((item, index) => ({
        id: String(item.id),
        rank: index + 1,
        name: String(item.name || item.team_name || item.teamName || ""),
        leaderUserId: String(item.leader_user_id || item.leaderUserId || ""),
        leaderEmail: String(item.leader_email || item.leaderEmail || ""),
        leaderProfileImageUrl: (item.leader_profile_image_url || item.leaderProfileImageUrl || null) as string | null,
        leader: String(item.leader_name_th || item.leaderNameTh || item.leader_name_en || item.leaderNameEn || item.leader_email || item.leaderEmail || ""),
        members: Number(item.members || item.member_count || item.memberCount || 0),
        color: String(item.color || "var(--brand-accent)"),
        points: Number(item.points || 0),
        percent: (Number(item.points || 0) / maxPoints) * 100,
        streak: Number(item.streak || 0),
        awards: Number(item.awards || 0),
      })));
    }

    return leaderboardResult.ok && teamsResult.ok;
  }, []);

  const refreshAwarenessAttempts = useCallback(async () => {
    const attemptsResult = await apiFetch<{ items: ApiAwarenessAttempt[] }>("/api/safety-awareness/attempts/me?pageSize=120");
    if (attemptsResult.ok && Array.isArray(attemptsResult.data?.items)) {
      const history = attemptsResult.data.items
        .map(awarenessCompletionFromApi)
        .filter((item): item is AwarenessCompletion => Boolean(item))
        .sort((left, right) => left.date.localeCompare(right.date));
      setAwarenessHistory(history);
      setAwarenessDoneDate(history.some((item) => item.date === todayKey()) ? todayKey() : "");
    }
  }, [loadPostComments]);

  useEffect(() => {
    let cancelled = false;

    async function loadBackendState() {
      let demoLoginAllowed = false;
      try {
        demoLoginAllowed =
          process.env.NODE_ENV !== "production"
          && isLocalDemoLoginHost(window.location.hostname)
          && window.sessionStorage.getItem(DEMO_LOGIN_SESSION_KEY) === "true";
      } catch {
        demoLoginAllowed = false;
      }

      // ตรวจ session ก่อน ถ้ายังไม่ล็อกอินก็ไม่ต้องเรียก API ที่ต้องยืนยันตัวตน
      let authed = false;
      let sessionUser: SessionUser | null = null;
      try {
        const sessionRes = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" });
        if (sessionRes.ok) {
          const session = await sessionRes.json().catch(() => null);
          authed = !!(session?.authenticated || session?.user);
          sessionUser = session?.user || null;
        }
      } catch {
        authed = false;
      }
      if (cancelled) return;
      isAuthenticatedRef.current = authed;
      currentUserRef.current = sessionUser;
      demoModeRef.current = false;

      if (!authed) {
        if (demoLoginAllowed) {
          const demoUser = createDemoSessionUser();
          const demoSnapshot = createDemoSafetyCultureSnapshot(demoUser);
          currentUserRef.current = demoUser;
          demoModeRef.current = true;
          setCurrentUserPoints(demoSnapshot.currentUserPoints);
          setPosts(demoSnapshot.posts);
          setFeedEvents(demoSnapshot.feedEvents);
          setTeamStandings(demoSnapshot.teamStandings);
          setPersonalRankings(demoSnapshot.personalRankings);
          setRewardsCatalog(demoSnapshot.rewardsCatalog);
          setRewardCategories(demoSnapshot.rewardCategories);
          setRewardRedemptions(demoSnapshot.rewardRedemptions);
          setInboxNotifications(demoSnapshot.inboxNotifications);
          setUserActivityHistory(demoSnapshot.userActivityHistory);
          setAwarenessQuestions(demoSnapshot.awarenessQuestions);
          setAwarenessHistory(demoSnapshot.awarenessHistory);
          setAwarenessDoneDate(demoSnapshot.awarenessDoneDate);
          setAwarenessHolidays(demoSnapshot.awarenessHolidays);
          setSafetyCultureEvent(demoSnapshot.safetyCultureEvent);
          setAwarenessActiveStartTimeState("08:00");
          setAwarenessActiveEndTimeState("17:00");
        }
        return;
      }

      const [
        postsResult,
        balanceResult,
        notificationsResult,
        rewardsResult,
        rewardCategoriesResult,
        leaderboardResult,
        teamsResult,
        awarenessResult,
        attemptsResult,
        holidaysResult,
        eventsResult,
        transactionsResult,
        awarenessEnabledResult,
        awarenessWeekdaysResult,
        campaignStartDateResult,
        campaignEndDateResult
      ] = await Promise.all([
        apiFetch<{ items: ApiPost[] }>("/api/safety-culture/posts?limit=50"),
        apiFetch<{ balance: { balance: number } }>("/api/safety-culture/points/me"),
        apiFetch<{ items: Array<Record<string, unknown>> }>("/api/notifications?limit=100"),
        apiFetch<{ items: Array<Record<string, unknown>> }>("/api/safety-culture/rewards?pageSize=100"),
        apiFetch<{ setting: { setting_value?: unknown } | null }>("/api/safety-settings?key=safety_reward_categories"),
        apiFetch<{ items: Array<Record<string, unknown>> }>("/api/safety-culture/leaderboard"),
        apiFetch<{ items: Array<Record<string, unknown>> }>("/api/safety-culture/teams"),
        apiFetch<{ items: Array<Record<string, unknown>> }>("/api/safety-awareness/questions/admin?pageSize=1000"),
        apiFetch<{ items: ApiAwarenessAttempt[] }>("/api/safety-awareness/attempts/me?pageSize=120"),
        apiFetch<{ items: Array<Record<string, unknown>> }>(`/api/holidays?year=${new Date().getFullYear()}`),
        apiFetch<{ items: Array<Record<string, unknown>> }>("/api/safety-culture/events?pageSize=100"),
        apiFetch<{ items: Array<{ id: string; amount: number; sourceType: string; sourceId?: string | null; description?: string | null; occurredAt: string }> }>("/api/safety-culture/points/me/transactions?limit=100"),
        apiFetch<{ setting: { setting_value?: unknown } | null }>("/api/safety-settings?key=safety_awareness_enabled"),
        apiFetch<{ setting: { setting_value?: unknown } | null }>("/api/safety-settings?key=safety_awareness_weekdays"),
        apiFetch<{ setting: { setting_value?: unknown } | null }>("/api/safety-settings?key=safety_awareness_active_start_time"),
        apiFetch<{ setting: { setting_value?: unknown } | null }>("/api/safety-settings?key=safety_awareness_active_end_time"),
      ]);

      if (cancelled) return;
      const backendFeedEvents = eventsResult.ok && Array.isArray(eventsResult.data?.items)
        ? eventsResult.data.items.map(feedEventFromApi)
        : [];

      if (postsResult.ok && Array.isArray(postsResult.data?.items)) {
        const viewerId = sessionUser?.id ? String(sessionUser.id) : null;
        const backendPosts = postsResult.data.items.map((item) => {
          const mapped = postFromApi(item);
          return { ...mapped, isYou: Boolean(viewerId && mapped.authorId && mapped.authorId === viewerId) };
        });
        const hydratedPosts = await Promise.all(
          backendPosts.map(async (post) => {
            const comments = await loadPostComments(post.id, viewerId).catch(() => null);
            return comments ? { ...post, comments } : post;
          }),
        );
        if (!cancelled) setPosts(hydratedPosts);
      }

      if (balanceResult.ok && typeof balanceResult.data?.balance?.balance === "number") {
        setCurrentUserPoints(Math.max(0, balanceResult.data.balance.balance));
      }
      if (transactionsResult.ok && Array.isArray(transactionsResult.data?.items)) {
        setUserActivityHistory(normalizeUserActivityHistory(transactionsResult.data.items.map((item) => ({
          id: `transaction-${item.id}`,
          type: item.sourceType === "REWARD" ? "redeem" : item.sourceType === "COMMENT" ? "comment" : item.sourceType === "REACTION" ? "reaction" : item.sourceType === "POST" ? "post" : item.sourceType === "SAFETY_AWARENESS" ? "awareness" : "safety-effort",
          occurredAt: new Date(item.occurredAt).getTime(),
          postId: item.sourceType === "POST" ? Number(item.sourceId) || 0 : 0,
          postAuthor: userDisplayName(sessionUser),
          postCategory: item.sourceType,
          postPreview: item.description || item.sourceType,
          pointsDelta: Number(item.amount) || 0,
        }))));
      }

      if (notificationsResult.ok && Array.isArray(notificationsResult.data?.items)) {
        setInboxNotifications(notificationsResult.data.items.map((item) => inboxNotificationFromApi(item, backendFeedEvents)));
      }

      if (rewardsResult.ok && Array.isArray(rewardsResult.data?.items)) {
        setRewardsCatalog(rewardsResult.data.items.map(rewardFromApi));
      }

      if (rewardCategoriesResult.ok) {
        const settingValue = rewardCategoriesResult.data?.setting?.setting_value;
        const parsed = metadataRecord(settingValue);
        const categories = Array.isArray(parsed.categories) ? parsed.categories : Array.isArray(settingValue) ? settingValue : [];
        if (categories.length > 0) {
          setRewardCategories(normalizeRewardCategories(categories as RewardCategory[]));
        }
      }

      if (leaderboardResult.ok && Array.isArray(leaderboardResult.data?.items)) {
        setPersonalRankings(leaderboardResult.data.items.map((item, index) => ({
          id: String(item.user_id || item.userId || item.id),
          rank: `#${index + 1}`,
          name: String(item.name_th || item.nameTh || item.name || "Unknown user"),
          points: Number(item.points || 0),
          team: String(item.team || item.team_name || item.teamName || ""),
          active: Boolean(sessionUser?.id && String(item.user_id || item.userId || item.id) === String(sessionUser.id)),
        })));
      }

      if (teamsResult.ok && Array.isArray(teamsResult.data?.items)) {
        const maxPoints = Math.max(1, ...teamsResult.data.items.map((item) => Number(item.points || 0)));
        setTeamStandings(teamsResult.data.items.map((item, index) => ({
          id: String(item.id),
          rank: index + 1,
          name: String(item.name || item.team_name || item.teamName || ""),
          leaderUserId: String(item.leader_user_id || item.leaderUserId || ""),
          leaderEmail: String(item.leader_email || item.leaderEmail || ""),
          leaderProfileImageUrl: (item.leader_profile_image_url || item.leaderProfileImageUrl || null) as string | null,
          leader: String(item.leader_name_th || item.leaderNameTh || item.leader_name_en || item.leaderNameEn || item.leader_email || item.leaderEmail || ""),
          members: Number(item.members || item.member_count || item.memberCount || 0),
          color: String(item.color || "var(--brand-accent)"),
          points: Number(item.points || 0),
          percent: (Number(item.points || 0) / maxPoints) * 100,
          streak: Number(item.streak || 0),
          awards: Number(item.awards || 0),
        })));
      }

      if (awarenessResult.ok && Array.isArray(awarenessResult.data?.items) && awarenessResult.data.items.length > 0) {
        setAwarenessQuestions(awarenessResult.data.items.map((item) => {
          const options = item.options_json as Record<string, unknown> | null;
          return {
            id: String(item.id),
            category: String((options && options.category) || "ทั่วไป"),
            text: String(item.question_text || ""),
            answer: Boolean((options && options.answer) ?? true),
            note: String((options && options.note) || ""),
            enabled: String(item.status || "ACTIVE").toUpperCase() === "ACTIVE",
          };
        }));
      } else {
        // The daily gate cannot open without enabled questions. Keep the
        // built-in safety bank as a fail-safe when the API is empty or down,
        // so an incomplete user must still finish Awareness before proceeding.
        setAwarenessQuestions(createDefaultAwarenessQuestions());
      }

      if (attemptsResult.ok && Array.isArray(attemptsResult.data?.items)) {
        const history = attemptsResult.data.items
          .map(awarenessCompletionFromApi)
          .filter((item): item is AwarenessCompletion => Boolean(item))
          .sort((left, right) => left.date.localeCompare(right.date));
        setAwarenessHistory(history);
        setAwarenessDoneDate(history.some((item) => item.date === todayKey()) ? todayKey() : "");
      }

      if (holidaysResult.ok && Array.isArray(holidaysResult.data?.items)) {
        setAwarenessHolidays(holidaysResult.data.items.map((item) => ({
          id: item.id ? String(item.id) : undefined,
          date: String(item.holiday_date || "").slice(0, 10),
          name: String(item.name || ""),
        })));
      }

      if (awarenessEnabledResult.ok && awarenessEnabledResult.data?.setting) {
        const raw = awarenessEnabledResult.data.setting.setting_value;
        const value = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (value && typeof value === "object" && value.enabled !== undefined) {
          setAwarenessEnabledState(Boolean(value.enabled));
        }
      }

      if (awarenessWeekdaysResult && awarenessWeekdaysResult.ok && awarenessWeekdaysResult.data?.setting) {
        const raw = awarenessWeekdaysResult.data.setting.setting_value;
        const value = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (value && typeof value === "object" && Array.isArray(value.weekdays)) {
          setAwarenessWeekdaysState(value.weekdays.map(Number));
        }
      }

      if (campaignStartDateResult && campaignStartDateResult.ok && campaignStartDateResult.data?.setting) {
        const raw = campaignStartDateResult.data.setting.setting_value;
        const value = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (value && typeof value === "object" && value.startTime !== undefined) {
          setAwarenessActiveStartTimeState(String(value.startTime));
        }
      }

      if (campaignEndDateResult && campaignEndDateResult.ok && campaignEndDateResult.data?.setting) {
        const raw = campaignEndDateResult.data.setting.setting_value;
        const value = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (value && typeof value === "object" && value.endTime !== undefined) {
          setAwarenessActiveEndTimeState(String(value.endTime));
        }
      }

      if (eventsResult.ok && Array.isArray(eventsResult.data?.items)) {
        setFeedEvents(backendFeedEvents);
      }
    }

    void loadBackendState();
    return () => {
      cancelled = true;
    };
  }, [loadPostComments]);

  useEffect(() => {
    if (!isAuthenticatedRef.current) return;

    const refreshLiveSafetyCultureState = () => {
      void refreshInboxNotifications();
      void refreshPostsSnapshot();
      void refreshRewardsState();
      void refreshLeaderboardState(currentUserRef.current);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshLiveSafetyCultureState();
      }
    };

    window.addEventListener("focus", refreshLiveSafetyCultureState);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(refreshLiveSafetyCultureState, 30000);

    return () => {
      window.removeEventListener("focus", refreshLiveSafetyCultureState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [refreshInboxNotifications, refreshLeaderboardState, refreshPostsSnapshot, refreshRewardsState]);

  useEffect(() => {
    setEventNow(Date.now());

    const timer = window.setInterval(() => {
      setEventNow(Date.now());
    }, 1000 * 15);

    return () => window.clearInterval(timer);
  }, []);

  const showNotification = useCallback((n: NotificationType) => {
    setNotification(n);
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const markInboxNotificationRead = useCallback((notificationId: string) => {
    setInboxNotifications((current) =>
      normalizeInboxNotifications(
        current.map((item) => (item.id === notificationId ? { ...item, read: true } : item))
      )
    );
    if (isAuthenticatedRef.current) {
      void apiFetch(`/api/notifications/${notificationId}/read`, apiJson("PATCH", {}));
    }
  }, []);

  const markAllInboxNotificationsRead = useCallback(() => {
    setInboxNotifications((current) =>
      normalizeInboxNotifications(current.map((item) => ({ ...item, read: true })))
    );
    if (isAuthenticatedRef.current) {
      void apiFetch("/api/notifications/read-all", apiJson("PATCH", {}));
    }
  }, []);

  const fetchPosts = useCallback(async (options: { scope?: "all" | "my-team" | "mine"; category?: string | null; limit?: number } = {}) => {
    if (demoModeRef.current) {
      const currentUserId = String(currentUserRef.current?.id || currentUserRef.current?.sub || "demo-admin");
      return filterDemoPosts(postsRef.current, currentUserId, options);
    }
    if (!isAuthenticatedRef.current) return [];
    const params = new URLSearchParams();
    params.set("limit", String(options.limit || 50));
    if (options.scope) params.set("scope", options.scope);
    if (options.category) params.set("category", options.category);
    const result = await apiFetch<{ items: ApiPost[] }>(`/api/safety-culture/posts?${params.toString()}`);
    if (!result.ok || !Array.isArray(result.data?.items)) {
      throw new Error(result.error || "posts_fetch_failed");
    }
    const viewerId = currentUserRef.current?.id ? String(currentUserRef.current.id) : null;
    const mappedPosts = result.data.items.map((item) => {
      const mapped = postFromApi(item);
      return { ...mapped, isYou: Boolean(viewerId && mapped.authorId && mapped.authorId === viewerId) };
    });
    return Promise.all(
      mappedPosts.map(async (post) => {
        const comments = await loadPostComments(post.id, viewerId).catch(() => null);
        return comments ? { ...post, comments } : post;
      }),
    );
  }, [loadPostComments]);

  const addPost = useCallback(async (post: Post) => {
    const linkedFeedEvent = getLinkedFeedEvent(post.feedEventId);
    const basePoints = getSafetyPoint("safetyPostApproved");
    const awardedPoints = linkedFeedEvent
      ? calculateFeedEventAwardedPoints(basePoints, "theme-post", linkedFeedEvent)
      : calculateAwardedPoints(basePoints, "approved-post", safetyCultureEvent);
    const pointsDelta = Math.max(0, awardedPoints);
    const occurredAt = post.createdAt || Date.now();

    if (isAuthenticatedRef.current) {
      const result = await apiFetch<{ post: ApiPost }>("/api/safety-culture/posts", apiJson("POST", {
        content: post.body,
        category: post.category,
        attachmentIds: post.photos.map((photo) => photo.id),
        feedEventId: post.feedEventId,
      }));
      if (!result.ok || !result.data?.post) {
        throw new Error(result.error || "post_create_failed");
      }
      const savedPost = { ...postFromApi(result.data.post), isYou: true };
      const savedPoints = Math.max(0, Number(savedPost.points) || awardedPoints);
      setPosts((prev) => [savedPost, ...prev.filter((item) => item.id !== savedPost.id)]);
      setUserActivityHistory((current) =>
        normalizeUserActivityHistory([
          {
            id: `activity-post-${savedPost.id}-${savedPost.createdAt || occurredAt}`,
            type: "post",
            occurredAt: savedPost.createdAt || occurredAt,
            postId: savedPost.id,
            postAuthor: savedPost.author,
            postCategory: savedPost.category,
            postPreview: savedPost.body,
            pointsDelta: savedPoints,
          },
          ...current,
        ])
      );
      setCurrentUserPoints((prev) => prev + savedPoints);
      return savedPost;
    }

    setPosts((prev) => [{ ...post, points: awardedPoints }, ...prev]);
    setUserActivityHistory((current) =>
      normalizeUserActivityHistory([
        {
          id: `activity-post-${post.id}-${occurredAt}`,
          type: "post",
          occurredAt,
          postId: post.id,
          postAuthor: post.author,
          postCategory: post.category,
          postPreview: post.body,
          pointsDelta,
        },
        ...current,
      ])
    );
    setCurrentUserPoints((prev) => prev + pointsDelta);
    return { ...post, points: awardedPoints };
  }, [getLinkedFeedEvent, safetyCultureEvent]);

  const toggleLike = useCallback((postId: number) => {
    let currentDelta = 0;
    let likedPost: Post | null = null;
    let previousPost: Post | null = null;
    const occurredAt = Date.now();

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        previousPost = p;
        const isAdding = !p.hasLiked;
        const linkedFeedEvent = getLinkedFeedEvent(p.feedEventId);
        const awarded = linkedFeedEvent
          ? calculateFeedEventAwardedPoints(getSafetyPoint("reactionCreated"), "reaction", linkedFeedEvent)
          : calculateAwardedPoints(getSafetyPoint("reactionCreated"), "reaction", safetyCultureEvent);
        currentDelta = isAdding ? awarded : -awarded;
        if (isAdding) {
          likedPost = p;
        }

        return {
          ...p,
          hasLiked: isAdding,
          likes: isAdding ? p.likes + 1 : Math.max(0, p.likes - 1),
          points: Math.max(0, (p.points || 0) + currentDelta),
        };
      })
    );

    const activityPost = likedPost as Post | null;
    if (activityPost) {
      setUserActivityHistory((current) =>
        normalizeUserActivityHistory([
          {
            id: `activity-reaction-${postId}-${occurredAt}`,
            type: "reaction",
            occurredAt,
            postId: activityPost.id,
            postAuthor: activityPost.author,
            postCategory: activityPost.category,
            postPreview: activityPost.body,
            pointsDelta: Math.max(0, currentDelta),
          },
          ...current,
        ])
      );
    }

    if (currentDelta !== 0) {
      setCurrentUserPoints((prev) => Math.max(0, prev + currentDelta));
    }
    if (isAuthenticatedRef.current) {
      void apiFetch(`/api/safety-culture/posts/${postId}/reactions`, apiJson(currentDelta > 0 ? "POST" : "DELETE", { reactionType: "LIKE" }))
        .then(async (result) => {
          if (result.ok) {
            const syncedPostResult = await apiFetch<{ post: ApiPost }>(`/api/safety-culture/posts/${postId}`);
            if (!syncedPostResult.ok || !syncedPostResult.data?.post) return;

            // Reconcile only the reaction fields with the server. Replacing the
            // whole post (and reloading its comments) on every tap made the card
            // visibly "jump"; the optimistic update already keeps the rest in sync.
            const syncedPostBase = postFromApi(syncedPostResult.data.post);
            setPosts((current) =>
              current.map((post) =>
                post.id === postId
                  ? {
                      ...post,
                      likes: syncedPostBase.likes,
                      hasLiked: syncedPostBase.hasLiked,
                      likedBy: syncedPostBase.likedBy,
                    }
                  : post
              )
            );
            await refreshInboxNotifications();
            return;
          }

          const rollbackPost = previousPost;
          if (rollbackPost) {
            setPosts((current) => current.map((post) => (post.id === postId ? rollbackPost : post)));
            setCurrentUserPoints((points) => Math.max(0, points - currentDelta));
          }
        });
    }
  }, [getLinkedFeedEvent, loadPostComments, refreshInboxNotifications, safetyCultureEvent]);

  const fetchComments = useCallback(async (postId: number) => {
    if (demoModeRef.current) {
      const post = postsRef.current.find((item) => item.id === postId);
      return post && Array.isArray(post.comments) ? post.comments : [];
    }
    const comments = await loadPostComments(postId);
    if (!comments) return [];
    setPosts((current) => current.map((post) => (post.id === postId ? { ...post, comments } : post)));
    return comments;
  }, [loadPostComments]);

  const addComment = useCallback(async (postId: number, text: string) => {
    const occurredAt = Date.now();
    let targetPost: Post | null = null;
    let currentAwardedPoints = 0;
    const actorName = userDisplayName(currentUserRef.current);
    const actorInitials = currentUserRef.current ? getSessionInitials(currentUserRef.current) : "U";
    const actorId = currentUserRef.current?.id ? String(currentUserRef.current.id) : undefined;
    const actorImage = currentUserRef.current?.profileImageUrl || currentUserRef.current?.lineProfileImageUrl || null;
    const optimisticId = `pending-${postId}-${occurredAt}`;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        targetPost = p;
        const linkedFeedEvent = getLinkedFeedEvent(p.feedEventId);
        currentAwardedPoints = linkedFeedEvent
          ? calculateFeedEventAwardedPoints(getSafetyPoint("commentCreated"), "comment", linkedFeedEvent)
          : calculateAwardedPoints(getSafetyPoint("commentCreated"), "comment", safetyCultureEvent);
        const currentComments = Array.isArray(p.comments) ? p.comments : [];
        return {
          ...p,
          points: (p.points || 0) + currentAwardedPoints,
          comments: [
            ...currentComments,
            {
              id: optimisticId,
              authorId: actorId,
              author: actorName,
              avatarText: actorInitials,
              avatarImageUrl: actorImage,
              text,
              isYou: true,
              createdAt: occurredAt,
            },
          ],
        };
      })
    );
    const activityPost = targetPost as Post | null;
    if (activityPost) {
      setUserActivityHistory((current) =>
        normalizeUserActivityHistory([
          {
            id: `activity-comment-${postId}-${occurredAt}`,
            type: "comment",
            occurredAt,
            postId: activityPost.id,
            postAuthor: activityPost.author,
            postCategory: activityPost.category,
            postPreview: activityPost.body,
            pointsDelta: currentAwardedPoints,
            commentText: text,
          },
          ...current,
        ])
      );
    }
    setCurrentUserPoints((prev) => prev + currentAwardedPoints);
    if (!isAuthenticatedRef.current) return true;

    const result = await apiFetch<{ comment: ApiComment }>(`/api/safety-culture/posts/${postId}/comments`, apiJson("POST", { content: text }));
    if (!result.ok || !result.data?.comment) {
      setPosts((current) => current.map((post) => {
        if (post.id !== postId || !Array.isArray(post.comments)) return post;
        return {
          ...post,
          comments: post.comments.filter((comment) => comment.id !== optimisticId),
          points: Math.max(0, (post.points || 0) - currentAwardedPoints),
        };
      }));
      setCurrentUserPoints((prev) => Math.max(0, prev - currentAwardedPoints));
      return false;
    }
    const savedComment = commentFromApi(result.data.comment, actorId);
    setPosts((current) => current.map((post) => {
      if (post.id !== postId || !Array.isArray(post.comments)) return post;
      return {
        ...post,
        comments: post.comments.map((comment) => comment.id === optimisticId ? savedComment : comment),
      };
    }));
    return true;
  }, [getLinkedFeedEvent, safetyCultureEvent]);

  const updateComment = useCallback(async (postId: number, commentId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return false;
    let previousText: string | undefined;
    setPosts((current) => current.map((post) => {
      if (post.id !== postId || !Array.isArray(post.comments)) return post;
      return {
        ...post,
        comments: post.comments.map((comment) => {
          if (comment.id !== commentId) return comment;
          previousText = comment.text;
          return { ...comment, text: trimmed };
        }),
      };
    }));
    if (!isAuthenticatedRef.current) return true;
    const result = await apiFetch<{ comment: ApiComment }>(`/api/safety-culture/comments/${commentId}`, apiJson("PATCH", { content: trimmed }));
    if (!result.ok || !result.data?.comment) {
      setPosts((current) => current.map((post) => {
        if (post.id !== postId || !Array.isArray(post.comments)) return post;
        return { ...post, comments: post.comments.map((comment) => comment.id === commentId && previousText !== undefined ? { ...comment, text: previousText } : comment) };
      }));
      return false;
    }
    const savedComment = commentFromApi(result.data.comment, currentUserRef.current?.id);
    setPosts((current) => current.map((post) => {
      if (post.id !== postId || !Array.isArray(post.comments)) return post;
      return { ...post, comments: post.comments.map((comment) => comment.id === commentId ? savedComment : comment) };
    }));
    return true;
  }, []);

  const deleteComment = useCallback(async (postId: number, commentId: string) => {
    let removed: Comment | undefined;
    let removedIndex = -1;
    setPosts((current) => current.map((post) => {
      if (post.id !== postId || !Array.isArray(post.comments)) return post;
      removedIndex = post.comments.findIndex((comment) => comment.id === commentId);
      removed = removedIndex >= 0 ? post.comments[removedIndex] : undefined;
      return { ...post, comments: post.comments.filter((comment) => comment.id !== commentId) };
    }));
    if (!isAuthenticatedRef.current) return true;
    const result = await apiFetch<{ deleted: boolean }>(`/api/safety-culture/comments/${commentId}`, { method: "DELETE" });
    if (!result.ok || !result.data?.deleted) {
      const restored = removed;
      setPosts((current) => current.map((post) => {
        if (post.id !== postId || !restored) return post;
        const comments = Array.isArray(post.comments) ? [...post.comments] : [];
        comments.splice(removedIndex >= 0 ? removedIndex : comments.length, 0, restored);
        return { ...post, comments };
      }));
      return false;
    }
    return true;
  }, []);

  // Edit own post (text). Backend enforces author_id = current user.
  const updatePost = useCallback(async (postId: number, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return false;
    // optimistic update
    let previousBody: string | undefined;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        previousBody = p.body;
        return { ...p, body: trimmed };
      })
    );
    if (!isAuthenticatedRef.current) return true;
    const result = await apiFetch<{ post: ApiPost }>(
      `/api/safety-culture/posts/${postId}`,
      apiJson("PATCH", { content: trimmed })
    );
    if (!result.ok || !result.data?.post) {
      // revert on failure
      setPosts((prev) => prev.map((p) => (p.id === postId && previousBody !== undefined ? { ...p, body: previousBody } : p)));
      return false;
    }
    const saved = postFromApi(result.data.post);
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, body: saved.body, isYou: true } : p)));
    return true;
  }, []);

  // Delete own post (soft delete server-side). Backend enforces author_id = current user.
  const deletePost = useCallback(async (postId: number) => {
    let removed: Post | undefined;
    let removedIndex = -1;
    setPosts((prev) => {
      removedIndex = prev.findIndex((p) => p.id === postId);
      removed = removedIndex >= 0 ? prev[removedIndex] : undefined;
      return prev.filter((p) => p.id !== postId);
    });
    if (!isAuthenticatedRef.current) return true;
    const result = await apiFetch<{ deleted: boolean; pointsReversed: number; balance: number | null }>(
      `/api/safety-culture/posts/${postId}`,
      apiJson("DELETE")
    );
    if (!result.ok || result.data?.deleted !== true) {
      // revert on failure
      if (removed) {
        const restored = removed;
        const at = removedIndex;
        setPosts((prev) => {
          const next = [...prev];
          next.splice(at >= 0 ? at : 0, 0, restored);
          return next;
        });
      }
      return false;
    }
    if (typeof result.data?.balance === "number") {
      setCurrentUserPoints(result.data.balance);
    } else if (removed?.points) {
      setCurrentUserPoints((current) => current - Math.max(0, removed?.points || 0));
    }
    setUserActivityHistory((current) => current.filter((item) => !(item.type === "post" && item.postId === postId)));
    return true;
  }, []);

  const updateSafetyCultureEvent = useCallback((data: SafetyCultureEventConfig) => {
    setSafetyCultureEvent(data);
    if (isAuthenticatedRef.current) {
      void apiFetch("/api/safety-culture/events", apiJson("POST", {
        title: data.eventName || data.headline,
        description: data.supportingText,
        eventStartAt: `${data.startDate} ${data.startTime}:00`,
        eventEndAt: `${data.endDate} ${data.endTime}:00`,
        status: data.status === "live" ? "ACTIVE" : data.status.toUpperCase(),
        metadata: data,
      }));
    }
  }, []);

  const updateFeedEvents = useCallback(async (events: SafetyCultureFeedEvent[]) => {
    const normalized = normalizeFeedEvents(events);
    const previousIds = new Set(feedEvents.map((event) => event.id));
    if (!isAuthenticatedRef.current) {
      setFeedEvents(normalized);
      return true;
    }

    const persistedEvents: SafetyCultureFeedEvent[] = [];

    try {
      for (const event of normalized) {
        const existing = previousIds.has(event.id) && /^\d+$/.test(event.id);
        const status = !event.published ? "DRAFT" : event.status === "closed" ? "INACTIVE" : "ACTIVE";
        const result = await apiFetch<{ event?: Record<string, unknown> }>(
          existing ? `/api/safety-culture/events/${event.id}` : "/api/safety-culture/events",
          apiJson(existing ? "PATCH" : "POST", {
            title: event.title,
            description: event.details || event.summary,
            eventStartAt: event.startDate || null,
            eventEndAt: event.endDate || null,
            status,
            metadata: event,
          }),
        );

        if (!result.ok) return false;
        persistedEvents.push(result.data?.event ? feedEventFromApi(result.data.event, persistedEvents.length) : event);
      }

      const nextIds = new Set(normalized.map((event) => event.id));
      for (const event of feedEvents) {
        if (/^\d+$/.test(event.id) && !nextIds.has(event.id)) {
          const result = await apiFetch<{ deleted: boolean }>(`/api/safety-culture/events/${event.id}`, { method: "DELETE" });
          if (!result.ok || result.data?.deleted !== true) return false;
        }
      }
    } catch {
      return false;
    }

    setFeedEvents(normalizeFeedEvents(persistedEvents));
    return true;
  }, [feedEvents]);

  const sendFeedEventNotification = useCallback((feedEventId: string) => {
    const targetEvent = feedEvents.find((event) => event.id === feedEventId);
    if (!targetEvent) return false;

    const occurredAt = Date.now();

    setInboxNotifications((current) =>
      normalizeInboxNotifications([
        {
          id: `activity-notification-${feedEventId}-${occurredAt}`,
          kind: "activity",
          title: "กิจกรรมใหม่จาก Safety Culture",
          body: `กิจกรรม "${targetEvent.title}" พร้อมให้เข้าร่วมแล้ว กดเข้ามาดูรายละเอียดและร่วมกิจกรรมได้เลย`,
          createdAt: occurredAt,
          read: false,
          feedEventId: targetEvent.id,
          href: `/safety-culture?activityId=${encodeURIComponent(targetEvent.id)}`,
        },
        ...current,
      ])
    );
    if (isAuthenticatedRef.current && /^\d+$/.test(feedEventId)) {
      void apiFetch(`/api/safety-culture/events/${feedEventId}/notify`, apiJson("POST", {}));
    }

    return true;
  }, [feedEvents]);

  const updateTeamStandings = useCallback(async (teams: LeaderboardTeam[]) => {
    const normalized = normalizeTeamStandings(teams);
    setTeamStandings(normalized);
    if (!isAuthenticatedRef.current) return false;
    const result = await apiFetch("/api/safety-culture/teams", apiJson("PUT", {
      teams: normalized.map((team) => ({
        id: /^\d+$/.test(team.id) ? team.id : null,
        name: team.name,
        leaderUserId: team.leaderUserId || null,
        status: "ACTIVE",
      })),
    }));
    if (!result.ok) return false;
    await refreshLeaderboardState(currentUserRef.current);
    return true;
  }, [refreshLeaderboardState]);

  const updatePersonalRankings = useCallback(async (rankings: LeaderboardPerson[]) => {
    setPersonalRankings(normalizePersonalRankings(rankings));
    return true;
  }, []);

  const updateRewardsCatalog = useCallback(async (rewards: RewardCatalogItem[]) => {
    const normalized = normalizeRewardsCatalog(rewards);
    const previousIds = new Set(rewardsCatalog.map((reward) => reward.id));
    const nextIds = new Set(normalized.map((reward) => reward.id));
    if (!isAuthenticatedRef.current) return false;
    try {
      for (const reward of normalized) {
        const existing = previousIds.has(reward.id);
        const result = await apiFetch(
          existing ? `/api/safety-culture/rewards/${reward.id}` : "/api/safety-culture/rewards",
          apiJson(existing ? "PATCH" : "POST", {
            code: `REWARD-${reward.id}`,
            name: reward.name,
            pointsRequired: reward.points,
            stockQty: reward.stockRemaining ?? 0,
            status: "ACTIVE",
            metadata: reward,
          }),
        );
        if (!result.ok) return false;
      }
      for (const reward of rewardsCatalog) {
        if (!nextIds.has(reward.id)) {
          const result = await apiFetch(`/api/safety-culture/rewards/${reward.id}`, { method: "DELETE" });
          if (!result.ok) return false;
        }
      }
      return await refreshRewardsState();
    } catch { return false; }
  }, [refreshRewardsState, rewardsCatalog]);

  const updateRewardCategories = useCallback(async (categories: RewardCategory[]) => {
    const normalized = normalizeRewardCategories(categories);
    if (!isAuthenticatedRef.current) return false;
    const result = await apiFetch("/api/safety-settings?key=safety_reward_categories", apiJson("PUT", { value: { categories: normalized } }));
    if (!result.ok) return false;
    setRewardCategories(normalized);
    return true;
  }, []);

  const updateAwarenessEnabled = useCallback(async (enabled: boolean) => {
    setAwarenessEnabledState(enabled);
    if (isAuthenticatedRef.current) {
      void apiFetch("/api/safety-settings?key=safety_awareness_enabled", apiJson("PUT", { value: { enabled } })).catch(() => null);
    }
    return true;
  }, []);

  const updateAwarenessWeekdays = useCallback(async (weekdays: number[]) => {
    setAwarenessWeekdaysState(weekdays);
    if (isAuthenticatedRef.current) {
      void apiFetch("/api/safety-settings?key=safety_awareness_weekdays", apiJson("PUT", { value: { weekdays } })).catch(() => null);
    }
    return true;
  }, []);

  const updateAwarenessTimeWindow = useCallback(async (startTime: string, endTime: string) => {
    setAwarenessActiveStartTimeState(startTime);
    setAwarenessActiveEndTimeState(endTime);
    if (isAuthenticatedRef.current) {
      void apiFetch("/api/safety-settings?key=safety_awareness_active_start_time", apiJson("PUT", { value: { startTime } })).catch(() => null);
      void apiFetch("/api/safety-settings?key=safety_awareness_active_end_time", apiJson("PUT", { value: { endTime } })).catch(() => null);
    }
    return true;
  }, []);

  const updateAwarenessQuestions = useCallback((questions: SafetyAwarenessQuestion[]) => {
    const existingByText = new Map(
      awarenessQuestions.map((question) => [question.text.trim(), question]),
    );
    const normalized = normalizeAwarenessQuestions(questions).map((question) => {
      if (/^\d+$/.test(question.id)) return question;
      const existing = existingByText.get(question.text.trim());
      return existing ? { ...question, id: existing.id } : question;
    });
    const previousById = new Map(
      awarenessQuestions.map((question) => [question.id, question]),
    );
    const previousIds = new Set(awarenessQuestions.map((question) => question.id));
    const nextIds = new Set(normalized.map((question) => question.id));
    setAwarenessQuestions(normalized);
    if (isAuthenticatedRef.current) {
      for (const question of normalized) {
        const existing = previousIds.has(question.id) && /^\d+$/.test(question.id);
        const previous = previousById.get(question.id);
        const changed = !previous
          || previous.text !== question.text
          || previous.category !== question.category
          || previous.answer !== question.answer
          || (previous.note || "") !== (question.note || "")
          || previous.enabled !== question.enabled;
        if (!changed) continue;

        void (async () => {
          const result = await apiFetch<{ question?: { id?: string | number } }>(
            existing ? `/api/safety-awareness/questions/${question.id}` : "/api/safety-awareness/questions",
            apiJson(existing ? "PATCH" : "POST", {
              questionText: question.text,
              optionsJson: { category: question.category, answer: question.answer, note: question.note || "" },
              correctAnswerJson: { answer: question.answer },
              status: question.enabled ? "ACTIVE" : "INACTIVE",
            }),
          );
          const savedId = result.ok ? result.data?.question?.id : null;
          if (!existing && savedId) {
            setAwarenessQuestions((current) =>
              current.map((item) => item.id === question.id ? { ...item, id: String(savedId) } : item),
            );
          }
        })();
      }
      for (const question of awarenessQuestions) {
        if (/^\d+$/.test(question.id) && !nextIds.has(question.id)) {
          void apiFetch(`/api/safety-awareness/questions/${question.id}`, { method: "DELETE" });
        }
      }
    }
  }, [awarenessQuestions]);

  const updateAwarenessHolidays = useCallback((holidays: AwarenessHoliday[]) => {
    const previousByDate = new Map(awarenessHolidays.map((holiday) => [holiday.date, holiday]));
    const normalized = holidays
        .filter((holiday) => holiday.date && holiday.name.trim())
        .map((holiday) => ({
          id: holiday.id || previousByDate.get(holiday.date)?.id,
          date: holiday.date.slice(0, 10),
          name: holiday.name.trim(),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    setAwarenessHolidays(normalized);
    if (isAuthenticatedRef.current) {
      void (async () => {
        const nextDates = new Set(normalized.map((holiday) => holiday.date));
        for (const previous of awarenessHolidays) {
          if (!nextDates.has(previous.date) && previous.id) {
            await apiFetch(`/api/holidays/${previous.id}`, { method: "DELETE" });
          }
        }
        for (const holiday of normalized) {
          const previous = previousByDate.get(holiday.date);
          if (previous && previous.name === holiday.name && previous.id) continue;
          const saved = await apiFetch<{ holiday: { id?: string | number; holiday_date?: string; name?: string } }>(
            "/api/holidays",
            apiJson("POST", { holidayDate: holiday.date, name: holiday.name }),
          );
          const savedHolidayId = saved.data?.holiday?.id;
          if (saved.ok && savedHolidayId) {
            setAwarenessHolidays((current) => current.map((item) => item.date === holiday.date
              ? { ...item, id: String(savedHolidayId) }
              : item));
          }
        }
        await Promise.all([refreshPointBalance(), refreshAwarenessAttempts()]);
      })();
    }
  }, [awarenessHolidays, refreshAwarenessAttempts, refreshPointBalance]);

  const markAwarenessDone = useCallback(async (completion: Omit<AwarenessCompletion, "date" | "completedAt">) => {
    const date = todayKey();
    const occurredAt = Date.now();
    const points = getSafetyPoint("safetyAwarenessCompleted");
    const actorName = userDisplayName(currentUserRef.current);
    const alreadyCompletedToday = awarenessDoneDate === date || awarenessHistory.some((item) => item.date === date);

    if (isAuthenticatedRef.current) {
      const saved = await apiFetch<{ attempt: { attemptDate?: string; score?: number; total?: number } }>("/api/safety-awareness/attempts", apiJson("POST", {
        score: completion.score,
        total: completion.total,
        questions: completion.questions,
      }));
      if (!saved.ok) {
        setNotification({ type: "info", message: "บันทึก Safety Awareness ไม่สำเร็จ กรุณารีเฟรชแล้วลองอีกครั้ง" });
        return false;
      }
    }

    setAwarenessDoneDate(date);
    setAwarenessHistory((current) => [
      ...current.filter((item) => item.date !== date),
      { ...completion, date, completedAt: new Date().toISOString() },
    ]);
    if (!alreadyCompletedToday) {
      setCurrentUserPoints((prev) => prev + points);
      setUserActivityHistory((current) =>
        normalizeUserActivityHistory([
          {
            id: `activity-awareness-${date}`,
            type: "awareness",
            occurredAt,
            postId: 0,
            postAuthor: actorName,
            postCategory: "Safety Awareness",
            postPreview: `ผ่าน Safety Awareness ประจำวัน ได้ ${completion.score}/${completion.total} ข้อ`,
            pointsDelta: points,
          },
          ...current.filter((item) => item.id !== `activity-awareness-${date}`),
        ])
      );
    }
    if (isAuthenticatedRef.current) {
      await Promise.all([refreshPointBalance(), refreshAwarenessAttempts()]);
    }
    return true;
  }, [awarenessDoneDate, awarenessHistory, refreshAwarenessAttempts, refreshPointBalance]);

  const awardSafetyEffortCompletion = useCallback((sourceId: string, label = "Safety Effort สำเร็จ") => {
    void sourceId;
    void label;
    void refreshPointBalance();
  }, [refreshPointBalance]);

  const redeemPoints = useCallback(
    async (rewardId: number, points: number) => {
      const reward = rewardsCatalog.find((item) => item.id === rewardId);
      if (!reward) {
        return { ok: false as const, reason: "not-found" as const };
      }

      if (currentUserPoints < points) {
        return { ok: false as const, reason: "insufficient-points" as const };
      }

      const availability = getRewardAvailabilityState(reward);
      if (!availability.hasStarted) {
        return { ok: false as const, reason: "not-started" as const };
      }

      if (availability.hasEnded) {
        return { ok: false as const, reason: "expired" as const };
      }

      if (!availability.inStock) {
        return { ok: false as const, reason: "out-of-stock" as const };
      }

      const occurredAt = Date.now();
      const redeemedAtIso = new Date(occurredAt).toISOString();
      const persisted = await apiFetch<{ redemption?: { balance?: number; pointsUsed?: number; rewardId?: string } }>(
        `/api/safety-culture/rewards/${rewardId}/redeem`,
        apiJson("POST", { points })
      );
      if (!persisted.ok) {
        return { ok: false as const, reason: "api-error" as const };
      }

      const nextBalance = Number(persisted.data?.redemption?.balance);
      setCurrentUserPoints((prev) => (Number.isFinite(nextBalance) ? Math.max(0, nextBalance) : Math.max(0, prev - points)));
      setRewardRedemptions((current) =>
        normalizeRewardRedemptions([
          {
            id: `reward-redemption-${occurredAt}-${rewardId}`,
            rewardId: reward.id,
            rewardName: reward.name,
            rewardCategory: reward.category,
            pointsSpent: points,
            redeemedAt: redeemedAtIso,
            redeemedBy: userDisplayName(currentUserRef.current),
          },
          ...current,
        ])
      );
      setUserActivityHistory((current) =>
        normalizeUserActivityHistory([
          {
            id: `activity-redeem-${rewardId}-${occurredAt}`,
            type: "redeem",
            occurredAt,
            postId: 0,
            postAuthor: userDisplayName(currentUserRef.current),
            postCategory: reward.category || "Reward",
            postPreview: `แลกรางวัล "${reward.name}" สำเร็จ ใช้ ${points.toLocaleString()} Coin`,
            pointsDelta: -Math.max(0, points),
          },
          ...current,
        ])
      );
      setInboxNotifications((current) =>
        normalizeInboxNotifications([
          {
            id: `reward-notification-${rewardId}-${occurredAt}`,
            kind: "reward",
            title: "แลกรางวัลสำเร็จ",
            body: `คุณได้แลกรางวัล "${reward.name}" ใช้ ${points.toLocaleString()} Coin ระบบจะส่งรหัสให้ตามช่องทางที่กำหนด`,
            createdAt: occurredAt,
            read: false,
            href: "/safety-culture/rewards",
          },
          ...current,
        ])
      );
      setRewardsCatalog((current) =>
        normalizeRewardsCatalog(
          current.map((item) => {
            if (item.id !== rewardId || item.stockMode !== "limited") return item;
            return {
              ...item,
              stockRemaining: Math.max(0, (item.stockRemaining ?? item.stockTotal ?? 0) - 1),
            };
          })
        )
      );
      void refreshPointBalance();
      void refreshRewardsState();
      return { ok: true as const };
    },
    [currentUserPoints, refreshPointBalance, refreshRewardsState, rewardsCatalog]
  );

  const awarenessNow = new Date(eventNow);
  const awarenessBangkokDay = new Date(awarenessNow.getTime() + 7 * 60 * 60 * 1000).getUTCDay();
  const awarenessTodayKey = todayKey(awarenessNow);
  // วันเริ่มใช้งานของผู้ใช้: ใช้บันทึก Awareness แรกสุดถ้ามี ไม่งั้น = วันนี้ (ผู้ใช้ใหม่)
  // เมื่อเชื่อม backend แล้วให้แทนที่ด้วย created_at ของผู้ใช้
  const awarenessStartDate =
    awarenessHistory.length > 0
      ? awarenessHistory.reduce((min, item) => (item.date < min ? item.date : min), awarenessHistory[0].date)
      : awarenessTodayKey;

  const state: AppState = {
    posts,
    userActivityHistory,
    notification,
    inboxNotifications,
    currentUserPoints,
    safetyCultureEvent,
    feedEvents,
    teamStandings,
    personalRankings,
    rewardsCatalog,
    rewardCategories,
    rewardRedemptions,
    awarenessQuestions,
    awarenessDoneToday: awarenessDoneDate === awarenessTodayKey,
    awarenessHistory,
    awarenessHolidays,
    awarenessRequiredToday:
      mounted &&
      awarenessEnabled &&
      (() => {
        if (!awarenessActiveStartTime || !awarenessActiveEndTime) return true;
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const bkk = new Date(utc + 7 * 60 * 60 * 1000);
        const currentMin = bkk.getHours() * 60 + bkk.getMinutes();
        const [startH, startM] = awarenessActiveStartTime.split(":").map(Number);
        const [endH, endM] = awarenessActiveEndTime.split(":").map(Number);
        const startMin = startH * 60 + startM;
        const endMin = endH * 60 + endM;
        return currentMin >= startMin && currentMin <= endMin;
      })() &&
      !awarenessHolidays.some((holiday) => holiday.date === awarenessTodayKey) &&
      ![0, 6].includes(awarenessBangkokDay),
    awarenessEnabled,
    awarenessWeekdays,
    awarenessActiveStartTime,
    awarenessActiveEndTime,
    awarenessStartDate,
    isEventLive: isSafetyCultureEventLive(safetyCultureEvent, eventNow),
    eventNow,
  };

  const actions: AppActions = {
    showNotification,
    dismissNotification,
    markInboxNotificationRead,
    markAllInboxNotificationsRead,
    addPost,
    fetchPosts,
    toggleLike,
    addComment,
    fetchComments,
    updateComment,
    deleteComment,
    updatePost,
    deletePost,
    updateSafetyCultureEvent,
    updateFeedEvents,
    sendFeedEventNotification,
    updateTeamStandings,
    updatePersonalRankings,
    updateRewardsCatalog,
    updateRewardCategories,
    updateAwarenessQuestions,
    updateAwarenessHolidays,
    updateAwarenessEnabled,
    updateAwarenessWeekdays,
    updateAwarenessTimeWindow,
    markAwarenessDone,
    awardSafetyEffortCompletion,
    redeemPoints,
  };

  return (
    <AppStateContext.Provider value={state}>
      <AppActionsContext.Provider value={actions}>
        {children}
      </AppActionsContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppProviders");
  return ctx;
}

export function useAppActions() {
  const ctx = useContext(AppActionsContext);
  if (!ctx) throw new Error("useAppActions must be used within AppProviders");
  return ctx;
}
