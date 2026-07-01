"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, LayoutList, Loader2, Plus, Save, Search, UserCog, Users } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, apiJson } from "@/lib/api-client";
import { FIXED_SAFETY_CULTURE_TEAMS } from "@/lib/safety-culture-fixed-teams";
import { useAppActions } from "@/providers/app-providers";

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

type TeamMember = {
  user_id: string;
  name: string;
  email?: string | null;
  division?: string | null;
  profile_image_url?: string | null;
  points?: number;
};

type AdminTeam = {
  id: string;
  code?: string;
  name: string;
  leader_user_id?: string | null;
  leader_name?: string | null;
  leader_email?: string | null;
  color: string;
  members: number;
  points: number;
  display_order?: number;
  source_divisions?: string[];
  member_ids?: string[];
  member_details?: TeamMember[];
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  division: string;
  currentTeamId: string;
  currentTeamName: string;
};

type TeamForm = {
  id: string;
  name: string;
  code: string;
  leaderUserId: string;
  memberUserIds: string[];
};

function userDisplayName(item: Record<string, unknown>) {
  return String(item.name_th || item.nameTh || item.name_en || item.nameEn || item.email || "Unknown user");
}

function teamFromApi(item: Record<string, unknown>): AdminTeam {
  const memberDetails = Array.isArray(item.member_details || item.memberDetails)
    ? ((item.member_details || item.memberDetails) as TeamMember[])
    : [];
  return {
    id: String(item.id || ""),
    code: String(item.code || item.team_code || item.teamCode || ""),
    name: String(item.name || item.team_name || item.teamName || ""),
    leader_user_id: item.leader_user_id || item.leaderUserId ? String(item.leader_user_id || item.leaderUserId) : "",
    leader_name: item.leader_name || item.leaderName ? String(item.leader_name || item.leaderName) : "",
    leader_email: item.leader_email || item.leaderEmail ? String(item.leader_email || item.leaderEmail) : "",
    color: String(item.color || "var(--brand-accent)"),
    members: Number(item.members || item.member_count || item.memberCount || 0),
    points: Number(item.points || 0),
    display_order: Number(item.display_order || item.displayOrder || 999),
    source_divisions: Array.isArray(item.source_divisions || item.sourceDivisions)
      ? ((item.source_divisions || item.sourceDivisions) as string[])
      : [],
    member_ids: Array.isArray(item.member_ids || item.memberIds)
      ? ((item.member_ids || item.memberIds) as string[]).map(String)
      : memberDetails.map((member) => String(member.user_id || "")),
    member_details: memberDetails,
  };
}

function sortTeams(left: AdminTeam, right: AdminTeam) {
  const leftFixedOrder = FIXED_SAFETY_CULTURE_TEAMS.find((team) => team.code === left.code)?.order;
  const rightFixedOrder = FIXED_SAFETY_CULTURE_TEAMS.find((team) => team.code === right.code)?.order;
  return (leftFixedOrder ?? left.display_order ?? 999) - (rightFixedOrder ?? right.display_order ?? 999)
    || left.name.localeCompare(right.name, "th");
}

export default function AdminLeaderboardPage() {
  const { showNotification } = useAppActions();
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [form, setForm] = useState<TeamForm>({
    id: "",
    name: "",
    code: "",
    leaderUserId: "",
    memberUserIds: [],
  });

  const orderedTeams = useMemo(() => [...teams].sort(sortTeams), [teams]);
  const totalPoints = orderedTeams.reduce((sum, team) => sum + (Number(team.points) || 0), 0);
  const totalMembers = orderedTeams.reduce((sum, team) => sum + (Number(team.members) || 0), 0);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [teamsResult, usersResult] = await Promise.all([
      apiFetch<{ items: Array<Record<string, unknown>> }>("/api/safety-culture/teams"),
      apiFetch<{ items: Array<Record<string, unknown>> }>("/api/users?pageSize=500"),
    ]);

    const nextTeams = teamsResult.ok && Array.isArray(teamsResult.data?.items)
      ? teamsResult.data.items.map(teamFromApi).sort(sortTeams)
      : [];
    setTeams(nextTeams);

    const currentTeamByUser = new Map<string, { id: string; name: string }>();
    for (const team of nextTeams) {
      for (const userId of team.member_ids || []) {
        currentTeamByUser.set(String(userId), { id: team.id, name: team.name });
      }
    }

    if (usersResult.ok && Array.isArray(usersResult.data?.items)) {
      setUsers(usersResult.data.items.map((item) => {
        const id = String(item.id || "");
        const currentTeam = currentTeamByUser.get(id);
        return {
          id,
          name: userDisplayName(item),
          email: String(item.email || ""),
          division: String(item.division || item.organization_name || item.organizationName || ""),
          currentTeamId: currentTeam?.id || "",
          currentTeamName: currentTeam?.name || "ยังไม่มีทีม",
        };
      }));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedMemberSet = useMemo(() => new Set(form.memberUserIds), [form.memberUserIds]);
  const selectedUsers = useMemo(
    () => users.filter((user) => selectedMemberSet.has(user.id)).sort((left, right) => left.name.localeCompare(right.name, "th")),
    [selectedMemberSet, users],
  );
  const filteredUsers = useMemo(() => {
    const search = memberSearch.trim().toLowerCase();
    if (!search) return users;
    return users.filter((user) => {
      const haystack = `${user.name} ${user.email} ${user.division} ${user.currentTeamName}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [memberSearch, users]);

  const openCreateDialog = () => {
    setForm({ id: "", name: "", code: "", leaderUserId: "", memberUserIds: [] });
    setMemberSearch("");
    setDialogOpen(true);
  };

  const openEditDialog = (team: AdminTeam) => {
    setForm({
      id: team.id,
      name: team.name,
      code: team.code || "",
      leaderUserId: String(team.leader_user_id || ""),
      memberUserIds: [...(team.member_ids || [])],
    });
    setMemberSearch("");
    setDialogOpen(true);
  };

  const toggleMember = (userId: string) => {
    setForm((current) => {
      const next = new Set(current.memberUserIds);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      const leaderUserId = next.has(current.leaderUserId) ? current.leaderUserId : "";
      return { ...current, leaderUserId, memberUserIds: [...next] };
    });
  };

  const saveTeam = async () => {
    const name = form.name.trim();
    if (!name) {
      showNotification({ type: "info", message: "กรุณาระบุชื่อทีม" });
      return;
    }
    setSaving(true);
    const payload = {
      id: form.id || undefined,
      name,
      leaderUserId: form.leaderUserId || null,
      memberUserIds: form.memberUserIds,
    };
    const result = await apiFetch<{ items: Array<Record<string, unknown>> }>(
      "/api/safety-culture/teams",
      apiJson(form.id ? "PUT" : "POST", payload),
    );
    setSaving(false);
    if (!result.ok) {
      showNotification({ type: "info", message: "บันทึกทีมไม่สำเร็จ กรุณาลองใหม่" });
      return;
    }
    await loadData();
    setDialogOpen(false);
    showNotification({ type: "success", message: "บันทึกทีมเรียบร้อยแล้ว" });
  };

  return (
    <div className="page-shell-wide bg-[var(--background)] pt-2.5 pb-8 font-sarabun">
      <SafetyCultureHero
        eyebrow="SAFETY CULTURE ADMIN"
        title={<>ทีมและ <span className="text-[var(--brand-accent)]">อันดับ</span></>}
        description="จัดทีมจาก SSO และสร้างทีมกำหนดเอง พร้อมย้ายสมาชิกและตั้งหัวหน้าทีม"
        variant="community"
        backgroundImage="/images/heroes/Safety-Culture-Admin-Leaderboard.png"
        backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.82) 0%, rgba(210,235,255,.60) 32%, rgba(210,235,255,.10) 56%, rgba(210,235,255,0) 74%)"
        mascotSrc="/images/mascots/wangjai/44.png"
        mascotAction="cheer2"
      />

      <Card className="mt-4 rounded-[16px] border border-[var(--border)] bg-[var(--brand-soft)] p-3.5 shadow-[0_8px_18px_var(--brand-shadow)] md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[12px] font-black text-[var(--brand-text)]">
              {orderedTeams.length.toLocaleString()} ทีมทั้งหมด
            </Badge>
            <Badge className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[12px] font-black text-[var(--brand-text)]">
              <Users className="mr-1.5 h-3.5 w-3.5" />
              {totalMembers.toLocaleString()} สมาชิก
            </Badge>
            <Badge className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[12px] font-black text-[var(--brand-text)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/icons/STCoin.png" alt="Coin" className="mr-1.5 h-3.5 w-3.5 object-contain" />
              {totalPoints.toLocaleString()} Coin รวม
            </Badge>
          </div>
          <Button onClick={openCreateDialog} className="h-9 rounded-xl px-3 text-[13px] font-black">
            <Plus className="h-4 w-4" />
            สร้างทีมใหม่
          </Button>
        </div>
      </Card>

      <Card className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] p-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)]">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] bg-[var(--brand-soft)] text-[var(--brand-text)]">
            <LayoutList className="h-5 w-5" strokeWidth={2.3} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[18px] font-black text-[#1A1A1A]">จัดการทีม Safety Culture</h2>
            <p className="text-[13px] font-bold leading-relaxed text-[#8E8A81]">
              ทีม SSO ยังคงจับกลุ่มตาม Division ส่วนทีมที่ admin สร้างเองจะคงสมาชิกไว้เมื่อผู้ใช้ login ใหม่
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse">
              <thead className="bg-[var(--brand-soft)] text-left">
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 text-[12px] font-black text-[var(--brand-text)]">ทีม</th>
                  <th className="px-4 py-3 text-[12px] font-black text-[var(--brand-text)]">หัวหน้าทีม</th>
                  <th className="px-4 py-3 text-[12px] font-black text-[var(--brand-text)]">กติกาจับกลุ่ม</th>
                  <th className="px-4 py-3 text-[12px] font-black text-[var(--brand-text)]">Division ที่พบ</th>
                  <th className="px-4 py-3 text-right text-[12px] font-black text-[var(--brand-text)]">สมาชิก</th>
                  <th className="px-4 py-3 text-right text-[12px] font-black text-[var(--brand-text)]">Coin รวม</th>
                  <th className="px-4 py-3 text-right text-[12px] font-black text-[var(--brand-text)]">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[13px] font-bold text-[#55739B]">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      กำลังโหลดข้อมูลทีม
                    </td>
                  </tr>
                ) : orderedTeams.map((team) => (
                  <tr key={team.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[#F8FCFF]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: team.color }} />
                        <div>
                          <div className="text-[15px] font-black text-[#20324d]">{team.name}</div>
                          <div className="text-[11px] font-bold text-[#8E8A81]">{team.code || "CUSTOM"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[13px] font-bold text-[#55739B]">
                      {team.leader_name || team.leader_email || <span className="text-[#9AA8B8]">ยังไม่กำหนด</span>}
                    </td>
                    <td className="px-4 py-4 text-[13px] font-bold text-[#55739B]">
                      {team.code ? MATCH_RULES[team.code] || MATCH_RULES.OTHER : "กำหนดสมาชิกโดย Admin"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex max-w-[300px] flex-wrap gap-1.5">
                        {team.source_divisions?.length ? team.source_divisions.map((division) => (
                          <span key={division} className="rounded-md border border-[#D7EAFE] bg-[#F4F9FF] px-2 py-1 text-[11px] font-bold text-[#365D8D]">
                            {division}
                          </span>
                        )) : (
                          <span className="text-[12px] font-bold text-[#9AA8B8]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-[15px] font-black text-[#20324d]">{team.members.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right text-[15px] font-black text-[#20324d]">{team.points.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(team)} className="rounded-xl font-black">
                        <UserCog className="h-3.5 w-3.5" />
                        จัดทีม
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && orderedTeams.length === 0 ? (
          <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--brand-soft)] px-4 py-5 text-[13px] font-bold text-[#55739B]">
            <Building2 className="h-4 w-4" />
            ยังไม่มีข้อมูลทีม กรุณาสร้างทีมใหม่หรือรัน migration ทีมถาวร
          </div>
        ) : null}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !saving && setDialogOpen(open)}>
        <DialogContent className="max-w-[min(960px,calc(100%-1rem))] p-0">
          <div className="border-b border-[var(--border)] bg-[var(--brand-soft)] px-5 py-4">
            <DialogHeader>
              <DialogTitle className="text-[18px] font-black text-[#20324d]">
                {form.id ? "จัดการทีม" : "สร้างทีมใหม่"}
              </DialogTitle>
              <DialogDescription className="text-[13px] font-bold text-[#55739B]">
                เลือกสมาชิกจากทุกทีมได้ทันที เมื่อบันทึก ระบบจะย้ายสมาชิกออกจากทีมเดิมให้อัตโนมัติ
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid max-h-[calc(100dvh-210px)] gap-4 overflow-y-auto p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-black text-[#20324d]">ชื่อทีม</span>
                <Input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  disabled={Boolean(form.code)}
                  className="h-10 rounded-xl bg-white text-[14px] font-bold"
                  placeholder="เช่น ทีมโครงการพิเศษ"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-black text-[#20324d]">หัวหน้าทีม</span>
                <Select
                  value={form.leaderUserId || "none"}
                  onValueChange={(value) => setForm((current) => ({ ...current, leaderUserId: value === "none" ? "" : value }))}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-white text-[13px] font-bold">
                    <SelectValue placeholder="เลือกหัวหน้าทีม" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ยังไม่กำหนด</SelectItem>
                    {selectedUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <div className="rounded-[12px] border border-[var(--border)] bg-[#F8FCFF] p-3">
                <div className="text-[12px] font-black text-[#20324d]">สมาชิกที่เลือก</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedUsers.length ? selectedUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleMember(user.id)}
                      className="rounded-lg border border-[#C9E4FF] bg-white px-2 py-1 text-left text-[11px] font-bold text-[#365D8D]"
                    >
                      {user.name}
                    </button>
                  )) : (
                    <span className="text-[12px] font-bold text-[#8E8A81]">ยังไม่ได้เลือกสมาชิก</span>
                  )}
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2">
                <Search className="h-4 w-4 flex-shrink-0 text-[#55739B]" />
                <Input
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  className="h-7 border-0 px-0 text-[13px] font-bold shadow-none focus-visible:ring-0"
                  placeholder="ค้นหาชื่อ อีเมล Division หรือทีมปัจจุบัน"
                />
              </div>

              <div className="max-h-[430px] overflow-y-auto rounded-[14px] border border-[var(--border)] bg-white">
                {filteredUsers.map((user) => {
                  const checked = selectedMemberSet.has(user.id);
                  return (
                    <label
                      key={user.id}
                      className="flex cursor-pointer items-start gap-3 border-b border-[var(--border)] px-3 py-3 last:border-b-0 hover:bg-[#F8FCFF]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMember(user.id)}
                        className="mt-1 h-4 w-4 rounded border-[#B9DCFF] accent-[#0B82F0]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-black text-[#20324d]">{user.name}</div>
                        <div className="truncate text-[11px] font-bold text-[#8E8A81]">{user.email || "-"}</div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <span className="rounded-md bg-[#F0F7FF] px-2 py-0.5 text-[11px] font-bold text-[#365D8D]">
                            {user.currentTeamName}
                          </span>
                          {user.division ? (
                            <span className="rounded-md bg-[#F7FAFC] px-2 py-0.5 text-[11px] font-bold text-[#64748B]">
                              {user.division}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-[var(--border)] bg-white px-5 py-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving} className="rounded-xl font-black">
              ยกเลิก
            </Button>
            <Button onClick={saveTeam} disabled={saving} className="rounded-xl font-black">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              บันทึกทีม
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
