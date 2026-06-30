"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, ChevronDown, LayoutList, Pencil, Plus, Trash2 } from "lucide-react";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Dialog } from "@/components/ui/dialog";
import {
  AppDialogBody,
  AppDialogContent,
  AppDialogDescription,
  AppDialogSectionFooter,
  AppDialogSectionHeader,
  AppDialogTitle,
} from "@/components/ui/app-dialog";
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
  const [divisions, setDivisions] = useState<string[]>([
    "Metro",
    "East",
    "West",
    "North",
    "Northeast",
    "RMC",
    "SMART Structure"
  ]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
        
        const mockupDivs = ["Metro", "East", "West", "North", "Northeast", "RMC", "SMART Structure"];
        setDivisions(Array.from(new Set([...mockupDivs, ...names])));
      } catch (error) {
        console.error("Failed to load organizations", error);
        setDivisions(["Metro", "East", "West", "North", "Northeast", "RMC", "SMART Structure"]);
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
    // กลุ่มรองรับคนที่หน่วยงานเป็น null/ว่าง ให้ Coin ยังถูกนับได้
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
      <div className="page-shell-wide bg-[var(--background)] pt-2.5 pb-8 font-sarabun">
        <SafetyCultureHero
          eyebrow="SAFETY CULTURE ADMIN"
          title={
            <>
              ทีมและ <span className="text-[var(--brand-accent)]">อันดับ</span>
            </>
          }
          description="จัดการหน่วยงาน Coin และอันดับ โดยอ้างอิงข้อมูลจริงในระบบ"
          variant="community"
          backgroundImage="/images/heroes/Home01.png"
          backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.82) 0%, rgba(210,235,255,.60) 32%, rgba(210,235,255,.10) 56%, rgba(210,235,255,0) 74%)"
          mascotSrc="/images/mascots/wangjai/44.png"
          mascotAction="cheer2"
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
                {totalPoints.toLocaleString()} Coin รวม
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
                className="h-11 rounded-full bg-[#0B82F0] px-5 text-[13px] font-black text-white hover:bg-[#0973d6] transition-colors"
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
                      <th className="px-4 py-4 text-[12px] font-black text-[var(--brand-text)]">Coin รวม</th>
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

        <Dialog open={!!editingTeam} onOpenChange={(open) => {
          if (!open) {
            setEditingTeam(null);
            setDropdownOpen(false);
          }
        }}>
          <AppDialogContent 
            className="max-w-[485px] w-[92vw] overflow-visible"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <AppDialogSectionHeader className="px-5 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-[#F1F1F1]">
              <AppDialogTitle className="text-[22px] sm:text-[24px] font-black text-[#1A1A1A]">
                {editingTeam?.mode === "create" ? "เพิ่มหน่วยงาน" : "แก้ไขหน่วยงาน"}
              </AppDialogTitle>
              <AppDialogDescription className="text-[13px] sm:text-[14px] text-[#8E8A81] mt-1">
                {editingTeam?.mode === "create"
                  ? "กรอกข้อมูลหน่วยงานใหม่ แล้วกดยืนยันเพื่อบันทึกลงระบบ"
                  : "ปรับข้อมูลหน่วยงาน แล้วกดยืนยันเพื่ออัปเดตกลับไปยังระบบ"}
              </AppDialogDescription>
            </AppDialogSectionHeader>

            {editingTeam ? (
              <AppDialogBody className="overflow-visible bg-[var(--brand-surface)] px-5 py-5 sm:px-6 sm:py-6">
                {/* Preview Badge */}
                <div className="mb-5 rounded-xl border border-[var(--border)] bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-5 w-5 flex-shrink-0 rounded-full ring-4 ring-[var(--brand-soft)] transition-all duration-300"
                      style={{ backgroundColor: editingTeam.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-black text-[#1A1A1A]">
                        {editingTeam.name || "ชื่อหน่วยงาน"}
                      </div>
                      <div className="text-[12px] font-bold text-[#8E8A81]">
                        {editingTeam.mode === "create"
                          ? "หน่วยงานใหม่"
                          : `หัวหน้า: ${editingTeam.leader || "ยังไม่ได้เลือก"}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Single Column Fields */}
                <div className="flex flex-col gap-4.5">
                  {/* Agency Name */}
                  <div className="flex flex-col gap-1.5 relative">
                    <Label className="text-[12px] font-black text-[var(--brand-text)]">ชื่อหน่วยงาน</Label>
                    <div className="relative flex items-center w-full">
                      <span className="absolute left-3.5 text-[#8E8A81] pointer-events-none">
                        <Building2 className="h-4.5 w-4.5" />
                      </span>
                      <input
                        type="text"
                        value={editingTeam.name}
                        onChange={(e) => {
                          updateEditingTeam("name", e.target.value);
                          setDropdownOpen(true);
                        }}
                        placeholder="พิมพ์หรือเลือกชื่อหน่วยงาน"
                        className="w-full h-11 rounded-xl border border-[var(--border)] bg-white pl-10 pr-9 text-[14px] font-bold text-[var(--foreground)] outline-none focus:border-[#0B82F0] focus:ring-1 focus:ring-[#0B82F0] transition-all shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="absolute right-2.5 h-6 w-6 text-[#8E8A81] hover:text-[#1A1A1A] hover:bg-[#F1F8FE] rounded-lg transition-all flex items-center justify-center cursor-pointer"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      {dropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setDropdownOpen(false)} 
                          />
                          <div className="absolute top-[100%] left-0 w-full mt-1.5 max-h-[190px] overflow-y-auto rounded-xl border border-[#CFE3F4] bg-white shadow-xl z-50 py-1.5 divide-y divide-[#F1F8FE] [scrollbar-width:thin]">
                            {(() => {
                              const filteredDivs = divisions.filter((name) =>
                                name.toLowerCase().includes((editingTeam.name || "").toLowerCase())
                              );
                              
                              const itemsToShow = filteredDivs.length > 0 ? filteredDivs : divisions;
                              
                              return (
                                <>
                                  {itemsToShow.map((name) => (
                                    <button
                                      key={name}
                                      type="button"
                                      onClick={() => {
                                        updateEditingTeam("name", name);
                                        setDropdownOpen(false);
                                      }}
                                      className={cn(
                                        "w-full text-left px-4 py-2.5 text-[13.5px] font-bold transition-colors cursor-pointer flex items-center justify-between",
                                        editingTeam.name === name 
                                          ? "bg-[#EAF6FF] text-[#0B82F0]" 
                                          : "text-[#0B2F6B] hover:bg-[#F8FCFF]"
                                      )}
                                    >
                                      <span className="truncate pr-3">{name}</span>
                                      {editingTeam.name === name && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#0B82F0] flex-shrink-0" />
                                      )}
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateEditingTeam("name", UNASSIGNED_DIVISION);
                                      setDropdownOpen(false);
                                    }}
                                    className={cn(
                                      "w-full text-left px-4 py-2.5 text-[13.5px] font-bold transition-colors cursor-pointer flex items-center justify-between",
                                      editingTeam.name === UNASSIGNED_DIVISION 
                                        ? "bg-[#EAF6FF] text-[#0B82F0]" 
                                        : "text-[#8E8A81] hover:bg-[#F8FCFF]"
                                    )}
                                  >
                                    <span>{UNASSIGNED_DIVISION} (ไม่มีหน่วยงาน)</span>
                                    {editingTeam.name === UNASSIGNED_DIVISION && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-[#0B82F0] flex-shrink-0" />
                                    )}
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Leader */}
                  <div className="flex flex-col gap-1.5">
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
                      className="w-full h-11 rounded-xl border border-[var(--border)] bg-white px-4 text-[14px] font-bold text-[var(--foreground)] outline-none focus:border-[#0B82F0] focus:ring-1 focus:ring-[#0B82F0] transition-all shadow-sm"
                      contentClassName="min-w-[320px] max-w-[420px]"
                    />
                    {editingTeam.leaderEmail && (
                      <p className="px-1 text-[11px] font-bold text-[#8E8A81] truncate">
                        อีเมลหัวหน้า: {editingTeam.leaderEmail}
                      </p>
                    )}
                  </div>

                  {/* Colors */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[12px] font-black text-[var(--brand-text)]">สีประจำหน่วยงาน</Label>
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-white p-2.5 shadow-sm">
                      {["#0B82F0", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#EC4899", "#6B7280"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateEditingTeam("color", c)}
                          className={cn(
                            "h-6 w-6 rounded-full border transition-all duration-150 cursor-pointer flex items-center justify-center relative hover:scale-105",
                            editingTeam.color === c 
                              ? "border-black ring-2 ring-offset-2 ring-black scale-105" 
                              : "border-transparent"
                          )}
                          style={{ backgroundColor: c }}
                          title={c}
                        >
                          {editingTeam.color === c && (
                            <span className="block h-1 w-1 rounded-full bg-white shadow-sm" />
                          )}
                        </button>
                      ))}

                      {/* Custom Color Input */}
                      <div className="ml-auto flex items-center gap-1.5 border-l border-[#F1F1F1] pl-2.5">
                        <input
                          type="color"
                          value={editingTeam.color.startsWith("#") ? editingTeam.color : "#0B82F0"}
                          onChange={(event) => updateEditingTeam("color", event.target.value)}
                          className="h-7 w-7 cursor-pointer rounded-lg border border-[var(--border)] bg-transparent p-0 overflow-hidden"
                        />
                        <span className="text-[11px] font-mono font-bold text-[var(--brand-text)] uppercase">
                          {editingTeam.color}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </AppDialogBody>
            ) : null}

            <AppDialogSectionFooter className="px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex w-full justify-end pr-1 pb-1 sm:pr-0 sm:pb-0">
                <Button
                  onClick={confirmTeamEdit}
                  className="h-10 rounded-full bg-[#0B82F0] px-4 text-[13px] text-white hover:bg-[#0973d6] sm:h-11 sm:px-5 sm:text-[14px] transition-colors"
                >
                  บันทึก
                </Button>
              </div>
            </AppDialogSectionFooter>
          </AppDialogContent>
        </Dialog>

        <Dialog open={!!deletingTeam} onOpenChange={(open) => !open && setDeletingTeam(null)}>
          <AppDialogContent className="max-w-130">
            <AppDialogSectionHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-5">
              <AppDialogTitle className="text-[#8a2f2b] sm:text-[26px]">
                Confirm Delete
              </AppDialogTitle>
              <AppDialogDescription className="max-w-105 sm:text-[14px]">
                แน่ใจใช่ไหมว่าต้องการลบหน่วยงานนี้ออกจากหน้าอันดับ หากยืนยัน รายการจะหายจากหน้าแอดมินและหน้าหลักทันที
              </AppDialogDescription>
            </AppDialogSectionHeader>

            {deletingTeam ? (
              <AppDialogBody className="bg-(--brand-surface) px-4 py-4 sm:px-6 sm:py-6">
                <div className="rounded-[16px] border border-[#f1d1cf] bg-white px-4 py-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)]">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-5 w-5 shrink-0 rounded-full ring-4 ring-brand-soft"
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
              </AppDialogBody>
            ) : null}

            <AppDialogSectionFooter className="px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex w-full justify-end">
                <Button
                  onClick={confirmDeleteTeam}
                  className="h-10 rounded-full bg-[#b33a34] px-4 text-[13px] text-white hover:bg-[#982b26] sm:h-11 sm:px-5 sm:text-[14px]"
                >
                  Confirm Delete
                </Button>
              </div>
            </AppDialogSectionFooter>
          </AppDialogContent>
        </Dialog>
      </div>
    </>
  );
}
