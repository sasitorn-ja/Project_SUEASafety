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

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-600 border border-amber-200 shadow-[0_3px_10px_rgba(245,158,11,0.5),inset_0_1px_2.5px_rgba(255,255,255,0.7)] text-amber-950 font-black text-[12px] sm:text-[14px] relative transition-transform duration-300 group-hover:scale-110">
        <span className="z-10 drop-shadow-[0_0.5px_0.5px_rgba(255,255,255,0.6)]">1</span>
        <div className="absolute inset-0 rounded-full bg-yellow-300/30 blur-[2px] animate-pulse" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-slate-100 via-slate-300 to-slate-500 border border-slate-100 shadow-[0_2.5px_8px_rgba(148,163,184,0.4),inset_0_1px_2px_rgba(255,255,255,0.7)] text-slate-800 font-black text-[11px] sm:text-[13px] transition-transform duration-300 group-hover:scale-110">
        <span className="drop-shadow-[0_0.5px_0.5px_rgba(255,255,255,0.6)]">2</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-orange-200 via-orange-400 to-orange-600 border border-orange-200 shadow-[0_2.5px_8px_rgba(249,115,22,0.4),inset_0_1px_2px_rgba(255,255,255,0.7)] text-orange-950 font-black text-[11px] sm:text-[13px] transition-transform duration-300 group-hover:scale-110">
      <span className="drop-shadow-[0_0.5px_0.5px_rgba(255,255,255,0.6)]">3</span>
    </div>
  );
}

function TeamPodium({
  teams,
  selectedTeamCode,
  selectedTeamName,
  onSelectTeam,
}: {
  teams: any[];
  selectedTeamCode: string;
  selectedTeamName: string;
  onSelectTeam: (code: string, name: string) => void;
}) {
  const { themedColor } = useAppTheme();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!teams || teams.length === 0) return null;

  const top3 = teams.slice(0, 3);
  
  const getPodiumOrder = () => {
    if (top3.length === 1) {
      return [{ team: top3[0], rankPosition: 1 }];
    }
    if (top3.length === 2) {
      return [
        { team: top3[1], rankPosition: 2 },
        { team: top3[0], rankPosition: 1 }
      ];
    }
    return [
      { team: top3[1], rankPosition: 2 },
      { team: top3[0], rankPosition: 1 },
      { team: top3[2], rankPosition: 3 }
    ];
  };

  const orderedItems = getPodiumOrder();

  return (
    <div className="flex items-end justify-center gap-1.5 sm:gap-4 md:gap-6 pt-14 pb-5 bg-[linear-gradient(180deg,rgba(255,255,255,0.48),rgba(255,255,255,0.18))] rounded-2xl border border-white/30 shadow-inner mb-5 relative overflow-hidden select-none max-w-[640px] mx-auto w-full">
      {/* Background Soft Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(189,224,254,0.12)_0%,transparent_70%)] pointer-events-none" />

      {orderedItems.map(({ team, rankPosition }) => {
        const isSelected = (selectedTeamCode && selectedTeamCode === team.code) || selectedTeamName === team.name;
        const teamColor = themedColor(team.color || "var(--brand-accent)");

        // Separate Pedestal Width & Height classes
        const pedestalWidthClass = 
          rankPosition === 1 ? "w-[90px] sm:w-[135px]" : 
          "w-[80px] sm:w-[115px]";

        const pedestalHeightClass = 
          rankPosition === 1 ? "h-[130px] sm:h-[160px]" : 
          rankPosition === 2 ? "h-[105px] sm:h-[125px]" : 
          "h-[90px] sm:h-[105px]";

        const pedestalBg = 
          rankPosition === 1 ? "bg-gradient-to-b from-amber-400/30 via-amber-400/20 to-amber-500/10 border-amber-500/80 shadow-[0_12px_24px_rgba(245,158,11,0.25),inset_0_1px_3px_rgba(255,255,255,0.6)]" : 
          rankPosition === 2 ? "bg-gradient-to-b from-slate-300/30 via-slate-300/20 to-slate-400/10 border-slate-400/80 shadow-[0_10px_20px_rgba(148,163,184,0.2),inset_0_1px_3px_rgba(255,255,255,0.6)]" : 
          "bg-gradient-to-b from-orange-500/25 via-orange-500/15 to-orange-600/10 border-orange-500/80 shadow-[0_10px_20px_rgba(249,115,22,0.2),inset_0_1px_3px_rgba(255,255,255,0.6)]";

        const mountDelay = rankPosition === 2 ? 80 : rankPosition === 1 ? 200 : 320;

        return (
          <button
            key={team.id}
            type="button"
            onClick={() => onSelectTeam(team.code || "", team.name)}
            className={cn(
              "group flex flex-col items-center focus:outline-none relative hover:-translate-y-2 hover:scale-[1.03]",
              pedestalWidthClass,
              isSelected ? "opacity-100" : "opacity-95 hover:opacity-100"
            )}
            style={{
              transition: "transform 800ms cubic-bezier(0.25, 1, 0.5, 1), opacity 800ms ease-out",
              transitionDelay: animate ? "0ms" : `${mountDelay}ms`,
              transform: animate 
                ? (isSelected ? "translateY(0) scale(1.04)" : "translateY(0) scale(1)") 
                : "translateY(30px) scale(0.96)",
              opacity: animate ? 1 : 0,
            }}
          >
            {/* Center Pedestal Backlight Glow */}
            {rankPosition === 1 && (
              <div className="absolute top-[-25px] w-24 h-24 bg-amber-400/15 rounded-full blur-xl pointer-events-none -z-10 animate-[pulse_2s_infinite]" />
            )}

            {/* Avatar & Name ABOVE the pedestal */}
            <div className="relative mb-2 flex flex-col items-center w-full">
              {/* SVG Crown for Rank 1 */}
              {rankPosition === 1 && (
                <div className="absolute top-[-30px] sm:top-[-34px] left-1/2 -translate-x-1/2">
                  <svg
                    className="w-7 h-7 sm:w-8.5 sm:h-8.5 drop-shadow-[0_2.5px_5px_rgba(245,158,11,0.4)] animate-[bounce_2.5s_infinite_ease-in-out]"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="team3dCrownGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF4D0" />
                        <stop offset="50%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#B45309" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M2 18H22V20H2V18ZM4 16L2 5L8 10L12 3L16 10L22 5L20 16H4Z"
                      fill="url(#team3dCrownGold)"
                      stroke="#B45309"
                      strokeWidth="0.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}

              {/* Team Icon */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-full border-[3px] bg-white p-0.5 shadow-md transition-all duration-300",
                  rankPosition === 1 ? "h-12 w-12 sm:h-18 sm:w-18 border-amber-400 ring-4 ring-amber-400/15 group-hover:ring-amber-400/25" : 
                  rankPosition === 2 ? "h-10 w-10 sm:h-14 sm:w-14 border-slate-300 ring-4 ring-slate-300/10 group-hover:ring-slate-300/20" : 
                  "h-10 w-10 sm:h-14 sm:w-14 border-orange-400 ring-4 ring-orange-400/10 group-hover:ring-orange-400/20"
                )}
              >
                <div
                  className="flex h-full w-full items-center justify-center rounded-full text-white font-bold"
                  style={{ backgroundColor: teamColor }}
                >
                  <Users className={cn(rankPosition === 1 ? "h-5 w-5 sm:h-8 sm:w-8" : "h-4.5 w-4.5 sm:h-6 sm:w-6")} strokeWidth={2.4} />
                </div>
              </div>
            </div>

            {/* Name below avatar but ABOVE pedestal */}
            <p className={cn("truncate text-[11px] sm:text-[13px] font-black text-[#1A1A1A] max-w-full w-full px-1 text-center transition-colors", isSelected ? "text-[#0B2F6B]" : "group-hover:text-[var(--brand-accent)]")}>
              {team.name}
            </p>
            {/* Member count */}
            <p className="truncate text-[8.5px] sm:text-[11px] font-bold text-[var(--brand-muted-text)] text-center mb-2 mt-0.5 leading-none max-w-full w-full px-1">
              {team.members || 0} สมาชิก
            </p>

            {/* 3D Pedestal Body */}
            <div className="relative flex flex-col items-center w-full">
              {/* Top Lid / Surface - provides 3D depth */}
              <div 
                className={cn(
                  "w-full h-3 rounded-[50%] border-t border-x -mb-1.5 z-20 transition-all duration-300",
                  rankPosition === 1 ? "border-amber-400/80 bg-amber-300/40" : 
                  rankPosition === 2 ? "border-slate-300 bg-slate-200/40" : 
                  "border-orange-400/80 bg-orange-300/40"
                )} 
              />
              
              {/* Pedestal Front Face */}
              <div
                className={cn(
                  "w-full rounded-b-2xl border-x border-b backdrop-blur-[4px] flex flex-col items-center justify-center gap-1.5 sm:gap-3 p-1.5 sm:p-3 overflow-hidden transition-all duration-300 relative shadow-lg",
                  pedestalHeightClass,
                  pedestalBg,
                  isSelected && "ring-2 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                )}
              >
                {/* Reflection gloss */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none" />
                
                {/* Medal */}
                <div className="-mt-1 z-10">
                  <RankMedal rank={rankPosition} />
                </div>

                {/* Points / Score */}
                <div className="text-center w-full z-10">
                  <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                    <img src="/images/icons/STCoin.png" alt="Coin" className="w-3.5 h-3.5 sm:w-5.5 sm:h-5.5 object-contain" />
                    <span className="text-[11px] sm:text-[18px] font-black text-[#0B2F6B] tracking-tight leading-none">
                      {team.points.toLocaleString()}
                    </span>
                  </div>
                  <p className={cn(
                    "text-[9px] sm:text-[11px] font-bold tracking-wider mt-0.5 leading-none",
                    rankPosition === 1 ? "text-amber-800/90" : 
                    rankPosition === 2 ? "text-slate-600/90" : 
                    "text-orange-800/90"
                  )}>
                    {POINT_UNIT}
                  </p>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MemberPodium({
  members,
  selectedTeamColor,
}: {
  members: LeaderboardPerson[];
  selectedTeamColor: string;
}) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!members || members.length === 0) return null;

  const top3 = members.slice(0, 3);
  
  const getPodiumOrder = () => {
    if (top3.length === 1) {
      return [{ user: top3[0], rankPosition: 1 }];
    }
    if (top3.length === 2) {
      return [
        { user: top3[1], rankPosition: 2 },
        { user: top3[0], rankPosition: 1 }
      ];
    }
    return [
      { user: top3[1], rankPosition: 2 },
      { user: top3[0], rankPosition: 1 },
      { user: top3[2], rankPosition: 3 }
    ];
  };

  const orderedItems = getPodiumOrder();

  return (
    <div className="flex items-end justify-center gap-1.5 sm:gap-4 md:gap-6 pt-14 pb-5 bg-[linear-gradient(180deg,rgba(255,255,255,0.48),rgba(255,255,255,0.18))] rounded-2xl border border-white/30 shadow-inner mb-5 relative overflow-hidden select-none max-w-[640px] mx-auto w-full">
      {/* Background Soft Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_80%)] pointer-events-none" />

      {orderedItems.map(({ user, rankPosition }) => {
        // Separate Pedestal Width & Height classes
        const pedestalWidthClass = 
          rankPosition === 1 ? "w-[90px] sm:w-[135px]" : 
          "w-[80px] sm:w-[115px]";

        const pedestalHeightClass = 
          rankPosition === 1 ? "h-[130px] sm:h-[160px]" : 
          rankPosition === 2 ? "h-[105px] sm:h-[125px]" : 
          "h-[90px] sm:h-[105px]";

        const pedestalBg = 
          rankPosition === 1 ? "bg-gradient-to-b from-amber-400/30 via-amber-400/20 to-amber-500/10 border-amber-500/80 shadow-[0_12px_24px_rgba(245,158,11,0.25),inset_0_1px_3px_rgba(255,255,255,0.6)]" : 
          rankPosition === 2 ? "bg-gradient-to-b from-slate-300/30 via-slate-300/20 to-slate-400/10 border-slate-400/80 shadow-[0_10px_20px_rgba(148,163,184,0.2),inset_0_1px_3px_rgba(255,255,255,0.6)]" : 
          "bg-gradient-to-b from-orange-500/25 via-orange-500/15 to-orange-600/10 border-orange-500/80 shadow-[0_10px_20px_rgba(249,115,22,0.2),inset_0_1px_3px_rgba(255,255,255,0.6)]";

        const textGlow = 
          rankPosition === 1 ? "text-[#7A4B00] drop-shadow-[0_1px_2.5px_rgba(245,158,11,0.15)]" : 
          rankPosition === 2 ? "text-[#4F5F74]" : 
          "text-[#7B4422]";

        const avatarSizeClass = 
          rankPosition === 1 ? "h-12 w-12 sm:h-18 sm:w-18" : "h-10 w-10 sm:h-14 sm:w-14";

        const mountDelay = rankPosition === 2 ? 80 : rankPosition === 1 ? 200 : 320;
        const scaleVal = rankPosition === 1 ? 1.03 : 0.97;

        return (
          <div
            key={user.id}
            className={cn(
              "group flex flex-col items-center relative z-10 hover:-translate-y-2 hover:scale-[1.03]",
              pedestalWidthClass
            )}
            style={{
              transition: "transform 800ms cubic-bezier(0.25, 1, 0.5, 1), opacity 800ms ease-out",
              transitionDelay: animate ? "0ms" : `${mountDelay}ms`,
              transform: animate 
                ? `translateY(0) scale(${scaleVal})` 
                : "translateY(30px) scale(0.96)",
              opacity: animate ? 1 : 0,
            }}
          >
            {/* Avatar ABOVE pedestal */}
            <div className="relative mb-2 w-full flex flex-col items-center">
              {/* Backlight halo for member rank 1 */}
              {rankPosition === 1 && (
                <div className="absolute top-[-12px] w-14 h-14 bg-amber-400/10 rounded-full blur-lg pointer-events-none -z-10 animate-pulse" />
              )}

              {/* SVG Crown for Rank 1 */}
              {rankPosition === 1 && (
                <div className="absolute top-[-26px] sm:top-[-28px] left-1/2 -translate-x-1/2">
                  <svg
                    className="w-6 h-6 sm:w-7.5 sm:h-7.5 drop-shadow-[0_2px_4px_rgba(245,158,11,0.35)] animate-[bounce_2.5s_infinite_ease-in-out]"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="mem3dCrownGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF4D0" />
                        <stop offset="50%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#B45309" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M2 18H22V20H2V18ZM4 16L2 5L8 10L12 3L16 10L22 5L20 16H4Z"
                      fill="url(#mem3dCrownGold)"
                      stroke="#B45309"
                      strokeWidth="0.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}

              {/* Avatar frame */}
              <div
                className={cn(
                  "rounded-full p-0.5 shadow-md border bg-white transition-all duration-300",
                  rankPosition === 1 ? "ring-4 ring-amber-400/15 border-amber-400" : 
                  rankPosition === 2 ? "ring-4 ring-slate-300/10 border-slate-300" : 
                  "ring-4 ring-orange-400/10 border-orange-400"
                )}
              >
                <div className={cn("relative flex items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(180deg,var(--brand-accent),var(--brand-nav-active))] text-[11px] font-black text-white", avatarSizeClass)}>
                  <RankingAvatar imageUrl={user.profileImageUrl} name={user.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.15))]" />
                </div>
              </div>
            </div>

            {/* Name below avatar but ABOVE pedestal */}
            <p className="truncate text-[10px] sm:text-[14px] font-black text-[#1A1A1A] max-w-full w-full px-1 text-center mb-2 leading-tight group-hover:text-[var(--brand-accent)] transition-colors">
              {user.name}
            </p>

            {/* 3D Pedestal Body */}
            <div className="relative flex flex-col items-center w-full">
              {/* Top Lid / Surface - provides 3D depth */}
              <div 
                className={cn(
                  "w-full h-3 rounded-[50%] border-t border-x -mb-1.5 z-20 transition-all duration-300",
                  rankPosition === 1 ? "border-amber-400 bg-amber-300/60" : 
                  rankPosition === 2 ? "border-slate-300 bg-slate-200/60" : 
                  "border-orange-400 bg-orange-300/60"
                )} 
              />
              
              {/* Pedestal Front Face */}
              <div
                className={cn(
                  "w-full rounded-b-2xl border-x border-b backdrop-blur-[4px] flex flex-col items-center justify-center gap-1.5 sm:gap-3 p-1.5 sm:p-3 overflow-hidden relative shadow-lg",
                  pedestalHeightClass,
                  pedestalBg
                )}
              >
                {/* Reflection gloss */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none" />

                {/* Medal */}
                <div className="-mt-1 z-10">
                  <RankMedal rank={rankPosition} />
                </div>

                {/* Points / Score */}
                <div className="text-center w-full z-10">
                  <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                    <img src="/images/icons/STCoin.png" alt="Coin" className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 object-contain" />
                    <span className="text-[13px] sm:text-[18px] font-black text-[#0B2F6B] tracking-tight leading-none">
                      {user.points.toLocaleString()}
                    </span>
                  </div>
                  <p className={cn(
                    "text-[9px] sm:text-[11px] font-bold tracking-wider mt-0.5 leading-none",
                    rankPosition === 1 ? "text-amber-800/90" : 
                    rankPosition === 2 ? "text-slate-600/90" : 
                    "text-orange-800/90"
                  )}>
                    {POINT_UNIT}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── อันดับทีม ── */}
          <Card
            className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.62))] shadow-[0_10px_24px_var(--brand-shadow)] backdrop-blur-sm font-sarabun anim-fade flex flex-col h-full"
            style={animStyle(0.15)}
          >
            <div className="border-b border-[var(--border)] px-3 py-2.5 min-h-[46px] lg:h-[54px] flex items-center">
              <p className="app-card-title text-[var(--foreground)]">อันดับทีม · เดือนนี้</p>
            </div>

            <div className="p-3 md:p-4 flex flex-col flex-1">
              <TeamPodium
                teams={teamStandings}
                selectedTeamCode={selectedTeamCode}
                selectedTeamName={selectedTeamName}
                onSelectTeam={handleSelectTeam}
              />

              <div className="space-y-1.5 mt-3 border-t border-[var(--border)] pt-4 flex-1">
                {teamStandings.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-4 py-8 text-center">
                    <p className="text-[14px] font-black text-[var(--foreground)]">ยังไม่มีข้อมูลทีม</p>
                    <p className="mt-1 text-[12px] font-bold text-[var(--brand-muted-text)]">เมื่อมีข้อมูลทีม ระบบจะแสดงอันดับที่นี่</p>
                  </div>
                ) : teamStandings.length <= 3 ? (
                  <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-4 py-4 text-center">
                    <p className="text-[12px] font-bold text-[var(--brand-muted-text)]">ทีมทั้งหมดแสดงอยู่บนโพเดียมแล้ว</p>
                  </div>
                ) : (
                  teamStandings.slice(3).map((team, idx) => (
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

                      {/* fixed team marker */}
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
                        </div>
                        <p className="mt-0.5 truncate text-[11px] font-bold text-[var(--brand-muted-text)] md:text-[12px]">
                          {team.members} สมาชิก
                        </p>
                      </div>

                      {/* points */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-[16px] leading-none font-black text-[var(--foreground)] md:text-[20px]">{team.points.toLocaleString()}</p>
                        <p className="mt-0.5 text-[9px] font-bold tracking-[0.1em] text-[var(--brand-muted-text)]">{POINT_UNIT}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* ── อันดับสมาชิก ── */}
          <Card
            className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.70))] shadow-[0_10px_24px_var(--brand-shadow)] backdrop-blur-sm font-sarabun anim-fade flex flex-col h-full"
            style={animStyle(0.24)}
          >
            <div className="border-b border-[var(--border)] px-3 py-2.5 min-h-[46px] lg:h-[54px] flex items-center">
              <div className="flex flex-wrap items-center gap-2">
                <p className="app-card-title text-[var(--foreground)]">อันดับสมาชิกในทีม · เดือนนี้</p>
                {selectedTeamName ? (
                  <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-0.5 text-[11px] font-black text-[var(--brand-text)] border border-[rgba(var(--brand-accent-rgb),0.2)]">
                    {selectedTeamName}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="p-3 md:p-4 flex flex-col flex-1">
              {isLoadingTeamMembers ? (
                <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-4 py-8 text-center flex-1 flex flex-col items-center justify-center">
                  <p className="text-[14px] font-black text-[var(--foreground)]">กำลังโหลดสมาชิกทีม</p>
                  <p className="mt-1 text-[12px] font-bold text-[var(--brand-muted-text)]">กำลังดึงอันดับของทีมที่เลือก</p>
                </div>
              ) : visibleTopScorers.length === 0 ? (
                <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-4 py-8 text-center flex-1 flex flex-col items-center justify-center">
                  <p className="text-[14px] font-black text-[var(--foreground)]">ยังไม่มีอันดับสมาชิก</p>
                  <p className="mt-1 text-[12px] font-bold text-[var(--brand-muted-text)]">
                    {selectedTeamName ? `ทีม ${selectedTeamName} ยังไม่มีสมาชิกหรือยังไม่มี Coin` : "ระบบจะแสดงอันดับเมื่อมีสมาชิกและ Coin"}
                  </p>
                </div>
              ) : (
                <>
                  <MemberPodium members={teamMembers} selectedTeamColor={selectedTeamColor} />
                  
                  <div className="space-y-1.5 mt-3 border-t border-[var(--border)] pt-4">
                    {teamMembers.length <= 3 ? (
                      <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-4 py-4 text-center">
                        <p className="text-[12px] font-bold text-[var(--brand-muted-text)]">สมาชิกทั้งหมดแสดงอยู่บนโพเดียมแล้ว</p>
                      </div>
                    ) : (
                      visibleTopScorers.slice(3).map((user, index) => {
                        const realIndex = index + 3;
                        const rankStyle = TOP_RANK_STYLES[realIndex] ?? {
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
                              <p className="mt-0.5 text-[9px] font-bold tracking-[0.1em] text-[var(--brand-muted-text)]">{POINT_UNIT}</p>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            {topScorers.length > 5 ? (
              <div className="border-t border-[var(--border)] px-4 py-2.5 bg-white/30">
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
