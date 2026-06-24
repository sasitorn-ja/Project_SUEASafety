"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutList, Pencil, Plus, Trash2 } from "lucide-react";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  leaderUserId: string;
  leaderEmail: string;
  leader: string;
  members: number;
  points: number;
  percent: number;
  streak: number;
  awards: number;
  color: string;
};

type ApiUser = {
  id: string | number;
  employee_no?: string | null;
  email?: string | null;
  name_th?: string | null;
  name_en?: string | null;
};

function userName(user: ApiUser) {
  return user.name_th || user.name_en || user.email || `User #${user.id}`;
}

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

// กลุ่มสำรองสำหรับ user ที่หน่วยงาน (แผนก) เป็น null/ว่าง
const UNASSIGNED_DIVISION = "ไม่ระบุหน่วยงาน";

function makeTeamDraft(index: number): LeaderboardTeam {
  return {
    id: `team-draft-${Date.now()}-${index}`,
    rank: index + 1,
    name: `หน่วยงานใหม่ ${index + 1}`,
    leaderUserId: "",
    leaderEmail: "",
    leader: "",
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
    leaderUserId: team.leaderUserId || "",
    leaderEmail: team.leaderEmail || "",
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
  const [leaderSearch, setLeaderSearch] = useState("");
  const [leaderUsers, setLeaderUsers] = useState<ApiUser[]>([]);
  const [leaderUsersLoading, setLeaderUsersLoading] = useState(false);
  const [divisions, setDivisions] = useState<string[]>([]);

  useEffect(() => {
    setDraftTeams(teamStandings);
  }, [teamStandings]);

  // ดึงรายชื่อหน่วยงาน (ระดับแผนก/DIVISION) จากระบบ ให้เลือกในตาราง
  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/organizations?pageSize=1000", { credentials: "include", cache: "no-store" });
        const payload = await response.json().catch(() => null) as { data?: { items?: Array<Record<string, unknown>> } } | null;
        const items = Array.isArray(payload?.data?.items) ? payload!.data!.items! : [];
        const names = items
          .filter((item) => String(item.organization_type ?? item.organizationType ?? "").toUpperCase() === "DIVISION")
          .map((item) => String(item.name_th ?? item.nameTh ?? item.name_en ?? item.nameEn ?? "").trim())
          .filter(Boolean);
        setDivisions(Array.from(new Set(names)));
      } catch (error) {
        console.error("Failed to load organizations", error);
        setDivisions([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!editingTeam) {
      setLeaderSearch("");
      setLeaderUsers([]);
      return;
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        setLeaderUsersLoading(true);
        try {
          const params = new URLSearchParams({ pageSize: "50" });
          if (leaderSearch.trim()) params.set("search", leaderSearch.trim());
          const response = await fetch(`/api/users?${params}`, { credentials: "include", cache: "no-store" });
          const payload = await response.json().catch(() => null) as { data?: { items?: ApiUser[] } } | null;
          setLeaderUsers(response.ok && Array.isArray(payload?.data?.items) ? payload.data.items : []);
        } finally {
          setLeaderUsersLoading(false);
        }
      })();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [editingTeam?.id, leaderSearch]);

  const totalPoints = useMemo(
    () => draftTeams.reduce((sum, team) => sum + (Number(team.points) || 0), 0),
    [draftTeams]
  );
  const totalMembers = useMemo(
    () => draftTeams.reduce((sum, team) => sum + (Number(team.members) || 0), 0),
    [draftTeams]
  );
  const leaderOptions = useMemo<ComboboxOption[]>(() => {
    const options: ComboboxOption[] = leaderUsers.map((user) => ({
      value: String(user.id),
      label: `${userName(user)}${user.email ? ` · ${user.email}` : ""}`,
      keywords: [user.email || "", user.employee_no || "", user.name_en || "", user.name_th || ""],
    }));
    if (editingTeam?.leaderUserId && !options.some((option) => option.value === editingTeam.leaderUserId)) {
      options.unshift({
        value: editingTeam.leaderUserId,
        label: `${editingTeam.leader || `User #${editingTeam.leaderUserId}`}${editingTeam.leaderEmail ? ` · ${editingTeam.leaderEmail}` : ""}`,
      });
    }
    return options;
  }, [editingTeam, leaderUsers]);

  const divisionOptions = useMemo<ComboboxOption[]>(() => {
    const options: ComboboxOption[] = divisions.map((name) => ({ value: name, label: name }));
    // กลุ่มรองรับคนที่หน่วยงานเป็น null/ว่าง ให้คะแนนยังถูกนับได้
    options.push({ value: UNASSIGNED_DIVISION, label: UNASSIGNED_DIVISION, keywords: ["null", "ไม่มี", "ว่าง", "unassigned"] });
    // ให้แถวเดิมที่ชื่อหน่วยงานไม่อยู่ในรายการ ยังแสดงค่าปัจจุบันได้
    if (editingTeam?.name && !options.some((option) => option.value === editingTeam.name)) {
      options.unshift({ value: editingTeam.name, label: editingTeam.name });
    }
    return options;
  }, [divisions, editingTeam?.name]);

  const commitTeams = async (teams: LeaderboardTeam[]) => {
    const normalizedTeams = teams.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));

    setDraftTeams(normalizedTeams);
    const saved = await updateTeamStandings(normalizedTeams);
    if (!saved) {
      window.alert("บันทึกข้อมูลทีมและอันดับไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return false;
    }
    setSaveState("saved");
    return true;
  };

  const addTeam = () => {
    const nextTeam = makeTeamDraft(draftTeams.length);
    setEditingTeam({
      ...createTeamEditor(nextTeam),
      mode: "create",
    });
    setSaveState("idle");
  };

  const confirmDeleteTeam = async () => {
    if (!deletingTeam) return;

    if (await commitTeams(draftTeams.filter((team) => team.id !== deletingTeam.id))) {
      setDeletingTeam(null);
    }
  };

  const openEditTeam = (team: LeaderboardTeam) => {
    setEditingTeam(createTeamEditor(team));
  };

  const updateEditingTeam = <K extends keyof TeamEditorState>(key: K, value: TeamEditorState[K]) => {
    setEditingTeam((current) => (current ? { ...current, [key]: value } : current));
  };

  const confirmTeamEdit = async () => {
    if (!editingTeam) return;

    let saved = false;
    if (editingTeam.mode === "create") {
      saved = await commitTeams([
        ...draftTeams,
        {
          id: editingTeam.id,
          rank: draftTeams.length + 1,
          name: editingTeam.name,
          leaderUserId: editingTeam.leaderUserId,
          leaderEmail: editingTeam.leaderEmail,
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
      saved = await commitTeams(
        draftTeams.map((team) =>
          team.id === editingTeam.id
            ? {
                ...team,
                name: editingTeam.name,
                leaderUserId: editingTeam.leaderUserId,
                leaderEmail: editingTeam.leaderEmail,
                leader: editingTeam.leader,
                color: editingTeam.color,
              }
            : team
        )
      );
    }

    if (saved) setEditingTeam(null);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[1480px] bg-[var(--background)] px-3.5 pt-2.5 pb-8 font-sarabun md:px-5">
        <SafetyCultureHero
          eyebrow="SAFETY CULTURE ADMIN"
          title={
            <>
              ทีมและ <span className="text-[var(--brand-accent)]">อันดับ</span>
            </>
          }
          description="จัดการหน่วยงาน คะแนน และอันดับ โดยอ้างอิงข้อมูลจริงในระบบ"
          variant="community"
          backgroundImage="/images/safety-culture-hero.png"
          backgroundOverlay="linear-gradient(90deg, rgba(2, 26, 66, .82) 0%, rgba(3, 33, 78, .5) 34%, rgba(3, 33, 78, .16) 56%, rgba(3, 33, 78, 0) 70%)"
        />
        <Card className="mt-4 rounded-[16px] border border-[var(--border)] bg-[var(--brand-soft)] p-3.5 shadow-[0_8px_18px_var(--brand-shadow)] md:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[11px] font-black text-[var(--brand-text)]">
                {draftTeams.length} หน่วยงาน
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
            title="จัดการหน่วยงาน"
            description="จัดการหน่วยงานที่จะแสดงบนหน้าอันดับจากข้อมูลจริงในระบบ พร้อมแก้ไขหัวหน้าหน่วยงานได้จากหน้านี้"
            icon={<LayoutList className="h-5 w-5" strokeWidth={2.3} />}
            actions={
              <Button
                onClick={addTeam}
                className="h-11 rounded-xl bg-[var(--brand-accent-strong)] px-5 text-[13px] font-black text-white hover:bg-[var(--brand-accent)]"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                เพิ่มหน่วยงาน
              </Button>
            }
          >
            <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--brand-surface)] shadow-[0_8px_18px_rgba(62,36,13,0.04)]">
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full">
                  <thead className="bg-[var(--brand-soft)] text-left">
                    <tr className="border-b border-[var(--border)]">
                      <th className="px-4 py-4 text-[12px] font-black text-[var(--brand-text)]">หน่วยงาน</th>
                      <th className="px-4 py-4 text-[12px] font-black text-[var(--brand-text)]">หัวหน้า</th>
                      <th className="px-4 py-4 text-[12px] font-black text-[var(--brand-text)]">สมาชิก</th>
                      <th className="px-4 py-4 text-[12px] font-black text-[var(--brand-text)]">คะแนนรวม</th>
                      <th className="px-4 py-4 text-[12px] font-black text-[var(--brand-text)]">จัดการ</th>
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
                              aria-label={`แก้ไขหน่วยงาน ${team.name}`}
                            >
                              <Pencil className="h-4 w-4" strokeWidth={2.2} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTeam(team)}
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f1caca] bg-white text-[#ef544d] transition-colors hover:bg-[#fff4f4] hover:text-[#d63b35]"
                              aria-label={`ลบหน่วยงาน ${team.name}`}
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
                {editingTeam?.mode === "create" ? "เพิ่มหน่วยงาน" : "แก้ไขหน่วยงาน"}
              </DialogTitle>
              <DialogDescription className="max-w-[460px] text-[12px] font-bold leading-relaxed text-[#8E8A81] sm:text-[14px]">
                {editingTeam?.mode === "create"
                  ? "กรอกข้อมูลหน่วยงานใหม่ แล้วกดยืนยันเพื่อบันทึกลงระบบ"
                  : "ปรับข้อมูลหน่วยงาน แล้วกดยืนยันเพื่ออัปเดตกลับไปยังระบบ"}
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
                        {editingTeam.name || "ชื่อหน่วยงาน"}
                      </div>
                      <div className="text-[11px] font-bold text-[#8E8A81] sm:text-[13px]">
                        {editingTeam.mode === "create"
                          ? "ตั้งค่าหน่วยงานใหม่ก่อนยืนยัน"
                          : "อัปเดตข้อมูลหน่วยงานก่อนยืนยัน"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2 sm:gap-4 sm:pb-1">
                  <div className="flex flex-col gap-2">
                    <Label className="text-[12px] font-black text-[var(--brand-text)]">ชื่อหน่วยงาน</Label>
                    <Combobox
                      value={editingTeam.name}
                      onValueChange={(name) => updateEditingTeam("name", name)}
                      options={divisionOptions}
                      placeholder="เลือกหน่วยงาน"
                      searchPlaceholder="ค้นหาหน่วยงาน"
                      emptyText="ไม่พบหน่วยงาน"
                      className="h-11 rounded-[18px] border-[var(--border)] bg-white px-4 text-[14px] font-bold text-[var(--foreground)] sm:h-12 sm:text-[15px]"
                      contentClassName="min-w-[300px]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-[12px] font-black text-[var(--brand-text)]">หัวหน้าหน่วยงาน</Label>
                    <Combobox
                      value={editingTeam.leaderUserId}
                      onValueChange={(userId) => {
                        const selected = leaderUsers.find((user) => String(user.id) === userId);
                        setEditingTeam((current) => current ? {
                          ...current,
                          leaderUserId: userId,
                          leader: selected ? userName(selected) : current.leader,
                          leaderEmail: selected?.email || current.leaderEmail,
                        } : current);
                      }}
                      onSearchValueChange={setLeaderSearch}
                      options={leaderOptions}
                      placeholder="เลือกหัวหน้าหน่วยงานจากรายชื่อผู้ใช้"
                      searchPlaceholder="พิมพ์ชื่อ อีเมล หรือรหัสพนักงาน"
                      emptyText={leaderUsersLoading ? "กำลังค้นหาผู้ใช้..." : "ไม่พบผู้ใช้"}
                      className="h-11 rounded-[18px] border-[var(--border)] bg-white px-4 text-[14px] font-bold text-[var(--foreground)] sm:h-12 sm:text-[15px]"
                      contentClassName="min-w-[360px]"
                    />
                    <p className="px-1 text-[11px] font-bold text-[#8E8A81]">
                      เลือกหัวหน้าหน่วยงานจากรายชื่อผู้ใช้ในระบบ
                      {editingTeam.leaderEmail ? ` · ${editingTeam.leaderEmail}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label className="text-[12px] font-black text-[var(--brand-text)]">สีประจำหน่วยงาน</Label>
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
              <div className="flex w-full justify-end pr-1 pb-1 sm:pr-0 sm:pb-0">
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
                แน่ใจใช่ไหมว่าต้องการลบหน่วยงานนี้ออกจากหน้าอันดับ หากยืนยัน รายการจะหายจากหน้าแอดมินและหน้าหลักทันที
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
                        หัวหน้า {deletingTeam.leader} · อันดับ #{deletingTeam.rank}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <DialogFooter className="rounded-b-[26px] border-t border-[var(--border)] bg-[var(--brand-soft)] px-5 py-4 sm:rounded-b-[30px] sm:px-6 sm:py-5">
              <div className="flex w-full justify-end">
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
