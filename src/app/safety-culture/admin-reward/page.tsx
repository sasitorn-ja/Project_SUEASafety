"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Gift,
  ImagePlus,
  Pencil,
  Plus,
  Shield,
  Star,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { type RewardCatalogItem, useAppActions, useAppState } from "@/providers/app-providers";

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
};

const CATEGORY_OPTIONS: Array<{
  value: RewardCatalogItem["category"];
  label: string;
  hint: string;
  icon: typeof Ticket;
}> = [
  { value: "voucher", label: "บัตรของขวัญ", hint: "e-voucher, cinema, shopping", icon: Ticket },
  { value: "merch", label: "สินค้า", hint: "merchandise และของพรีเมียม", icon: Gift },
  { value: "ppe", label: "PPE", hint: "อุปกรณ์เซฟตี้และของใช้หน้างาน", icon: Shield },
  { value: "team", label: "ของรางวัลทีม", hint: "รางวัลสำหรับทีมและกิจกรรมร่วมกัน", icon: Users },
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
        "rounded-[26px] border border-[#e3d0ae] bg-[#fffdfa] p-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)] md:p-5",
        className
      )}
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#fff1c9] text-[#6d4716]">
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
  };
}

function getCategoryMeta(category: RewardCatalogItem["category"]) {
  return CATEGORY_OPTIONS.find((option) => option.value === category) ?? CATEGORY_OPTIONS[1];
}

function RewardImage({
  reward,
  className,
}: {
  reward: Pick<RewardCatalogItem, "name" | "imageSrc" | "imageText" | "isHot">;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[22px] border border-[#eadcc7] bg-[#f7ead6]",
        className
      )}
    >
      {reward.isHot ? (
        <span className="absolute top-3 left-3 z-10 rounded-full bg-[#d9383a] px-2.5 py-1 text-[10px] font-black text-white">
          HOT
        </span>
      ) : null}
      {reward.imageSrc ? (
        <Image src={reward.imageSrc} alt={reward.name} fill className="object-cover" />
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
  layout = "split",
}: {
  reward: RewardEditorState;
  layout?: "split" | "stacked";
}) {
  return (
    <div className="rounded-[26px] border border-[#e6d5b7] bg-[linear-gradient(135deg,#fff7de_0%,#fffef9_100%)] p-4 shadow-[0_10px_24px_rgba(62,36,13,0.06)] sm:p-5">
      <div className={cn("grid gap-4", layout === "split" ? "lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-5" : "grid-cols-1")}>
        <RewardImage reward={reward} className="min-h-[220px]" />

        <div className="min-w-0 rounded-[24px] border border-[#efdfc7] bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] sm:p-5">
          <div className="flex h-full min-w-0 flex-col gap-4 lg:min-h-[220px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-[#ead2a5] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#8b5a12]">
              Public Preview
            </span>
            <span className="inline-flex items-center rounded-full border border-[#eadcc7] bg-[#fffaf0] px-3 py-1 text-[12px] font-black text-[#6f665b]">
              {getCategoryMeta(reward.category).label}
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
              <div className="mt-3 rounded-[18px] border border-[#efdfc7] bg-[#fffdf7] px-4 py-3">
                <p className="line-clamp-6 min-h-[8.1rem] text-[14px] font-bold leading-relaxed text-[#6f665b] [overflow-wrap:anywhere] sm:text-[15px]">
              
              {reward.description || "รายละเอียด reward จะแสดงตรงนี้บนหน้า Rewards"}
              
                </p>
              </div>
            </div>

            <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-[#efdfc7] pt-4">
              <div className="rounded-[22px] border border-[#eadcc7] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(62,36,13,0.04)]">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#b58a00]">Points</div>
              <div className="mt-1 text-[30px] font-black leading-none text-[#5c3214]">
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
  layout = "split",
}: {
  reward: RewardEditorState;
  layout?: "split" | "stacked";
}) {
  const previewCard = (
    <Card className="relative flex flex-col gap-3 rounded-[22px] border-[#E4D4B8] bg-[#FFFDF7] p-3.5 shadow-[0_4px_10px_rgba(0,0,0,0.01)]">
      {reward.isHot ? (
        <span className="absolute top-2.5 left-2.5 z-10 rounded-md bg-[#D9383A] px-2 py-0.5 text-[9.5px] font-black tracking-wide text-white shadow-[0_2px_6px_rgba(217,56,58,0.25)]">
          HOT
        </span>
      ) : null}

      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[14px] border-[1.5px] border-[#E4D4B8] bg-[#F7EAD6]">
        {reward.imageSrc ? (
          <Image src={reward.imageSrc} alt={reward.name} fill className="object-cover" />
        ) : reward.isHot ? (
          <Image
            src="/images/mascots/gallery/ppe-1.png"
            alt="SUEA reward"
            fill
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
        <span className="pt-1 text-[12.5px] font-extrabold text-[#B58A00]">
          {reward.points.toLocaleString()} <span className="ml-0.5 text-[10px] font-bold text-muted-foreground">POINTS</span>
        </span>
      </div>

      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-xl border-[1.5px] border-[#DDD9CD] bg-[#EAE6DA] py-2.5 text-center text-[13px] font-[850] text-[#A39E92]"
      >
        ยังไม่พอ
      </button>
    </Card>
  );

  return (
    <div className="rounded-[26px] border border-[#e6d5b7] bg-[linear-gradient(135deg,#fff7de_0%,#fffef9_100%)] p-4 shadow-[0_10px_24px_rgba(62,36,13,0.06)] sm:p-5">
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
    <div className={cn("rounded-[22px] border border-[#eadcc7] bg-white p-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)] sm:p-5", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[14px] font-black text-[#1A1A1A]">{title}</div>
        {subtitle ? <div className="text-[12px] font-bold text-[#8E8A81]">{subtitle}</div> : null}
      </div>
      {children}
    </div>
  );
}

export default function AdminRewardPage() {
  const { rewardsCatalog } = useAppState();
  const { updateRewardsCatalog } = useAppActions();

  const [draftRewards, setDraftRewards] = useState<RewardCatalogItem[]>(rewardsCatalog);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [editingReward, setEditingReward] = useState<RewardEditorState | null>(null);
  const [deletingReward, setDeletingReward] = useState<RewardCatalogItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraftRewards(rewardsCatalog);
  }, [rewardsCatalog]);

  const totalRewards = draftRewards.length;
  const hotRewards = useMemo(() => draftRewards.filter((reward) => reward.isHot).length, [draftRewards]);
  const averagePoints = useMemo(() => {
    if (draftRewards.length === 0) return 0;
    return Math.round(draftRewards.reduce((sum, reward) => sum + reward.points, 0) / draftRewards.length);
  }, [draftRewards]);

  const categorySummary = useMemo(
    () =>
      CATEGORY_OPTIONS.map((option) => ({
        ...option,
        count: draftRewards.filter((reward) => reward.category === option.value).length,
      })),
    [draftRewards]
  );

  const commitRewards = (rewards: RewardCatalogItem[]) => {
    setDraftRewards(rewards);
    updateRewardsCatalog(rewards);
    setSaveState("saved");
  };

  const addReward = () => {
    const nextReward = makeRewardDraft(draftRewards);
    setEditingReward({
      ...createRewardEditor(nextReward),
      mode: "create",
    });
    setSaveState("idle");
  };

  const openEditReward = (reward: RewardCatalogItem) => {
    setEditingReward(createRewardEditor(reward));
    setSaveState("idle");
  };

  const confirmRewardEdit = () => {
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
    };

    if (editingReward.mode === "create") {
      commitRewards([...draftRewards, payload]);
    } else {
      commitRewards(draftRewards.map((reward) => (reward.id === editingReward.id ? payload : reward)));
    }

    setEditingReward(null);
  };

  const confirmDeleteReward = () => {
    if (!deletingReward) return;
    commitRewards(draftRewards.filter((reward) => reward.id !== deletingReward.id));
    setDeletingReward(null);
  };

  const updateEditingReward = <K extends keyof RewardEditorState>(key: K, value: RewardEditorState[K]) => {
    setEditingReward((current) => (current ? { ...current, [key]: value } : current));
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

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1320px] bg-[#f1ecdf] px-3.5 pt-0 pb-8 font-sarabun md:px-4">
        <SafetyCultureHero
          eyebrow="SAFETY CULTURE ADMIN"
          title={
            <>
              จัดการ <span className="text-[#F5BB00]">Rewards</span>
            </>
          }
          description="ออกแบบ reward catalog, รูปภาพ, รายละเอียด และราคา ให้หน้า Rewards ใช้งานง่ายและดูดีขึ้นจากที่เดียว"
          mascotSrc="/images/mascots/suea-mascot.png"
          mascotAlt="SUEA Admin Mascot"
          actions={
            <div className="mt-[12px] flex flex-wrap gap-2">
              <Link href="/safety-culture/rewards">
                <Button className="h-[32px] rounded-full border border-white/30 bg-white/10 px-4 text-[12.5px] font-black text-white hover:bg-white/14 md:h-[36px] md:text-[13px]">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  กลับไปหน้า Rewards
                </Button>
              </Link>
            </div>
          }
        />

        <div className="mt-4">
          <Card className="rounded-[24px] border border-[#e4d3b3] bg-[#fffaf0] p-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)]">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge className="rounded-xl border border-[#d7c5a7] bg-white px-3 py-2 text-[11px] font-black text-[#5c3214]">
                {totalRewards} rewards
              </Badge>
              <Badge className="rounded-xl border border-[#d7c5a7] bg-[#fff6d6] px-3 py-2 text-[11px] font-black text-[#8b5a12]">
                {hotRewards} hot items
              </Badge>
              <Badge className="rounded-xl border border-[#d7c5a7] bg-white px-3 py-2 text-[11px] font-black text-[#5c3214]">
                Avg {averagePoints.toLocaleString()} pts
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {categorySummary.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.value}
                    className="flex items-center justify-between gap-4 rounded-[20px] border border-[#eadcc7] bg-white px-4 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#fff1c9] text-[#8b5a12]">
                        <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-black text-[#1A1A1A]">{item.label}</div>
                        <div className="text-[12px] font-bold text-[#8E8A81]">ในหมวดนี้</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[24px] font-black leading-none text-[#1A1A1A]">{item.count}</div>
                      <div className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#b58a00]">
                        items
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {saveState === "saved" ? (
              <div className="mt-4 flex items-center rounded-[16px] border border-[#bfd7c0] bg-[#f2fff2] px-3 py-2 text-[12px] font-black text-[#245336]">
                บันทึกเรียบร้อยแล้ว หน้า Rewards หลักอัปเดตทันที
              </div>
            ) : null}
          </Card>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <SectionCard
            title="Reward Catalog Studio"
            description="จัดการ rewards ผ่าน card-based layout เห็นภาพและบริบทของแต่ละรายการได้ทันที"
            icon={<Gift className="h-5 w-5" strokeWidth={2.3} />}
            actions={
              <Button
                onClick={addReward}
                className="h-11 rounded-xl bg-[#ffb000] px-5 text-[13px] font-black text-[#3b1d07] hover:bg-[#ffc02a]"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                New Reward
              </Button>
            }
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {draftRewards.map((reward) => {
                const category = getCategoryMeta(reward.category);
                const CategoryIcon = category.icon;

                return (
                  <Card
                    key={reward.id}
                    className="overflow-hidden rounded-[24px] border border-[#e3d0ae] bg-white p-0 shadow-[0_8px_18px_rgba(62,36,13,0.05)] transition-transform hover:-translate-y-1"
                  >
                    <div className="p-4">
                      <RewardImage reward={reward} />
                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-[17px] font-black text-[#1A1A1A]">{reward.name}</div>
                          <div className="mt-1 flex items-center gap-2 text-[12px] font-black text-[#8E8A81]">
                            <CategoryIcon className="h-3.5 w-3.5 text-[#8b5a12]" strokeWidth={2.2} />
                            {category.label}
                          </div>
                        </div>
                        <div className="rounded-full bg-[#fff1c9] px-3 py-1 text-[12px] font-black text-[#8b5a12]">
                          {reward.points.toLocaleString()} pts
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-3 min-h-[60px] text-[13px] font-bold leading-relaxed text-[#6f665b]">
                        {reward.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#f0e2ca] bg-[#fffaf0] px-4 py-3">
                      <div className="text-[12px] font-black text-[#8E8A81]">
                        {reward.isHot ? "Featured on public page" : reward.imageText}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditReward(reward)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eadcc7] bg-white text-[#5c3214] transition-colors hover:border-[#f5bb00] hover:bg-[#fff7e1] hover:text-[#a36206]"
                          aria-label={`แก้ไขรางวัล ${reward.name}`}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2.2} />
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

        <Dialog open={!!editingReward} onOpenChange={(open) => !open && setEditingReward(null)}>
          <DialogContent
            className={cn(
              "grid h-[min(90vh,960px)] w-[calc(100vw-16px)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[28px] border border-[#e3d0ae] bg-[#fffdfa] p-0 shadow-[0_24px_50px_rgba(62,36,13,0.18)] sm:w-[calc(100vw-32px)] sm:rounded-[32px]",
              editingReward?.mode === "create"
                ? "sm:!max-w-[1180px] lg:!max-w-[1280px]"
                : "sm:!max-w-[1240px] lg:!max-w-[1360px]"
            )}
          >
            <DialogHeader className="border-b border-[#eadcc7] bg-[linear-gradient(180deg,#fff8eb_0%,#fff3d9_100%)] px-5 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5 lg:px-8">
              <DialogTitle className="text-[24px] font-black text-[#5c3214] sm:text-[30px]">
                {editingReward?.mode === "create" ? "Create Reward" : "Edit Reward"}
              </DialogTitle>
              <DialogDescription className="max-w-[840px] text-[13px] font-bold leading-relaxed text-[#8E8A81] sm:text-[14px]">
                {editingReward?.mode === "create"
                  ? "ใช้มุมมองนี้เพื่อสร้าง reward ให้ใกล้กับหน้า public มากขึ้น เห็นรูป ราคา รายละเอียด และสถานะเด่นได้ตั้งแต่ก่อนยืนยัน"
                  : "ปรับรายละเอียด reward และเช็ก preview ไปพร้อมกัน เพื่อให้แก้ไขได้แม่นขึ้นทั้งบน desktop และ mobile"}
              </DialogDescription>
            </DialogHeader>

            {editingReward ? (
              <div className="min-h-0 overflow-y-auto bg-[#fffcf6] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
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
                      <RewardPreviewPanel reward={editingReward} />

                      <DetailCard title="รูปภาพรางวัล" subtitle="อัปโหลดรูปจริงหรือใช้ mockup จาก Image Text">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[#c89a4f] bg-[#fff8eb] px-4 text-[13px] font-black text-[#8b5a12] transition-colors hover:bg-[#fff1d0]"
                          >
                            <ImagePlus className="h-4 w-4" strokeWidth={2.2} />
                            เลือกรูปหรืออัปโหลดรูป
                          </button>
                          <button
                            type="button"
                            onClick={() => updateEditingReward("imageSrc", null)}
                            className="flex h-12 w-full items-center justify-center rounded-[16px] border border-[#eadcc7] bg-white px-4 text-[13px] font-black text-[#5c3214] transition-colors hover:bg-[#fff7e1]"
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
                            <Label className="text-[12px] font-black text-[#5c3214]">Reward Name</Label>
                            <Input
                              value={editingReward.name}
                              onChange={(event) => updateEditingReward("name", event.target.value)}
                              className="h-12 rounded-[18px] border-[#d7c5a7] bg-white px-4 text-[15px] font-bold text-[#2d2116] focus-visible:border-[#f5bb00] focus-visible:ring-0"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-2">
                              <Label className="text-[12px] font-black text-[#5c3214]">Points</Label>
                              <Input
                                value={`${editingReward.points}`}
                                onChange={(event) => updateEditingReward("points", Number(event.target.value) || 0)}
                                className="h-12 rounded-[18px] border-[#d7c5a7] bg-white px-4 text-[15px] font-bold text-[#2d2116] focus-visible:border-[#f5bb00] focus-visible:ring-0"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label className="text-[12px] font-black text-[#5c3214]">Image Text Fallback</Label>
                              <Input
                                value={editingReward.imageText}
                                onChange={(event) => updateEditingReward("imageText", event.target.value)}
                                className="h-12 rounded-[18px] border-[#d7c5a7] bg-white px-4 text-[15px] font-bold text-[#2d2116] focus-visible:border-[#f5bb00] focus-visible:ring-0"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label className="text-[12px] font-black text-[#5c3214]">Description</Label>
                            <Textarea
                              value={editingReward.description}
                              onChange={(event) => updateEditingReward("description", event.target.value)}
                              className="min-h-[156px] rounded-[18px] border-[#d7c5a7] bg-white px-4 py-3 text-[14px] font-bold leading-relaxed text-[#2d2116] focus-visible:border-[#f5bb00] focus-visible:ring-0"
                            />
                          </div>

                          <div className="rounded-[18px] border border-[#eadcc7] bg-[#fff8eb] p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <div className="text-[13px] font-black text-[#5c3214]">รูปภาพรางวัล</div>
                              <div className="text-[12px] font-bold text-[#8E8A81]">อัปโหลดรูปจริงหรือใช้ mockup จาก Image Text</div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[#c89a4f] bg-[#fff8eb] px-4 text-[13px] font-black text-[#8b5a12] transition-colors hover:bg-[#fff1d0]"
                              >
                                <ImagePlus className="h-4 w-4" strokeWidth={2.2} />
                                เลือกรูปหรืออัปโหลดรูป
                              </button>
                              <button
                                type="button"
                                onClick={() => updateEditingReward("imageSrc", null)}
                                className="flex h-12 w-full items-center justify-center rounded-[16px] border border-[#eadcc7] bg-white px-4 text-[13px] font-black text-[#5c3214] transition-colors hover:bg-[#fff7e1]"
                              >
                                ลบรูปออก
                              </button>
                            </div>
                          </div>
                        </div>
                      </DetailCard>

                      <DetailCard title="เลือกหมวดหมู่" subtitle="เลือกประเภทที่เหมาะกับ reward นี้">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {CATEGORY_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const isActive = option.value === editingReward.category;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => updateEditingReward("category", option.value)}
                                className={cn(
                                  "rounded-[20px] border p-4 text-left transition-colors",
                                  isActive
                                    ? "border-[#f5bb00] bg-[#fff5cf] shadow-[0_8px_18px_rgba(245,187,0,0.14)]"
                                    : "border-[#eadcc7] bg-[#fffdfa] hover:bg-[#fff8eb]"
                                )}
                              >
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#8b5a12]">
                                  <Icon className="h-4 w-4" strokeWidth={2.2} />
                                </div>
                                <div className="text-[15px] font-black text-[#1A1A1A]">{option.label}</div>
                                <div className="mt-1 text-[12px] font-bold leading-relaxed text-[#8E8A81]">
                                  {option.hint}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </DetailCard>

                      <DetailCard title="Display Settings" subtitle="กำหนดว่ารางวัลนี้จะเด่นบนหน้า public หรือไม่">
                        <button
                          type="button"
                          onClick={() => updateEditingReward("isHot", !editingReward.isHot)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-left transition-colors",
                            editingReward.isHot
                              ? "border-[#f1c6c6] bg-[#fff3f3] text-[#b43a33]"
                              : "border-[#d7c5a7] bg-[#fffdfa] text-[#5c3214]"
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
                      <RewardPreviewPanel reward={editingReward} />

                      <DetailCard title="รูปภาพรางวัล" subtitle="อัปเดตรูปหรือเคลียร์กลับเป็น mockup">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-12 items-center justify-center gap-2 rounded-[16px] border border-dashed border-[#c89a4f] bg-[#fff8eb] text-[13px] font-black text-[#8b5a12] transition-colors hover:bg-[#fff1d0]"
                          >
                            <ImagePlus className="h-4 w-4" strokeWidth={2.2} />
                            อัปโหลดรูป
                          </button>
                          <button
                            type="button"
                            onClick={() => updateEditingReward("imageSrc", null)}
                            className="flex h-12 items-center justify-center rounded-[16px] border border-[#eadcc7] bg-white text-[13px] font-black text-[#5c3214] transition-colors hover:bg-[#fff7e1]"
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
                            <Label className="text-[12px] font-black text-[#5c3214]">Reward Name</Label>
                            <Input
                              value={editingReward.name}
                              onChange={(event) => updateEditingReward("name", event.target.value)}
                              className="h-12 rounded-[18px] border-[#d7c5a7] bg-white px-4 text-[15px] font-bold text-[#2d2116] focus-visible:border-[#f5bb00] focus-visible:ring-0"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label className="text-[12px] font-black text-[#5c3214]">Points</Label>
                            <Input
                              value={`${editingReward.points}`}
                              onChange={(event) => updateEditingReward("points", Number(event.target.value) || 0)}
                              className="h-12 rounded-[18px] border-[#d7c5a7] bg-white px-4 text-[15px] font-bold text-[#2d2116] focus-visible:border-[#f5bb00] focus-visible:ring-0"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label className="text-[12px] font-black text-[#5c3214]">Image Text Fallback</Label>
                            <Input
                              value={editingReward.imageText}
                              onChange={(event) => updateEditingReward("imageText", event.target.value)}
                              className="h-12 rounded-[18px] border-[#d7c5a7] bg-white px-4 text-[15px] font-bold text-[#2d2116] focus-visible:border-[#f5bb00] focus-visible:ring-0"
                            />
                          </div>
                          <div className="flex flex-col gap-2 lg:col-span-2">
                            <Label className="text-[12px] font-black text-[#5c3214]">Description</Label>
                            <Textarea
                              value={editingReward.description}
                              onChange={(event) => updateEditingReward("description", event.target.value)}
                              className="min-h-[160px] rounded-[18px] border-[#d7c5a7] bg-white px-4 py-3 text-[14px] font-bold leading-relaxed text-[#2d2116] focus-visible:border-[#f5bb00] focus-visible:ring-0"
                            />
                          </div>

                          <div className="rounded-[18px] border border-[#eadcc7] bg-[#fff8eb] p-4 lg:col-span-2">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <div className="text-[13px] font-black text-[#5c3214]">รูปภาพรางวัล</div>
                              <div className="text-[12px] font-bold text-[#8E8A81]">อัปเดตรูปหรือเคลียร์กลับเป็น mockup</div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-12 items-center justify-center gap-2 rounded-[16px] border border-dashed border-[#c89a4f] bg-[#fff8eb] text-[13px] font-black text-[#8b5a12] transition-colors hover:bg-[#fff1d0]"
                              >
                                <ImagePlus className="h-4 w-4" strokeWidth={2.2} />
                                อัปโหลดรูป
                              </button>
                              <button
                                type="button"
                                onClick={() => updateEditingReward("imageSrc", null)}
                                className="flex h-12 items-center justify-center rounded-[16px] border border-[#eadcc7] bg-white text-[13px] font-black text-[#5c3214] transition-colors hover:bg-[#fff7e1]"
                              >
                                ลบรูปออก
                              </button>
                            </div>
                          </div>
                        </div>
                      </DetailCard>

                      <DetailCard title="Display Settings" subtitle="หมวดหมู่ ข้อความสำรอง และสถานะเด่น">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <div className="flex flex-col gap-2">
                            <Label className="text-[12px] font-black text-[#5c3214]">Category</Label>
                            <select
                              value={editingReward.category}
                              onChange={(event) =>
                                updateEditingReward("category", event.target.value as RewardCatalogItem["category"])
                              }
                              className="h-12 rounded-[18px] border border-[#d7c5a7] bg-white px-4 text-[15px] font-bold text-[#2d2116] outline-none"
                            >
                              {CATEGORY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <div className="text-[12px] font-bold text-[#8E8A81]">
                              {getCategoryMeta(editingReward.category).hint}
                            </div>
                          </div>

                          <div className="rounded-[18px] border border-[#eadcc7] bg-[#fffdf8] px-4 py-3">
                            <div className="text-[12px] font-black text-[#5c3214]">Current Fallback</div>
                            <div className="mt-2 text-[15px] font-black text-[#1A1A1A]">
                              {editingReward.imageText || "ยังไม่มีข้อความสำรอง"}
                            </div>
                            <div className="mt-1 text-[12px] font-bold text-[#8E8A81]">
                              ใช้เมื่อ reward นี้ยังไม่มีรูปอัปโหลด
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
                              : "border-[#d7c5a7] bg-[#fffdfa] text-[#5c3214]"
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

            <DialogFooter className="mx-0 mb-0 rounded-b-[28px] border-t border-[#eadcc7] bg-[#fff8eb] px-5 py-4 sm:px-6 lg:px-8">
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:pr-1 lg:pr-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingReward(null)}
                  className="h-10 rounded-full border-[#d7c5a7] bg-white px-4 text-[13px] text-[#5c3214] hover:bg-[#fff4de]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmRewardEdit}
                  className="h-10 rounded-full bg-[#5c3214] px-4 text-[13px] text-white hover:bg-[#4a280f]"
                >
                  {editingReward?.mode === "create" ? "Confirm Create" : "Confirm Update"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deletingReward} onOpenChange={(open) => !open && setDeletingReward(null)}>
          <DialogContent className="max-w-[520px] overflow-hidden rounded-[26px] border border-[#e3d0ae] bg-[#fffdfa] p-0 shadow-[0_24px_50px_rgba(62,36,13,0.18)] sm:rounded-[30px]">
            <DialogHeader className="border-b border-[#eadcc7] bg-[linear-gradient(180deg,#fff8eb_0%,#fff3d9_100%)] px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-5">
              <DialogTitle className="text-[22px] font-black text-[#8a2f2b] sm:text-[26px]">
                Confirm Delete
              </DialogTitle>
              <DialogDescription className="max-w-[420px] text-[12px] font-bold leading-relaxed text-[#8E8A81] sm:text-[14px]">
                แน่ใจใช่ไหมว่าต้องการลบรางวัลนี้ หากยืนยัน รายการจะหายจากหน้า Admin และหน้า Rewards หลักทันที
              </DialogDescription>
            </DialogHeader>

            {deletingReward ? (
              <div className="bg-[#fffcf6] px-4 py-4 sm:px-6 sm:py-6">
                <div className="rounded-[20px] border border-[#f1d1cf] bg-white px-4 py-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)]">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#fff1c9]">
                      {deletingReward.imageSrc ? (
                        <Image src={deletingReward.imageSrc} alt={deletingReward.name} fill className="object-cover" />
                      ) : (
                        <Gift className="h-4 w-4 text-[#8b5a12]" strokeWidth={2.2} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-black text-[#1A1A1A] sm:text-[16px]">
                        {deletingReward.name}
                      </div>
                      <div className="text-[12px] font-bold text-[#8E8A81]">
                        {getCategoryMeta(deletingReward.category).label} · {deletingReward.points.toLocaleString()} points
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <DialogFooter className="mx-0 mb-0 rounded-b-[26px] border-t border-[#eadcc7] bg-[#fff8eb] px-5 py-4 sm:rounded-b-[30px] sm:px-6 sm:py-5">
              <div className="flex w-full justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeletingReward(null)}
                  className="h-10 rounded-full border-[#d7c5a7] bg-white px-4 text-[13px] text-[#5c3214] hover:bg-[#fff4de]"
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
      </div>
    </AppShell>
  );
}
