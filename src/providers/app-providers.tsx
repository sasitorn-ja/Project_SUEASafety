"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import {
  DEFAULT_REWARD_CATEGORIES,
  PERSONAL_RANKINGS,
  REWARDS_LIST,
  TEAM_STANDINGS,
  type RewardCategoryConfig,
  type RewardItem,
} from "@/lib/safety-culture";
import {
  type SafetyAwarenessQuestion,
  createDefaultAwarenessQuestions,
  normalizeAwarenessQuestions,
  todayKey,
} from "@/lib/safety-awareness";

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
};

export type Comment = {
  id: string;
  author: string;
  avatarText: string;
  text: string;
  reactions?: Record<string, number>;
};

export type Post = {
  id: number;
  author: string;
  avatarBg: string;
  avatarColor: string;
  avatarText: string;
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
};

export type SafetyCultureUserActivityType = "post" | "reaction" | "comment" | "redeem";

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
  addPost: (post: Post) => void;
  toggleLike: (postId: number) => void;
  addComment: (postId: number, text: string) => void;
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
  redeemPoints: (
    rewardId: number,
    points: number
  ) => {
    ok: boolean;
    reason?: "not-found" | "insufficient-points" | "not-started" | "expired" | "out-of-stock";
  };
};

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppActionsContext = createContext<AppActions | undefined>(undefined);

const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    author: "Nattaya K.",
    avatarBg: "var(--brand-accent)",
    avatarColor: "#1A1A1A",
    avatarText: "N",
    subtext: "OBK-C2 · 12 นาที · Yellow",
    category: "Line Walk",
    body: "ทีม OBK-C2 ใช้ cable tray ใหม่แทนสายไฟพาดพื้น ลดโอกาสสะดุดตรงทางเดินหลักได้ชัดเจน",
    photos: [
      { id: "suea-app-1-1", dataUrl: "/images/mascots/gallery/line-walk-1.png", type: "sample" },
      { id: "suea-app-1-2", dataUrl: "/images/mascots/gallery/line-walk-2.png", type: "sample" },
      { id: "suea-app-1-3", dataUrl: "/images/mascots/gallery/line-walk-3.png", type: "sample" },
    ],
    imageText: "SITE AFTER FIX",
    likes: 24,
    comments: 7,
    points: 17,
    hasLiked: false,
  },
  {
    id: 2,
    author: "Chaiwat T.",
    avatarBg: "var(--brand-accent)",
    avatarColor: "#1A1A1A",
    avatarText: "C",
    isYou: true,
    subtext: "BPI-04 · 1 ชม. · Yellow",
    category: "PPE",
    body: "ตรวจ PPE ก่อนเข้ากะ พบหมวกแตก 1 ใบและแจ้ง store เปลี่ยนทันที ขอบคุณทีมที่ช่วยกันดูก่อนเริ่มงาน",
    photos: [
      { id: "suea-app-2-1", dataUrl: "/images/mascots/gallery/ppe-1.png", type: "sample" },
      { id: "suea-app-2-2", dataUrl: "/images/mascots/gallery/ppe-2.png", type: "sample" },
    ],
    imageText: "PPE INSPECTION",
    likes: 12,
    comments: 2,
    points: 12,
    hasLiked: false,
  },
  {
    id: 3,
    author: "Arisara P.",
    avatarBg: "#FDF2F2",
    avatarColor: "#D9383A",
    avatarText: "A",
    subtext: "BPI-04 · 3 ชม. · Red",
    category: "5S",
    body: "จัดเก็บพื้นที่กองเศษวัสดุหน้างานเรียบร้อย เพิ่มทางเดินปลอดภัยกว้างขึ้น 1.5 เมตร",
    photos: [
      { id: "suea-app-3-1", dataUrl: "/images/mascots/gallery/five-s-1.png", type: "sample" },
      { id: "suea-app-3-2", dataUrl: "/images/mascots/gallery/line-walk-3.png", type: "sample" },
      { id: "suea-app-3-3", dataUrl: "/images/mascots/gallery/line-walk-2.png", type: "sample" },
    ],
    imageText: "5S ORGANIZATION",
    likes: 42,
    comments: 9,
    points: 20,
    hasLiked: false,
  },
  {
    id: 4,
    author: "Chaiwat T.",
    avatarBg: "var(--brand-accent)",
    avatarColor: "#1A1A1A",
    avatarText: "C",
    isYou: true,
    subtext: "BPI-04 · 42 นาที · Blue",
    category: "ทั่วไป",
    body: "พบจุดเสี่ยงบริเวณทางเดินหน้าไลน์งานแล้วรีบจัดระเบียบพื้นที่ พร้อมติดป้ายเตือนให้ทีมเห็นชัดขึ้นก่อนเริ่มกะ",
    photos: [{ id: "suea-app-4-1", dataUrl: "/images/mascots/gallery/line-walk-3.png", type: "sample" }],
    imageText: "BOSS EVENT",
    likes: 6,
    comments: [
      { id: "post-4-comment-1", author: "Arisara P.", avatarText: "A", text: "ตัวอย่างนี้ดีมาก เดี๋ยวทีมจะเอาไปใช้ต่อ" },
      { id: "post-4-comment-2", author: "Nattaya K.", avatarText: "N", text: "อ่านแล้วเห็นภาพเลยค่ะ ขอบคุณที่แชร์" },
    ],
    points: 6,
    hasLiked: false,
  },
  {
    id: 5,
    author: "Chaiwat T.",
    avatarBg: "var(--brand-accent)",
    avatarColor: "#1A1A1A",
    avatarText: "C",
    isYou: true,
    subtext: "OBK-C2 · 2 ชั่วโมง · Yellow",
    category: "Line Walk",
    body: "พาทีมเดิน Line Walk รอบบ่ายแล้วสรุปจุดเสี่ยงที่ต้องแก้ทันที พร้อมแชร์ภาพตัวอย่างให้กะถัดไปเอาไปใช้ต่อได้",
    photos: [{ id: "suea-app-5-1", dataUrl: "/images/mascots/gallery/line-walk-2.png", type: "sample" }],
    imageText: "LINE WALK SHARE",
    likes: 9,
    comments: [{ id: "post-5-comment-1", author: "Preecha V.", avatarText: "P", text: "ไอเดียนี้เอาไปใช้ต่อหน้างานได้ทันทีเลยครับ" }],
    points: 14,
    hasLiked: false,
  },
  {
    id: 6,
    author: "Chaiwat T.",
    avatarBg: "var(--brand-accent)",
    avatarColor: "#1A1A1A",
    avatarText: "C",
    isYou: true,
    subtext: "BPI-04 · 4 ชั่วโมง · Red",
    category: "5S",
    body: "แชร์ภาพ before/after หลังจัดระเบียบพื้นที่กองวัสดุหน้าจุดโหลด เพื่อให้ทีมเห็นผลลัพธ์ชัดเจนและทำตามได้ง่ายขึ้น",
    photos: [
      { id: "suea-app-6-1", dataUrl: "/images/mascots/gallery/five-s-1.png", type: "sample" },
      { id: "suea-app-6-2", dataUrl: "/images/mascots/gallery/line-walk-3.png", type: "sample" },
    ],
    imageText: "5S BEFORE AFTER",
    likes: 11,
    comments: [
      { id: "post-6-comment-1", author: "Anand T.", avatarText: "A", text: "ตัวอย่างการจัดพื้นที่นี้ช่วยให้ทีมเห็นวิธีแก้จุดเสี่ยงได้ชัดขึ้น" },
      { id: "post-6-comment-2", author: "Nattaya K.", avatarText: "N", text: "ภาพ before/after ชุดนี้ดูแล้วเข้าใจผลลัพธ์ได้ง่ายมาก" },
    ],
    points: 18,
    hasLiked: false,
  },
];

const STORAGE_KEYS = {
  posts: "safety-hub:safety-culture-posts",
  event: "safety-hub:safety-culture-event",
  feedEvents: "safety-hub:safety-culture-feed-events",
  currentUserPoints: "safety-hub:safety-culture-current-user-points",
  teamStandings: "safety-hub:safety-culture-team-standings",
  personalRankings: "safety-hub:safety-culture-personal-rankings",
  rewardsCatalog: "safety-hub:safety-culture-rewards-catalog",
  rewardCategories: "safety-hub:safety-culture-reward-categories",
  rewardRedemptions: "safety-hub:safety-culture-reward-redemptions",
  awarenessQuestions: "safety-hub:safety-awareness-questions",
  awarenessDoneDate: "safety-hub:safety-awareness-done-date",
  awarenessHistory: "safety-hub:safety-awareness-history",
  awarenessHolidays: "safety-hub:safety-awareness-holidays",
  userActivityHistory: "safety-hub:safety-culture-user-activity-history",
  inboxNotifications: "safety-hub:inbox-notifications",
} as const;

const INITIAL_CURRENT_USER_POINTS = 254;

function getDefaultCurrentUserName() {
  const activeRankingName = PERSONAL_RANKINGS.find((person) => person.active)?.name;
  if (activeRankingName) {
    return activeRankingName.replace(/\s*\(.+?\)\s*$/, "").trim();
  }

  const currentPostAuthor = INITIAL_POSTS.find((post) => post.isYou)?.author;
  return currentPostAuthor || "Current User";
}

const DEFAULT_CURRENT_USER_NAME = getDefaultCurrentUserName();

const INITIAL_USER_ACTIVITY_HISTORY: SafetyCultureUserActivity[] = [
  {
    id: "activity-post-seed-1",
    type: "post",
    occurredAt: new Date("2026-06-15T08:40:00+07:00").getTime(),
    postId: 2,
    postAuthor: "Chaiwat T.",
    postCategory: "PPE",
    postPreview: "ตรวจ PPE ก่อนเข้ากะ พบหมวกแตก 1 ใบและแจ้ง store เปลี่ยนทันที",
    pointsDelta: 12,
  },
  {
    id: "activity-reaction-seed-1",
    type: "reaction",
    occurredAt: new Date("2026-06-15T09:05:00+07:00").getTime(),
    postId: 1,
    postAuthor: "Nattaya K.",
    postCategory: "Line Walk",
    postPreview: "ทีม OBK-C2 ใช้ cable tray ใหม่แทนสายไฟพาดพื้น",
    pointsDelta: 1,
  },
  {
    id: "activity-comment-seed-1",
    type: "comment",
    occurredAt: new Date("2026-06-15T10:15:00+07:00").getTime(),
    postId: 3,
    postAuthor: "Arisara P.",
    postCategory: "5S",
    postPreview: "จัดเก็บพื้นที่กองเศษวัสดุหน้างานเรียบร้อย เพิ่มทางเดินปลอดภัยกว้างขึ้น",
    pointsDelta: 1,
    commentText: "ตัวอย่างดีมาก เดี๋ยวทีมเราจะนำไปใช้ต่อ",
  },
];

const INITIAL_INBOX_NOTIFICATIONS: AppInboxNotification[] = [
  {
    id: "notif-comment-1",
    kind: "comment",
    actorName: "Arisara P.",
    title: "\u0e21\u0e35\u0e04\u0e2d\u0e21\u0e40\u0e21\u0e19\u0e15\u0e4c\u0e17\u0e35\u0e48\u0e42\u0e1e\u0e2a\u0e15\u0e4c\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13",
    body: "Arisara P. \u0e04\u0e2d\u0e21\u0e40\u0e21\u0e19\u0e15\u0e4c\u0e1a\u0e19\u0e42\u0e1e\u0e2a\u0e15\u0e4c\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13\u0e27\u0e48\u0e32\u0e15\u0e31\u0e27\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e19\u0e35\u0e49\u0e14\u0e35\u0e21\u0e32\u0e01",
    createdAt: new Date("2026-06-16T10:25:00+07:00").getTime(),
    read: false,
    postId: 4,
    href: "/safety-culture",
  },
  {
    id: "notif-like-1",
    kind: "like",
    actorName: "Nattaya K.",
    title: "\u0e21\u0e35\u0e04\u0e19\u0e01\u0e14\u0e0a\u0e2d\u0e1a\u0e42\u0e1e\u0e2a\u0e15\u0e4c\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13",
    body: "Nattaya K. \u0e01\u0e14\u0e0a\u0e2d\u0e1a\u0e42\u0e1e\u0e2a\u0e15\u0e4c PPE \u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13\u0e43\u0e19\u0e2b\u0e19\u0e49\u0e32 Safety Culture",
    createdAt: new Date("2026-06-16T10:55:00+07:00").getTime(),
    read: false,
    postId: 2,
    href: "/safety-culture",
  },
  {
    id: "notif-activity-1",
    kind: "activity",
    title: "\u0e01\u0e34\u0e08\u0e01\u0e23\u0e23\u0e21\u0e43\u0e2b\u0e21\u0e48\u0e43\u0e19 Safety Culture",
    body: "Happy Hour Bonus x1.5 \u0e40\u0e1b\u0e34\u0e14\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19\u0e41\u0e25\u0e49\u0e27 \u0e40\u0e02\u0e49\u0e32\u0e21\u0e32\u0e23\u0e48\u0e27\u0e21\u0e01\u0e34\u0e08\u0e01\u0e23\u0e23\u0e21\u0e41\u0e25\u0e30\u0e40\u0e01\u0e47\u0e1a\u0e04\u0e30\u0e41\u0e19\u0e19\u0e1e\u0e34\u0e40\u0e28\u0e29\u0e44\u0e14\u0e49\u0e40\u0e25\u0e22",
    createdAt: new Date("2026-06-16T08:15:00+07:00").getTime(),
    read: false,
    feedEventId: "activity-1",
    href: "/safety-culture",
  },
  {
    id: "notif-like-2",
    kind: "like",
    actorName: "Somchai T.",
    title: "\u0e21\u0e35\u0e04\u0e19\u0e01\u0e14\u0e0a\u0e2d\u0e1a\u0e42\u0e1e\u0e2a\u0e15\u0e4c\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13",
    body: "Somchai T. \u0e01\u0e14\u0e0a\u0e2d\u0e1a\u0e42\u0e1e\u0e2a\u0e15\u0e4c 5\u0e2a \u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13\u0e40\u0e21\u0e37\u0e48\u0e2d\u0e27\u0e32\u0e19\u0e19\u0e35\u0e49",
    createdAt: new Date("2026-06-15T16:40:00+07:00").getTime(),
    read: true,
    postId: 6,
    href: "/safety-culture",
  },
  {
    id: "notif-comment-2",
    kind: "comment",
    actorName: "Kanya S.",
    title: "\u0e21\u0e35\u0e04\u0e2d\u0e21\u0e40\u0e21\u0e19\u0e15\u0e4c\u0e17\u0e35\u0e48\u0e42\u0e1e\u0e2a\u0e15\u0e4c\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13",
    body: "Kanya S. \u0e40\u0e02\u0e49\u0e32\u0e21\u0e32\u0e04\u0e2d\u0e21\u0e40\u0e21\u0e19\u0e15\u0e4c\u0e02\u0e2d\u0e1a\u0e04\u0e38\u0e13\u0e2a\u0e33\u0e2b\u0e23\u0e31\u0e1a\u0e41\u0e19\u0e27\u0e17\u0e32\u0e07\u0e08\u0e31\u0e14\u0e40\u0e01\u0e47\u0e1a\u0e1e\u0e37\u0e49\u0e19\u0e17\u0e35\u0e48\u0e2b\u0e19\u0e49\u0e32\u0e44\u0e25\u0e19\u0e4c\u0e1c\u0e25\u0e34\u0e15",
    createdAt: new Date("2026-06-15T13:20:00+07:00").getTime(),
    read: true,
    postId: 6,
    href: "/safety-culture",
  },
  {
    id: "notif-activity-2",
    kind: "activity",
    title: "กิจกรรมใหม่ใน Safety Culture",
    body: "Walk Safe Challenge เปิดให้ส่งผลงานแล้ว พร้อมรับคะแนนจากการแชร์แนวทางลดจุดเสี่ยงในพื้นที่ทำงาน",
    createdAt: new Date("2026-06-16T07:42:00+07:00").getTime(),
    read: false,
    feedEventId: "activity-1",
    href: "/safety-culture",
  },
  {
    id: "notif-like-3",
    kind: "like",
    actorName: "Preecha V.",
    title: "มีคนกดชอบโพสต์ของคุณ",
    body: "Preecha V. กดชอบโพสต์ Line Walk ของคุณและบอกว่าไอเดียนี้นำไปใช้ต่อได้ทันที",
    createdAt: new Date("2026-06-16T06:58:00+07:00").getTime(),
    read: false,
    postId: 5,
    href: "/safety-culture",
  },
  {
    id: "notif-comment-3",
    kind: "comment",
    actorName: "Anand T.",
    title: "มีคอมเมนต์ที่โพสต์ของคุณ",
    body: "Anand T. คอมเมนต์ว่าตัวอย่างการจัดพื้นที่ของคุณช่วยให้ทีมเห็นวิธีแก้จุดเสี่ยงได้ชัดขึ้น",
    createdAt: new Date("2026-06-16T06:15:00+07:00").getTime(),
    read: false,
    postId: 6,
    href: "/safety-culture",
  },
  {
    id: "notif-like-4",
    kind: "like",
    actorName: "Suda M.",
    title: "มีคนกดชอบโพสต์ของคุณ",
    body: "Suda M. กดชอบโพสต์ PPE ของคุณหลังจากเห็นตัวอย่างการตรวจอุปกรณ์ก่อนเริ่มงาน",
    createdAt: new Date("2026-06-15T18:05:00+07:00").getTime(),
    read: true,
    postId: 2,
    href: "/safety-culture",
  },
  {
    id: "notif-activity-3",
    kind: "activity",
    title: "กิจกรรมใหม่ใน Safety Culture",
    body: "PPE Buddy Check เปิดรอบใหม่แล้ว ชวนทีมจับคู่ตรวจ PPE ก่อนเริ่มงานและแชร์แนวทางเตือนกันอย่างสร้างสรรค์",
    createdAt: new Date("2026-06-15T11:05:00+07:00").getTime(),
    read: true,
    feedEventId: "activity-2",
    href: "/safety-culture",
  },
  {
    id: "notif-comment-4",
    kind: "comment",
    actorName: "Nattaya K.",
    title: "มีคอมเมนต์ที่โพสต์ของคุณ",
    body: "Nattaya K. บอกว่าภาพ before/after ของคุณทำให้เข้าใจผลลัพธ์การปรับปรุงพื้นที่ได้ง่ายมาก",
    createdAt: new Date("2026-06-14T16:12:00+07:00").getTime(),
    read: true,
    postId: 6,
    href: "/safety-culture",
  },
  {
    id: "notif-like-5",
    kind: "like",
    actorName: "Surachai J.",
    title: "มีคนกดชอบโพสต์ของคุณ",
    body: "Surachai J. กดชอบโพสต์ของคุณและแชร์ต่อให้ทีมหน้างานดูเป็นตัวอย่าง",
    createdAt: new Date("2026-06-14T09:48:00+07:00").getTime(),
    read: true,
    postId: 4,
    href: "/safety-culture",
  },
];

const DEFAULT_SAFETY_CULTURE_EVENT: SafetyCultureEventConfig = {
  eventName: "Happy Hour Bonus",
  eventCode: "SC-HAPPY-HOUR-001",
  headline: "Happy Hour Bonus x1.5",
  supportingText: "แชร์เรื่องความปลอดภัยช่วง 14:00 - 16:00 แล้วรับคะแนนคูณเพิ่มทันที",
  bannerNote: "เน้นกิจกรรมโพสต์ดี ๆ ระหว่างกะบ่าย เพื่อดึงคนกลับเข้ามาใช้งานอีกครั้ง",
  bannerVisible: true,
  status: "scheduled",
  bonusMode: "multiplier",
  multiplier: 1.5,
  fixedPoints: 5,
  startDate: "2026-06-12",
  startTime: "14:00",
  endDate: "2026-06-12",
  endTime: "16:00",
  enabledActions: ["approved-post", "comment"],
};

const DEFAULT_FEED_EVENTS: SafetyCultureFeedEvent[] = [
  {
    id: "activity-1",
    title: "Walk Safe Challenge",
    subtitle: "Activity Details and Submission",
    summary: "ชวนทีมแชร์การเดินตรวจพื้นที่และแนวทางแก้ไขจุดเสี่ยงที่พบในหน้างานประจำวัน",
    details:
      "หมวดกิจกรรม: Line Walk | รายละเอียดกิจกรรม: ถ่ายภาพก่อนและหลังการปรับปรุงจุดเสี่ยง พร้อมเขียนสรุปสิ่งที่แก้ไขและผลลัพธ์ที่เกิดขึ้น | เงื่อนไข: ส่งได้ทีมละ 1 ครั้งต่อสัปดาห์",
    imageSrc: "/images/mascots/gallery/line-walk-1.png",
    imageText: "Walk Safe Challenge",
    startDate: "2026-06-10",
    endDate: "2026-06-25",
    dateLabel: "10 Jun - 25 Jun",
    points: 100,
    status: "open",
    published: true,
    bonusMode: "fixed",
    multiplier: 1,
    fixedPoints: 0,
    enabledActions: ["theme-post"],
  },
  {
    id: "activity-2",
    title: "PPE Buddy Check",
    subtitle: "Activity Details and Submission",
    summary: "จับคู่เพื่อนร่วมงานตรวจ PPE ก่อนเริ่มกะและแชร์วิธีเตือนกันอย่างสร้างสรรค์",
    details:
      "หมวดกิจกรรม: PPE | รายละเอียดกิจกรรม: อัปโหลดภาพการตรวจ PPE คู่กันก่อนเริ่มงาน พร้อมระบุสิ่งที่ตรวจพบและแนวทางแก้ไข | เงื่อนไข: ส่งได้วันละ 1 ครั้งต่อคน",
    imageSrc: "/images/mascots/gallery/ppe-1.png",
    imageText: "PPE Buddy Check",
    startDate: "2026-06-12",
    endDate: "2026-06-30",
    dateLabel: "12 Jun - 30 Jun",
    points: 120,
    status: "open",
    published: true,
    bonusMode: "fixed",
    multiplier: 1,
    fixedPoints: 0,
    enabledActions: ["theme-post"],
  },
  {
    id: "activity-3",
    title: "5S Flash Mission",
    subtitle: "Activity Details and Submission",
    summary: "เคลียร์พื้นที่กองวัสดุและแชร์ before/after เพื่อสร้างแรงบันดาลใจให้ทีมอื่นทำตาม",
    details:
      "หมวดกิจกรรม: 5S | รายละเอียดกิจกรรม: แนบภาพก่อนและหลังการจัดระเบียบพื้นที่ พร้อมอธิบายว่าลดความเสี่ยงหรือเพิ่มความคล่องตัวอย่างไร | เงื่อนไข: จำกัด 2 ผลงานต่อแผนกต่อเดือน",
    imageSrc: "/images/mascots/gallery/five-s-1.png",
    imageText: "5S Flash Mission",
    startDate: "2026-06-15",
    endDate: "2026-07-05",
    dateLabel: "15 Jun - 05 Jul",
    points: 100,
    status: "closed",
    published: true,
    bonusMode: "fixed",
    multiplier: 1,
    fixedPoints: 0,
    enabledActions: ["theme-post"],
  },
];

const LEGACY_DEFAULT_EVENT_RANGE = {
  startDate: "2026-06-12",
  startTime: "14:00",
  endDate: "2026-06-12",
  endTime: "16:00",
} as const;

const LEGACY_DEFAULT_EVENT_COPY = {
  headline: "Happy Hour Bonus x1.5",
  supportingText: "แชร์เรื่องความปลอดภัยช่วง 14:00 - 16:00 แล้วรับคะแนนคูณเพิ่มทันที",
} as const;

const DEFAULT_TEAM_LEADS = [
  "Boonrueng M.",
  "Surachai J.",
  "Pipat R.",
  "Prawet O.",
  "Narongsak T.",
  "Sittiphan K.",
  "Arthit S.",
  "Prapon S.",
] as const;

const DEFAULT_PERSON_TEAMS = ["Other", "SSB", "RMC South", "RMC East"] as const;

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
  const start = new Date();
  const end = addDays(start, 14);
  const startDate = formatLocalDate(start);
  const endDate = formatLocalDate(end);
  const startTime = DEFAULT_SAFETY_CULTURE_EVENT.startTime;
  const endTime = DEFAULT_SAFETY_CULTURE_EVENT.endTime;

  return {
    ...DEFAULT_SAFETY_CULTURE_EVENT,
    startDate,
    endDate,
    supportingText: `แชร์เรื่องความปลอดภัยช่วง ${startTime} - ${endTime} แล้วรับคะแนนคูณเพิ่มทันที`,
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
          author: repairMojibakeText(comment.author) || "Unknown author",
          avatarText: repairMojibakeText(comment.avatarText) || "C",
          text: repairMojibakeText(comment.text) || "",
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
  const merged = new Map<number, Post>();

  for (const item of normalizePosts(INITIAL_POSTS)) {
    merged.set(item.id, item);
  }

  for (const item of normalizePosts(posts)) {
    const seed = merged.get(item.id);
    const mergedPhotos = item.photos?.length ? item.photos : seed?.photos || [];
    merged.set(item.id, {
      ...seed,
      ...item,
      body: item.body || seed?.body || "",
      subtext: item.subtext || seed?.subtext || "",
      category: item.category || seed?.category || "ทั่วไป",
      comments: item.comments || seed?.comments || 0,
      photos: mergedPhotos.length ? mergedPhotos : item.id === 4 ? [{ id: "suea-app-4-fallback", dataUrl: "/images/mascots/gallery/line-walk-3.png", type: "sample" }] : [],
    });
  }

  return Array.from(merged.values()).sort((left, right) => right.id - left.id);
}

function normalizeStoredSafetyCultureEvent(parsedEvent: Partial<SafetyCultureEventConfig>) {
  const defaultEvent = createDefaultSafetyCultureEvent();
  const mergedEvent = {
    ...defaultEvent,
    ...parsedEvent,
    eventName: repairMojibakeText(parsedEvent.eventName ?? defaultEvent.eventName),
    eventCode: repairMojibakeText(parsedEvent.eventCode ?? defaultEvent.eventCode),
    headline: repairMojibakeText(parsedEvent.headline ?? defaultEvent.headline),
    supportingText: repairMojibakeText(parsedEvent.supportingText ?? defaultEvent.supportingText),
    bannerNote: repairMojibakeText(parsedEvent.bannerNote ?? defaultEvent.bannerNote),
  };
  const usesLegacyRange =
    parsedEvent.startDate === LEGACY_DEFAULT_EVENT_RANGE.startDate &&
    parsedEvent.startTime === LEGACY_DEFAULT_EVENT_RANGE.startTime &&
    parsedEvent.endDate === LEGACY_DEFAULT_EVENT_RANGE.endDate &&
    parsedEvent.endTime === LEGACY_DEFAULT_EVENT_RANGE.endTime;

  if (!usesLegacyRange) {
    return mergedEvent;
  }

  return {
    ...mergedEvent,
    startDate: defaultEvent.startDate,
    endDate: defaultEvent.endDate,
    headline: parsedEvent.headline === LEGACY_DEFAULT_EVENT_COPY.headline ? defaultEvent.headline : mergedEvent.headline,
    supportingText:
      parsedEvent.supportingText === LEGACY_DEFAULT_EVENT_COPY.supportingText ? defaultEvent.supportingText : mergedEvent.supportingText,
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
  return normalizeTeamStandings(
    TEAM_STANDINGS.map((team, index) => ({
      id: `team-${team.name.toLowerCase().replace(/\s+/g, "-")}-${index + 1}`,
      rank: team.rank,
      name: team.name,
      leader: DEFAULT_TEAM_LEADS[index] ?? `${team.name} Lead`,
      members: team.members,
      color: team.color,
      points: team.points,
      percent: team.percent,
      streak: 1,
      awards: index < 3 ? 1 : 0,
    }))
  );
}

function createDefaultPersonalRankings(): LeaderboardPerson[] {
  return normalizePersonalRankings(
    PERSONAL_RANKINGS.map((person, index) => ({
      id: `person-${index + 1}`,
      rank: person.rank,
      name: person.name,
      points: person.points,
      team: DEFAULT_PERSON_TEAMS[index] ?? "Safety Team",
      active: person.active,
    }))
  );
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
  return normalizeRewardsCatalog(REWARDS_LIST.map((reward) => ({ ...reward })));
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
  return normalizeRewardRedemptions([
    {
      id: "reward-redemption-seed-1",
      rewardId: 5,
      rewardName: "ตั๋วหนัง SF - 1 ที่นั่ง",
      rewardCategory: "voucher",
      pointsSpent: 350,
      redeemedAt: "2026-06-15T13:42:00.000Z",
      redeemedBy: "Chaiwat T.",
    },
    {
      id: "reward-redemption-seed-2",
      rewardId: 2,
      rewardName: "ผ้าขนหนู Safety",
      rewardCategory: "merch",
      pointsSpent: 320,
      redeemedAt: "2026-06-15T11:18:00.000Z",
      redeemedBy: "Nattaya K.",
    },
    {
      id: "reward-redemption-seed-3",
      rewardId: 1,
      rewardName: "บัตร Tesco Lotus",
      rewardCategory: "voucher",
      pointsSpent: 500,
      redeemedAt: "2026-06-14T09:27:00.000Z",
      redeemedBy: "Anand T.",
    },
    {
      id: "reward-redemption-seed-4",
      rewardId: 4,
      rewardName: "เสื้อ Safety Cup",
      rewardCategory: "merch",
      pointsSpent: 850,
      redeemedAt: "2026-06-13T15:05:00.000Z",
      redeemedBy: "Arisara P.",
    },
    {
      id: "reward-redemption-seed-5",
      rewardId: 3,
      rewardName: "หมวกกันน็อก premium",
      rewardCategory: "ppe",
      pointsSpent: 1200,
      redeemedAt: "2026-06-12T07:54:00.000Z",
      redeemedBy: "Surachai J.",
    },
  ]);
}

function mergeRewardRedemptionsWithSeed(records: RewardRedemptionRecord[]) {
  const normalizedCurrent = normalizeRewardRedemptions(records);
  const seedRecords = createDefaultRewardRedemptions();
  const redeemerSet = new Set(normalizedCurrent.map((item) => item.redeemedBy.trim().toLowerCase()));
  const merged = [...normalizedCurrent];

  for (const seed of seedRecords) {
    if (redeemerSet.has(seed.redeemedBy.trim().toLowerCase())) continue;
    merged.push(seed);
    redeemerSet.add(seed.redeemedBy.trim().toLowerCase());
    if (redeemerSet.size >= 5) break;
  }

  return normalizeRewardRedemptions(merged);
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
  const merged = new Map<string, AppInboxNotification>();

  for (const item of notifications) {
    merged.set(item.id, item);
  }

  for (const item of INITIAL_INBOX_NOTIFICATIONS) {
    const current = merged.get(item.id);
    const resolvedPostId = current?.postId ?? item.postId;
    const resolvedFeedEventId = current?.feedEventId ?? item.feedEventId;
    merged.set(item.id, {
      ...item,
      ...current,
      title: !current?.title || /\?{4,}/.test(current.title) ? item.title : current.title,
      body: !current?.body || /\?{4,}/.test(current.body) ? item.body : current.body,
      postId: resolvedPostId,
      feedEventId: resolvedFeedEventId,
      href:
        !current?.href || current.href === "/safety-culture" || current.href === "/notifications"
          ? buildNotificationHref({ postId: resolvedPostId, feedEventId: resolvedFeedEventId, href: current?.href ?? item.href })
          : current.href,
    });
  }

  return normalizeInboxNotifications(Array.from(merged.values()));
}
function createDefaultInboxNotifications() {
  return mergeInboxNotificationsWithSeed(INITIAL_INBOX_NOTIFICATIONS);
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [healthData, setHealthData] = useState<HealthData>(null);
  const [kytData, setKytData] = useState<KytData>(null);
  const [preTripData, setPreTripData] = useState<PreTripData>(null);
  const [queueConfirmed, setQueueConfirmed] = useState(false);
  const [sosData, setSosData] = useState<SosData>(null);
  const [posts, setPosts] = useState<Post[]>(() => mergePostsWithSeed(INITIAL_POSTS));
  const [userActivityHistory, setUserActivityHistory] = useState<SafetyCultureUserActivity[]>(() => createDefaultUserActivityHistory());
  const [notification, setNotification] = useState<NotificationType>(null);
  const [inboxNotifications, setInboxNotifications] = useState<AppInboxNotification[]>(() => createDefaultInboxNotifications());
  const [currentUserPoints, setCurrentUserPoints] = useState(INITIAL_CURRENT_USER_POINTS);
  // NOTE: Must be a deterministic, static seed (no `new Date()`), otherwise the
  // server (UTC) and client (local TZ) compute different dates and React throws
  // a hydration mismatch (#418). The today-based default is applied on the
  // client inside the load effect below.
  const [safetyCultureEvent, setSafetyCultureEvent] = useState<SafetyCultureEventConfig>(() => createDefaultSafetyCultureEvent());
  const [feedEvents, setFeedEvents] = useState<SafetyCultureFeedEvent[]>(() => createDefaultFeedEvents());
  const [teamStandings, setTeamStandings] = useState<LeaderboardTeam[]>(() => createDefaultTeamStandings());
  const [personalRankings, setPersonalRankings] = useState<LeaderboardPerson[]>(() => createDefaultPersonalRankings());
  const [rewardsCatalog, setRewardsCatalog] = useState<RewardCatalogItem[]>(() => createDefaultRewardsCatalog());
  const [rewardCategories, setRewardCategories] = useState<RewardCategory[]>(() => createDefaultRewardCategories());
  const [rewardRedemptions, setRewardRedemptions] = useState<RewardRedemptionRecord[]>(() => createDefaultRewardRedemptions());
  const [awarenessQuestions, setAwarenessQuestions] = useState<SafetyAwarenessQuestion[]>(() => createDefaultAwarenessQuestions());
  const [awarenessDoneDate, setAwarenessDoneDate] = useState<string>("");
  const [awarenessHistory, setAwarenessHistory] = useState<AwarenessCompletion[]>([]);
  const [awarenessHolidays, setAwarenessHolidays] = useState<AwarenessHoliday[]>([]);
  const [eventNow, setEventNow] = useState(0);

  useEffect(() => {
    try {
      const storedPosts = window.localStorage.getItem(STORAGE_KEYS.posts);
      const storedEvent = window.localStorage.getItem(STORAGE_KEYS.event);
      const storedFeedEvents = window.localStorage.getItem(STORAGE_KEYS.feedEvents);
      const storedCurrentUserPoints = window.localStorage.getItem(STORAGE_KEYS.currentUserPoints);
      const storedTeamStandings = window.localStorage.getItem(STORAGE_KEYS.teamStandings);
      const storedPersonalRankings = window.localStorage.getItem(STORAGE_KEYS.personalRankings);
      const storedRewardsCatalog = window.localStorage.getItem(STORAGE_KEYS.rewardsCatalog);
      const storedRewardCategories = window.localStorage.getItem(STORAGE_KEYS.rewardCategories);
      const storedRewardRedemptions = window.localStorage.getItem(STORAGE_KEYS.rewardRedemptions);
      const storedUserActivityHistory = window.localStorage.getItem(STORAGE_KEYS.userActivityHistory);
      const storedInboxNotifications = window.localStorage.getItem(STORAGE_KEYS.inboxNotifications);

      if (storedPosts) {
        const parsedPosts = JSON.parse(storedPosts) as Post[];
        if (Array.isArray(parsedPosts) && parsedPosts.length > 0) {
          setPosts(mergePostsWithSeed(parsedPosts));
        }
      }

      if (storedEvent) {
        const parsedEvent = JSON.parse(storedEvent) as Partial<SafetyCultureEventConfig>;
        setSafetyCultureEvent(normalizeStoredSafetyCultureEvent(parsedEvent));
      } else {
        // No persisted event: apply the today-based default on the client only
        // (the initial render uses a static seed to stay hydration-safe).
        setSafetyCultureEvent(createDefaultSafetyCultureEvent());
      }

      if (storedFeedEvents) {
        const parsedFeedEvents = JSON.parse(storedFeedEvents) as SafetyCultureFeedEvent[];
        if (Array.isArray(parsedFeedEvents) && parsedFeedEvents.length > 0) {
          setFeedEvents(normalizeFeedEvents(parsedFeedEvents));
        }
      }

      if (storedCurrentUserPoints) {
        const parsedPoints = Number(storedCurrentUserPoints);
        if (!Number.isNaN(parsedPoints)) {
          setCurrentUserPoints(parsedPoints);
        }
      }

      if (storedTeamStandings) {
        const parsedTeams = JSON.parse(storedTeamStandings) as LeaderboardTeam[];
        if (Array.isArray(parsedTeams) && parsedTeams.length > 0) {
          setTeamStandings(normalizeTeamStandings(parsedTeams));
        }
      }

      if (storedPersonalRankings) {
        const parsedRankings = JSON.parse(storedPersonalRankings) as LeaderboardPerson[];
        if (Array.isArray(parsedRankings) && parsedRankings.length > 0) {
          setPersonalRankings(normalizePersonalRankings(parsedRankings));
        }
      }

      if (storedRewardsCatalog) {
        const parsedRewards = JSON.parse(storedRewardsCatalog) as RewardCatalogItem[];
        if (Array.isArray(parsedRewards) && parsedRewards.length > 0) {
          setRewardsCatalog(normalizeRewardsCatalog(parsedRewards));
        }
      }

      if (storedRewardCategories) {
        const parsedCategories = JSON.parse(storedRewardCategories) as RewardCategory[];
        if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
          setRewardCategories(normalizeRewardCategories(parsedCategories));
        }
      }

      if (storedRewardRedemptions) {
        const parsedRedemptions = JSON.parse(storedRewardRedemptions) as RewardRedemptionRecord[];
        if (Array.isArray(parsedRedemptions) && parsedRedemptions.length > 0) {
          setRewardRedemptions(mergeRewardRedemptionsWithSeed(parsedRedemptions));
        }
      }

      if (storedUserActivityHistory) {
        const parsedHistory = JSON.parse(storedUserActivityHistory) as SafetyCultureUserActivity[];
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          setUserActivityHistory(normalizeUserActivityHistory(parsedHistory));
        }
      }

      if (storedInboxNotifications) {
        const parsedNotifications = JSON.parse(storedInboxNotifications) as AppInboxNotification[];
        if (Array.isArray(parsedNotifications) && parsedNotifications.length > 0) {
          setInboxNotifications(mergeInboxNotificationsWithSeed(parsedNotifications));
        }
      }
    } catch {
      // Ignore invalid persisted data and keep defaults.
    }
  }, []);

  const getLinkedFeedEvent = useCallback(
    (feedEventId?: string) => {
      if (!feedEventId) return null;
      return feedEvents.find((event) => event.id === feedEventId) ?? null;
    },
    [feedEvents]
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(serializePostsForStorage(posts)));
    } catch {
      // Prevent crashes when attached images exceed localStorage quota.
    }
  }, [posts]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.event, JSON.stringify(safetyCultureEvent));
    } catch {
      // Ignore persistence failures and keep in-memory state.
    }
  }, [safetyCultureEvent]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.feedEvents, JSON.stringify(feedEvents));
    } catch {
      // Ignore persistence failures and keep in-memory state.
    }
  }, [feedEvents]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.currentUserPoints, `${currentUserPoints}`);
    } catch {
      // Ignore persistence failures and keep in-memory state.
    }
  }, [currentUserPoints]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.teamStandings, JSON.stringify(teamStandings));
    } catch {
      // Ignore persistence failures and keep in-memory state.
    }
  }, [teamStandings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.personalRankings, JSON.stringify(personalRankings));
    } catch {
      // Ignore persistence failures and keep in-memory state.
    }
  }, [personalRankings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.rewardsCatalog, JSON.stringify(rewardsCatalog));
    } catch {
      // Ignore persistence failures and keep in-memory state.
    }
  }, [rewardsCatalog]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.rewardCategories, JSON.stringify(rewardCategories));
    } catch {
      // Ignore persistence failures and keep in-memory state.
    }
  }, [rewardCategories]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.rewardRedemptions, JSON.stringify(rewardRedemptions));
    } catch {
      // Ignore persistence failures and keep in-memory state.
    }
  }, [rewardRedemptions]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.userActivityHistory, JSON.stringify(userActivityHistory));
    } catch {
      // Ignore persistence failures and keep in-memory state.
    }
  }, [userActivityHistory]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.inboxNotifications, JSON.stringify(inboxNotifications));
    } catch {
      // Ignore persistence failures and keep in-memory state.
    }
  }, [inboxNotifications]);

  // Load Safety Awareness question bank + today's completion flag.
  useEffect(() => {
    try {
      const storedQuestions = window.localStorage.getItem(STORAGE_KEYS.awarenessQuestions);
      if (storedQuestions) {
        const parsed = JSON.parse(storedQuestions) as SafetyAwarenessQuestion[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAwarenessQuestions(normalizeAwarenessQuestions(parsed));
        }
      }
      const storedDone = window.localStorage.getItem(STORAGE_KEYS.awarenessDoneDate);
      if (storedDone) setAwarenessDoneDate(storedDone);
      const storedHistory = window.localStorage.getItem(STORAGE_KEYS.awarenessHistory);
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory) as AwarenessCompletion[];
        if (Array.isArray(parsed)) setAwarenessHistory(parsed);
      } else if (storedDone) {
        setAwarenessHistory([{ date: storedDone, completedAt: `${storedDone}T00:00:00.000Z`, score: 0, total: 0, questions: [] }]);
      }
      const storedHolidays = window.localStorage.getItem(STORAGE_KEYS.awarenessHolidays);
      if (storedHolidays) {
        const parsed = JSON.parse(storedHolidays) as AwarenessHoliday[];
        if (Array.isArray(parsed)) setAwarenessHolidays(parsed);
      }
    } catch {
      // Keep defaults on parse/storage failure.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.awarenessQuestions, JSON.stringify(awarenessQuestions));
    } catch {
      // Ignore persistence failures and keep in-memory state.
    }
  }, [awarenessQuestions]);

  useEffect(() => {
    try {
      if (awarenessDoneDate) {
        window.localStorage.setItem(STORAGE_KEYS.awarenessDoneDate, awarenessDoneDate);
      }
    } catch {
      // Ignore persistence failures and keep in-memory state.
    }
  }, [awarenessDoneDate]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.awarenessHistory, JSON.stringify(awarenessHistory));
    } catch {
      // Ignore persistence failures and keep in-memory state.
    }
  }, [awarenessHistory]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.awarenessHolidays, JSON.stringify(awarenessHolidays));
    } catch {
      // Ignore persistence failures and keep in-memory state.
    }
  }, [awarenessHolidays]);

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
  }, []);

  const markAllInboxNotificationsRead = useCallback(() => {
    setInboxNotifications((current) =>
      normalizeInboxNotifications(current.map((item) => ({ ...item, read: true })))
    );
  }, []);

  const addPost = useCallback((post: Post) => {
    const linkedFeedEvent = getLinkedFeedEvent(post.feedEventId);
    const basePoints = linkedFeedEvent ? Math.max(0, linkedFeedEvent.points || 0) : Math.max(0, post.points || 0);
    const awardedPoints = linkedFeedEvent
      ? calculateFeedEventAwardedPoints(basePoints, "theme-post", linkedFeedEvent)
      : calculateAwardedPoints(basePoints, "approved-post", safetyCultureEvent);
    const pointsDelta = Math.max(0, awardedPoints);
    const occurredAt = post.createdAt || Date.now();

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
  }, [getLinkedFeedEvent, safetyCultureEvent]);

  const toggleLike = useCallback((postId: number) => {
    let currentDelta = 0;
    let likedPost: Post | null = null;
    const occurredAt = Date.now();

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const isAdding = !p.hasLiked;
        const linkedFeedEvent = getLinkedFeedEvent(p.feedEventId);
        const awarded = linkedFeedEvent
          ? calculateFeedEventAwardedPoints(1, "reaction", linkedFeedEvent)
          : calculateAwardedPoints(1, "reaction", safetyCultureEvent);
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
  }, [getLinkedFeedEvent, safetyCultureEvent]);

  const addComment = useCallback((postId: number, text: string) => {
    const occurredAt = Date.now();
    let targetPost: Post | null = null;
    let currentAwardedPoints = 0;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        targetPost = p;
        const linkedFeedEvent = getLinkedFeedEvent(p.feedEventId);
        currentAwardedPoints = linkedFeedEvent
          ? calculateFeedEventAwardedPoints(1, "comment", linkedFeedEvent)
          : calculateAwardedPoints(1, "comment", safetyCultureEvent);
        const currentComments = Array.isArray(p.comments) ? p.comments : [];
        return {
          ...p,
          points: (p.points || 0) + currentAwardedPoints,
          comments: [
            ...currentComments,
            {
              id: `${Date.now()}`,
              author: "Chaiwat T.",
              avatarText: "C",
              text,
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
  }, [getLinkedFeedEvent, safetyCultureEvent]);

  const updateSafetyCultureEvent = useCallback((data: SafetyCultureEventConfig) => {
    setSafetyCultureEvent(data);
  }, []);

  const updateFeedEvents = useCallback((events: SafetyCultureFeedEvent[]) => {
    setFeedEvents(normalizeFeedEvents(events));
  }, []);

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

    return true;
  }, [feedEvents]);

  const updateTeamStandings = useCallback((teams: LeaderboardTeam[]) => {
    setTeamStandings(normalizeTeamStandings(teams));
  }, []);

  const updatePersonalRankings = useCallback((rankings: LeaderboardPerson[]) => {
    setPersonalRankings(normalizePersonalRankings(rankings));
  }, []);

  const updateRewardsCatalog = useCallback((rewards: RewardCatalogItem[]) => {
    setRewardsCatalog(normalizeRewardsCatalog(rewards));
  }, []);

  const updateRewardCategories = useCallback((categories: RewardCategory[]) => {
    setRewardCategories(normalizeRewardCategories(categories));
  }, []);

  const updateAwarenessQuestions = useCallback((questions: SafetyAwarenessQuestion[]) => {
    setAwarenessQuestions(normalizeAwarenessQuestions(questions));
  }, []);

  const updateAwarenessHolidays = useCallback((holidays: AwarenessHoliday[]) => {
    setAwarenessHolidays(
      holidays
        .filter((holiday) => holiday.date && holiday.name.trim())
        .map((holiday) => ({ date: holiday.date, name: holiday.name.trim() }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    );
  }, []);

  const markAwarenessDone = useCallback((completion: Omit<AwarenessCompletion, "date" | "completedAt">) => {
    const date = todayKey();
    setAwarenessDoneDate(date);
    setAwarenessHistory((current) => [
      ...current.filter((item) => item.date !== date),
      { ...completion, date, completedAt: new Date().toISOString() },
    ]);
  }, []);

  const redeemPoints = useCallback(
    (rewardId: number, points: number) => {
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
            redeemedBy: DEFAULT_CURRENT_USER_NAME,
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
            postAuthor: DEFAULT_CURRENT_USER_NAME,
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
    toggleLike,
    addComment,
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

