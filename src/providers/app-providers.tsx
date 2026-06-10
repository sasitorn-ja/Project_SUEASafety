"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { PERSONAL_RANKINGS, REWARDS_LIST, TEAM_STANDINGS, type RewardItem } from "@/lib/safety-culture";

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
};

export type NotificationType = {
  message: string;
  type: "sos" | "info" | "success";
} | null;

export type SafetyCultureEventStatus = "draft" | "scheduled" | "live" | "paused";
export type SafetyCultureBonusMode = "multiplier" | "fixed";
export type SafetyCultureEventAction = "approved-post" | "comment" | "reaction" | "theme-post";

export type SafetyCultureEventConfig = {
  eventName: string;
  eventCode: string;
  headline: string;
  supportingText: string;
  bannerNote: string;
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

type AppState = {
  completedSteps: number[];
  healthData: HealthData;
  kytData: KytData;
  preTripData: PreTripData;
  queueConfirmed: boolean;
  sosData: SosData;
  posts: Post[];
  notification: NotificationType;
  currentUserPoints: number;
  safetyCultureEvent: SafetyCultureEventConfig;
  teamStandings: LeaderboardTeam[];
  personalRankings: LeaderboardPerson[];
  rewardsCatalog: RewardCatalogItem[];
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
  addPost: (post: Post) => void;
  toggleLike: (postId: number) => void;
  addComment: (postId: number, text: string) => void;
  updateSafetyCultureEvent: (data: SafetyCultureEventConfig) => void;
  updateTeamStandings: (teams: LeaderboardTeam[]) => void;
  updatePersonalRankings: (rankings: LeaderboardPerson[]) => void;
  updateRewardsCatalog: (rewards: RewardCatalogItem[]) => void;
  redeemPoints: (points: number) => boolean;
};

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppActionsContext = createContext<AppActions | undefined>(undefined);

const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    author: "Nattaya K.",
    avatarBg: "#F5BB00",
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
    avatarBg: "#F5BB00",
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
];

const STORAGE_KEYS = {
  posts: "safety-hub:safety-culture-posts",
  event: "safety-hub:safety-culture-event",
  currentUserPoints: "safety-hub:safety-culture-current-user-points",
  teamStandings: "safety-hub:safety-culture-team-standings",
  personalRankings: "safety-hub:safety-culture-personal-rankings",
  rewardsCatalog: "safety-hub:safety-culture-rewards-catalog",
} as const;

const INITIAL_CURRENT_USER_POINTS = 254;

const DEFAULT_SAFETY_CULTURE_EVENT: SafetyCultureEventConfig = {
  eventName: "Happy Hour Bonus",
  eventCode: "SC-HAPPY-HOUR-001",
  headline: "Happy Hour Bonus x1.5",
  supportingText: "แชร์เรื่องความปลอดภัยช่วง 14:00 - 16:00 แล้วรับคะแนนคูณเพิ่มทันที",
  bannerNote: "เน้นกิจกรรมโพสต์ดีๆ ระหว่างกะบ่าย เพื่อดึงคนกลับเข้ามาใช้งานอีกครั้ง",
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

function normalizeStoredSafetyCultureEvent(parsedEvent: Partial<SafetyCultureEventConfig>) {
  const defaultEvent = createDefaultSafetyCultureEvent();
  const mergedEvent = { ...defaultEvent, ...parsedEvent };
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

function normalizeRewardsCatalog(rewards: RewardCatalogItem[]) {
  return rewards.map((reward, index) => ({
    id: Math.max(1, Number(reward.id) || index + 1),
    name: reward.name || `Reward ${index + 1}`,
    category: reward.category || "merch",
    description: reward.description || "Reward description",
    imageText: reward.imageText || "// merch",
    imageSrc: reward.imageSrc ?? null,
    points: Math.max(0, Number(reward.points) || 0),
    isHot: Boolean(reward.isHot),
  }));
}

function createDefaultRewardsCatalog() {
  return normalizeRewardsCatalog(REWARDS_LIST.map((reward) => ({ ...reward })));
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [healthData, setHealthData] = useState<HealthData>(null);
  const [kytData, setKytData] = useState<KytData>(null);
  const [preTripData, setPreTripData] = useState<PreTripData>(null);
  const [queueConfirmed, setQueueConfirmed] = useState(false);
  const [sosData, setSosData] = useState<SosData>(null);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [notification, setNotification] = useState<NotificationType>(null);
  const [currentUserPoints, setCurrentUserPoints] = useState(INITIAL_CURRENT_USER_POINTS);
  const [safetyCultureEvent, setSafetyCultureEvent] = useState<SafetyCultureEventConfig>(() => createDefaultSafetyCultureEvent());
  const [teamStandings, setTeamStandings] = useState<LeaderboardTeam[]>(() => createDefaultTeamStandings());
  const [personalRankings, setPersonalRankings] = useState<LeaderboardPerson[]>(() => createDefaultPersonalRankings());
  const [rewardsCatalog, setRewardsCatalog] = useState<RewardCatalogItem[]>(() => createDefaultRewardsCatalog());
  const [eventNow, setEventNow] = useState(() => Date.now());

  useEffect(() => {
    try {
      const storedPosts = window.localStorage.getItem(STORAGE_KEYS.posts);
      const storedEvent = window.localStorage.getItem(STORAGE_KEYS.event);
      const storedCurrentUserPoints = window.localStorage.getItem(STORAGE_KEYS.currentUserPoints);
      const storedTeamStandings = window.localStorage.getItem(STORAGE_KEYS.teamStandings);
      const storedPersonalRankings = window.localStorage.getItem(STORAGE_KEYS.personalRankings);
      const storedRewardsCatalog = window.localStorage.getItem(STORAGE_KEYS.rewardsCatalog);

      if (storedPosts) {
        const parsedPosts = JSON.parse(storedPosts) as Post[];
        if (Array.isArray(parsedPosts) && parsedPosts.length > 0) {
          setPosts(parsedPosts);
        }
      }

      if (storedEvent) {
        const parsedEvent = JSON.parse(storedEvent) as Partial<SafetyCultureEventConfig>;
        setSafetyCultureEvent(normalizeStoredSafetyCultureEvent(parsedEvent));
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
    } catch {
      // Ignore invalid persisted data and keep defaults.
    }
  }, []);

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

  const addPost = useCallback((post: Post) => {
    const awardedPoints = calculateAwardedPoints(post.points || 0, "approved-post", safetyCultureEvent);
    const pointsDelta = Math.max(0, awardedPoints);

    setPosts((prev) => [{ ...post, points: awardedPoints }, ...prev]);
    setCurrentUserPoints((prev) => prev + pointsDelta);
  }, [safetyCultureEvent]);

  const toggleLike = useCallback((postId: number) => {
    let currentDelta = 0;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const isAdding = !p.hasLiked;
        const awarded = calculateAwardedPoints(1, "reaction", safetyCultureEvent);
        currentDelta = isAdding ? awarded : -awarded;

        return {
          ...p,
          hasLiked: isAdding,
          likes: isAdding ? p.likes + 1 : Math.max(0, p.likes - 1),
          points: Math.max(0, (p.points || 0) + currentDelta),
        };
      })
    );

    if (currentDelta !== 0) {
      setCurrentUserPoints((prev) => Math.max(0, prev + currentDelta));
    }
  }, [safetyCultureEvent]);

  const addComment = useCallback((postId: number, text: string) => {
    const awardedPoints = calculateAwardedPoints(1, "comment", safetyCultureEvent);

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const currentComments = Array.isArray(p.comments) ? p.comments : [];
        return {
          ...p,
          points: (p.points || 0) + awardedPoints,
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
    setCurrentUserPoints((prev) => prev + awardedPoints);
  }, [safetyCultureEvent]);

  const updateSafetyCultureEvent = useCallback((data: SafetyCultureEventConfig) => {
    setSafetyCultureEvent(data);
  }, []);

  const updateTeamStandings = useCallback((teams: LeaderboardTeam[]) => {
    setTeamStandings(normalizeTeamStandings(teams));
  }, []);

  const updatePersonalRankings = useCallback((rankings: LeaderboardPerson[]) => {
    setPersonalRankings(normalizePersonalRankings(rankings));
  }, []);

  const updateRewardsCatalog = useCallback((rewards: RewardCatalogItem[]) => {
    setRewardsCatalog(normalizeRewardsCatalog(rewards));
  }, []);

  const redeemPoints = useCallback((points: number) => {
    let redeemed = false;

    setCurrentUserPoints((prev) => {
      if (prev < points) return prev;
      redeemed = true;
      return prev - points;
    });

    return redeemed;
  }, []);

  const state: AppState = {
    completedSteps,
    healthData,
    kytData,
    preTripData,
    queueConfirmed,
    sosData,
    posts,
    notification,
    currentUserPoints,
    safetyCultureEvent,
    teamStandings,
    personalRankings,
    rewardsCatalog,
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
    addPost,
    toggleLike,
    addComment,
    updateSafetyCultureEvent,
    updateTeamStandings,
    updatePersonalRankings,
    updateRewardsCatalog,
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
