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
import { getSessionDisplayName, getSessionInitials, type SessionUser } from "@/lib/session-user";

export type HealthData = {
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  alcohol?: number;
  bpStatus?: string;
  alcStatus?: string;
  bpPhoto?: string | null;
  alcPhoto?: string | null;
} | null;

export type PreTripData = {
  checkedStates: Record<number, "pass" | "fail">;
  hasFailures: boolean;
} | null;

export type KytData = {
  photo?: string | null;
  isPhotoConfirmed?: boolean;
  isSubmitted?: boolean;
  hasRetaken?: boolean;
} | null;

export type SosData = {
  restHours: number;
  restMinutes: number;
  reason: string;
  timestamp: string;
} | null;

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
  isYou?: boolean;
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
  completedSteps: number[];
  healthData: HealthData;
  kytData: KytData;
  preTripData: PreTripData;
  queueConfirmed: boolean;
  sosData: SosData;
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
  /** วันแรกที่ผู้ใช้เริ่มใช้งาน (YYYY-MM-DD). วันก่อนหน้านี้จะไม่ถูกนับใน KPI. */
  awarenessStartDate: string;
  isEventLive: boolean;
  eventNow: number;
};

type AppActions = {
  completeSteps: (stepIds: number[]) => void;
  setHealthData: (data: HealthData) => void;
  setKytData: (data: KytData) => void;
  setPreTripData: (data: PreTripData) => void;
  confirmQueue: () => void;
  setSosData: (data: SosData) => void;
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
  updateFeedEvents: (events: SafetyCultureFeedEvent[]) => void;
  sendFeedEventNotification: (feedEventId: string) => boolean;
  updateTeamStandings: (teams: LeaderboardTeam[]) => void;
  updatePersonalRankings: (rankings: LeaderboardPerson[]) => void;
  updateRewardsCatalog: (rewards: RewardCatalogItem[]) => void;
  updateRewardCategories: (categories: RewardCategory[]) => void;
  updateAwarenessQuestions: (questions: SafetyAwarenessQuestion[]) => void;
  updateAwarenessHolidays: (holidays: AwarenessHoliday[]) => void;
  /** Mark today's Safety Awareness popup as completed. */
  markAwarenessDone: (completion: Omit<AwarenessCompletion, "date" | "completedAt">) => void;
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

function buildNotificationHref(notification: Pick<AppInboxNotification, "postId" | "feedEventId" | "href">) {
  if (notification.postId) return `/safety-culture?postId=${notification.postId}`;
  if (notification.feedEventId) return `/safety-culture?activityId=${encodeURIComponent(notification.feedEventId)}`;
  return notification.href || "/notifications";
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
        }))
      : Math.max(0, Number(post.comments) || 0),
    likes: Math.max(0, Number(post.likes) || 0),
    points: Math.max(0, Number(post.points) || 0),
    hasLiked: Boolean(post.hasLiked),
    photos: Array.isArray(post.photos)
      ? post.photos
          .filter((photo) => photo?.dataUrl)
          .map((photo, photoIndex) => {
            const normalizedPhotoUrl =
              photo.dataUrl === "/images/mascots/gallery/live-1.png" ? "/images/mascots/gallery/line-walk-3.png" : photo.dataUrl;

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
    isYou: Boolean(viewerId && authorId && String(authorId) === String(viewerId)),
  };
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [healthData, setHealthData] = useState<HealthData>(null);
  const [kytData, setKytData] = useState<KytData>(null);
  const [preTripData, setPreTripData] = useState<PreTripData>(null);
  const [queueConfirmed, setQueueConfirmed] = useState(false);
  const [sosData, setSosData] = useState<SosData>(null);
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
  const [rewardCategories, setRewardCategories] = useState<RewardCategory[]>([]);
  const [rewardRedemptions, setRewardRedemptions] = useState<RewardRedemptionRecord[]>([]);
  const [awarenessQuestions, setAwarenessQuestions] = useState<SafetyAwarenessQuestion[]>([]);
  const [awarenessDoneDate, setAwarenessDoneDate] = useState<string>("");
  const [awarenessHistory, setAwarenessHistory] = useState<AwarenessCompletion[]>([]);
  const [awarenessHolidays, setAwarenessHolidays] = useState<AwarenessHoliday[]>([]);
  const [eventNow, setEventNow] = useState(0);

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

  const refreshPointBalance = useCallback(async () => {
    const balance = await apiFetch<{ balance: { balance: number } }>("/api/safety-culture/points/me");
    if (balance.ok && typeof balance.data?.balance?.balance === "number") {
      setCurrentUserPoints(Math.max(0, balance.data.balance.balance));
    }
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
      if (!authed) return;

      const [postsResult, balanceResult, notificationsResult, rewardsResult, leaderboardResult, teamsResult, awarenessResult, attemptsResult, holidaysResult, eventsResult] = await Promise.all([
        apiFetch<{ items: ApiPost[] }>("/api/safety-culture/posts?limit=50"),
        apiFetch<{ balance: { balance: number } }>("/api/safety-culture/points/me"),
        apiFetch<{ items: Array<Record<string, unknown>> }>("/api/notifications?limit=100"),
        apiFetch<{ items: Array<Record<string, unknown>> }>("/api/safety-culture/rewards?pageSize=100"),
        apiFetch<{ items: Array<Record<string, unknown>> }>("/api/safety-culture/leaderboard"),
        apiFetch<{ items: Array<Record<string, unknown>> }>("/api/safety-culture/teams"),
        apiFetch<{ items: Array<Record<string, unknown>> }>("/api/safety-awareness/questions/admin?pageSize=1000"),
        apiFetch<{ items: ApiAwarenessAttempt[] }>("/api/safety-awareness/attempts/me?pageSize=120"),
        apiFetch<{ items: Array<Record<string, unknown>> }>(`/api/holidays?year=${new Date().getFullYear()}`),
        apiFetch<{ items: Array<Record<string, unknown>> }>("/api/safety-culture/events?pageSize=100"),
      ]);

      if (cancelled) return;

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

      if (notificationsResult.ok && Array.isArray(notificationsResult.data?.items)) {
        setInboxNotifications(notificationsResult.data.items.map((item) => ({
          id: String(item.id),
          kind: "activity",
          title: String(item.title || "Notification"),
          body: String(item.body || ""),
          createdAt: new Date(String(item.created_at || Date.now())).getTime(),
          read: Boolean(item.read_at),
          href: "/notifications",
        })));
      }

      if (rewardsResult.ok && Array.isArray(rewardsResult.data?.items)) {
        setRewardsCatalog(rewardsResult.data.items.map((item) => ({
          id: Number(item.id),
          name: String(item.name || ""),
          category: "reward",
          description: String(item.description || ""),
          imageText: String(item.code || item.name || ""),
          points: Number(item.points_required || 0),
          stockMode: "limited",
          stockTotal: Number(item.stock_qty || 0),
          stockRemaining: Number(item.stock_qty || 0),
        })));
      }

      if (leaderboardResult.ok && Array.isArray(leaderboardResult.data?.items)) {
        setPersonalRankings(leaderboardResult.data.items.map((item, index) => ({
          id: String(item.user_id || item.id),
          rank: `#${index + 1}`,
          name: String(item.name_th || item.name || "Unknown user"),
          points: Number(item.points || 0),
          team: String(item.team || ""),
          active: Boolean(sessionUser?.id && String(item.user_id || item.id) === String(sessionUser.id)),
        })));
      }

      if (teamsResult.ok && Array.isArray(teamsResult.data?.items)) {
        const maxPoints = Math.max(1, ...teamsResult.data.items.map((item) => Number(item.points || 0)));
        setTeamStandings(teamsResult.data.items.map((item, index) => ({
          id: String(item.id),
          rank: index + 1,
          name: String(item.name || ""),
          leaderUserId: String(item.leader_user_id || ""),
          leaderEmail: String(item.leader_email || ""),
          leader: String(item.leader_name_th || item.leader_name_en || item.leader_email || ""),
          members: Number(item.members || 0),
          color: "var(--brand-accent)",
          points: Number(item.points || 0),
          percent: (Number(item.points || 0) / maxPoints) * 100,
          streak: 0,
          awards: 0,
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

      if (eventsResult.ok && Array.isArray(eventsResult.data?.items)) {
        setFeedEvents(eventsResult.data.items.map((item) => ({
          id: String(item.id),
          title: String(item.title || ""),
          subtitle: String(item.location_text || ""),
          summary: String(item.description || ""),
          details: String(item.description || ""),
          imageSrc: null,
          imageText: String(item.title || "EVENT"),
          startDate: item.event_start_at ? String(item.event_start_at).slice(0, 10) : undefined,
          endDate: item.event_end_at ? String(item.event_end_at).slice(0, 10) : undefined,
          dateLabel: "",
          points: 0,
          status: item.status === "ACTIVE" ? "open" : "closed",
          published: item.status !== "DRAFT",
          bonusMode: "fixed",
          multiplier: 1,
          fixedPoints: 0,
          enabledActions: [],
        })));
      }
    }

    void loadBackendState();
    return () => {
      cancelled = true;
    };
  }, [loadPostComments]);

  useEffect(() => {
    setEventNow(Date.now());

    const timer = window.setInterval(() => {
      setEventNow(Date.now());
    }, 1000 * 15);

    return () => window.clearInterval(timer);
  }, []);

  const completeSteps = useCallback((stepIds: number[]) => {
    setCompletedSteps((prev) => {
      const next = [...prev];
      stepIds.forEach((id) => {
        if (!next.includes(id)) next.push(id);
      });
      return next;
    });
  }, []);

  const confirmQueue = useCallback(() => {
    setQueueConfirmed(true);
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
        .then((result) => {
          if (result.ok) return;
          const rollbackPost = previousPost;
          if (rollbackPost) {
            setPosts((current) => current.map((post) => (post.id === postId ? rollbackPost : post)));
            setCurrentUserPoints((points) => Math.max(0, points - currentDelta));
          }
        });
    }
  }, [getLinkedFeedEvent, safetyCultureEvent]);

  const fetchComments = useCallback(async (postId: number) => {
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

  const updateFeedEvents = useCallback((events: SafetyCultureFeedEvent[]) => {
    const normalized = normalizeFeedEvents(events);
    const previousIds = new Set(feedEvents.map((event) => event.id));
    setFeedEvents(normalized);
    if (isAuthenticatedRef.current) {
      for (const event of normalized) {
        const existing = previousIds.has(event.id) && /^\d+$/.test(event.id);
        void apiFetch(
          existing ? `/api/safety-culture/events/${event.id}` : "/api/safety-culture/events",
          apiJson(existing ? "PATCH" : "POST", {
            title: event.title,
            description: event.details || event.summary,
            eventStartAt: event.startDate || null,
            eventEndAt: event.endDate || null,
            status: event.published ? "ACTIVE" : "DRAFT",
            metadata: event,
          }),
        );
      }
    }
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

  const updateTeamStandings = useCallback((teams: LeaderboardTeam[]) => {
    const normalized = normalizeTeamStandings(teams);
    setTeamStandings(normalized);
    if (isAuthenticatedRef.current) {
      void apiFetch("/api/safety-culture/teams", apiJson("PUT", {
        teams: normalized.map((team) => ({
          id: /^\d+$/.test(team.id) ? team.id : null,
          name: team.name,
          leaderUserId: team.leaderUserId || null,
          status: "ACTIVE",
        })),
      }));
    }
  }, []);

  const updatePersonalRankings = useCallback((rankings: LeaderboardPerson[]) => {
    setPersonalRankings(normalizePersonalRankings(rankings));
  }, []);

  const updateRewardsCatalog = useCallback((rewards: RewardCatalogItem[]) => {
    const normalized = normalizeRewardsCatalog(rewards);
    const previousIds = new Set(rewardsCatalog.map((reward) => reward.id));
    const nextIds = new Set(normalized.map((reward) => reward.id));
    setRewardsCatalog(normalized);
    if (isAuthenticatedRef.current) {
      for (const reward of normalized) {
        const existing = previousIds.has(reward.id);
        void apiFetch(
          existing ? `/api/safety-culture/rewards/${reward.id}` : "/api/safety-culture/rewards",
          apiJson(existing ? "PATCH" : "POST", {
            code: `REWARD-${reward.id}`,
            name: reward.name,
            pointsRequired: reward.points,
            stockQty: reward.stockRemaining ?? 0,
            status: "ACTIVE",
          }),
        );
      }
      for (const reward of rewardsCatalog) {
        if (!nextIds.has(reward.id)) void apiFetch(`/api/safety-culture/rewards/${reward.id}`, { method: "DELETE" });
      }
    }
  }, [rewardsCatalog]);

  const updateRewardCategories = useCallback((categories: RewardCategory[]) => {
    setRewardCategories(normalizeRewardCategories(categories));
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

  const markAwarenessDone = useCallback((completion: Omit<AwarenessCompletion, "date" | "completedAt">) => {
    const date = todayKey();
    const occurredAt = Date.now();
    const points = getSafetyPoint("safetyAwarenessCompleted");
    const actorName = userDisplayName(currentUserRef.current);
    const alreadyCompletedToday = awarenessDoneDate === date || awarenessHistory.some((item) => item.date === date);
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
      void (async () => {
        const saved = await apiFetch<{ attempt: { attemptDate?: string; score?: number; total?: number } }>("/api/safety-awareness/attempts", apiJson("POST", {
          score: completion.score,
          total: completion.total,
          questions: completion.questions,
        }));
        if (!saved.ok) {
          setNotification({ type: "info", message: "บันทึก Safety Awareness ไม่สำเร็จ กรุณารีเฟรชแล้วลองอีกครั้ง" });
          return;
        }
        await Promise.all([refreshPointBalance(), refreshAwarenessAttempts()]);
      })();
    }
  }, [awarenessDoneDate, awarenessHistory, refreshAwarenessAttempts, refreshPointBalance]);

  const awardSafetyEffortCompletion = useCallback((sourceId: string, label = "Safety Effort สำเร็จ") => {
    const occurredAt = Date.now();
    const points = getSafetyPoint("safetyEffortCompleted");
    const activityId = `activity-safety-effort-${sourceId}`;
    const actorName = userDisplayName(currentUserRef.current);

    setCurrentUserPoints((prev) => prev + points);
    setUserActivityHistory((current) =>
      normalizeUserActivityHistory([
        {
          id: activityId,
          type: "safety-effort",
          occurredAt,
          postId: 0,
          postAuthor: actorName,
          postCategory: "Safety Effort",
          postPreview: label,
          pointsDelta: points,
        },
        ...current.filter((item) => item.id !== activityId),
      ])
    );
  }, []);

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
      const persisted = await apiFetch(`/api/safety-culture/rewards/${rewardId}/redeem`, apiJson("POST", { points }));
      if (!persisted.ok) {
        return { ok: false as const, reason: "api-error" as const };
      }

      setCurrentUserPoints((prev) => prev - points);
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
            postPreview: `แลกรางวัล "${reward.name}" สำเร็จ ใช้ ${points.toLocaleString()} แต้ม`,
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
            body: `คุณได้แลกรางวัล "${reward.name}" ใช้ ${points.toLocaleString()} แต้ม ระบบจะส่งรหัสให้ตามช่องทางที่กำหนด`,
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
      return { ok: true as const };
    },
    [currentUserPoints, rewardsCatalog]
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
    completedSteps,
    healthData,
    kytData,
    preTripData,
    queueConfirmed,
    sosData,
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
    awarenessRequiredToday: ![0, 6].includes(awarenessBangkokDay) && !awarenessHolidays.some((holiday) => holiday.date === awarenessTodayKey),
    awarenessStartDate,
    isEventLive: isSafetyCultureEventLive(safetyCultureEvent, eventNow),
    eventNow,
  };

  const actions: AppActions = {
    completeSteps,
    setHealthData,
    setKytData,
    setPreTripData,
    confirmQueue,
    setSosData,
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
