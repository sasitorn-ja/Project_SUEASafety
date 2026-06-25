"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Gift } from "lucide-react";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { SafetyCultureTabs } from "@/components/safety-culture/safety-culture-tabs";
import { SafetyCulturePageHeader } from "@/components/safety-culture/safety-culture-page-header";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppActions, useAppState } from "@/providers/app-providers";
import { cn } from "@/lib/utils";
import { useAppTheme } from "@/providers/theme-provider";

function formatRewardDateTime(value?: string | null) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function getRewardAvailability(reward: {
  redeemStartAt?: string | null;
  redeemEndAt?: string | null;
  stockMode?: "limited" | "unlimited";
  stockTotal?: number | null;
  stockRemaining?: number | null;
}) {
  const now = Date.now();
  const startAt = reward.redeemStartAt ? Date.parse(reward.redeemStartAt) : NaN;
  const endAt = reward.redeemEndAt ? Date.parse(reward.redeemEndAt) : NaN;
  const hasStarted = Number.isNaN(startAt) || startAt <= now;
  const hasEnded = !Number.isNaN(endAt) && endAt < now;
  const remaining = Math.max(0, Number(reward.stockRemaining) || 0);
  const inStock = reward.stockMode !== "limited" || remaining > 0;

  return {
    hasStarted,
    hasEnded,
    inStock,
    remaining,
  };
}

function getRewardScheduleText(reward: { redeemStartAt?: string | null; redeemEndAt?: string | null }) {
  const startLabel = formatRewardDateTime(reward.redeemStartAt);
  const endLabel = formatRewardDateTime(reward.redeemEndAt);

  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`;
  if (startLabel) return `เริ่มแลก ${startLabel}`;
  if (endLabel) return `แลกได้ถึง ${endLabel}`;
  return "แลกได้ตลอดเวลา";
}

function getRewardRemainingOnlyLabel(reward: {
  stockMode?: "limited" | "unlimited";
  stockRemaining?: number | null;
}) {
  if (reward.stockMode !== "limited") return "พร้อมใช้งาน";

  const remaining = Math.max(0, Number(reward.stockRemaining) || 0);
  return `คงเหลือ ${remaining} ชิ้น`;
}

export default function RewardsPage() {
  const { themedImage, mascot } = useAppTheme();
  const { currentUserPoints, rewardsCatalog, rewardCategories } = useAppState();
  const { redeemPoints } = useAppActions();
  const [filter, setFilter] = useState("all");
  const [redeeming, setRedeeming] = useState<(typeof rewardsCatalog)[number] | null>(null);
  const [result, setResult] = useState<{ type: "success" | "error"; title: string; desc: string } | null>(null);

  const animStyle = (delay: number) => ({
    animationDelay: `${delay}s`,
  });

  const rewardFilters = useMemo(() => {
    const categoriesInUse = new Set(rewardsCatalog.map((reward) => reward.category));
    const fallbackCategories = rewardsCatalog
      .filter((reward) => !rewardCategories.some((category) => category.value === reward.category))
      .map((reward) => ({
        value: reward.category,
        label: reward.category,
      }));

    return [
      { value: "all", label: "ทั้งหมด" },
      ...rewardCategories
        .filter((category) => categoriesInUse.has(category.value))
        .map((category) => ({ value: category.value, label: category.label })),
      ...fallbackCategories,
    ].filter((item, index, array) => array.findIndex((candidate) => candidate.value === item.value) === index);
  }, [rewardCategories, rewardsCatalog]);

  useEffect(() => {
    if (filter === "all") return;
    if (rewardFilters.some((item) => item.value === filter)) return;
    setFilter("all");
  }, [filter, rewardFilters]);

  const handleRedeem = (item: (typeof rewardsCatalog)[number]) => {
    const availability = getRewardAvailability(item);

    if (!availability.hasStarted) {
      setResult({
        type: "error",
        title: "ยังไม่ถึงเวลาแลก",
        desc: `รางวัลนี้จะเริ่มแลกได้ ${getRewardScheduleText(item)}`,
      });
      return;
    }

    if (availability.hasEnded) {
      setResult({
        type: "error",
        title: "หมดเวลาแลกแล้ว",
        desc: `รางวัลนี้ปิดการแลกแล้ว (${getRewardScheduleText(item)})`,
      });
      return;
    }

    if (!availability.inStock) {
      setResult({
        type: "error",
        title: "สินค้าหมดแล้ว",
        desc: `รางวัล "${item.name}" หมดสต็อกแล้ว กรุณาเลือกรางวัลอื่น`,
      });
      return;
    }

    if (currentUserPoints < item.points) {
      setResult({
        type: "error",
        title: "คะแนนยังไม่พอ",
        desc: `ต้องใช้ ${item.points.toLocaleString()} แต้ม แต่คุณมี ${currentUserPoints.toLocaleString()} แต้ม`,
      });
      return;
    }

    setRedeeming(item);
  };

  const confirmRedeem = async () => {
    if (!redeeming) return;

    const redeemResult = await redeemPoints(redeeming.id, redeeming.points);
    if (!redeemResult.ok) {
      setRedeeming(null);
      setResult({
        type: "error",
        title:
          redeemResult.reason === "out-of-stock"
            ? "สินค้าหมดแล้ว"
            : redeemResult.reason === "not-started"
              ? "ยังไม่ถึงเวลาแลก"
              : redeemResult.reason === "expired"
                ? "หมดเวลาแลกแล้ว"
                : redeemResult.reason === "api-error"
                  ? "ไม่สามารถแลกรางวัลได้"
                  : "คะแนนยังไม่พอ",
        desc:
          redeemResult.reason === "out-of-stock"
            ? `รางวัล "${redeeming.name}" หมดสต็อกแล้ว`
            : redeemResult.reason === "not-started" || redeemResult.reason === "expired"
              ? getRewardScheduleText(redeeming)
              : redeemResult.reason === "api-error"
                ? "ระบบไม่สามารถบันทึกการแลกรางวัลได้ กรุณาลองใหม่"
                : "คะแนนอาจถูกใช้ไปแล้ว กรุณาลองใหม่",
      });
      return;
    }

    setRedeeming(null);
    setResult({
      type: "success",
      title: "แลกรางวัลสำเร็จ",
      desc: `รหัสแลกรางวัล "${redeeming.name}" จะถูกส่งไปทาง SMS ของคุณ`,
    });
  };

  const filtered = filter === "all" ? rewardsCatalog : rewardsCatalog.filter((reward) => reward.category === filter);

  return (
    <>
      <div className="mx-auto w-full max-w-[1480px] bg-[var(--background)] px-3.5 pt-2.5 pb-8 md:px-5">
        <div className="anim-fade" style={animStyle(0)}>
          <SafetyCultureHero
            eyebrow="SAFETY CARING REWARDS SHOP"
            title={
              <>
                ทำดี แลกของ <span className="text-[var(--brand-accent)]">ให้ทีมภูมิใจ</span>
              </>
            }
            description="คะแนน Safety ของคุณเปลี่ยนเป็นรางวัลสุดแสนพิเศษได้"
            variant="community"
            backgroundImage="/images/heroes/safety-culture-rewards-hero.png"
            backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.82) 0%, rgba(210,235,255,.60) 32%, rgba(210,235,255,.10) 56%, rgba(210,235,255,0) 74%)"
          />
        </div>

        <div className="mt-4 mb-6 anim-fade" style={animStyle(0.02)}>
          <SafetyCultureTabs />
        </div>

        <div className="mt-2 mb-4 anim-fade" style={animStyle(0.05)}>
          <SafetyCulturePageHeader
            eyebrow="แลกของรางวัลรายบุคคล"
            title="ร้านแลกของรางวัล"
            rightSlot={
              <div className="flex items-center gap-1.5 rounded-xl border-2 border-[var(--brand-accent)] bg-[var(--brand-soft)] px-3.5 py-1.5 text-[13.5px] font-black text-[var(--brand-text)] shadow-[0_2px_6px_rgba(var(--brand-accent-rgb),0.12)]">
                <Gift className="h-4 w-4 text-[var(--brand-accent)]" strokeWidth={2.5} />
                <span>{currentUserPoints.toLocaleString()} แต้ม</span>
              </div>
            }
          />
        </div>

        {rewardsCatalog.length > 0 ? (
          <div className="scrollbar-hide mb-4 flex gap-2 overflow-x-auto py-2 anim-fade" style={animStyle(0.12)}>
            {rewardFilters.map((tag) => (
              <button
                key={tag.value}
                onClick={() => setFilter(tag.value)}
                className={cn(
                  "flex-shrink-0 whitespace-nowrap rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-bold transition-all",
                  filter === tag.value
                    ? "border-[var(--brand-text)] bg-[var(--brand-text)] text-white shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
                    : "border-[var(--border)] bg-white text-[var(--brand-text)] hover:border-[var(--brand-accent)] hover:bg-[var(--brand-soft)]"
                )}
              >
                {tag.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((reward, idx) => {
            const availability = getRewardAvailability(reward);
            const locked = currentUserPoints < reward.points;
            const disabledReason = !availability.hasStarted
              ? "ยังไม่ถึงเวลา"
              : availability.hasEnded
                ? "หมดเขตแลก"
                : !availability.inStock
                  ? "ของหมด"
                  : locked
                    ? "ยังไม่พอ"
                    : null;

            return (
              <Card
                key={reward.id}
                className="relative flex flex-col gap-3 rounded-[16px] border-[var(--border)] bg-[var(--brand-surface)] p-3.5 shadow-[0_4px_10px_rgba(0,0,0,0.01)] transition-all hover:-translate-y-0.5 hover:border-[var(--brand-accent)] hover:shadow-[0_12px_28px_var(--brand-shadow)] anim-fade"
                style={animStyle(0.15 + idx * 0.05)}
              >
                {reward.isHot && (
                  <span className="absolute top-2.5 left-2.5 z-10 rounded-md bg-[#D9383A] px-2 py-0.5 text-[9.5px] font-black tracking-wide text-white shadow-[0_2px_6px_rgba(217,56,58,0.25)]">
                    HOT
                  </span>
                )}

                <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[14px] border-[1.5px] border-[var(--border)] bg-[var(--brand-image-placeholder)]">
                  {reward.imageSrc ? (
                    <Image src={themedImage(reward.imageSrc)} alt={reward.name} fill sizes="(max-width: 768px) 50vw, 220px" className="object-cover" />
                  ) : reward.isHot ? (
                    <Image src={mascot("welcome")} alt="น้องวางใจ reward" fill sizes="(max-width: 768px) 50vw, 220px" className="object-cover" />
                  ) : (
                    <span className="text-[13px] font-extrabold lowercase text-[var(--brand-muted-text)]">{reward.imageText}</span>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-3">
                    <span className="line-clamp-2 text-[14.5px] font-[850] text-foreground">{reward.name}</span>
                    <span className="flex-shrink-0 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[11px] font-black text-[var(--brand-text)]">
                      {reward.points.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="flex min-h-[58px] flex-wrap content-start gap-1.5 pt-2">
                    <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[11px] font-black text-[var(--brand-text)]">
                      {getRewardRemainingOnlyLabel(reward)}
                    </span>
                    {reward.redeemStartAt || reward.redeemEndAt ? (
                      <span className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-[11px] font-black text-[var(--brand-muted-text)]">
                        {getRewardScheduleText(reward)}
                      </span>
                    ) : null}
                  </div>
                </div>

                {disabledReason ? (
                  <button disabled className="w-full cursor-not-allowed rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--secondary)] py-2.5 text-center text-[13px] font-[850] text-[var(--c-a39e92)]">
                    {disabledReason}
                  </button>
                ) : (
                  <button
                    onClick={() => handleRedeem(reward)}
                    className="w-full rounded-xl bg-[#1A1A1A] py-2.5 text-center text-[13px] font-[850] text-white outline-none transition-all hover:bg-[var(--brand-accent)] hover:text-[#1A1A1A]"
                  >
                    แลกรางวัล
                  </button>
                )}
              </Card>
            );
          })}
        </div>

        {rewardsCatalog.length === 0 ? (
          <Card className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-5 py-10 text-center">
            <p className="text-[17px] font-black text-[var(--brand-text)]">ยังไม่มีของรางวัลในระบบ</p>
            <p className="mt-2 text-[13px] font-bold text-[var(--brand-muted-text)]">
              เมื่อมีรางวัลในระบบ รายการจะแสดงที่นี่
            </p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-5 py-10 text-center">
            <p className="text-[17px] font-black text-[var(--brand-text)]">ไม่มีรางวัลในหมวดนี้</p>
          </Card>
        ) : null}
      </div>

      <Dialog open={!!redeeming} onOpenChange={(open) => !open && setRedeeming(null)}>
        <DialogContent className="p-4 text-center sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-3 text-xl font-extrabold text-foreground">
              <div className="w-[120px] animate-[sueaMascotFloat_1.8s_ease-in-out_infinite_alternate]">
                <Image
                  src={mascot("happyClaim")}
                  alt="น้องวางใจ Safety mascot"
                  width={120}
                  height={120}
                  className="mascot-motion h-auto w-full"
                />
              </div>
              ยืนยันการแลกรางวัล
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm font-semibold leading-relaxed text-[#555149]">
            คุณต้องการใช้คะแนนจำนวน <strong className="text-[var(--brand-accent-strong)]">{redeeming?.points} แต้ม</strong> เพื่อแลก
            <br />
            <strong>&quot;{redeeming?.name}&quot;</strong> ใช่หรือไม่?
          </p>
          {redeeming ? (
            <div className="rounded-[14px] border border-[var(--border)] bg-white/80 px-3 py-2 text-left text-[12px] font-bold text-[#6f665b]">
              <div>{redeeming.stockMode === "limited" ? `คงเหลือ ${Math.max(0, Number(redeeming.stockRemaining) || 0)} ชิ้น` : "ไม่จำกัดจำนวน"}</div>
              <div className="mt-1">{getRewardScheduleText(redeeming)}</div>
            </div>
          ) : null}
          <div className="flex flex-col gap-2.5">
            <button onClick={confirmRedeem} className="w-full rounded-xl bg-[#1A1A1A] py-3 text-center text-[13px] font-[850] text-white transition-all hover:bg-[var(--brand-accent)] hover:text-[#1A1A1A]">
              ยืนยันการแลก
            </button>
            <button
              onClick={() => setRedeeming(null)}
              className="w-full rounded-xl bg-[var(--secondary)] py-2.5 text-center text-[13px] font-[850] text-foreground transition-colors hover:bg-[var(--border)]"
            >
              ยกเลิก
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!result} onOpenChange={(open) => !open && setResult(null)}>
        <DialogContent className="p-4 text-center sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-3 text-xl font-extrabold text-foreground">
              <span className="text-[52px] leading-none">{result?.type === "success" ? "✓" : "!"}</span>
              {result?.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm font-semibold leading-relaxed text-[#555149]">{result?.desc}</p>
          <button onClick={() => setResult(null)} className="w-full rounded-xl bg-[#1A1A1A] py-3 text-center text-[13px] font-[850] text-white transition-all hover:bg-[var(--brand-accent)] hover:text-[#1A1A1A]">
            ตกลง
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
