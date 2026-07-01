"use client";

import { Building2, CircleDollarSign, LayoutList, Users } from "lucide-react";

import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FIXED_SAFETY_CULTURE_TEAMS } from "@/lib/safety-culture-fixed-teams";
import { useAppState } from "@/providers/app-providers";

const MATCH_RULES: Record<string, string> = {
  RMC_METRO: "Division มีคำว่า Metro",
  RMC_EAST: "Division มีคำว่า East",
  RMC_WEST: "Division มีคำว่า West",
  RMC_SOUTH: "Division มีคำว่า South",
  RMC_NORTH: "Division มีคำว่า North",
  RMC_NORTHEAST: "Division มีคำว่า Northeast หรือ North East",
  SSB: "Division มีคำว่า Smart Structure หรือ SSB",
  OTHER: "Division ว่างหรือไม่ตรงกับกลุ่มที่กำหนด",
};

export default function AdminLeaderboardPage() {
  const { teamStandings } = useAppState();
  const orderedTeams = [...teamStandings].sort((left, right) => {
    const leftOrder = FIXED_SAFETY_CULTURE_TEAMS.find((team) => team.code === left.code)?.order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = FIXED_SAFETY_CULTURE_TEAMS.find((team) => team.code === right.code)?.order ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
  const totalPoints = orderedTeams.reduce((sum, team) => sum + (Number(team.points) || 0), 0);
  const totalMembers = orderedTeams.reduce((sum, team) => sum + (Number(team.members) || 0), 0);

  return (
    <div className="page-shell-wide bg-[var(--background)] pt-2.5 pb-8 font-sarabun">
      <SafetyCultureHero
        eyebrow="SAFETY CULTURE ADMIN"
        title={<>ทีมและ <span className="text-[var(--brand-accent)]">อันดับ</span></>}
        description="ผู้ใช้ทุกคนถูกจัดทีมอัตโนมัติจาก Division ที่ได้รับจาก SSO"
        variant="community"
        backgroundImage="/images/heroes/Home01.png"
        backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.82) 0%, rgba(210,235,255,.60) 32%, rgba(210,235,255,.10) 56%, rgba(210,235,255,0) 74%)"
        mascotSrc="/images/mascots/wangjai/44.png"
        mascotAction="cheer2"
      />

      <Card className="mt-4 rounded-[16px] border border-[var(--border)] bg-[var(--brand-soft)] p-3.5 shadow-[0_8px_18px_var(--brand-shadow)] md:p-4">
        <div className="flex flex-wrap gap-2">
          <Badge className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[12px] font-black text-[var(--brand-text)]">
            {FIXED_SAFETY_CULTURE_TEAMS.length} ทีมถาวร
          </Badge>
          <Badge className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[12px] font-black text-[var(--brand-text)]">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            {totalMembers.toLocaleString()} สมาชิก
          </Badge>
          <Badge className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[12px] font-black text-[var(--brand-text)]">
            <CircleDollarSign className="mr-1.5 h-3.5 w-3.5" />
            {totalPoints.toLocaleString()} Coin รวม
          </Badge>
        </div>
      </Card>

      <Card className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] p-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)]">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] bg-[var(--brand-soft)] text-[var(--brand-text)]">
            <LayoutList className="h-5 w-5" strokeWidth={2.3} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[18px] font-black text-[#1A1A1A]">ทีมอัตโนมัติจาก SSO</h2>
            <p className="text-[13px] font-bold leading-relaxed text-[#8E8A81]">
              ระบบย้ายทีมให้อัตโนมัติเมื่อ Division ของผู้ใช้เปลี่ยน ส่วนหัวหน้าทีมจะเพิ่มในภายหลัง
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="bg-[var(--brand-soft)] text-left">
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 text-[12px] font-black text-[var(--brand-text)]">ทีม</th>
                  <th className="px-4 py-3 text-[12px] font-black text-[var(--brand-text)]">กติกาจับกลุ่ม</th>
                  <th className="px-4 py-3 text-[12px] font-black text-[var(--brand-text)]">Division ที่พบ</th>
                  <th className="px-4 py-3 text-right text-[12px] font-black text-[var(--brand-text)]">สมาชิก</th>
                  <th className="px-4 py-3 text-right text-[12px] font-black text-[var(--brand-text)]">Coin รวม</th>
                </tr>
              </thead>
              <tbody>
                {orderedTeams.map((team) => (
                  <tr key={team.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[#F8FCFF]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: team.color }} />
                        <div>
                          <div className="text-[15px] font-black text-[#20324d]">{team.name}</div>
                          <div className="text-[11px] font-bold text-[#8E8A81]">{team.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[13px] font-bold text-[#55739B]">
                      {MATCH_RULES[team.code || ""] || MATCH_RULES.OTHER}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex max-w-[360px] flex-wrap gap-1.5">
                        {team.sourceDivisions?.length ? team.sourceDivisions.map((division) => (
                          <span key={division} className="rounded-md border border-[#D7EAFE] bg-[#F4F9FF] px-2 py-1 text-[11px] font-bold text-[#365D8D]">
                            {division}
                          </span>
                        )) : (
                          <span className="text-[12px] font-bold text-[#9AA8B8]">ยังไม่มีผู้ใช้</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-[15px] font-black text-[#20324d]">{team.members.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right text-[15px] font-black text-[#20324d]">{team.points.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {orderedTeams.length === 0 ? (
          <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--brand-soft)] px-4 py-5 text-[13px] font-bold text-[#55739B]">
            <Building2 className="h-4 w-4" />
            ยังไม่มีข้อมูลทีม กรุณารัน migration ทีมถาวร
          </div>
        ) : null}
      </Card>
    </div>
  );
}
