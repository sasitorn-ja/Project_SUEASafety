"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, LayoutList, Pencil, Plus, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  type LeaderboardTeam,
  useAppActions,
  useAppState,
} from "@/providers/app-providers";
import { useAppTheme } from "@/providers/theme-provider";

type TeamEditorState = {
  mode: "create" | "edit";
  id: string;
  rank: number;
  name: string;
  leader: string;
  members: number;
  points: number;
  percent: number;
  streak: number;
  awards: number;
  color: string;
};

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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-[18px] font-black text-[#1A1A1A]">{title}</h2>
            <p className="text-[13px] font-bold leading-relaxed text-[#8E8A81]">{description}</p>
          </div>
        </div>
        {actions ? <div className="sm:pt-1">{actions}</div> : null}
      </div>
      {children}
    </Card>
  );
}

function makeTeamDraft(index: number): LeaderboardTeam {
  return {
    id: `team-draft-${Date.now()}-${index}`,
    rank: index + 1,
    name: `ทีมใหม่ ${index + 1}`,
    leader: "หัวหน้าทีม",
    members: 100,
    color: "var(--brand-accent)",
    points: 0,
    percent: 0,
    streak: 1,
    awards: 1,
  };
}

function createTeamEditor(team: LeaderboardTeam): TeamEditorState {
  return {
    mode: "edit",
    id: team.id,
    rank: team.rank,
    name: team.name,
    leader: team.leader,
    members: team.members,
    points: team.points,
    percent: team.percent,
    streak: team.streak,
    awards: team.awards,
    color: team.color,
  };
}

export default function AdminLeaderboardPage() {
  const { themedColor } = useAppTheme();
  const { teamStandings } = useAppState();
  const { updateTeamStandings } = useAppActions();

  const [draftTeams, setDraftTeams] = useState<LeaderboardTeam[]>(teamStandings);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [editingTeam, setEditingTeam] = useState<TeamEditorState | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<LeaderboardTeam | null>(null);

  useEffect(() => {
    setDraftTeams(teamStandings);
  }, [teamStandings]);

  const totalPoints = useMemo(
    () => draftTeams.reduce((sum, team) => sum + (Number(team.points) || 0), 0),
    [draftTeams]
  );
  const totalMembers = useMemo(
    () => draftTeams.reduce((sum, team) => sum + (Number(team.members) || 0), 0),
    [draftTeams]
  );

  const commitTeams = (teams: LeaderboardTeam[]) => {
    const normalizedTeams = teams.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));

    setDraftTeams(normalizedTeams);
    updateTeamStandings(normalizedTeams);
    setSaveState("saved");
  };

  const addTeam = () => {
    const nextTeam = makeTeamDraft(draftTeams.length);
    setEditingTeam({
      ...createTeamEditor(nextTeam),
      mode: "create",
    });
    setSaveState("idle");
  };

  const confirmDeleteTeam = () => {
    if (!deletingTeam) return;

    commitTeams(draftTeams.filter((team) => team.id !== deletingTeam.id));
    setDeletingTeam(null);
  };

  const openEditTeam = (team: LeaderboardTeam) => {
    setEditingTeam(createTeamEditor(team));
  };

  const updateEditingTeam = <K extends keyof TeamEditorState>(key: K, value: TeamEditorState[K]) => {
    setEditingTeam((current) => (current ? { ...current, [key]: value } : current));
  };

  const confirmTeamEdit = () => {
    if (!editingTeam) return;

    if (editingTeam.mode === "create") {
      commitTeams([
        ...draftTeams,
        {
          id: editingTeam.id,
          rank: draftTeams.length + 1,
          name: editingTeam.name,
          leader: editingTeam.leader,
          members: editingTeam.members,
          color: editingTeam.color,
          points: editingTeam.points,
          percent: editingTeam.percent,
          streak: editingTeam.streak,
          awards: editingTeam.awards,
        },
      ]);
    } else {
      commitTeams(
        draftTeams.map((team) =>
          team.id === editingTeam.id
            ? {
                ...team,
                name: editingTeam.name,
                leader: editingTeam.leader,
                color: editingTeam.color,
              }
            : team
        )
      );
    }

    setEditingTeam(null);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[1320px] bg-[var(--background)] px-3.5 pt-2 pb-8 font-sarabun md:px-4">
        <SafetyCultureHero
          eyebrow="SAFETY CULTURE ADMIN"
          title={
            <>
              จัดการ <span className="text-[var(--brand-accent)]">Leaderboard</span>
            </>
          }
          description="โฟกัสเฉพาะการจัดการทีมและคะแนนให้พร้อมใช้งานจริง โดยแก้ผ่าน modal แล้วค่อย confirm ก่อนบันทึก"
          mascotSrc="/images/mascots/suea-mascot.png"
          mascotAlt="SUEA Admin Mascot"
          actions={
            <div className="mt-[12px] flex flex-wrap gap-2">
              <Link href="/safety-culture/leaderboard">
                <Button className="h-[32px] rounded-full border border-white/30 bg-white/10 px-4 text-[12.5px] font-black text-white hover:bg-white/14 md:h-[36px] md:text-[13px]">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  กลับไปหน้า Leaderboard
                </Button>
              </Link>
            </div>
          }
        />

        <Card className="mt-4 rounded-[16px] border border-[var(--border)] bg-[var(--brand-soft)] p-3.5 shadow-[0_8px_18px_var(--brand-shadow)] md:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[11px] font-black text-[var(--brand-text)]">
                {draftTeams.length} ทีม
              </Badge>
              <Badge className="rounded-xl border border-[var(--border)] bg-[var(--brand-soft)] px-3 py-2 text-[11px] font-black text-[var(--brand-text)]">
                {totalMembers.toLocaleString()} สมาชิก
              </Badge>
              <Badge className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[11px] font-black text-[var(--brand-text)]">
                {totalPoints.toLocaleString()} คะแนนรวม
              </Badge>
            </div>

            {saveState === "saved" ? (
              <div className="flex h-10 items-center rounded-xl border border-[#bfd7c0] bg-[#f2fff2] px-3 text-[12px] font-black text-[#245336]">
                บันทึกเรียบร้อยแล้ว
              </div>
            ) : null}
          </div>
        </Card>

        <div className="mt-4 flex flex-col gap-4">
          <SectionCard
            title="Teams Management"
            description="จัดการทีมในมุมมองเดียวแบบอ่านง่ายขึ้น เน้นตารางหลักที่สะอาดตาและ modal แก้ไขที่ใช้งานง่าย"
            icon={<LayoutList className="h-5 w-5" strokeWidth={2.3} />}
            actions={
              <Button
                onClick={addTeam}
                className="h-11 rounded-xl bg-[var(--brand-accent-strong)] px-5 text-[13px] font-black text-white hover:bg-[var(--brand-accent)]"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                New Team
              </Button>
            }
          >
            <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--brand-surface)] shadow-[0_8px_18px_rgba(62,36,13,0.04)]">
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full">
                  <thead className="bg-[var(--brand-soft)] text-left">
                    <tr className="border-b border-[var(--border)]">
                      <th className="px-4 py-4 text-[12px] font-black text-[var(--brand-text)]">Team Name</th>
                      <th className="px-4 py-4 text-[12px] font-black text-[var(--brand-text)]">Leader</th>
                      <th className="px-4 py-4 text-[12px] font-black text-[var(--brand-text)]">Members</th>
                      <th className="px-4 py-4 text-[12px] font-black text-[var(--brand-text)]">Total Points</th>
                      <th className="px-4 py-4 text-[12px] font-black text-[var(--brand-text)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftTeams.map((team) => (
                      <tr
                        key={team.id}
                        className="border-b border-[var(--border)] transition-colors hover:bg-[var(--brand-surface)] last:border-b-0"
                      >
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-3">
                            <span
                              className="h-4 w-4 rounded-full shadow-[0_0_0_2px_rgba(255,255,255,0.8)]"
                              style={{ backgroundColor: themedColor(team.color) }}
                            />
                            <div>
                              <div className="text-[15px] font-black text-[#20324d]">{team.name}</div>
                              <div className="text-[12px] font-bold text-[var(--c-9d8a73)]">อันดับ #{team.rank}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-[14px] font-bold text-[#20324d]">{team.leader}</td>
                        <td className="px-4 py-5 text-[14px] font-bold text-[#20324d]">{team.members}</td>
                        <td className="px-4 py-5 text-[14px] font-bold text-[#20324d]">
                          {team.points.toLocaleString()}
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openEditTeam(team)}
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--brand-text)] transition-colors hover:border-[var(--brand-accent)] hover:bg-[var(--brand-soft)] hover:text-[var(--c-a36206)]"
                              aria-label={`แก้ไขทีม ${team.name}`}
                            >
                              <Pencil className="h-4 w-4" strokeWidth={2.2} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTeam(team)}
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f1caca] bg-white text-[#ef544d] transition-colors hover:bg-[#fff4f4] hover:text-[#d63b35]"
                              aria-label={`ลบทีม ${team.name}`}
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        </div>

        <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
          <DialogContent className="max-h-[88vh] max-w-[620px] overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] p-0 shadow-[0_24px_50px_rgba(62,36,13,0.18)] sm:rounded-[30px] sm:max-w-[680px]">
            <DialogHeader className="border-b border-[var(--border)] bg-[linear-gradient(180deg,var(--brand-soft)_0%,var(--brand-soft)_100%)] px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-5">
              <DialogTitle className="text-[22px] font-black text-[var(--brand-text)] sm:text-[28px]">
                {editingTeam?.mode === "create" ? "Create Team" : "Edit Team"}
              </DialogTitle>
              <DialogDescription className="max-w-[460px] text-[12px] font-bold leading-relaxed text-[#8E8A81] sm:text-[14px]">
                {editingTeam?.mode === "create"
                  ? "กรอกข้อมูลทีมใหม่ใน mockup นี้ แล้วกด confirm เพื่อเพิ่มทีมลงตาราง"
                  : "ปรับข้อมูลใน mockup นี้ แล้วกด confirm เพื่ออัปเดตกลับไปยังตารางหลัก"}
              </DialogDescription>
            </DialogHeader>

            {editingTeam ? (
              <div className="max-h-[calc(88vh-132px)] overflow-y-auto bg-[var(--brand-surface)] px-4 py-4 sm:max-h-[calc(88vh-150px)] sm:px-6 sm:py-6">
                <div className="mb-4 rounded-[18px] border border-[var(--border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(62,36,13,0.04)] sm:mb-5 sm:rounded-[16px] sm:px-5 sm:py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-5 w-5 flex-shrink-0 rounded-full ring-4 ring-[var(--brand-soft)]"
                      style={{ backgroundColor: editingTeam.color }}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-black text-[#1A1A1A] sm:text-[16px]">
                        {editingTeam.name || "Team name"}
                      </div>
                      <div className="text-[11px] font-bold text-[#8E8A81] sm:text-[13px]">
                        {editingTeam.mode === "create"
                          ? "ตั้งค่าทีมใหม่ก่อนยืนยัน"
                          : "อัปเดตข้อมูลทีมก่อนยืนยัน"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2 sm:gap-4 sm:pb-1">
                  <div className="flex flex-col gap-2">
                    <Label className="text-[12px] font-black text-[var(--brand-text)]">Team Name</Label>
                    <Input
                      value={editingTeam.name}
                      onChange={(event) => updateEditingTeam("name", event.target.value)}
                      className="h-11 rounded-[18px] border-[var(--border)] bg-white px-4 text-[14px] font-bold text-[var(--foreground)] focus-visible:border-[var(--brand-accent)] focus-visible:ring-0 sm:h-12 sm:text-[15px]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-[12px] font-black text-[var(--brand-text)]">Leader</Label>
                    <Input
                      value={editingTeam.leader}
                      onChange={(event) => updateEditingTeam("leader", event.target.value)}
                      className="h-11 rounded-[18px] border-[var(--border)] bg-white px-4 text-[14px] font-bold text-[var(--foreground)] focus-visible:border-[var(--brand-accent)] focus-visible:ring-0 sm:h-12 sm:text-[15px]"
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label className="text-[12px] font-black text-[var(--brand-text)]">Team Color</Label>
                    <div className="flex h-11 items-center gap-3 rounded-[18px] border border-[var(--border)] bg-white px-4 sm:h-12">
                      <input
                        type="color"
                        value={editingTeam.color}
                        onChange={(event) => updateEditingTeam("color", event.target.value)}
                        className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0 sm:h-8 sm:w-10"
                      />
                      <span className="text-[12px] font-bold text-[var(--brand-text)] sm:text-[14px]">
                        {editingTeam.color}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <DialogFooter className="rounded-b-[26px] border-t border-[var(--border)] bg-[var(--brand-soft)] px-5 py-4 sm:rounded-b-[30px] sm:px-6 sm:py-5">
              <div className="flex w-full justify-end gap-2 pr-1 pb-1 sm:pr-0 sm:pb-0">
                <Button
                  variant="outline"
                  onClick={() => setEditingTeam(null)}
                  className="h-10 rounded-full border-[var(--border)] bg-white px-4 text-[13px] text-[var(--brand-text)] hover:bg-[var(--brand-soft)] sm:h-11 sm:px-5 sm:text-[14px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmTeamEdit}
                  className="h-10 rounded-full bg-[var(--brand-text)] px-4 text-[13px] text-white hover:bg-[var(--c-4a280f)] sm:h-11 sm:px-5 sm:text-[14px]"
                >
                  {editingTeam?.mode === "create" ? "Confirm Create" : "Confirm Update"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deletingTeam} onOpenChange={(open) => !open && setDeletingTeam(null)}>
          <DialogContent className="max-w-[520px] overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] p-0 shadow-[0_24px_50px_rgba(62,36,13,0.18)] sm:rounded-[30px]">
            <DialogHeader className="border-b border-[var(--border)] bg-[linear-gradient(180deg,var(--brand-soft)_0%,var(--brand-soft)_100%)] px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-5">
              <DialogTitle className="text-[22px] font-black text-[#8a2f2b] sm:text-[26px]">
                Confirm Delete
              </DialogTitle>
              <DialogDescription className="max-w-[420px] text-[12px] font-bold leading-relaxed text-[#8E8A81] sm:text-[14px]">
                แน่ใจใช่ไหมว่าต้องการลบทีมนี้ออกจาก Leaderboard หากยืนยัน รายการจะหายจากหน้าแอดมินและหน้าหลักทันที
              </DialogDescription>
            </DialogHeader>

            {deletingTeam ? (
              <div className="bg-[var(--brand-surface)] px-4 py-4 sm:px-6 sm:py-6">
                <div className="rounded-[16px] border border-[#f1d1cf] bg-white px-4 py-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)]">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-5 w-5 flex-shrink-0 rounded-full ring-4 ring-[var(--brand-soft)]"
                      style={{ backgroundColor: deletingTeam.color }}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-black text-[#1A1A1A] sm:text-[16px]">
                        {deletingTeam.name}
                      </div>
                      <div className="text-[12px] font-bold text-[#8E8A81]">
                        Leader {deletingTeam.leader} · Rank #{deletingTeam.rank}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <DialogFooter className="rounded-b-[26px] border-t border-[var(--border)] bg-[var(--brand-soft)] px-5 py-4 sm:rounded-b-[30px] sm:px-6 sm:py-5">
              <div className="flex w-full justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeletingTeam(null)}
                  className="h-10 rounded-full border-[var(--border)] bg-white px-4 text-[13px] text-[var(--brand-text)] hover:bg-[var(--brand-soft)] sm:h-11 sm:px-5 sm:text-[14px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteTeam}
                  className="h-10 rounded-full bg-[#b33a34] px-4 text-[13px] text-white hover:bg-[#982b26] sm:h-11 sm:px-5 sm:text-[14px]"
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
