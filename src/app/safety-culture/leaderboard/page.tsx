"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { SafetyCultureTabs } from "@/components/safety-culture/safety-culture-tabs";
import { SafetyCulturePageHeader } from "@/components/safety-culture/safety-culture-page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAppState } from "@/providers/app-providers";
import { useAppTheme } from "@/providers/theme-provider";

export default function LeaderboardPage() {
  const [mounted] = useState(true);
  const { teamStandings, personalRankings } = useAppState();
  const { themedColor } = useAppTheme();
  const leadingTeam = teamStandings[0];
  const runnerUpTeam = teamStandings[1];
  const leadPoints = leadingTeam && runnerUpTeam ? leadingTeam.points - runnerUpTeam.points : 0;

  const animStyle = (delay: number) => ({
    animationDelay: `${delay}s`,
  });

  return (
    <>
      <div className="mx-auto w-full max-w-[1180px] bg-[var(--background)] px-3.5 pt-2 pb-8 font-sarabun md:px-4">
        <div className="anim-fade" style={animStyle(0)}>
          <SafetyCultureHero
            eyebrow="SUEA SAFETY SCOREBOARD"
            title={
              <>
                ทีมไหน <span className="text-[var(--brand-accent)]">ปลอดภัยสุด</span>
              </>
            }
            description="พี่ SUEA ช่วยสรุปคะแนน Safety ให้เห็นภาพเร็วขึ้น ทั้งคะแนนทีมและอันดับในทีมของคุณ โดยข้อมูลจะอัปเดตตามที่แอดมินจัดการล่าสุด"
            mascotSrc="/images/mascots/suea-mascot.png"
            mascotAlt="SUEA Mascot"
          />
        </div>

        <div className="mt-[13px] mb-[20px] anim-fade" style={animStyle(0.02)}>
          <SafetyCultureTabs />
        </div>

        <div className="mt-2 mb-4 anim-fade" style={animStyle(0.05)}>
          <SafetyCulturePageHeader
            eyebrow="ตารางคะแนน"
            title="คะแนนรวมแต่ละทีม"
            rightSlot={
              <Badge variant="outline" className="rounded-lg border-[#1A1A1A] px-3 py-1 text-xs font-black shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
                อัปเดตสด
              </Badge>
            }
          />
        </div>

        <Card
          className="relative mb-5 flex items-center gap-4 overflow-hidden rounded-[18px] p-4 text-white shadow-[0_10px_25px_rgba(0,0,0,0.12)] anim-fade md:p-4"
          style={{ background: "linear-gradient(135deg, var(--brand-hero-start), var(--brand-text))", ...animStyle(0.1) }}
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-[repeating-linear-gradient(-45deg,var(--brand-accent),var(--brand-accent)_10px,#1A1A1A_10px,#1A1A1A_20px)]" />
          <div className="relative flex w-full items-center gap-4">
            <div
              className="flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-full border-[3px] border-white text-3xl shadow-[0_0_16px_rgba(var(--brand-accent-rgb),0.35)] md:h-[68px] md:w-[68px]"
              style={{ backgroundColor: themedColor(leadingTeam?.color) }}
            >
              <Trophy className="h-8 w-8 text-white" strokeWidth={2.3} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--brand-hero-copy)]/75 md:text-[13px]">ทีมนำตอนนี้</span>
              <div className="mt-0.5 text-[26px] leading-none font-black tracking-tight text-white md:text-[30px]">{leadingTeam?.name ?? "-"}</div>
              <span className="mt-1.5 block text-[13.5px] font-black md:text-[14.5px]" style={{ color: themedColor(leadingTeam?.color) }}>
                + {leadPoints.toLocaleString()} คะแนน เหนือกว่า {runnerUpTeam?.name ?? "-"}
              </span>
              {leadingTeam ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-black text-[var(--brand-soft)]">
                    Leader {leadingTeam.leader}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.45fr_1fr]">
          <div className="flex flex-col gap-3">
            <h3 className="px-1 text-[14px] font-black text-[#1A1A1A]">ลำดับทีม · YTD</h3>
            <div className="flex flex-col gap-3">
              {teamStandings.map((team, idx) => (
                <Card
                  key={team.id}
                  className="flex flex-col gap-2.5 rounded-[16px] border border-[var(--border)] bg-[var(--brand-surface)] p-4 shadow-[0_6px_15px_var(--brand-shadow)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--brand-accent)] hover:shadow-[0_8px_20px_var(--brand-shadow)] anim-fade"
                  style={animStyle(0.1 + idx * 0.04)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="min-w-[15px] text-[18px] font-black text-[#1A1A1A]">{team.rank}</span>
                      <div className="h-9 w-9 flex-shrink-0 rounded-[10px] border border-[#1A1A1A]" style={{ backgroundColor: themedColor(team.color) }} />
                      <div className="min-w-0">
                        <span className="block truncate text-[15.5px] font-black text-[#1A1A1A]">{team.name}</span>
                        <span className="text-[11px] font-bold text-[var(--brand-muted-text)]">
                          {team.leader} · {team.members} สมาชิก
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-[15.5px] font-black text-[#1A1A1A]">{team.points.toLocaleString()}</span>
                      <span className="block text-[9px] font-bold text-[var(--brand-muted-text)]">คะแนน</span>
                    </div>
                  </div>
                  <div className="h-[6px] w-full overflow-hidden rounded-full bg-[var(--secondary)]">
                    <div
                      className="h-full rounded-full transition-[width] duration-1000 ease-out"
                      style={{ width: mounted ? `${team.percent}%` : "0%", backgroundColor: themedColor(team.color) }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Card
              className="flex flex-col gap-4 rounded-[16px] border border-[var(--border)] bg-[var(--brand-surface)] p-4 shadow-[0_10px_24px_rgba(62,36,13,0.02)] anim-fade"
              style={animStyle(0.25)}
            >
              <h3 className="text-[15.5px] font-black text-[#1A1A1A]">ผู้ทำคะแนนสูงสุด · เดือนนี้</h3>
              <div className="flex flex-col gap-1.5">
                {personalRankings.map((user) => (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center justify-between rounded-xl border-[1.5px] px-3 py-2 text-[14.5px] font-bold text-[#1A1A1A] transition-all duration-200",
                      user.active
                        ? "border-[var(--brand-accent)] bg-[var(--brand-soft)] shadow-[0_2px_8px_rgba(var(--brand-accent-rgb),0.08)]"
                        : "border-transparent bg-transparent"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={cn("min-w-[20px] font-black", user.active ? "text-[var(--brand-accent)]" : "text-[var(--brand-muted-text)]")}>{user.rank}</span>
                      <div className="min-w-0">
                        <span className="block truncate font-[750]">{user.name}</span>
                        <span className="block text-[11px] font-bold text-[var(--brand-muted-text)]">{user.team}</span>
                      </div>
                    </div>
                    <span className="flex-shrink-0 font-black">{user.points} แต้ม</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
