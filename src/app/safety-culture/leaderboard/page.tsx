"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Trophy, UsersRound } from "lucide-react";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { SafetyCultureTabs } from "@/components/safety-culture/safety-culture-tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAppState } from "@/providers/app-providers";
import { useAppTheme } from "@/providers/theme-provider";

const TOP_RANK_STYLES = [
  {
    badgeClassName:
      "border-[rgba(236,182,36,0.34)] bg-[linear-gradient(180deg,rgba(255,224,122,0.95),rgba(238,184,49,0.88))] text-[#7a4b00]",
    avatarRingClassName: "ring-[rgba(236,182,36,0.45)]",
  },
  {
    badgeClassName:
      "border-[rgba(141,154,173,0.28)] bg-[linear-gradient(180deg,rgba(242,246,251,0.96),rgba(201,211,225,0.9))] text-[#4f5f74]",
    avatarRingClassName: "ring-[rgba(141,154,173,0.32)]",
  },
  {
    badgeClassName:
      "border-[rgba(190,140,108,0.28)] bg-[linear-gradient(180deg,rgba(250,232,219,0.96),rgba(223,172,137,0.88))] text-[#87563b]",
    avatarRingClassName: "ring-[rgba(190,140,108,0.32)]",
  },
];

function formatRankLabel(rank: string) {
  const digits = rank.replace(/[^\d]/g, "");
  return digits ? `#${digits}` : rank;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function LeaderboardPage() {
  const [mounted] = useState(true);
  const [showAllTopScorers, setShowAllTopScorers] = useState(false);
  const { teamStandings, personalRankings } = useAppState();
  const { themedColor } = useAppTheme();
  const leadingTeam = teamStandings[0];
  const runnerUpTeam = teamStandings[1];
  const leadPoints = leadingTeam && runnerUpTeam ? leadingTeam.points - runnerUpTeam.points : 0;
  const topScorers = [...personalRankings];
  const visibleTopScorers = showAllTopScorers ? topScorers.slice(0, 10) : topScorers.slice(0, 4);

  const animStyle = (delay: number) => ({
    animationDelay: `${delay}s`,
  });

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] bg-[var(--background)] px-3.5 pt-2 pb-8 font-sarabun md:px-4 xl:px-6">
        <div className="anim-fade" style={animStyle(0)}>
          <SafetyCultureHero
            eyebrow="CPAC SAFETY SCOREBOARD"
            title={
              <>
                ทีมไหน <span className="text-[var(--brand-accent)]">ปลอดภัยสุด</span>
              </>
            }
            description="CPAC Safety ช่วยสรุปคะแนน Safety ให้เห็นภาพรวม ทั้งคะแนนทีมและอันดับในทีมของคุณ"
            mascotSrc="/images/mascots/suea-mascot.png"
            mascotAlt="SUEA Mascot"
            mascotAction="salute"
            actionsLayout="side"
            actions={
              leadingTeam ? (
                <div className="mt-2 w-full max-w-[410px] rounded-[22px] border border-white/16 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,255,255,0.92))] px-3 py-2.5 text-[var(--foreground)] shadow-[0_12px_24px_rgba(0,0,0,0.16)] backdrop-blur-sm sm:px-3.5 md:mt-0">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-[3px] border-white shadow-[0_8px_18px_rgba(0,0,0,0.10)] sm:h-15 sm:w-15"
                      style={{ background: `linear-gradient(180deg, ${themedColor(leadingTeam.color)}, color-mix(in srgb, ${themedColor(leadingTeam.color)} 84%, white))` }}
                    >
                      <Trophy className="h-7 w-7 text-white" strokeWidth={2.4} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[12px] font-extrabold tracking-[0.01em] text-[var(--brand-muted-text)]">ทีมนำตอนนี้</p>
                      <h2 className="truncate text-[26px] leading-none font-black tracking-tight text-[var(--foreground)] sm:text-[30px]">
                        {leadingTeam.name}
                      </h2>
                      <p className="mt-1 text-[13.5px] font-black sm:text-[15px]" style={{ color: themedColor(leadingTeam.color) }}>
                        +{leadPoints.toLocaleString()} คะแนน เหนือกว่า {runnerUpTeam?.name ?? "-"}
                      </p>
                      <div className="mt-2 inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--brand-soft)] px-2.5 py-1 text-[11px] font-black text-[var(--brand-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                        Leader {leadingTeam.leader}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null
            }
          />
        </div>

        <div className="mt-[13px] mb-[20px] anim-fade" style={animStyle(0.02)}>
          <SafetyCultureTabs />
        </div>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.95fr)] 2xl:grid-cols-[minmax(0,1.78fr)_minmax(380px,0.92fr)]">
          <Card
            className="overflow-hidden rounded-[24px] border-[1.5px] border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.62))] shadow-[0_16px_36px_var(--brand-shadow)] backdrop-blur-sm anim-fade"
            style={animStyle(0.15)}
          >
            <div className="border-b border-[var(--border)] px-3.5 py-3.5 md:px-5 md:py-4">
              <p className="text-[13px] font-black tracking-[0.01em] text-[var(--foreground)] md:text-[14px]">ลำดับทีม · YTD</p>
            </div>

            <div className="space-y-2.5 p-2.5 md:space-y-3 md:p-4">
              {teamStandings.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-4 py-8 text-center">
                  <p className="text-[14px] font-black text-[var(--foreground)]">ยังไม่มีข้อมูลทีม</p>
                  <p className="mt-1 text-[12px] font-bold text-[var(--brand-muted-text)]">เมื่อมีข้อมูลทีมใน DB ระบบจะแสดงอันดับที่นี่</p>
                </div>
              ) : teamStandings.map((team, idx) => (
                <article
                  key={team.id}
                  className="rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] px-2.5 py-2.5 shadow-[0_8px_22px_var(--brand-shadow)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[rgba(var(--brand-accent-rgb),0.45)] md:rounded-[20px] md:px-4 md:py-3"
                  style={animStyle(0.18 + idx * 0.04)}
                >
                  <div className="flex items-center gap-2.5 md:gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5 md:gap-3.5">
                      <div className="flex w-6 flex-shrink-0 items-center justify-center text-[18px] font-black text-[var(--foreground)] md:w-8 md:text-[22px]">
                        {team.rank}
                      </div>
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] md:h-12 md:w-12 md:rounded-[14px]"
                        style={{ background: `linear-gradient(180deg, ${themedColor(team.color)}, color-mix(in srgb, ${themedColor(team.color)} 76%, white))` }}
                      >
                        <UsersRound className="h-5 w-5 text-white md:h-6 md:w-6" strokeWidth={2.2} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <h4 className="truncate text-[15px] font-black text-[var(--foreground)] md:text-[18px]">{team.name}</h4>
                          {idx === 0 ? (
                            <span className="rounded-full bg-[var(--brand-soft)] px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-[0.12em] text-[var(--brand-text)] md:px-2 md:text-[10px]">
                              Leader
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] font-bold text-[var(--brand-muted-text)] md:text-[12.5px]">
                          {team.leader} · {team.members} สมาชิก
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-[17px] leading-none font-black text-[var(--foreground)] md:text-[22px]">{team.points.toLocaleString()}</p>
                      <p className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.1em] text-[var(--brand-muted-text)] md:text-[10px] md:tracking-[0.12em]">คะแนน</p>
                    </div>
                  </div>

                  <div className="mt-2.5 md:mt-3">
                    <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-[var(--brand-muted-text)] md:mb-1.5 md:text-[11px]">
                      <span>ภาพรวมทีม</span>
                      <span>{team.percent}%</span>
                    </div>
                    <div className="h-[6px] w-full overflow-hidden rounded-full bg-[var(--secondary)] md:h-[7px]">
                      <div
                        className="h-full rounded-full transition-[width] duration-1000 ease-out"
                        style={{ width: mounted ? `${team.percent}%` : "0%", backgroundColor: themedColor(team.color) }}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>

          </Card>

          <Card
            className="overflow-hidden rounded-[24px] border-[1.5px] border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.70))] shadow-[0_16px_36px_var(--brand-shadow)] backdrop-blur-sm anim-fade"
            style={animStyle(0.24)}
          >
            <div className="border-b border-[var(--border)] px-3.5 py-3.5 md:px-5 md:py-4">
              <p className="text-[13px] font-black tracking-[0.01em] text-[var(--foreground)] md:text-[14px]">อันดับในทีมของฉัน · เดือนนี้</p>
            </div>

            <div className="space-y-2.5 p-2.5 md:p-4">
              {visibleTopScorers.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-4 py-8 text-center">
                  <p className="text-[14px] font-black text-[var(--foreground)]">ยังไม่มีอันดับในทีม</p>
                  <p className="mt-1 text-[12px] font-bold text-[var(--brand-muted-text)]">ระบบจะแสดงอันดับเมื่อคุณมีทีมและมีสมาชิกทีมใน DB</p>
                </div>
              ) : visibleTopScorers.map((user, index) => {
                const rankStyle = TOP_RANK_STYLES[index] ?? {
                  badgeClassName: "border-[var(--border)] bg-[var(--brand-soft)] text-[var(--brand-text)]",
                  avatarRingClassName: "ring-[rgba(var(--brand-accent-rgb),0.26)]",
                };

                return (
                  <article
                    key={user.id}
                    className={cn(
                      "flex items-center justify-between gap-2.5 rounded-[18px] border px-2.5 py-2.5 shadow-[0_8px_22px_var(--brand-shadow)] transition-all duration-200 md:gap-3 md:px-4 md:py-3",
                      user.active
                        ? "border-[rgba(var(--brand-accent-rgb),0.55)] bg-[linear-gradient(180deg,rgba(var(--brand-accent-rgb),0.10),rgba(var(--brand-accent-rgb),0.03))]"
                        : "border-[var(--border)] bg-[var(--brand-surface)] hover:border-[rgba(var(--brand-accent-rgb),0.4)]"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
                      <div
                        className={cn(
                          "flex h-8 min-w-8 items-center justify-center rounded-full border text-[11px] font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] md:h-9 md:min-w-9 md:text-[13px]",
                          rankStyle.badgeClassName
                        )}
                      >
                        {formatRankLabel(user.rank)}
                      </div>

                      <div
                        className={cn(
                          "relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(180deg,var(--brand-accent),var(--brand-nav-active))] text-[13px] font-black text-white ring-2 ring-offset-2 ring-offset-[var(--brand-surface)] md:h-12 md:w-12 md:text-[15px]",
                          rankStyle.avatarRingClassName
                        )}
                      >
                        <span>{getInitials(user.name)}</span>
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.18))]" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[15px] leading-tight font-black text-[var(--foreground)] md:text-[18px]">{user.name}</p>
                        <p className="mt-0.5 truncate text-[11px] font-bold text-[var(--brand-muted-text)] md:text-[12.5px]">{user.team}</p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-[17px] leading-none font-black text-[var(--foreground)] md:text-[24px]">{user.points}</p>
                      <p className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.1em] text-[var(--brand-muted-text)] md:text-[10px] md:tracking-[0.12em]">คะแนน</p>
                    </div>
                  </article>
                );
              })}
            </div>

            {topScorers.length > 4 ? (
            <div className="flex justify-end px-4 pb-4 md:px-5">
              <button
                type="button"
                onClick={() => setShowAllTopScorers((current) => !current)}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--brand-surface)] px-4 py-2 text-[13px] font-black text-[var(--brand-accent)] shadow-[0_6px_16px_var(--brand-shadow)] transition-colors hover:bg-[var(--brand-soft)]"
              >
                {showAllTopScorers ? "ซ่อนบางส่วน" : "ดูทั้งหมด"}
                {showAllTopScorers ? <ChevronDown className="h-4 w-4" strokeWidth={2.4} /> : <ChevronRight className="h-4 w-4" strokeWidth={2.4} />}
              </button>
            </div>
            ) : null}
          </Card>
        </div>
      </div>
    </>
  );
}
