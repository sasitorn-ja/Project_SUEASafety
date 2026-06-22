"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Clock3,
  HeartPulse,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  Gift,
  GripVertical,
  History,
  ImagePlus,
  ShoppingBag,
  Search,
  Pencil,
  Plus,
  Shield,
  Sparkles,
  Star,
  Ticket,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import { DEFAULT_REWARD_CATEGORIES, type RewardCategoryIcon } from "@/lib/safety-culture";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type RewardCatalogItem, type RewardCategory, useAppActions, useAppState } from "@/providers/app-providers";
import { useAppTheme } from "@/providers/theme-provider";

type RewardEditorState = {
  mode: "create" | "edit";
  id: number;
  name: string;
  category: RewardCatalogItem["category"];
  description: string;
  imageText: string;
  imageSrc: string | null;
  points: number;
  isHot: boolean;
  hasRedeemWindow: boolean;
  redeemStartAt: string;
  redeemEndAt: string;
  stockMode: "limited" | "unlimited";
  stockTotal: number;
  stockRemaining: number;
};

const CATEGORY_ICON_MAP: Record<RewardCategoryIcon, typeof Ticket> = {
  ticket: Ticket,
  gift: Gift,
  shield: Shield,
  users: Users,
  heart: HeartPulse,
  wrench: Wrench,
  sparkles: Sparkles,
  shopping: ShoppingBag,
};

const CATEGORY_ICON_OPTIONS: Array<{
  value: RewardCategoryIcon;
  label: string;
  description: string;
}> = [
  { value: "gift", label: "ทั่วไป", description: "เหมาะกับของรางวัลทั่วไป" },
  { value: "ticket", label: "บัตร", description: "คูปอง ตั๋ว หรือ voucher" },
  { value: "shield", label: "ความปลอดภัย", description: "PPE อุปกรณ์เซฟตี้" },
  { value: "users", label: "ทีม", description: "ของรางวัลแบบทีม" },
  { value: "heart", label: "สุขภาพ", description: "wellness และสุขภาพ" },
  { value: "wrench", label: "อุปกรณ์", description: "เครื่องมือ อะไหล่" },
  { value: "sparkles", label: "พิเศษ", description: "limited หรือ campaign" },
  { value: "shopping", label: "สินค้า", description: "สินค้าทั่วไปและช้อปปิง" },
];

function SectionCard({
  title,
  description,
  icon,
  actions,
  children,
  className,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] p-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)] md:p-4",
        className
      )}
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-[18px] font-black text-[#1A1A1A]">{title}</h2>
            <p className="text-[13px] font-bold leading-relaxed text-[#8E8A81]">{description}</p>
          </div>
        </div>
        {actions ? <div className="lg:pt-1">{actions}</div> : null}
      </div>
      {children}
    </Card>
  );
}

function createRewardEditor(reward: RewardCatalogItem): RewardEditorState {
  return {
    mode: "edit",
    id: reward.id,
    name: reward.name,
    category: reward.category,
    description: reward.description,
    imageText: reward.imageText,
    imageSrc: reward.imageSrc ?? null,
    points: reward.points,
    isHot: Boolean(reward.isHot),
    hasRedeemWindow: Boolean(reward.redeemStartAt || reward.redeemEndAt),
    redeemStartAt: reward.redeemStartAt ?? "",
    redeemEndAt: reward.redeemEndAt ?? "",
    stockMode: reward.stockMode === "limited" ? "limited" : "unlimited",
    stockTotal: Math.max(0, Number(reward.stockTotal) || 0),
    stockRemaining:
      reward.stockMode === "limited"
        ? Math.max(0, Number.isNaN(Number(reward.stockRemaining)) ? Number(reward.stockTotal) || 0 : Number(reward.stockRemaining))
        : 0,
  };
}

function makeRewardDraft(rewards: RewardCatalogItem[]): RewardCatalogItem {
  const nextId = rewards.length > 0 ? Math.max(...rewards.map((reward) => reward.id)) + 1 : 1;

  return {
    id: nextId,
    name: `Reward ${nextId}`,
    category: "merch",
    description: "รายละเอียดรางวัลใหม่",
    imageText: "// merch",
    imageSrc: null,
    points: 100,
    isHot: false,
    redeemStartAt: null,
    redeemEndAt: null,
    stockMode: "unlimited",
    stockTotal: null,
    stockRemaining: null,
  };
}

function makeCategoryValue(label: string) {
  const normalized = label.trim().toLowerCase();
  if (!normalized) return "";

  const latinSlug = normalized
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-\u0E00-\u0E7F]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (latinSlug) return latinSlug;

  return `category-${Date.now()}`;
}

function makeCategoryHint(label: string) {
  return `หมวดหมู่ ${label.trim()} ที่สร้างเพิ่มโดยผู้ดูแล`;
}

function mergeCategoryOptions(categories: RewardCategory[], rewards: RewardCatalogItem[]): RewardCategory[] {
  const categoryMap = new Map<string, RewardCategory>();

  categories.forEach((category) => {
    categoryMap.set(category.value, category);
  });

  rewards.forEach((reward) => {
    if (!reward.category || categoryMap.has(reward.category)) return;
    categoryMap.set(reward.category, {
      value: reward.category,
      label: reward.category,
      hint: "Recovered from existing reward data",
      icon: "gift",
    });
  });

  return Array.from(categoryMap.values());
}

function normalizeCategorySearchText(value: string) {
  return value.trim().toLowerCase();
}

function getCategoryMeta(category: RewardCatalogItem["category"], categories: RewardCategory[]) {
  return (
    categories.find((option) => option.value === category) ??
    DEFAULT_REWARD_CATEGORIES.find((option) => option.value === "merch") ?? {
      value: "merch",
      label: "สินค้า",
      hint: "merchandise และของพรีเมียม",
      icon: "gift" as const,
    }
  );
}

function formatRewardDateTime(value?: string | null) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function getRewardScheduleLabel(reward: {
  hasRedeemWindow?: boolean;
  redeemStartAt?: string | null;
  redeemEndAt?: string | null;
}) {
  if (!reward.hasRedeemWindow || (!reward.redeemStartAt && !reward.redeemEndAt)) {
    return "แลกได้ตลอดเวลา";
  }

  const startLabel = formatRewardDateTime(reward.redeemStartAt);
  const endLabel = formatRewardDateTime(reward.redeemEndAt);

  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`;
  if (startLabel) return `เริ่มแลก ${startLabel}`;
  if (endLabel) return `แลกได้ถึง ${endLabel}`;
  return "แลกได้ตลอดเวลา";
}

function getRewardStockLabel(reward: {
  stockMode?: "limited" | "unlimited";
  stockTotal?: number | null;
  stockRemaining?: number | null;
}) {
  if (reward.stockMode !== "limited") return "ไม่จำกัดจำนวน";

  const total = Math.max(0, Number(reward.stockTotal) || 0);
  const remaining = Math.max(0, Number(reward.stockRemaining) || 0);
  return `คงเหลือ ${remaining}/${total}`;
}

function getRewardRemainingOnlyLabel(reward: {
  stockMode?: "limited" | "unlimited";
  stockRemaining?: number | null;
}) {
  if (reward.stockMode !== "limited") return "พร้อมใช้งาน";

  const remaining = Math.max(0, Number(reward.stockRemaining) || 0);
  return `คงเหลือ ${remaining} ชิ้น`;
}

function formatRedemptionDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function RewardImage({
  reward,
  className,
}: {
  reward: Pick<RewardCatalogItem, "name" | "imageSrc" | "imageText" | "isHot">;
  className?: string;
}) {
  const { themedImage } = useAppTheme();
  return (
    <div
      className={cn(
        "relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--brand-image-placeholder)]",
        className
      )}
    >
      {reward.isHot ? (
        <span className="absolute top-3 left-3 z-10 rounded-full bg-[#d9383a] px-2.5 py-1 text-[10px] font-black text-white">
          HOT
        </span>
      ) : null}
      {reward.imageSrc ? (
        <Image src={themedImage(reward.imageSrc)} alt={reward.name} fill sizes="(max-width: 768px) 50vw, 220px" className="object-cover" />
      ) : (
        <span className="px-4 text-center text-[13px] font-extrabold lowercase tracking-[0.02em] text-[#8E8A81]">
          {reward.imageText}
        </span>
      )}
    </div>
  );
}

function RewardPreviewPanelLegacy({
  reward,
  categories,
  layout = "split",
}: {
  reward: RewardEditorState;
  categories: RewardCategory[];
  layout?: "split" | "stacked";
}) {
  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[linear-gradient(135deg,var(--brand-soft)_0%,var(--brand-surface)_100%)] p-4 shadow-[0_10px_24px_var(--brand-shadow)] sm:p-4">
      <div className={cn("grid gap-4", layout === "split" ? "lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-5" : "grid-cols-1")}>
        <RewardImage reward={reward} className="min-h-[220px]" />

        <div className="min-w-0 rounded-[18px] border border-[var(--border)] bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] sm:p-4">
          <div className="flex h-full min-w-0 flex-col gap-4 lg:min-h-[220px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--brand-text)]">
              Public Preview
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--brand-soft)] px-3 py-1 text-[12px] font-black text-[var(--c-6f665b)]">
              {getCategoryMeta(reward.category, categories).label}
            </span>
            {reward.isHot ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#f1c6c6] bg-[#fff3f3] px-3 py-1 text-[12px] font-black text-[#c03c3c]">
                <Star className="h-3.5 w-3.5 fill-current" />
                HOT
              </span>
            ) : null}
          </div>

            <div className="min-w-0">
              <div className="line-clamp-2 text-[28px] font-black leading-[0.92] text-[#1A1A1A] [overflow-wrap:anywhere] sm:text-[34px]">
              {reward.name || "Reward name"}
            </div>
              <div className="mt-3 rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] px-4 py-3">
                <p className="line-clamp-6 min-h-[8.1rem] text-[14px] font-bold leading-relaxed text-[var(--c-6f665b)] [overflow-wrap:anywhere] sm:text-[15px]">

              {reward.description || "รายละเอียด reward จะแสดงตรงนี้บนหน้า Rewards"}

                </p>
              </div>
            </div>

            <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-[var(--border)] pt-4">
              <div className="rounded-[16px] border border-[var(--border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(62,36,13,0.04)]">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--brand-accent-strong)]">Points</div>
              <div className="mt-1 text-[30px] font-black leading-none text-[var(--brand-text)]">
                {reward.points.toLocaleString()}
              </div>
            </div>
              <div className="max-w-[250px] text-right text-[12px] font-bold leading-relaxed text-[#8E8A81] sm:text-[13px]">
              เช็กหน้าตา reward card ได้ทันที ทั้งรูป ชื่อ รายละเอียด และราคา ก่อนกดยืนยัน
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

function RewardPreviewPanel({
  reward,
  categories,
  layout = "split",
}: {
  reward: RewardEditorState;
  categories: RewardCategory[];
  layout?: "split" | "stacked";
}) {
  const { themedImage, mascot } = useAppTheme();
  const previewCard = (
    <Card className="relative flex flex-col gap-3 rounded-[16px] border-[var(--border)] bg-[var(--brand-surface)] p-3.5 shadow-[0_4px_10px_rgba(0,0,0,0.01)]">
      {reward.isHot ? (
        <span className="absolute top-2.5 left-2.5 z-10 rounded-md bg-[#D9383A] px-2 py-0.5 text-[9.5px] font-black tracking-wide text-white shadow-[0_2px_6px_rgba(217,56,58,0.25)]">
          HOT
        </span>
      ) : null}

      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[14px] border-[1.5px] border-[var(--border)] bg-[var(--brand-image-placeholder)]">
        {reward.imageSrc ? (
          <Image src={themedImage(reward.imageSrc)} alt={reward.name} fill sizes="(max-width: 768px) 50vw, 220px" className="object-cover" />
        ) : reward.isHot ? (
          <Image
            src={mascot("saluteAlt")}
            alt="SUEA reward"
            fill
            sizes="(max-width: 768px) 50vw, 220px"
            className="object-cover"
          />
        ) : (
          <span className="text-[13px] font-extrabold lowercase text-[#8E8A81]">{reward.imageText}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <span className="line-clamp-2 text-[14.5px] font-[850] text-foreground [overflow-wrap:anywhere]">
          {reward.name}
        </span>
        <p className="line-clamp-2 text-[12.5px] font-bold leading-relaxed text-[#7d766b] [overflow-wrap:anywhere]">
          {reward.description}
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[11px] font-black text-[var(--brand-text)]">
            {getRewardRemainingOnlyLabel(reward)}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-[11px] font-black text-[#8E8A81]">
            {getRewardScheduleLabel(reward)}
          </span>
        </div>
        <span className="pt-1 text-[12.5px] font-extrabold text-[var(--brand-accent-strong)]">
          {reward.points.toLocaleString()} <span className="ml-0.5 text-[10px] font-bold text-muted-foreground">POINTS</span>
        </span>
      </div>

      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--secondary)] py-2.5 text-center text-[13px] font-[850] text-[var(--c-a39e92)]"
      >
        ยังไม่พอ
      </button>
    </Card>
  );

  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[linear-gradient(135deg,var(--brand-soft)_0%,var(--brand-surface)_100%)] p-4 shadow-[0_10px_24px_var(--brand-shadow)] sm:p-4">
      {layout === "split" ? <div className="mx-auto w-full max-w-[360px]">{previewCard}</div> : previewCard}
    </div>
  );
}

function DetailCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[16px] border border-[var(--border)] bg-white p-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)] sm:p-4", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[14px] font-black text-[#1A1A1A]">{title}</div>
        {subtitle ? <div className="text-[12px] font-bold text-[#8E8A81]">{subtitle}</div> : null}
      </div>
      {children}
    </div>
  );
}

function CategorySummaryCard({
  item,
  isRecentlyAdded,
  onRemove,
}: {
  item: RewardCategory & { count: number };
  isRecentlyAdded: boolean;
  onRemove: (item: RewardCategory & { count: number }) => void;
}) {
  const Icon = CATEGORY_ICON_MAP[item.icon];

  return (
    <div
      className={cn(
        "rounded-[18px] border bg-white p-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)] transition-colors",
        isRecentlyAdded ? "border-[var(--brand-accent)] bg-[var(--brand-soft)]" : "border-[var(--border)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
            <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-black text-[#1A1A1A]">{item.label}</div>
            <div className="mt-1 line-clamp-2 text-[12px] font-bold leading-relaxed text-[#8E8A81]">{item.hint}</div>
            {isRecentlyAdded ? (
              <div className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[var(--brand-accent-strong)]">
                เพิ่มล่าสุด
              </div>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
            item.count > 0
              ? "border-[var(--border)] bg-[var(--brand-soft)] text-[#b4aea3] hover:bg-white"
              : "border-[#f1caca] bg-white text-[#ef544d] hover:bg-[#fff4f4] hover:text-[#d63b35]"
          )}
          aria-label={`ลบหมวด ${item.label}`}
        >
          <Trash2 className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[12px] font-black text-[var(--brand-text)]">
          {item.count} items
        </div>
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--brand-accent-strong)]">Category</div>
      </div>
    </div>
  );
}

export default function AdminRewardPage() {
  const { rewardsCatalog, rewardCategories, rewardRedemptions } = useAppState();
  const { updateRewardsCatalog, updateRewardCategories } = useAppActions();

  const [draftRewards, setDraftRewards] = useState<RewardCatalogItem[]>(rewardsCatalog);
  const [draftCategories, setDraftCategories] = useState<RewardCategory[]>(rewardCategories);
  const [rewardSaveState, setRewardSaveState] = useState<"idle" | "saved">("idle");
  const [categoryNotice, setCategoryNotice] = useState<string | null>(null);
  const [recentCategoryValue, setRecentCategoryValue] = useState<string | null>(null);
  const [editingReward, setEditingReward] = useState<RewardEditorState | null>(null);
  const [deletingReward, setDeletingReward] = useState<RewardCatalogItem | null>(null);
  const [pendingCategoryDelete, setPendingCategoryDelete] = useState<(RewardCategory & { count: number }) | null>(null);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState<RewardCategoryIcon>("gift");
  const [isCategoryIconMenuOpen, setIsCategoryIconMenuOpen] = useState(false);
  const [isCategoryManagerExpanded, setIsCategoryManagerExpanded] = useState(false);
  const [activeAdminCategory, setActiveAdminCategory] = useState("all");
  const [categorySearch, setCategorySearch] = useState("");
  const [rewardCatalogSearch, setRewardCatalogSearch] = useState("");
  const [rewardSortOrder, setRewardSortOrder] = useState<"latest" | "points-desc" | "points-asc" | "stock-desc">("latest");
  const [isRewardSortOpen, setIsRewardSortOpen] = useState(false);
  const [categoryPickerSearch, setCategoryPickerSearch] = useState("");
  const [pressedRewardId, setPressedRewardId] = useState<number | null>(null);
  const [draggingRewardId, setDraggingRewardId] = useState<number | null>(null);
  const [dragOverRewardId, setDragOverRewardId] = useState<number | null>(null);
  const [isRedemptionLogOpen, setIsRedemptionLogOpen] = useState(false);
  const [redemptionSearch, setRedemptionSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraftRewards(rewardsCatalog);
  }, [rewardsCatalog]);

  useEffect(() => {
    setDraftCategories(rewardCategories);
  }, [rewardCategories]);

  useEffect(() => {
    setCategoryPickerSearch("");
  }, [editingReward?.id]);

  const categoryOptions = useMemo(
    () => mergeCategoryOptions(draftCategories, draftRewards),
    [draftCategories, draftRewards]
  );

  const categorySummary = useMemo(
    () =>
      categoryOptions.map((option) => ({
        ...option,
        count: draftRewards.filter((reward) => reward.category === option.value).length,
      })),
    [categoryOptions, draftRewards]
  );

  const filteredCategorySummary = useMemo(() => {
    const keyword = normalizeCategorySearchText(categorySearch);
    if (!keyword) return categorySummary;

    return categorySummary.filter((item) => {
      const haystack = normalizeCategorySearchText(`${item.label} ${item.hint} ${item.value}`);
      return haystack.includes(keyword);
    });
  }, [categorySearch, categorySummary]);

  const usedCategorySummary = useMemo(
    () => filteredCategorySummary.filter((item) => item.count > 0),
    [filteredCategorySummary]
  );

  const emptyCategorySummary = useMemo(
    () => filteredCategorySummary.filter((item) => item.count === 0),
    [filteredCategorySummary]
  );

  const pickerCategoryOptions = useMemo(() => {
    const keyword = normalizeCategorySearchText(categoryPickerSearch);
    const sorted = [...categorySummary].sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.label.localeCompare(right.label, "th");
    });

    if (!keyword) return sorted;

    return sorted.filter((item) => {
      const haystack = normalizeCategorySearchText(`${item.label} ${item.hint} ${item.value}`);
      return haystack.includes(keyword);
    });
  }, [categoryPickerSearch, categorySummary]);

  const visibleRewards = useMemo(
    () =>
      activeAdminCategory === "all"
        ? draftRewards
        : draftRewards.filter((reward) => reward.category === activeAdminCategory),
    [activeAdminCategory, draftRewards]
  );

  const filteredVisibleRewards = useMemo(() => {
    const keyword = normalizeCategorySearchText(rewardCatalogSearch);
    if (!keyword) return visibleRewards;

    return visibleRewards.filter((reward) => {
      const category = getCategoryMeta(reward.category, categoryOptions);
      const haystack = normalizeCategorySearchText(`${reward.name} ${reward.description} ${category.label} ${reward.imageText}`);
      return haystack.includes(keyword);
    });
  }, [categoryOptions, rewardCatalogSearch, visibleRewards]);

  const rewardOrderMap = useMemo(
    () => new Map(draftRewards.map((reward, index) => [reward.id, index])),
    [draftRewards]
  );

  const displayedRewards = useMemo(() => {
    const rewards = [...filteredVisibleRewards];
    if (rewardSortOrder === "points-desc") {
      rewards.sort((left, right) => right.points - left.points || (rewardOrderMap.get(left.id) ?? 0) - (rewardOrderMap.get(right.id) ?? 0));
    } else if (rewardSortOrder === "points-asc") {
      rewards.sort((left, right) => left.points - right.points || (rewardOrderMap.get(left.id) ?? 0) - (rewardOrderMap.get(right.id) ?? 0));
    } else if (rewardSortOrder === "stock-desc") {
      rewards.sort(
        (left, right) =>
          (Number(right.stockRemaining) || 0) - (Number(left.stockRemaining) || 0) ||
          (rewardOrderMap.get(left.id) ?? 0) - (rewardOrderMap.get(right.id) ?? 0)
      );
    }

    return rewards;
  }, [filteredVisibleRewards, rewardSortOrder, rewardOrderMap]);

  const rewardSortLabel =
    rewardSortOrder === "points-desc"
      ? "คะแนนมากสุด"
      : rewardSortOrder === "points-asc"
        ? "คะแนนน้อยสุด"
        : rewardSortOrder === "stock-desc"
          ? "คงเหลือมากสุด"
          : "ล่าสุด";

  const filteredRewardRedemptions = useMemo(() => {
    const keyword = normalizeCategorySearchText(redemptionSearch);
    if (!keyword) return rewardRedemptions;

    return rewardRedemptions.filter((item) => normalizeCategorySearchText(item.redeemedBy).includes(keyword));
  }, [redemptionSearch, rewardRedemptions]);

  const rewardRedemptionSummary = useMemo(() => {
    const rewardNameMap = new Map(draftRewards.map((reward) => [reward.id, reward.name]));
    const totalRedeemed = filteredRewardRedemptions.length;
    const totalPointsSpent = filteredRewardRedemptions.reduce((sum, item) => sum + item.pointsSpent, 0);
    const uniqueRedeemers = new Set(filteredRewardRedemptions.map((item) => item.redeemedBy)).size;
    const topRewards = Array.from(
      filteredRewardRedemptions.reduce((map, item) => {
        const current = map.get(item.rewardId) ?? {
          rewardId: item.rewardId,
          rewardName: rewardNameMap.get(item.rewardId) || item.rewardName,
          count: 0,
        };
        current.count += 1;
        map.set(item.rewardId, current);
        return map;
      }, new Map<number, { rewardId: number; rewardName: string; count: number }>())
    )
      .map(([, value]) => value)
      .sort((left, right) => right.count - left.count || left.rewardName.localeCompare(right.rewardName, "th"))
      .slice(0, 5);

    return {
      totalRedeemed,
      totalPointsSpent,
      uniqueRedeemers,
      topRewards,
    };
  }, [draftRewards, filteredRewardRedemptions]);

  const rewardsInPendingCategory = useMemo(() => {
    if (!pendingCategoryDelete) return [];
    return draftRewards.filter((reward) => reward.category === pendingCategoryDelete.value);
  }, [draftRewards, pendingCategoryDelete]);

  const commitRewards = async (rewards: RewardCatalogItem[]) => {
    const saved = await updateRewardsCatalog(rewards);
    if (!saved) {
      window.alert("บันทึกรางวัลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return false;
    }
    setRewardSaveState("saved");
    return true;
  };

  const commitCategories = async (categories: RewardCategory[]) => {
    const saved = await updateRewardCategories(categories);
    if (!saved) {
      window.alert("บันทึกหมวดหมู่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return false;
    }
    return true;
  };

  const addReward = () => {
    const nextReward = makeRewardDraft(draftRewards);
    const preferredCategory =
      activeAdminCategory !== "all" && categoryOptions.some((category) => category.value === activeAdminCategory)
        ? activeAdminCategory
        : categoryOptions[0]?.value ?? "merch";

    setEditingReward({
      ...createRewardEditor(nextReward),
      category: preferredCategory,
      mode: "create",
    });
    setRewardSaveState("idle");
  };

  const openEditReward = (reward: RewardCatalogItem) => {
    setEditingReward(createRewardEditor(reward));
    setRewardSaveState("idle");
  };

  const confirmRewardEdit = async () => {
    if (!editingReward) return;

    const payload: RewardCatalogItem = {
      id: editingReward.id,
      name: editingReward.name,
      category: editingReward.category,
      description: editingReward.description,
      imageText: editingReward.imageText,
      imageSrc: editingReward.imageSrc,
      points: Math.max(0, Number(editingReward.points) || 0),
      isHot: editingReward.isHot,
      redeemStartAt: editingReward.hasRedeemWindow ? editingReward.redeemStartAt || null : null,
      redeemEndAt: editingReward.hasRedeemWindow ? editingReward.redeemEndAt || null : null,
      stockMode: editingReward.stockMode,
      stockTotal: editingReward.stockMode === "limited" ? Math.max(0, Number(editingReward.stockTotal) || 0) : null,
      stockRemaining:
        editingReward.stockMode === "limited"
          ? Math.min(
              Math.max(0, Number(editingReward.stockTotal) || 0),
              Math.max(0, Number(editingReward.stockRemaining) || 0)
            )
          : null,
    };

    const saved = editingReward.mode === "create"
      ? await commitRewards([payload, ...draftRewards])
      : await commitRewards(draftRewards.map((reward) => (reward.id === editingReward.id ? payload : reward)));
    if (saved) setEditingReward(null);
  };

  const confirmDeleteReward = async () => {
    if (!deletingReward) return;
    if (await commitRewards(draftRewards.filter((reward) => reward.id !== deletingReward.id))) setDeletingReward(null);
  };

  const updateEditingReward = <K extends keyof RewardEditorState>(key: K, value: RewardEditorState[K]) => {
    setEditingReward((current) => (current ? { ...current, [key]: value } : current));
  };

  const updateEditingRewardStockMode = (mode: RewardEditorState["stockMode"]) => {
    setEditingReward((current) => {
      if (!current) return current;
      if (mode === "unlimited") {
        return { ...current, stockMode: mode, stockTotal: 0, stockRemaining: 0 };
      }

      const fallbackTotal = Math.max(1, current.stockTotal || current.stockRemaining || 1);
      const nextRemaining = typeof current.stockRemaining === "number" ? current.stockRemaining : fallbackTotal;
      return {
        ...current,
        stockMode: mode,
        stockTotal: fallbackTotal,
        stockRemaining: Math.min(Math.max(0, nextRemaining), fallbackTotal),
      };
    });
  };

  const updateEditingRewardStockTotal = (value: number) => {
    setEditingReward((current) => {
      if (!current) return current;
      const nextTotal = Math.max(0, value || 0);
      return {
        ...current,
        stockTotal: nextTotal,
        stockRemaining: Math.min(current.stockRemaining, nextTotal),
      };
    });
  };

  const updateEditingRewardStockRemaining = (value: number) => {
    setEditingReward((current) => {
      if (!current) return current;
      const cap = Math.max(0, current.stockTotal || 0);
      return {
        ...current,
        stockRemaining: Math.min(Math.max(0, value || 0), cap),
      };
    });
  };

  const updateEditingRewardAvailableStock = (value: number) => {
    setEditingReward((current) => {
      if (!current) return current;
      const nextRemaining = Math.max(0, value || 0);
      const nextTotal = Math.max(current.stockTotal || 0, nextRemaining);
      return {
        ...current,
        stockTotal: nextTotal,
        stockRemaining: nextRemaining,
      };
    });
  };

  const addCategory = () => {
    const label = newCategoryLabel.trim();
    const value = makeCategoryValue(label);
    if (!label || !value) {
      setCategoryNotice("กรุณากรอกชื่อหมวดหมู่ก่อนเพิ่ม");
      return;
    }

    if (categoryOptions.some((category) => category.value === value)) {
      setCategoryNotice(`มีหมวด ${label} อยู่แล้ว`);
      return;
    }

    commitCategories([
      ...draftCategories,
      {
        value,
        label,
        hint: makeCategoryHint(label),
        icon: newCategoryIcon,
      },
    ]);
    setNewCategoryLabel("");
    setNewCategoryIcon("gift");
    setIsCategoryIconMenuOpen(false);
    setCategorySearch("");
    setRecentCategoryValue(value);
    setCategoryNotice(`เพิ่มหมวด ${label} เรียบร้อยแล้ว`);
  };

  const requestRemoveCategory = (item: RewardCategory & { count: number }) => {
    setPendingCategoryDelete(item);
  };

  const confirmRemoveCategory = () => {
    if (!pendingCategoryDelete) return;

    const { value, label } = pendingCategoryDelete;
    const remainingRewards = draftRewards.filter((reward) => reward.category !== value);
    commitRewards(remainingRewards);
    commitCategories(draftCategories.filter((category) => category.value !== value));
    if (activeAdminCategory === value) {
      setActiveAdminCategory("all");
    }
    setRecentCategoryValue((current) => (current === value ? null : current));
    setCategoryNotice(
      pendingCategoryDelete.count > 0
        ? `ลบหมวด ${label} และ reward ในหมวดนี้ทั้งหมดแล้ว`
        : `ลบหมวด ${label} แล้ว`
    );
    setPendingCategoryDelete(null);
  };

  const handleSelectImage = (file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) return;
      setEditingReward((current) => (current ? { ...current, imageSrc: result } : current));
    };
    reader.readAsDataURL(file);
  };

  const reorderRewards = (sourceId: number, targetId: number) => {
    if (sourceId === targetId) return;

    const sourceIndex = draftRewards.findIndex((reward) => reward.id === sourceId);
    const targetIndex = draftRewards.findIndex((reward) => reward.id === targetId);

    if (sourceIndex < 0 || targetIndex < 0) return;

    const nextRewards = [...draftRewards];
    const [movedReward] = nextRewards.splice(sourceIndex, 1);
    nextRewards.splice(targetIndex, 0, movedReward);
    commitRewards(nextRewards);
  };

  const moveRewardToIndex = (rewardId: number, targetIndex: number) => {
    const sourceIndex = draftRewards.findIndex((reward) => reward.id === rewardId);
    if (sourceIndex < 0) return;

    const boundedTargetIndex = Math.max(0, Math.min(targetIndex, draftRewards.length - 1));
    if (sourceIndex === boundedTargetIndex) return;

    const nextRewards = [...draftRewards];
    const [movedReward] = nextRewards.splice(sourceIndex, 1);
    nextRewards.splice(boundedTargetIndex, 0, movedReward);
    commitRewards(nextRewards);
  };

  const moveRewardByStep = (rewardId: number, step: -1 | 1) => {
    const sourceIndex = rewardOrderMap.get(rewardId);
    if (sourceIndex === undefined) return;
    moveRewardToIndex(rewardId, sourceIndex + step);
  };

  const moveRewardToTop = (rewardId: number) => {
    moveRewardToIndex(rewardId, 0);
  };

  const moveRewardToBottom = (rewardId: number) => {
    moveRewardToIndex(rewardId, draftRewards.length - 1);
  };

  const handleRewardDragStart = (rewardId: number) => {
    setPressedRewardId(null);
    setDraggingRewardId(rewardId);
    setDragOverRewardId(rewardId);
    setRewardSaveState("idle");
  };

  const handleRewardDrop = (targetRewardId: number) => {
    if (draggingRewardId === null) return;
    reorderRewards(draggingRewardId, targetRewardId);
    setDraggingRewardId(null);
    setDragOverRewardId(null);
  };

  const handleRewardDragEnd = () => {
    setPressedRewardId(null);
    setDraggingRewardId(null);
    setDragOverRewardId(null);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[1460px] bg-[var(--background)] px-3.5 pt-0 pb-8 font-sarabun md:px-4 lg:px-5">
        <SafetyCultureHero
          eyebrow="SAFETY CULTURE ADMIN"
          title={
            <>
              จัดการ <span className="text-[var(--brand-accent)]">Rewards</span>
            </>
          }
          description="ออกแบบ reward catalog, รูปภาพ, รายละเอียด และราคา ให้หน้า Rewards ใช้งานง่ายและดูดีขึ้นจากที่เดียว"
          mascotSrc="/images/mascots/suea-mascot.png"
          mascotAlt="SUEA Admin Mascot"
          mascotAction="happyReward"
        />

        <div className="mt-4 flex flex-col gap-4">
          <Card className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--brand-surface)] p-2.5 shadow-[0_10px_24px_var(--brand-shadow)]">
            <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
              {categorySummary.map((item) => {
                const Icon = CATEGORY_ICON_MAP[item.icon];
                return (
                  <div
                    key={item.value}
                    className="flex min-w-[230px] flex-shrink-0 items-center justify-between gap-3 rounded-[16px] border border-[var(--border)] bg-white px-4 py-3 sm:min-w-[250px]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
                        <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-black text-[#1A1A1A]">{item.label}</div>
                        <div className="text-[11px] font-bold text-[#8E8A81]">หมวดหมู่</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[22px] font-black leading-none text-[var(--brand-text)]">{item.count}</div>
                      <div className="mt-1 text-[10px] font-bold text-[#8E8A81]">รายการ</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {rewardSaveState === "saved" ? (
            <div className="flex items-center rounded-[16px] border border-[#bfd7c0] bg-[#f2fff2] px-3 py-2 text-[12px] font-black text-[#245336]">
              บันทึก reward เรียบร้อยแล้ว หน้า Rewards หลักอัปเดตทันที
            </div>
          ) : null}

          <SectionCard
            title="Category Manager"
            description="เพิ่มหมวดหมู่"
            icon={<Users className="h-5 w-5" strokeWidth={2.3} />}
            className="overflow-visible"
            actions={
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCategoryManagerExpanded((current) => !current)}
                className="h-11 rounded-[16px] border-[var(--brand-accent)] bg-white px-4 text-[13px] font-black text-[var(--brand-text)] hover:bg-[var(--brand-soft)]"
              >
                {isCategoryManagerExpanded ? "ซ่อนรายละเอียดหมวดหมู่" : "ดูรายละเอียดหมวดหมู่"}
                <ChevronDown
                  className={cn("ml-2 h-4 w-4 transition-transform", isCategoryManagerExpanded ? "rotate-180" : "")}
                  strokeWidth={2.2}
                />
              </Button>
            }
          >
            <div className="relative overflow-visible rounded-[20px] border border-[var(--border)] bg-[linear-gradient(135deg,var(--brand-surface)_0%,var(--brand-soft)_100%)] p-4">
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div className={cn("relative", isCategoryIconMenuOpen ? "z-40" : "z-10")}>
                  <div className="flex items-center gap-2 rounded-[16px] border border-[var(--border)] bg-white p-1.5">
                    <Input
                      value={newCategoryLabel}
                      onChange={(event) => {
                        setNewCategoryLabel(event.target.value);
                        if (categoryNotice) setCategoryNotice(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCategory();
                        }
                      }}
                      placeholder="เพิ่มหมวดใหม่ เช่น อุปกรณ์กันฝน หรือ สุขภาพ"
                      className="h-10 border-0 bg-transparent px-3 text-[14px] font-bold shadow-none focus-visible:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCategoryIconMenuOpen((current) => !current)}
                      className="flex h-10 min-w-10 items-center justify-center gap-1 rounded-[12px] border border-[var(--border)] bg-[var(--brand-soft)] px-2 text-[var(--brand-text)] transition-colors hover:bg-white"
                      aria-label="เลือกไอคอนหมวดหมู่"
                    >
                      {(() => {
                        const SelectedIcon = CATEGORY_ICON_MAP[newCategoryIcon];
                        return <SelectedIcon className="h-4.5 w-4.5" strokeWidth={2.2} />;
                      })()}
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isCategoryIconMenuOpen ? "rotate-180" : "")} strokeWidth={2.2} />
                    </button>
                  </div>
                  {isCategoryIconMenuOpen ? (
                    <div className="absolute top-[calc(100%+8px)] left-0 z-50 grid w-full grid-cols-4 gap-2 rounded-[16px] border border-[var(--border)] bg-white p-3 shadow-[0_18px_36px_rgba(62,36,13,0.14)] sm:grid-cols-6 xl:grid-cols-8">
                      {CATEGORY_ICON_OPTIONS.map((option) => {
                        const Icon = CATEGORY_ICON_MAP[option.value];
                        const isActive = option.value === newCategoryIcon;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setNewCategoryIcon(option.value);
                              setIsCategoryIconMenuOpen(false);
                            }}
                            className={cn(
                              "flex h-12 items-center justify-center rounded-[12px] border transition-colors",
                              isActive
                                ? "border-[var(--brand-accent)] bg-[var(--brand-soft)] text-[var(--brand-text)]"
                                : "border-[var(--border)] bg-white text-[#8E8A81] hover:bg-[var(--brand-soft)]"
                            )}
                            aria-label={`เลือกไอคอน ${option.label}`}
                            title={option.label}
                          >
                            <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                <Button
                  type="button"
                  onClick={addCategory}
                  className="h-12 rounded-[16px] bg-[var(--brand-accent-strong)] px-5 text-[13px] font-black text-white hover:bg-[var(--brand-accent)]"
                >
                  เพิ่มหมวด
                </Button>
              </div>
              {categoryNotice ? (
                <div className="mt-3 rounded-[14px] border border-[var(--border)] bg-white px-3 py-2 text-[12px] font-black text-[var(--brand-text)]">
                  {categoryNotice}
                </div>
              ) : null}
            </div>

            {isCategoryManagerExpanded ? (
              <>
                <div className="mt-4 flex flex-col gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--brand-soft)] p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="text-[12px] font-black text-[var(--brand-text)]">รายละเอียดหมวดหมู่</div>
                    <div className="relative w-full lg:max-w-[340px]">
                      <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#8E8A81]" />
                      <Input
                        value={categorySearch}
                        onChange={(event) => setCategorySearch(event.target.value)}
                        placeholder="ค้นหาหมวดหมู่"
                        className="h-11 rounded-[14px] border-[var(--border)] bg-white pr-4 pl-10 text-[13px] font-bold"
                      />
                    </div>
                  </div>
                </div>

                {usedCategorySummary.length > 0 ? (
                  <div className="mt-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-[13px] font-black text-[var(--brand-text)]">หมวดที่กำลังใช้งาน</div>
                      <div className="text-[11px] font-bold text-[#8E8A81]">เลื่อนซ้าย-ขวาเพื่อจัดการเร็วขึ้น</div>
                    </div>
                    <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                      {usedCategorySummary.map((item) => (
                        <div key={item.value} className="min-w-[310px] flex-shrink-0 sm:min-w-[340px]">
                          <CategorySummaryCard
                            item={item}
                            isRecentlyAdded={recentCategoryValue === item.value}
                            onRemove={requestRemoveCategory}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {emptyCategorySummary.length > 0 ? (
                  <div className="mt-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[13px] font-black text-[var(--brand-text)]">หมวดที่ยังไม่มี reward</div>
                    </div>
                    <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                      {emptyCategorySummary.map((item) => (
                        <div key={item.value} className="min-w-[310px] flex-shrink-0 sm:min-w-[340px]">
                          <CategorySummaryCard
                            item={item}
                            isRecentlyAdded={recentCategoryValue === item.value}
                            onRemove={requestRemoveCategory}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {filteredCategorySummary.length === 0 ? (
                  <div className="mt-4 rounded-[18px] border border-dashed border-[var(--border)] bg-white px-5 py-8 text-center">
                    <div className="text-[16px] font-black text-[#1A1A1A]">ไม่พบหมวดหมู่ที่ค้นหา</div>
                    <div className="mt-2 text-[13px] font-bold text-[#8E8A81]">ลองค้นหาด้วยชื่อหมวด หรือคำอธิบายอื่น</div>
                  </div>
                ) : null}
              </>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Reward Catalog"
            description="จัดการ rewards"
            icon={<Gift className="h-5 w-5" strokeWidth={2.3} />}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRedemptionLogOpen(true)}
                  className="h-11 rounded-[16px] border-[var(--brand-accent)] bg-white px-4 text-[13px] font-black text-[var(--brand-text)] shadow-[0_8px_18px_rgba(var(--brand-accent-rgb),0.14)] hover:bg-[var(--brand-surface)]"
                >
                  <History className="mr-1.5 h-4 w-4" />
                  ประวัติรางวัล
                </Button>
                <Button
                  onClick={addReward}
                  className="h-11 rounded-xl bg-[var(--brand-accent-strong)] px-5 text-[13px] font-black text-white hover:bg-[var(--brand-accent)]"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  New Reward
                </Button>
              </div>
            }
          >
            <div className="mb-4 rounded-[20px] border border-[var(--border)] bg-[var(--brand-surface)] p-3">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center">
                  <div className="relative w-full xl:max-w-[320px]">
                    <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#8E8A81]" />
                    <Input
                      value={rewardCatalogSearch}
                      onChange={(event) => setRewardCatalogSearch(event.target.value)}
                      placeholder="ค้นหาหมวดหมู่ หรือชื่อรางวัล"
                      className="h-11 rounded-[14px] border-[var(--border)] bg-white pr-4 pl-10 text-[13px] font-bold"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveAdminCategory("all")}
                      className={cn(
                        "flex-shrink-0 rounded-full border px-4 py-2 text-[12px] font-black transition-colors",
                        activeAdminCategory === "all"
                          ? "border-[var(--brand-accent)] bg-[var(--brand-soft)] text-[var(--brand-text)]"
                          : "border-[var(--border)] bg-white text-[#8E8A81] hover:bg-[var(--brand-soft)]"
                      )}
                    >
                      ทั้งหมด
                    </button>
                    {categoryOptions.map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => setActiveAdminCategory(category.value)}
                        className={cn(
                          "flex-shrink-0 rounded-full border px-4 py-2 text-[12px] font-black transition-colors",
                          activeAdminCategory === category.value
                            ? "border-[var(--brand-accent)] bg-[var(--brand-soft)] text-[var(--brand-text)]"
                            : "border-[var(--border)] bg-white text-[#8E8A81] hover:bg-[var(--brand-soft)]"
                        )}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ml-auto flex flex-nowrap items-center justify-end gap-2">
                  <div className={cn("relative", isRewardSortOpen ? "z-40" : "z-10")}>
                    <button
                      type="button"
                      onClick={() => setIsRewardSortOpen((current) => !current)}
                      className="flex h-11 min-w-[170px] items-center rounded-[14px] border border-[var(--border)] bg-white pr-10 pl-4 text-[12px] font-black text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-soft)]"
                    >
                      {`เรียงตาม: ${rewardSortLabel}`}
                      <ChevronDown
                        className={cn(
                          "pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#8E8A81] transition-transform",
                          isRewardSortOpen ? "rotate-180" : ""
                        )}
                        strokeWidth={2.2}
                      />
                    </button>
                    {isRewardSortOpen ? (
                      <div className="absolute top-[calc(100%+10px)] right-0 z-50 min-w-full rounded-[16px] border border-[var(--border)] bg-white p-2 shadow-[0_18px_36px_rgba(62,36,13,0.14)]">
                        {[
                          { value: "latest", label: "ล่าสุด" },
                          { value: "points-desc", label: "คะแนนมากสุด" },
                          { value: "points-asc", label: "คะแนนน้อยสุด" },
                          { value: "stock-desc", label: "คงเหลือมากสุด" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setRewardSortOrder(option.value as typeof rewardSortOrder);
                              setIsRewardSortOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center rounded-[12px] px-3 py-2.5 text-left text-[12px] font-black transition-colors",
                              rewardSortOrder === option.value
                                ? "bg-[var(--brand-soft)] text-[var(--brand-text)]"
                                : "text-[#8E8A81] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)]"
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {displayedRewards.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--brand-soft)] px-5 py-8 text-center">
                <div className="text-[18px] font-black text-[#1A1A1A]">
                  {rewardCatalogSearch
                    ? "ไม่พบรางวัลที่ค้นหา"
                    : activeAdminCategory === "all"
                      ? "ยังไม่มี reward ในระบบ"
                      : `ยังไม่มี reward ในหมวด ${getCategoryMeta(activeAdminCategory, categoryOptions).label}`}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {displayedRewards.map((reward) => {
                const category = getCategoryMeta(reward.category, categoryOptions);
                const CategoryIcon = CATEGORY_ICON_MAP[category.icon];
                const rewardIndex = rewardOrderMap.get(reward.id) ?? 0;
                const isFirstReward = rewardIndex === 0;
                const isLastReward = rewardIndex === draftRewards.length - 1;
                const isPressed = pressedRewardId === reward.id;
                const isDragging = draggingRewardId === reward.id;
                const isDropTarget = dragOverRewardId === reward.id && draggingRewardId !== reward.id;

                return (
                  <Card
                    key={reward.id}
                    draggable
                    onMouseDown={() => setPressedRewardId(reward.id)}
                    onMouseUp={() => setPressedRewardId((current) => (current === reward.id ? null : current))}
                    onMouseLeave={() => setPressedRewardId((current) => (current === reward.id ? null : current))}
                    onTouchStart={() => setPressedRewardId(reward.id)}
                    onTouchEnd={() => setPressedRewardId((current) => (current === reward.id ? null : current))}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", String(reward.id));
                      handleRewardDragStart(reward.id);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (draggingRewardId !== null && draggingRewardId !== reward.id) {
                        event.dataTransfer.dropEffect = "move";
                        setDragOverRewardId(reward.id);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleRewardDrop(reward.id);
                    }}
                    onDragEnd={handleRewardDragEnd}
                    className={cn(
                      "overflow-hidden rounded-[18px] border bg-white p-0 shadow-[0_8px_18px_rgba(62,36,13,0.05)] transition-all duration-200 ease-out",
                      isDragging
                        ? "z-20 scale-[0.985] border-[var(--brand-accent)] opacity-60 shadow-[0_22px_40px_rgba(62,36,13,0.18)]"
                        : isPressed
                          ? "z-10 -translate-y-1 scale-[1.015] border-[var(--brand-accent)] shadow-[0_18px_36px_rgba(62,36,13,0.14)]"
                          : "border-[var(--border)] hover:-translate-y-1",
                      isDropTarget ? "ring-2 ring-[var(--brand-accent)] ring-offset-2" : ""
                    )}
                  >
                    <div className="p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="rounded-full border border-[var(--border)] bg-[var(--brand-soft)] px-3 py-1 text-[11px] font-black text-[var(--brand-text)]">
                            {category.label}
                          </div>
                          {reward.isHot ? (
                            <div className="rounded-full bg-[#eef8ea] px-3 py-1 text-[11px] font-black text-[#5e9f41]">ฮิต</div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditReward(reward)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--brand-text)] transition-colors hover:border-[var(--brand-accent)] hover:bg-[var(--brand-soft)]"
                          aria-label={`แก้ไขรางวัล ${reward.name}`}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2.2} />
                        </button>
                      </div>
                      <RewardImage reward={reward} />
                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-[17px] font-black text-[#1A1A1A]">{reward.name}</div>
                        </div>
                        <div className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[12px] font-black text-[var(--brand-text)]">
                          {reward.points.toLocaleString()} pts
                        </div>
                      </div>

                      <div className="mt-3 flex min-h-[58px] flex-wrap content-start gap-2">
                        <div className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[11px] font-black text-[var(--brand-text)]">
                          {getRewardRemainingOnlyLabel(reward)}
                        </div>
                        {reward.redeemStartAt || reward.redeemEndAt ? (
                          <div className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[11px] font-black text-[#8E8A81]">
                            {getRewardScheduleLabel({
                              hasRedeemWindow: Boolean(reward.redeemStartAt || reward.redeemEndAt),
                              redeemStartAt: reward.redeemStartAt,
                              redeemEndAt: reward.redeemEndAt,
                            })}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--brand-soft)] px-4 py-3">
                      <div className="flex items-center gap-1 text-[12px] font-black text-[#8E8A81]">
                        <GripVertical className="h-3.5 w-3.5" strokeWidth={2.2} />
                        #{rewardIndex + 1}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveRewardToTop(reward.id)}
                          disabled={isFirstReward}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`ย้าย ${reward.name} ไปบนสุด`}
                        >
                          <ChevronsUp className="h-3.5 w-3.5" strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveRewardByStep(reward.id, -1)}
                          disabled={isFirstReward}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`เลื่อน ${reward.name} ขึ้น 1 ตำแหน่ง`}
                        >
                          <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveRewardByStep(reward.id, 1)}
                          disabled={isLastReward}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`เลื่อน ${reward.name} ลง 1 ตำแหน่ง`}
                        >
                          <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveRewardToBottom(reward.id)}
                          disabled={isLastReward}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`ย้าย ${reward.name} ไปล่างสุด`}
                        >
                          <ChevronsDown className="h-3.5 w-3.5" strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingReward(reward)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f1caca] bg-white text-[#ef544d] transition-colors hover:bg-[#fff4f4] hover:text-[#d63b35]"
                          aria-label={`ลบรางวัล ${reward.name}`}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <Dialog
          open={isRedemptionLogOpen}
          onOpenChange={(open) => {
            setIsRedemptionLogOpen(open);
            if (!open) setRedemptionSearch("");
          }}
        >
          <DialogContent className="grid h-[min(88vh,860px)] w-[calc(100vw-16px)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--brand-surface)] p-0 shadow-[0_24px_50px_rgba(62,36,13,0.18)] sm:w-[calc(100vw-32px)] sm:!max-w-[1040px]">
            <DialogHeader className="border-b border-[var(--border)] bg-[linear-gradient(180deg,var(--brand-soft)_0%,var(--brand-soft)_100%)] px-5 pt-5 pb-4 sm:px-6">
              <DialogTitle className="flex items-center gap-3 text-[24px] font-black text-[var(--brand-text)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--brand-text)]">
                  <History className="h-5 w-5" strokeWidth={2.3} />
                </div>
                ประวัติการแลกรางวัล
              </DialogTitle>
              <DialogDescription className="text-[13px] font-bold leading-relaxed text-[#8E8A81] sm:text-[14px]">
                ดูได้ว่าใครแลกรางวัลอะไรไปบ้าง เมื่อไร และใช้คะแนนไปเท่าไร
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="rounded-[18px] border border-[var(--border)] bg-[var(--brand-soft)] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                  <div className="max-w-[520px] text-[13px] font-black leading-relaxed text-[var(--brand-text)]">
                    ค้นหาชื่อผู้ใช้งานเพื่อดูว่าเคยแลก reward อะไร เวลาไหนบ้าง
                  </div>
                  <div className="relative w-full lg:max-w-[360px]">
                    <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#8E8A81]" />
                    <Input
                      value={redemptionSearch}
                      onChange={(event) => setRedemptionSearch(event.target.value)}
                      placeholder="ค้นหาชื่อผู้แลกรางวัล"
                      className="h-11 rounded-[14px] border-[var(--border)] bg-white pr-4 pl-10 text-[13px] font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-[18px] border border-[var(--border)] bg-white p-4">
                  <div className="text-[12px] font-black text-[#8E8A81]">รายการที่แลกทั้งหมด</div>
                  <div className="mt-2 text-[28px] font-black text-[#1A1A1A]">{rewardRedemptionSummary.totalRedeemed}</div>
                </div>
                <div className="rounded-[18px] border border-[var(--border)] bg-white p-4">
                  <div className="text-[12px] font-black text-[#8E8A81]">ผู้แลกทั้งหมด</div>
                  <div className="mt-2 text-[28px] font-black text-[#1A1A1A]">{rewardRedemptionSummary.uniqueRedeemers}</div>
                </div>
                <div className="rounded-[18px] border border-[var(--border)] bg-white p-4">
                  <div className="text-[12px] font-black text-[#8E8A81]">คะแนนที่ถูกใช้</div>
                  <div className="mt-2 text-[28px] font-black text-[#1A1A1A]">{rewardRedemptionSummary.totalPointsSpent.toLocaleString()}</div>
                </div>
              </div>

              {rewardRedemptionSummary.topRewards.length > 0 ? (
                <div className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--brand-soft)] p-4">
                  <div className="mb-3 text-[13px] font-black text-[var(--brand-text)]">รางวัลที่ถูกแลกบ่อย</div>
                  <div className="flex flex-wrap gap-2">
                    {rewardRedemptionSummary.topRewards.map((item) => (
                      <div key={item.rewardId} className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-[12px] font-black text-[var(--brand-text)]">
                        {item.rewardName} {item.count} ครั้ง
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {rewardRedemptions.length === 0 ? (
                <div className="mt-4 rounded-[18px] border border-dashed border-[var(--border)] bg-white px-5 py-10 text-center">
                  <div className="text-[18px] font-black text-[#1A1A1A]">ยังไม่มีประวัติการแลกรางวัล</div>
                  <div className="mt-2 text-[13px] font-bold text-[#8E8A81]">
                    เมื่อมีคนกดแลกรางวัลจากหน้า Rewards รายการจะมาแสดงที่นี่ทันที
                  </div>
                </div>
              ) : filteredRewardRedemptions.length === 0 ? (
                <div className="mt-4 rounded-[18px] border border-dashed border-[var(--border)] bg-white px-5 py-10 text-center">
                  <div className="text-[18px] font-black text-[#1A1A1A]">ไม่พบผู้ใช้งานที่ค้นหา</div>
                  <div className="mt-2 text-[13px] font-bold text-[#8E8A81]">
                    ลองค้นหาด้วยชื่อหรือชื่อย่อของผู้แลกรางวัลอีกครั้ง
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {filteredRewardRedemptions.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-[18px] border border-[var(--border)] bg-white p-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)]"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="truncate text-[16px] font-black text-[#1A1A1A]">{record.rewardName}</div>
                          <div className="mt-1 text-[13px] font-bold text-[#8E8A81]">{record.redeemedBy}</div>
                        </div>
                        <div className="flex flex-wrap gap-2 md:justify-end">
                          <div className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[12px] font-black text-[var(--brand-text)]">
                            {record.pointsSpent.toLocaleString()} pts
                          </div>
                          <div className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[12px] font-black text-[#8E8A81]">
                            {record.rewardCategory}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-[12px] font-bold text-[#8E8A81]">
                        <Clock3 className="h-3.5 w-3.5 text-[var(--brand-text)]" strokeWidth={2.2} />
                        {formatRedemptionDateTime(record.redeemedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingReward} onOpenChange={(open) => !open && setEditingReward(null)}>
          <DialogContent
            className={cn(
              "grid h-[min(90vh,960px)] w-[calc(100vw-16px)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--brand-surface)] p-0 shadow-[0_24px_50px_rgba(62,36,13,0.18)] sm:w-[calc(100vw-32px)] sm:rounded-[32px]",
              editingReward?.mode === "create"
                ? "sm:!max-w-[1180px] lg:!max-w-[1280px]"
                : "sm:!max-w-[1240px] lg:!max-w-[1360px]"
            )}
          >
            <DialogHeader className="border-b border-[var(--border)] bg-[linear-gradient(180deg,var(--brand-soft)_0%,var(--brand-soft)_100%)] px-5 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5 lg:px-8">
              <DialogTitle className="text-[24px] font-black text-[var(--brand-text)] sm:text-[30px]">
                {editingReward?.mode === "create" ? "Create Reward" : "Edit Reward"}
              </DialogTitle>
              <DialogDescription className="max-w-[840px] text-[13px] font-bold leading-relaxed text-[#8E8A81] sm:text-[14px]">
                {editingReward?.mode === "create"
                  ? "ใช้มุมมองนี้เพื่อสร้าง reward ให้ใกล้กับหน้า public มากขึ้น เห็นรูป ราคา รายละเอียด และสถานะเด่นได้ตั้งแต่ก่อนยืนยัน"
                  : "ปรับรายละเอียด reward และเช็ก preview ไปพร้อมกัน เพื่อให้แก้ไขได้แม่นขึ้นทั้งบน desktop และ mobile"}
              </DialogDescription>
            </DialogHeader>

            {editingReward ? (
              <div className="min-h-0 overflow-y-auto bg-[var(--brand-surface)] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleSelectImage(event.target.files?.[0])}
                />

                {editingReward.mode === "create" ? (
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <div className="space-y-5 lg:sticky lg:top-0 lg:self-start [&>*:not(:first-child)]:hidden">
                      <RewardPreviewPanel reward={editingReward} categories={categoryOptions} />

                      <DetailCard title="รูปภาพรางวัล" subtitle="อัปโหลดรูปจริงหรือใช้ mockup จาก Image Text">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--brand-soft)] px-4 text-[13px] font-black text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-soft)]"
                          >
                            <ImagePlus className="h-4 w-4" strokeWidth={2.2} />
                            เลือกรูปหรืออัปโหลดรูป
                          </button>
                          <button
                            type="button"
                            onClick={() => updateEditingReward("imageSrc", null)}
                            className="flex h-12 w-full items-center justify-center rounded-[16px] border border-[var(--border)] bg-white px-4 text-[13px] font-black text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-soft)]"
                          >
                            ลบรูปออก
                          </button>
                        </div>
                      </DetailCard>
                    </div>

                    <div className="space-y-5">
                      <DetailCard title="ข้อมูลหลัก" subtitle="เริ่มจากชื่อ ราคา และคำอธิบาย">
                        <div className="space-y-4">
                          <div className="flex flex-col gap-2">
                            <Label className="text-[12px] font-black text-[var(--brand-text)]">Reward Name</Label>
                            <Input
                              value={editingReward.name}
                              onChange={(event) => updateEditingReward("name", event.target.value)}
                              className="h-12 rounded-[18px] border-[var(--border)] bg-white px-4 text-[15px] font-bold text-[var(--foreground)] focus-visible:border-[var(--brand-accent)] focus-visible:ring-0"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-2">
                              <Label className="text-[12px] font-black text-[var(--brand-text)]">Points</Label>
                              <Input
                                value={`${editingReward.points}`}
                                onChange={(event) => updateEditingReward("points", Number(event.target.value) || 0)}
                                className="h-12 rounded-[18px] border-[var(--border)] bg-white px-4 text-[15px] font-bold text-[var(--foreground)] focus-visible:border-[var(--brand-accent)] focus-visible:ring-0"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label className="text-[12px] font-black text-[var(--brand-text)]">Image Text Fallback</Label>
                              <Input
                                value={editingReward.imageText}
                                onChange={(event) => updateEditingReward("imageText", event.target.value)}
                                className="h-12 rounded-[18px] border-[var(--border)] bg-white px-4 text-[15px] font-bold text-[var(--foreground)] focus-visible:border-[var(--brand-accent)] focus-visible:ring-0"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label className="text-[12px] font-black text-[var(--brand-text)]">Description</Label>
                            <Textarea
                              value={editingReward.description}
                              onChange={(event) => updateEditingReward("description", event.target.value)}
                              className="min-h-[156px] rounded-[18px] border-[var(--border)] bg-white px-4 py-3 text-[14px] font-bold leading-relaxed text-[var(--foreground)] focus-visible:border-[var(--brand-accent)] focus-visible:ring-0"
                            />
                          </div>

                          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--brand-soft)] p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <div className="text-[13px] font-black text-[var(--brand-text)]">รูปภาพรางวัล</div>
                              <div className="text-[12px] font-bold text-[#8E8A81]">อัปโหลดรูปจริงหรือใช้ mockup จาก Image Text</div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--brand-soft)] px-4 text-[13px] font-black text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-soft)]"
                              >
                                <ImagePlus className="h-4 w-4" strokeWidth={2.2} />
                                เลือกรูปหรืออัปโหลดรูป
                              </button>
                              <button
                                type="button"
                                onClick={() => updateEditingReward("imageSrc", null)}
                                className="flex h-12 w-full items-center justify-center rounded-[16px] border border-[var(--border)] bg-white px-4 text-[13px] font-black text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-soft)]"
                              >
                                ลบรูปออก
                              </button>
                            </div>
                          </div>
                        </div>
                      </DetailCard>

                      <DetailCard title="การแลกและสต็อก" subtitle="กำหนดช่วงเวลาและสินค้าคงเหลือ">
                        <div className="space-y-4">
                          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--brand-soft)] p-4">
                            <label className="flex cursor-pointer items-start justify-between gap-3">
                              <div>
                                <div className="text-[14px] font-black text-[var(--brand-text)]">จำกัดเวลาแลก</div>
                                <div className="mt-1 text-[12px] font-bold leading-relaxed text-[#8E8A81]">
                                  เปิดเมื่ออยากให้ reward แลกได้เฉพาะช่วงเวลาที่กำหนด
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={editingReward.hasRedeemWindow}
                                onChange={(event) => updateEditingReward("hasRedeemWindow", event.target.checked)}
                                className="mt-1 h-4 w-4 accent-[var(--brand-accent-strong)]"
                              />
                            </label>
                            {editingReward.hasRedeemWindow ? (
                              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                  <Label className="text-[12px] font-black text-[var(--brand-text)]">เริ่มแลกได้</Label>
                                  <Input
                                    type="datetime-local"
                                    value={editingReward.redeemStartAt}
                                    onChange={(event) => updateEditingReward("redeemStartAt", event.target.value)}
                                    className="h-12 rounded-[18px] border-[var(--border)] bg-white px-4 text-[14px] font-bold"
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label className="text-[12px] font-black text-[var(--brand-text)]">สิ้นสุดการแลก</Label>
                                  <Input
                                    type="datetime-local"
                                    value={editingReward.redeemEndAt}
                                    onChange={(event) => updateEditingReward("redeemEndAt", event.target.value)}
                                    className="h-12 rounded-[18px] border-[var(--border)] bg-white px-4 text-[14px] font-bold"
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--brand-soft)] p-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => updateEditingRewardStockMode("unlimited")}
                                className={cn(
                                  "rounded-full border px-4 py-2 text-[12px] font-black transition-colors",
                                  editingReward.stockMode === "unlimited"
                                    ? "border-[var(--brand-accent)] bg-white text-[var(--brand-text)]"
                                    : "border-[var(--border)] bg-[var(--brand-soft)] text-[#8E8A81]"
                                )}
                              >
                                ไม่จำกัดจำนวน
                              </button>
                              <button
                                type="button"
                                onClick={() => updateEditingRewardStockMode("limited")}
                                className={cn(
                                  "rounded-full border px-4 py-2 text-[12px] font-black transition-colors",
                                  editingReward.stockMode === "limited"
                                    ? "border-[var(--brand-accent)] bg-white text-[var(--brand-text)]"
                                    : "border-[var(--border)] bg-[var(--brand-soft)] text-[#8E8A81]"
                                )}
                              >
                                จำกัดจำนวน
                              </button>
                            </div>

                            {editingReward.stockMode === "limited" ? (
                              <div className="mt-4 flex flex-col gap-2">
                                <Label className="text-[12px] font-black text-[var(--brand-text)]">สินค้าคงเหลือ</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={`${editingReward.stockRemaining}`}
                                  onChange={(event) => updateEditingRewardAvailableStock(Number(event.target.value))}
                                  className="h-12 rounded-[18px] border-[var(--border)] bg-white px-4 text-[14px] font-bold"
                                />
                              </div>
                            ) : (
                              <div className="mt-3 text-[12px] font-bold text-[#8E8A81]">
                                reward นี้ไม่มีการจำกัดสต็อก
                              </div>
                            )}
                          </div>
                        </div>
                      </DetailCard>

                      <DetailCard title="เลือกหมวดหมู่" subtitle="เลือกประเภทที่เหมาะกับ reward นี้">
                        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="text-[12px] font-bold text-[#8E8A81]">
                            แสดงหมวดที่มีการใช้งานก่อน และค้นหาหมวดได้ทันที
                          </div>
                          <div className="relative w-full md:max-w-[320px]">
                            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#8E8A81]" />
                            <Input
                              value={categoryPickerSearch}
                              onChange={(event) => setCategoryPickerSearch(event.target.value)}
                              placeholder="ค้นหาหมวดสำหรับ reward นี้"
                              className="h-11 rounded-[14px] border-[var(--border)] bg-white pr-4 pl-10 text-[13px] font-bold"
                            />
                          </div>
                        </div>
                        <div className="max-h-[520px] overflow-y-auto pr-1">
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {pickerCategoryOptions.map((option) => {
                            const Icon = CATEGORY_ICON_MAP[option.icon];
                            const isActive = option.value === editingReward.category;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => updateEditingReward("category", option.value)}
                                className={cn(
                                  "rounded-[16px] border p-4 text-left transition-colors",
                                  isActive
                                    ? "border-[var(--brand-accent)] bg-[var(--brand-soft)] shadow-[0_8px_18px_rgba(var(--brand-accent-rgb),0.14)]"
                                    : "border-[var(--border)] bg-[var(--brand-surface)] hover:bg-[var(--brand-soft)]"
                                )}
                              >
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--brand-text)]">
                                  <Icon className="h-4 w-4" strokeWidth={2.2} />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-[15px] font-black text-[#1A1A1A]">{option.label}</div>
                                  <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[var(--brand-text)]">
                                    {option.count} items
                                  </div>
                                </div>
                                <div className="mt-1 text-[12px] font-bold leading-relaxed text-[#8E8A81]">
                                  {option.hint}
                                </div>
                              </button>
                            );
                          })}
                          </div>
                        </div>
                        {pickerCategoryOptions.length === 0 ? (
                          <div className="mt-3 rounded-[16px] border border-dashed border-[var(--border)] bg-white px-4 py-5 text-center text-[13px] font-bold text-[#8E8A81]">
                            ไม่พบหมวดที่ตรงกับคำค้นหา
                          </div>
                        ) : null}
                      </DetailCard>

                      <DetailCard title="Display Settings" subtitle="กำหนดว่ารางวัลนี้จะเด่นบนหน้า public หรือไม่">
                        <button
                          type="button"
                          onClick={() => updateEditingReward("isHot", !editingReward.isHot)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-left transition-colors",
                            editingReward.isHot
                              ? "border-[#f1c6c6] bg-[#fff3f3] text-[#b43a33]"
                              : "border-[var(--border)] bg-[var(--brand-surface)] text-[var(--brand-text)]"
                          )}
                        >
                          <span>
                            <span className="block text-[14px] font-black">Featured / Hot reward</span>
                            <span className="block text-[12px] font-bold opacity-80">
                              เปิดสถานะนี้เมื่ออยากให้รางวัลเด่นเป็นพิเศษในหน้า public
                            </span>
                          </span>
                          <span className="rounded-full bg-white/80 px-3 py-1 text-[12px] font-black">
                            {editingReward.isHot ? "HOT ON" : "STANDARD"}
                          </span>
                        </button>
                      </DetailCard>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                    <div className="space-y-5 lg:sticky lg:top-0 lg:self-start [&>*:not(:first-child)]:hidden">
                      <RewardPreviewPanel reward={editingReward} categories={categoryOptions} />

                      <DetailCard title="รูปภาพรางวัล" subtitle="อัปเดตรูปหรือเคลียร์กลับเป็น mockup">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-12 items-center justify-center gap-2 rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--brand-soft)] text-[13px] font-black text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-soft)]"
                          >
                            <ImagePlus className="h-4 w-4" strokeWidth={2.2} />
                            อัปโหลดรูป
                          </button>
                          <button
                            type="button"
                            onClick={() => updateEditingReward("imageSrc", null)}
                            className="flex h-12 items-center justify-center rounded-[16px] border border-[var(--border)] bg-white text-[13px] font-black text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-soft)]"
                          >
                            ลบรูปออก
                          </button>
                        </div>
                      </DetailCard>
                    </div>

                    <div className="space-y-5">
                      <DetailCard title="ข้อมูลหลัก" subtitle="แก้ชื่อ ราคา และคำอธิบายได้จากตรงนี้">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <div className="flex flex-col gap-2 lg:col-span-2">
                            <Label className="text-[12px] font-black text-[var(--brand-text)]">Reward Name</Label>
                            <Input
                              value={editingReward.name}
                              onChange={(event) => updateEditingReward("name", event.target.value)}
                              className="h-12 rounded-[18px] border-[var(--border)] bg-white px-4 text-[15px] font-bold text-[var(--foreground)] focus-visible:border-[var(--brand-accent)] focus-visible:ring-0"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label className="text-[12px] font-black text-[var(--brand-text)]">Points</Label>
                            <Input
                              value={`${editingReward.points}`}
                              onChange={(event) => updateEditingReward("points", Number(event.target.value) || 0)}
                              className="h-12 rounded-[18px] border-[var(--border)] bg-white px-4 text-[15px] font-bold text-[var(--foreground)] focus-visible:border-[var(--brand-accent)] focus-visible:ring-0"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label className="text-[12px] font-black text-[var(--brand-text)]">Image Text Fallback</Label>
                            <Input
                              value={editingReward.imageText}
                              onChange={(event) => updateEditingReward("imageText", event.target.value)}
                              className="h-12 rounded-[18px] border-[var(--border)] bg-white px-4 text-[15px] font-bold text-[var(--foreground)] focus-visible:border-[var(--brand-accent)] focus-visible:ring-0"
                            />
                          </div>
                          <div className="flex flex-col gap-2 lg:col-span-2">
                            <Label className="text-[12px] font-black text-[var(--brand-text)]">Description</Label>
                            <Textarea
                              value={editingReward.description}
                              onChange={(event) => updateEditingReward("description", event.target.value)}
                              className="min-h-[160px] rounded-[18px] border-[var(--border)] bg-white px-4 py-3 text-[14px] font-bold leading-relaxed text-[var(--foreground)] focus-visible:border-[var(--brand-accent)] focus-visible:ring-0"
                            />
                          </div>

                          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--brand-soft)] p-4 lg:col-span-2">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <div className="text-[13px] font-black text-[var(--brand-text)]">รูปภาพรางวัล</div>
                              <div className="text-[12px] font-bold text-[#8E8A81]">อัปเดตรูปหรือเคลียร์กลับเป็น mockup</div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-12 items-center justify-center gap-2 rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--brand-soft)] text-[13px] font-black text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-soft)]"
                              >
                                <ImagePlus className="h-4 w-4" strokeWidth={2.2} />
                                อัปโหลดรูป
                              </button>
                              <button
                                type="button"
                                onClick={() => updateEditingReward("imageSrc", null)}
                                className="flex h-12 items-center justify-center rounded-[16px] border border-[var(--border)] bg-white text-[13px] font-black text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-soft)]"
                              >
                                ลบรูปออก
                              </button>
                            </div>
                          </div>
                        </div>
                      </DetailCard>

                      <DetailCard title="การแลกและสต็อก" subtitle="ตั้งช่วงเวลาและสินค้าคงเหลือ">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--brand-soft)] p-4 lg:col-span-2">
                            <label className="flex cursor-pointer items-start justify-between gap-3">
                              <div>
                                <div className="text-[14px] font-black text-[var(--brand-text)]">จำกัดเวลาแลก</div>
                                <div className="mt-1 text-[12px] font-bold leading-relaxed text-[#8E8A81]">
                                  ถ้าปิดไว้ reward นี้จะแลกได้ตลอดเวลา
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={editingReward.hasRedeemWindow}
                                onChange={(event) => updateEditingReward("hasRedeemWindow", event.target.checked)}
                                className="mt-1 h-4 w-4 accent-[var(--brand-accent-strong)]"
                              />
                            </label>
                            {editingReward.hasRedeemWindow ? (
                              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                  <Label className="text-[12px] font-black text-[var(--brand-text)]">เริ่มแลกได้</Label>
                                  <Input
                                    type="datetime-local"
                                    value={editingReward.redeemStartAt}
                                    onChange={(event) => updateEditingReward("redeemStartAt", event.target.value)}
                                    className="h-12 rounded-[18px] border-[var(--border)] bg-white px-4 text-[14px] font-bold"
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label className="text-[12px] font-black text-[var(--brand-text)]">สิ้นสุดการแลก</Label>
                                  <Input
                                    type="datetime-local"
                                    value={editingReward.redeemEndAt}
                                    onChange={(event) => updateEditingReward("redeemEndAt", event.target.value)}
                                    className="h-12 rounded-[18px] border-[var(--border)] bg-white px-4 text-[14px] font-bold"
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--brand-soft)] p-4 lg:col-span-2">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => updateEditingRewardStockMode("unlimited")}
                                className={cn(
                                  "rounded-full border px-4 py-2 text-[12px] font-black transition-colors",
                                  editingReward.stockMode === "unlimited"
                                    ? "border-[var(--brand-accent)] bg-white text-[var(--brand-text)]"
                                    : "border-[var(--border)] bg-[var(--brand-soft)] text-[#8E8A81]"
                                )}
                              >
                                ไม่จำกัดจำนวน
                              </button>
                              <button
                                type="button"
                                onClick={() => updateEditingRewardStockMode("limited")}
                                className={cn(
                                  "rounded-full border px-4 py-2 text-[12px] font-black transition-colors",
                                  editingReward.stockMode === "limited"
                                    ? "border-[var(--brand-accent)] bg-white text-[var(--brand-text)]"
                                    : "border-[var(--border)] bg-[var(--brand-soft)] text-[#8E8A81]"
                                )}
                              >
                                จำกัดจำนวน
                              </button>
                            </div>

                            {editingReward.stockMode === "limited" ? (
                              <div className="mt-4 flex flex-col gap-2">
                                <Label className="text-[12px] font-black text-[var(--brand-text)]">สินค้าคงเหลือ</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={`${editingReward.stockRemaining}`}
                                  onChange={(event) => updateEditingRewardAvailableStock(Number(event.target.value))}
                                  className="h-12 rounded-[18px] border-[var(--border)] bg-white px-4 text-[14px] font-bold"
                                />
                              </div>
                            ) : (
                              <div className="mt-3 text-[12px] font-bold text-[#8E8A81]">
                                reward นี้ไม่มีการจำกัดสต็อก
                              </div>
                            )}
                          </div>
                        </div>
                      </DetailCard>

                      <DetailCard title="Display Settings" subtitle="หมวดหมู่ และสถานะเด่น">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <div className="flex flex-col gap-2">
                            <Label className="text-[12px] font-black text-[var(--brand-text)]">Category</Label>
                            <Combobox
                              value={editingReward.category}
                              onValueChange={(value) =>
                                updateEditingReward("category", value as RewardCatalogItem["category"])
                              }
                              aria-label="หมวดหมู่"
                              searchPlaceholder="ค้นหาหมวดหมู่"
                              className="h-12 rounded-[18px] border-[var(--border)] bg-white text-[15px] font-bold text-[var(--foreground)]"
                              options={categoryOptions.map((option) => ({ value: option.value, label: option.label }))}
                            />
                            <div className="text-[12px] font-bold text-[#8E8A81]">
                              {getCategoryMeta(editingReward.category, categoryOptions).hint}
                            </div>
                          </div>

                          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] px-4 py-3">
                            <div className="text-[12px] font-black text-[var(--brand-text)]">Current Fallback</div>
                            <div className="mt-2 text-[15px] font-black text-[#1A1A1A]">
                              {editingReward.imageText || "ยังไม่มีข้อความสำรอง"}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => updateEditingReward("isHot", !editingReward.isHot)}
                          className={cn(
                            "mt-4 flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-left transition-colors",
                            editingReward.isHot
                              ? "border-[#f1c6c6] bg-[#fff3f3] text-[#b43a33]"
                              : "border-[var(--border)] bg-[var(--brand-surface)] text-[var(--brand-text)]"
                          )}
                        >
                          <span>
                            <span className="block text-[14px] font-black">Featured / Hot reward</span>
                            <span className="block text-[12px] font-bold opacity-80">
                              เปิดสถานะนี้เมื่ออยากให้รางวัลเด่นบนหน้า Rewards
                            </span>
                          </span>
                          <span className="rounded-full bg-white/80 px-3 py-1 text-[12px] font-black">
                            {editingReward.isHot ? "HOT ON" : "STANDARD"}
                          </span>
                        </button>
                      </DetailCard>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <DialogFooter className="mx-0 mb-0 rounded-b-[28px] border-t border-[var(--border)] bg-[var(--brand-soft)] px-5 py-4 sm:px-6 lg:px-8">
              <div className="flex w-full justify-end sm:pr-1 lg:pr-2">
                <Button
                  onClick={confirmRewardEdit}
                  className="h-10 rounded-full bg-[var(--brand-text)] px-4 text-[13px] text-white hover:bg-[var(--c-4a280f)]"
                >
                  {editingReward?.mode === "create" ? "Confirm Create" : "Confirm Update"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deletingReward} onOpenChange={(open) => !open && setDeletingReward(null)}>
          <DialogContent className="max-w-[520px] overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] p-0 shadow-[0_24px_50px_rgba(62,36,13,0.18)] sm:rounded-[30px]">
            <DialogHeader className="border-b border-[var(--border)] bg-[linear-gradient(180deg,var(--brand-soft)_0%,var(--brand-soft)_100%)] px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-5">
              <DialogTitle className="text-[22px] font-black text-[#8a2f2b] sm:text-[26px]">
                Confirm Delete
              </DialogTitle>
              <DialogDescription className="max-w-[420px] text-[12px] font-bold leading-relaxed text-[#8E8A81] sm:text-[14px]">
                แน่ใจใช่ไหมว่าต้องการลบรางวัลนี้ หากยืนยัน รายการจะหายจากหน้า Admin และหน้า Rewards หลักทันที
              </DialogDescription>
            </DialogHeader>

            {deletingReward ? (
              <div className="bg-[var(--brand-surface)] px-4 py-4 sm:px-6 sm:py-6">
                <div className="rounded-[16px] border border-[#f1d1cf] bg-white px-4 py-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)]">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--brand-soft)]">
                      {deletingReward.imageSrc ? (
                        <Image src={deletingReward.imageSrc} alt={deletingReward.name} fill sizes="48px" className="object-cover" />
                      ) : (
                        <Gift className="h-4 w-4 text-[var(--brand-text)]" strokeWidth={2.2} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-black text-[#1A1A1A] sm:text-[16px]">
                        {deletingReward.name}
                      </div>
                      <div className="text-[12px] font-bold text-[#8E8A81]">
                        {getCategoryMeta(deletingReward.category, categoryOptions).label} · {deletingReward.points.toLocaleString()} points
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <DialogFooter className="mx-0 mb-0 rounded-b-[26px] border-t border-[var(--border)] bg-[var(--brand-soft)] px-5 py-4 sm:rounded-b-[30px] sm:px-6 sm:py-5">
              <div className="flex w-full justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeletingReward(null)}
                  className="h-10 rounded-full border-[var(--border)] bg-white px-4 text-[13px] text-[var(--brand-text)] hover:bg-[var(--brand-soft)]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteReward}
                  className="h-10 rounded-full bg-[#b33a34] px-4 text-[13px] text-white hover:bg-[#982b26]"
                >
                  Confirm Delete
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!pendingCategoryDelete} onOpenChange={(open) => !open && setPendingCategoryDelete(null)}>
          <DialogContent className="max-w-[560px] overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] p-0 shadow-[0_24px_50px_rgba(62,36,13,0.18)] sm:rounded-[30px]">
            <DialogHeader className="border-b border-[var(--border)] bg-[linear-gradient(180deg,var(--brand-soft)_0%,var(--brand-soft)_100%)] px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-5">
              <DialogTitle className="text-[22px] font-black text-[#8a2f2b] sm:text-[26px]">
                ยืนยันการลบหมวดหมู่
              </DialogTitle>
              <DialogDescription className="max-w-[460px] text-[12px] font-bold leading-relaxed text-[#8E8A81] sm:text-[14px]">
                {pendingCategoryDelete?.count
                  ? "หากยืนยัน จะลบข้อมูล Reward ทั้งหมดในหมู่นี้"
                  : "หากยืนยัน ระบบจะลบหมวดหมู่นี้ออกจากตัวเลือกของ Admin ทันที"}
              </DialogDescription>
            </DialogHeader>

            {pendingCategoryDelete ? (
              <div className="bg-[var(--brand-surface)] px-4 py-4 sm:px-6 sm:py-6">
                <div className="rounded-[16px] border border-[var(--border)] bg-white px-4 py-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[17px] font-black text-[#1A1A1A]">{pendingCategoryDelete.label}</div>
                      <div className="mt-1 text-[12px] font-bold text-[#8E8A81]">{pendingCategoryDelete.hint}</div>
                    </div>
                    <div className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[12px] font-black text-[var(--brand-text)]">
                      {pendingCategoryDelete.count} items
                    </div>
                  </div>

                  {pendingCategoryDelete.count > 0 ? (
                    <div className="mt-4 rounded-[14px] border border-[var(--border)] bg-[var(--brand-soft)] px-3 py-3">
                      <div className="text-[12px] font-black text-[var(--brand-text)]">Reward ที่ยังอยู่ในหมวดนี้</div>
                      <div className="mt-2 flex flex-col gap-2">
                        {rewardsInPendingCategory.slice(0, 4).map((reward) => (
                          <div key={reward.id} className="flex items-center justify-between gap-3 rounded-[12px] bg-white px-3 py-2">
                            <div className="min-w-0">
                              <div className="truncate text-[13px] font-black text-[#1A1A1A]">{reward.name}</div>
                              <div className="text-[11px] font-bold text-[#8E8A81]">{reward.description}</div>
                            </div>
                            <div className="whitespace-nowrap text-[11px] font-black text-[var(--brand-accent-strong)]">
                              {reward.points.toLocaleString()} pts
                            </div>
                          </div>
                        ))}
                      </div>
                      {rewardsInPendingCategory.length > 4 ? (
                        <div className="mt-2 text-[11px] font-bold text-[#8E8A81]">
                          และอีก {rewardsInPendingCategory.length - 4} รายการในหมวดนี้
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <DialogFooter className="mx-0 mb-0 rounded-b-[26px] border-t border-[var(--border)] bg-[var(--brand-soft)] px-5 py-4 sm:rounded-b-[30px] sm:px-6 sm:py-5">
              <div className="flex w-full justify-end">
                <Button
                  onClick={confirmRemoveCategory}
                  className="h-10 rounded-full bg-[#b33a34] px-4 text-[13px] text-white hover:bg-[#982b26]"
                >
                  Confirm Delete
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
