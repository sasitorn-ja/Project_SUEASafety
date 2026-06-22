export const SAFETY_CULTURE_CATEGORIES = [
  "ทั้งหมด",
  "ทีมของฉัน",
  "ทั่วไป",
  "KYT",
  "PPE",
  "Line Walk",
  "5S",
  "เคล็ดลับ",
] as const;

export type TeamStanding = {
  rank: number;
  name: string;
  members: number;
  color: string;
  points: number;
  percent: number;
};

export type PersonalRanking = {
  rank: string;
  name: string;
  points: number;
  active?: boolean;
};

export type RewardCategoryIcon = "ticket" | "gift" | "shield" | "users" | "heart" | "wrench" | "sparkles" | "shopping";

export type RewardCategoryConfig = {
  value: string;
  label: string;
  hint: string;
  icon: RewardCategoryIcon;
};

export type RewardItem = {
  id: number;
  name: string;
  category: string;
  description: string;
  imageText: string;
  imageSrc?: string | null;
  points: number;
  isHot?: boolean;
  redeemStartAt?: string | null;
  redeemEndAt?: string | null;
  stockMode?: "limited" | "unlimited";
  stockTotal?: number | null;
  stockRemaining?: number | null;
};

export const DEFAULT_REWARD_CATEGORIES: RewardCategoryConfig[] = [
  { value: "voucher", label: "บัตรของขวัญ", hint: "e-voucher, cinema, shopping", icon: "ticket" },
  { value: "merch", label: "สินค้า", hint: "merchandise และของพรีเมียม", icon: "gift" },
  { value: "ppe", label: "PPE", hint: "อุปกรณ์เซฟตี้และของใช้หน้างาน", icon: "shield" },
  { value: "team", label: "ของรางวัลทีม", hint: "รางวัลสำหรับทีมและกิจกรรมร่วมกัน", icon: "users" },
] as const;

export const TEAM_STANDINGS: TeamStanding[] = [];

export const PERSONAL_RANKINGS: PersonalRanking[] = [];

export const COMMENT_REACTION_CHOICES = [
  { id: "like", icon: "👍", label: "ถูกใจ" },
  { id: "love", icon: "❤️", label: "รักเลย" },
  { id: "care", icon: "🤗", label: "ห่วงใย" },
  { id: "wow", icon: "😮", label: "ว้าว" },
  { id: "useful", icon: "🙏", label: "มีประโยชน์" },
] as const;

export const REWARDS_LIST: RewardItem[] = [];

export const REWARD_TAGS = ["ทั้งหมด", "บัตรของขวัญ", "สินค้า", "PPE", "ของขวัญทีม"] as const;

export function formatRelativeTime(createdAt?: number) {
  if (!createdAt) return null;

  const elapsedMinutes = Math.floor(Math.max(0, Date.now() - createdAt) / 60000);
  if (elapsedMinutes < 1) return "เมื่อสักครู่";
  if (elapsedMinutes < 60) return `${elapsedMinutes} นาที`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} ชม.`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} วัน`;
}

const THAI_DATE_TIME_FORMATTER =
  typeof Intl !== "undefined"
    ? new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Bangkok",
      })
    : null;

// Absolute date + time in Thai (Buddhist era), e.g. "22 มิ.ย. 2569 14:30 น."
export function formatThaiDateTime(createdAt?: number) {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;

  if (THAI_DATE_TIME_FORMATTER) {
    return `${THAI_DATE_TIME_FORMATTER.format(date)} น.`;
  }

  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getDate()}/${pad(date.getMonth() + 1)}/${date.getFullYear() + 543} ${pad(date.getHours())}:${pad(date.getMinutes())} น.`;
}

export function formatPostSubtext(post: {
  subtext: string;
  createdAt?: number;
  location?: string;
  team?: string;
}) {
  const dateTime = formatThaiDateTime(post.createdAt);
  if (!dateTime) return post.subtext;

  const parts = (post.subtext || "").split(/\s*·\s*/);
  const location = post.location || parts[0] || "BPI-04";
  const team = post.team || parts[2] || "Yellow";
  return `${location} · ${dateTime} · ${team}`;
}
