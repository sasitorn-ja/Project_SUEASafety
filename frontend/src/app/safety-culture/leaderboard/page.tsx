"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { type LeaderboardPerson, useAppState } from "@/providers/app-providers";
import { useAppTheme } from "@/providers/theme-provider";

const POINT_UNIT = "Coin";

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

function RankingAvatar({
  imageUrl,
  name,
  className,
}: {
  imageUrl?: string | null;
  name: string;
  className: string;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  if (imageUrl && !hasError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={className}
        onError={() => setHasError(true)}
      />
    );
  }

  return <span>{getInitials(name)}</span>;
}

export default function LeaderboardPage() {
  const [mounted] = useState(true);
  const [showAllTopScorers, setShowAllTopScorers] = useState(false);
  const [selectedTeamCode, setSelectedTeamCode] = useState("");
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState<LeaderboardPerson[]>([]);
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);
  const { teamStandings, personalRankings } = useAppState();
  const { themedColor } = useAppTheme();
  const topScorers = [...teamMembers];
  const visibleTopScorers = showAllTopScorers ? topScorers.slice(0, 10) : topScorers.slice(0, 5);
  const selectedTeamColor = themedColor(
    teamStandings.find((team) => team.code === selectedTeamCode || team.name === selectedTeamName)?.color
      ?? "var(--brand-accent)"
  );

  useEffect(() => {
    if (personalRankings.length === 0) {
      setTeamMembers([]);
      setSelectedTeamName("");
      return;
    }
    setTeamMembers(personalRankings);
    if (!selectedTeamName) {
      setSelectedTeamName(personalRankings[0]?.team || "");
    }
  }, [personalRankings, selectedTeamName]);

  useEffect(() => {
    if (selectedTeamCode || !selectedTeamName) return;
    const currentTeam = teamStandings.find((team) => team.name === selectedTeamName);
    if (currentTeam?.code) {
      setSelectedTeamCode(currentTeam.code);
    }
  }, [selectedTeamCode, selectedTeamName, teamStandings]);

  async function handleSelectTeam(teamCode: string, teamName: string) {
    setSelectedTeamCode(teamCode);
    setSelectedTeamName(teamName);
    setShowAllTopScorers(false);
    setIsLoadingTeamMembers(true);

    const result = await apiFetch<{ items: Array<Record<string, unknown>> }>(
      `/api/safety-culture/leaderboard?teamCode=${encodeURIComponent(teamCode)}`,
    );

    if (result.ok && Array.isArray(result.data?.items)) {
      setTeamMembers(result.data.items.map((item, index) => ({
        id: String(item.user_id || item.userId || item.id),
        rank: `#${index + 1}`,
        name: String(item.name_th || item.nameTh || item.name || "Unknown user"),
        points: Number(item.points || 0),
        team: String(item.team || item.team_name || item.teamName || teamName),
        profileImageUrl: (item.profile_image_url || item.profileImageUrl || null) as string | null,
        active: false,
      })));
    } else {
      setTeamMembers([]);
    }

    setIsLoadingTeamMembers(false);
  }

  const animStyle = (delay: number) => ({
    animationDelay: `${delay}s`,
  });

  return (
    <>
      <div className="page-shell-wide bg-[var(--background)] pt-2.5 pb-8 font-sarabun">
        <div className="mb-3 anim-fade md:mb-4" style={animStyle(0)}>
          <SafetyCultureHero
            eyebrow="SAFETY CARING SCOREBOARD"
            title={
              <>
                ทีมไหน <span className="text-[var(--brand-accent)]">ปลอดภัยสุด</span>
              </>
            }
            description="สรุป Coin Safety ให้เห็นภาพรวม ทั้งอันดับทีมและอันดับสมาชิกในทีมของคุณ"
            variant="community"
            backgroundImage="/images/heroes/safety-culture-leaderboard-hero-construction.png"
            backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.82) 0%, rgba(210,235,255,.56) 42%, rgba(210,235,255,0) 100%)"
            backgroundPosition="78% center"
            contentFrame
            mascotSrc="/images/mascots/wangjai/7.png"
            mascotAction="flashlight"
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,1fr)]">
          {/* ── อันดับทีม ── */}
          <Card
            className="overflow-hidden rounded-[20px] border-[1.5px] border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.62))] shadow-[0_16px_36px_var(--brand-shadow)] backdrop-blur-sm anim-fade"
            style={animStyle(0.15)}
          >
            <div className="border-b border-[var(--border)] px-4 py-3 md:px-5">
              <p className="app-card-title text-[var(--foreground)]">อันดับทีม · เดือนนี้</p>
            </div>

            <div className="space-y-1.5 p-3 md:space-y-2 md:p-4">
              {teamStandings.length === 0 ? (
                <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-4 py-8 text-center">
                  <p className="text-[14px] font-black text-[var(--foreground)]">ยังไม่มีข้อมูลทีม</p>
                  <p className="mt-1 text-[12px] font-bold text-[var(--brand-muted-text)]">เมื่อมีข้อมูลทีม ระบบจะแสดงอันดับที่นี่</p>
                </div>
              ) : teamStandings.map((team, idx) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => void handleSelectTeam(team.code || "", team.name)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[14px] border px-3 py-2.5 text-left transition-all duration-150 hover:-translate-y-px md:gap-3.5 md:px-4 md:py-3",
                    selectedTeamCode === (team.code || "")
                      ? "border-[rgba(var(--brand-accent-rgb),0.55)] bg-[linear-gradient(180deg,rgba(var(--brand-accent-rgb),0.10),rgba(var(--brand-accent-rgb),0.03))] shadow-[0_10px_18px_rgba(18,101,214,0.10)]"
                      : "border-[var(--border)] bg-[var(--brand-surface)] hover:border-[rgba(var(--brand-accent-rgb),0.4)]",
                  )}
                  style={animStyle(0.18 + idx * 0.03)}
                >
                  {/* rank badge */}
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] text-[13px] font-black text-white shadow-[0_2px_6px_rgba(0,0,0,0.18)]"
                    style={{ background: `linear-gradient(180deg, ${themedColor(team.color)}, color-mix(in srgb, ${themedColor(team.color)} 78%, #000))` }}
                  >
                    {team.rank}
                  </div>

                  {/* fixed team marker; leaders will be added in a later phase */}
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[11px] border-2 border-white/80 text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] md:h-11 md:w-11"
                    style={{ backgroundColor: themedColor(team.color) }}
                  >
                    <Users className="h-5 w-5" strokeWidth={2.4} />
                  </div>

                  {/* info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="truncate text-[14px] font-black text-[var(--foreground)] md:text-[16px]">{team.name}</h4>
                      {idx === 0 ? (
                        <span className="flex-shrink-0 rounded-full bg-[var(--brand-soft)] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.1em] text-[var(--brand-text)] md:text-[9px]">
                          อันดับ 1
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] font-bold text-[var(--brand-muted-text)] md:text-[12px]">
                      {team.members} สมาชิก
                    </p>
                  </div>

                  {/* points */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[16px] leading-none font-black text-[var(--foreground)] md:text-[20px]">{team.points.toLocaleString()}</p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--brand-muted-text)]">{POINT_UNIT}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* ── อันดับสมาชิก ── */}
          <Card
            className="overflow-hidden rounded-[20px] border-[1.5px] border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.70))] shadow-[0_16px_36px_var(--brand-shadow)] backdrop-blur-sm anim-fade"
            style={animStyle(0.24)}
          >
            <div className="border-b border-[var(--border)] px-4 py-3 md:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="app-card-title text-[var(--foreground)]">อันดับสมาชิกในทีม · เดือนนี้</p>
                {selectedTeamName ? (
                  <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[11px] font-black text-[var(--brand-text)]">
                    {selectedTeamName}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5 p-3 md:space-y-2 md:p-4">
              {isLoadingTeamMembers ? (
                <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-4 py-8 text-center">
                  <p className="text-[14px] font-black text-[var(--foreground)]">กำลังโหลดสมาชิกทีม</p>
                  <p className="mt-1 text-[12px] font-bold text-[var(--brand-muted-text)]">กำลังดึงอันดับของทีมที่เลือก</p>
                </div>
              ) : visibleTopScorers.length === 0 ? (
                <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-4 py-8 text-center">
                  <p className="text-[14px] font-black text-[var(--foreground)]">ยังไม่มีอันดับสมาชิก</p>
                  <p className="mt-1 text-[12px] font-bold text-[var(--brand-muted-text)]">
                    {selectedTeamName ? `ทีม ${selectedTeamName} ยังไม่มีสมาชิกหรือยังไม่มี Coin` : "ระบบจะแสดงอันดับเมื่อมีสมาชิกและ Coin"}
                  </p>
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
                      "flex items-center gap-2.5 rounded-[14px] border px-3 py-2.5 transition-all duration-150",
                      user.active
                        ? "border-[rgba(var(--brand-accent-rgb),0.55)] bg-[linear-gradient(180deg,rgba(var(--brand-accent-rgb),0.10),rgba(var(--brand-accent-rgb),0.03))]"
                        : "border-[var(--border)] bg-[var(--brand-surface)] hover:border-[rgba(var(--brand-accent-rgb),0.4)]"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-[11px] font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
                        rankStyle.badgeClassName
                      )}
                    >
                      {formatRankLabel(user.rank)}
                    </div>

                    <div
                      className={cn(
                        "team-color-running-ring h-11 w-11 flex-shrink-0 rounded-full p-[3px] shadow-[0_6px_14px_rgba(13,71,161,0.14)]",
                        rankStyle.avatarRingClassName
                      )}
                      style={{ "--team-ring-color": selectedTeamColor } as CSSProperties}
                    >
                      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(180deg,var(--brand-accent),var(--brand-nav-active))] text-[13px] font-black text-white">
                        <RankingAvatar imageUrl={user.profileImageUrl} name={user.name} className="h-full w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.18))]" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] leading-tight font-black text-[var(--foreground)]">{user.name}</p>
                      <p className="mt-0.5 truncate text-[11px] font-bold text-[var(--brand-muted-text)]">{user.team}</p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-[16px] leading-none font-black text-[var(--foreground)] md:text-[20px]">{user.points}</p>
                      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--brand-muted-text)]">{POINT_UNIT}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            {topScorers.length > 5 ? (
              <div className="border-t border-[var(--border)] px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => setShowAllTopScorers((current) => !current)}
                  className="flex w-full items-center justify-center gap-1.5 py-1 text-[12px] font-black text-[var(--brand-accent)] outline-none transition-colors hover:text-[var(--brand-nav-active)]"
                >
                  {showAllTopScorers ? "ซ่อนบางส่วน" : "ดูอันดับทั้งหมด"}
                  {showAllTopScorers ? <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} /> : <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />}
                </button>
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </>
  );
}
