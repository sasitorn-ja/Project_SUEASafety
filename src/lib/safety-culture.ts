export const SAFETY_CULTURE_CATEGORIES = [
  "ทั้งหมด",
  "ทีมของฉัน",
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

export const TEAM_STANDINGS: TeamStanding[] = [
  { rank: 1, name: "Other", members: 126, color: "#6FC24D", points: 84200, percent: 100 },
  { rank: 2, name: "SSB", members: 98, color: "#F46A3D", points: 81480, percent: 96.8 },
  { rank: 3, name: "RMC South", members: 142, color: "#7AC4F4", points: 78920, percent: 93.7 },
  { rank: 4, name: "RMC West", members: 135, color: "#F8E46A", points: 76040, percent: 90.3 },
  { rank: 5, name: "RMC East", members: 131, color: "#3D47BE", points: 73410, percent: 87.2 },
  { rank: 6, name: "RMC Northeast", members: 117, color: "#4A352C", points: 70580, percent: 83.8 },
  { rank: 7, name: "RMC North", members: 124, color: "#D73D37", points: 68160, percent: 80.9 },
  { rank: 8, name: "RMC Metro", members: 110, color: "#D0D0D0", points: 65220, percent: 77.5 },
] as const;

export const PERSONAL_RANKINGS: PersonalRanking[] = [
  { rank: "#1", name: "Nattaya K.", points: 412 },
  { rank: "#2", name: "Anand T.", points: 388 },
  { rank: "#3", name: "Arisara P.", points: 342 },
  { rank: "#8", name: "Chaiwat T. (คุณ)", points: 254, active: true },
] as const;

export const COMMENT_REACTION_CHOICES = [
  { id: "like", icon: "👍", label: "ถูกใจ" },
  { id: "love", icon: "❤️", label: "รักเลย" },
  { id: "care", icon: "🤗", label: "ห่วงใย" },
  { id: "wow", icon: "😮", label: "ว้าว" },
  { id: "useful", icon: "🙏", label: "มีประโยชน์" },
] as const;

export const REWARDS_LIST: RewardItem[] = [
  {
    id: 1,
    name: "บัตร Tesco Lotus",
    category: "voucher",
    description: "บัตรของขวัญสำหรับใช้ซื้อสินค้าอุปโภคบริโภคในสาขาที่ร่วมรายการ",
    imageText: "// voucher",
    imageSrc: null,
    points: 500,
  },
  {
    id: 2,
    name: "ผ้าขนหนู Safety",
    category: "merch",
    description: "ของที่ระลึกสำหรับพนักงาน เนื้อผ้านุ่ม ใช้งานได้ทุกวัน",
    imageText: "// merch",
    imageSrc: null,
    points: 320,
  },
  {
    id: 3,
    name: "หมวกกันน็อก premium",
    category: "ppe",
    description: "หมวกเซฟตี้รุ่นพรีเมียมสำหรับใช้งานภาคสนาม พร้อมมาตรฐานความปลอดภัย",
    imageText: "// ppe",
    imageSrc: null,
    points: 1200,
    isHot: true,
  },
  {
    id: 4,
    name: "เสื้อ Safety Cup",
    category: "merch",
    description: "เสื้อกิจกรรมลายพิเศษสำหรับทีม Safety Culture collection",
    imageText: "// merch",
    imageSrc: null,
    points: 850,
  },
  {
    id: 5,
    name: "ตั๋วหนัง SF - 1 ที่นั่ง",
    category: "voucher",
    description: "สิทธิ์แลกตั๋วภาพยนตร์ 1 ที่นั่ง สำหรับสาขาที่ร่วมรายการ",
    imageText: "// voucher",
    imageSrc: null,
    points: 350,
  },
  {
    id: 6,
    name: "ชุดบะหมี่กิ๊ฟทีม",
    category: "team",
    description: "ของรางวัลแบบทีมสำหรับใช้ในกิจกรรมหรือ celebration ภายในหน่วยงาน",
    imageText: "// team",
    imageSrc: null,
    points: 6000,
  },
] as const;

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

export function formatPostSubtext(post: {
  subtext: string;
  createdAt?: number;
  location?: string;
  team?: string;
}) {
  const relativeTime = formatRelativeTime(post.createdAt);
  if (!relativeTime) return post.subtext;

  const parts = (post.subtext || "").split(/\s*·\s*/);
  const location = post.location || parts[0] || "BPI-04";
  const team = post.team || parts[2] || "Yellow";
  return `${location} · ${relativeTime} · ${team}`;
}
