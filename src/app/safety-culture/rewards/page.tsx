"use client";

import Image from "next/image";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { SafetyCultureTabs } from "@/components/safety-culture/safety-culture-tabs";
import { SafetyCulturePageHeader } from "@/components/safety-culture/safety-culture-page-header";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppActions, useAppState } from "@/providers/app-providers";
import { cn } from "@/lib/utils";
import { REWARD_TAGS } from "@/lib/safety-culture";

export default function RewardsPage() {
  const { currentUserPoints, rewardsCatalog } = useAppState();
  const { redeemPoints } = useAppActions();
  const [filter, setFilter] = useState("ทั้งหมด");
  const [redeeming, setRedeeming] = useState<(typeof rewardsCatalog)[number] | null>(null);
  const [result, setResult] = useState<{ type: "success" | "error"; title: string; desc: string } | null>(null);

  const animStyle = (delay: number) => ({
    animationDelay: `${delay}s`,
  });

  const handleRedeem = (item: (typeof rewardsCatalog)[number]) => {
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

  const confirmRedeem = () => {
    if (!redeeming) return;

    const success = redeemPoints(redeeming.points);
    if (!success) {
      setRedeeming(null);
      setResult({
        type: "error",
        title: "คะแนนยังไม่พอ",
        desc: "คะแนนอาจถูกใช้ไปแล้ว กรุณาลองใหม่",
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

  const filtered =
    filter === "ทั้งหมด"
      ? rewardsCatalog
      : rewardsCatalog.filter((reward) =>
          filter === "บัตรของขวัญ"
            ? reward.category === "voucher"
            : filter === "สินค้า"
              ? reward.category === "merch"
              : filter === "PPE"
                ? reward.category === "ppe"
                : filter === "ของขวัญทีม"
                  ? reward.category === "team"
                  : true
        );

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1180px] px-3.5 pt-2 pb-8 md:px-4">
        <div className="anim-fade" style={animStyle(0)}>
          <SafetyCultureHero
            eyebrow="SUEA REWARDS SHOP"
            title={
              <>
                ทำดี แลกของ <span className="text-[#F5BB00]">ให้ทีมภูมิใจ</span>
              </>
            }
            description="คะแนน Safety ของคุณเปลี่ยนเป็นรางวัลได้ พี่ SUEA คอยเชียร์ให้เก็บแต้มต่อทุกวัน"
            mascotSrc="/images/mascots/gallery/ppe-2.png"
            mascotAlt="SUEA Mascot"
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
              <div className="flex items-center gap-1.5 rounded-xl border-2 border-[#F5BB00] bg-[#FFF9E6] px-3.5 py-1.5 text-[13.5px] font-black text-[#1A1A1A] shadow-[0_2px_6px_rgba(245,187,0,0.12)]">
                <span>🪙</span>
                <span>{currentUserPoints.toLocaleString()} แต้ม</span>
              </div>
            }
          />
        </div>

        <div className="scrollbar-hide mb-4 flex gap-2 overflow-x-auto py-2 anim-fade" style={animStyle(0.12)}>
          {REWARD_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className={cn(
                "flex-shrink-0 whitespace-nowrap rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-bold transition-all",
                filter === tag
                  ? "border-[#5C350C] bg-[#5C350C] text-white shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
                  : "border-[#DDD9CD] bg-white text-[#555149] hover:border-[#B78922] hover:bg-[#FFF7E8]"
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((reward, idx) => {
            const locked = currentUserPoints < reward.points;

            return (
              <Card
                key={reward.id}
                className="relative flex flex-col gap-3 rounded-[22px] border-[#E4D4B8] bg-[#FFFDF7] p-3.5 shadow-[0_4px_10px_rgba(0,0,0,0.01)] transition-all hover:-translate-y-0.5 hover:border-[#C49A45] hover:shadow-[0_12px_28px_rgba(62,36,13,0.08)] anim-fade"
                style={animStyle(0.15 + idx * 0.05)}
              >
                {reward.isHot && (
                  <span className="absolute top-2.5 left-2.5 z-10 rounded-md bg-[#D9383A] px-2 py-0.5 text-[9.5px] font-black tracking-wide text-white shadow-[0_2px_6px_rgba(217,56,58,0.25)]">
                    HOT
                  </span>
                )}

                <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[14px] border-[1.5px] border-[#E4D4B8] bg-[#F7EAD6]">
                  {reward.imageSrc ? (
                    <Image
                      src={reward.imageSrc}
                      alt={reward.name}
                      fill
                      className="object-cover"
                    />
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
                  <span className="text-[14.5px] font-[850] text-foreground">{reward.name}</span>
                  <p className="line-clamp-2 text-[12.5px] font-bold leading-relaxed text-[#7d766b]">
                    {reward.description}
                  </p>
                  <span className="pt-1 text-[12.5px] font-extrabold text-[#B58A00]">
                    {reward.points.toLocaleString()} <span className="ml-0.5 text-[10px] font-bold text-muted-foreground">POINTS</span>
                  </span>
                </div>

                {locked ? (
                  <button disabled className="w-full cursor-not-allowed rounded-xl border-[1.5px] border-[#DDD9CD] bg-[#EAE6DA] py-2.5 text-center text-[13px] font-[850] text-[#A39E92]">
                    ยังไม่พอ
                  </button>
                ) : (
                  <button
                    onClick={() => handleRedeem(reward)}
                    className="w-full rounded-xl bg-[#1A1A1A] py-2.5 text-center text-[13px] font-[850] text-white outline-none transition-all hover:bg-[#F5BB00] hover:text-[#1A1A1A]"
                  >
                    แลกรางวัล
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={!!redeeming} onOpenChange={(open) => !open && setRedeeming(null)}>
        <DialogContent className="rounded-[28px] border-[3px] border-[#1A1A1A] bg-[#FAF8F2] p-6 text-center sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-3 text-xl font-extrabold text-foreground">
              <div className="w-[120px] animate-[sueaMascotFloat_1.8s_ease-in-out_infinite_alternate]">
                <Image
                  src="/images/mascots/gallery/reward-highlight.png"
                  alt="SUEA Mascot"
                  width={120}
                  height={120}
                  className="h-auto w-full"
                />
              </div>
              ยืนยันการแลกรางวัล
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm font-semibold leading-relaxed text-[#555149]">
            คุณต้องการใช้คะแนนจำนวน <strong className="text-[#B58A00]">{redeeming?.points} แต้ม</strong> เพื่อแลก
            <br />
            <strong>&quot;{redeeming?.name}&quot;</strong> ใช่หรือไม่?
          </p>
          <div className="flex flex-col gap-2.5">
            <button onClick={confirmRedeem} className="w-full rounded-xl bg-[#1A1A1A] py-3 text-center text-[13px] font-[850] text-white transition-all hover:bg-[#F5BB00] hover:text-[#1A1A1A]">
              ยืนยันการแลก
            </button>
            <button
              onClick={() => setRedeeming(null)}
              className="w-full rounded-xl bg-[#EAE6DA] py-2.5 text-center text-[13px] font-[850] text-foreground transition-colors hover:bg-[#DDD9CD]"
            >
              ยกเลิก
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!result} onOpenChange={(open) => !open && setResult(null)}>
        <DialogContent className="rounded-[28px] border-[3px] border-[#1A1A1A] bg-[#FAF8F2] p-6 text-center sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-3 text-xl font-extrabold text-foreground">
              <span className="text-[52px] leading-none">{result?.type === "success" ? "✓" : "!"}</span>
              {result?.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm font-semibold leading-relaxed text-[#555149]">{result?.desc}</p>
          <button onClick={() => setResult(null)} className="w-full rounded-xl bg-[#1A1A1A] py-3 text-center text-[13px] font-[850] text-white transition-all hover:bg-[#F5BB00] hover:text-[#1A1A1A]">
            ตกลง
          </button>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
