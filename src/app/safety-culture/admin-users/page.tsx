"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search, ShieldCheck, ShieldMinus, UserCog, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getSessionDisplayName, useSessionUser } from "@/lib/session-user";

type ApiRole = {
  id: string | number;
  code: string;
  name?: string;
};

type ApiUser = {
  id: string | number;
  employee_no?: string | null;
  email?: string | null;
  name_th?: string | null;
  name_en?: string | null;
  position_name?: string | null;
  status?: string | null;
  roles?: ApiRole[];
  role_codes?: string[];
};

function dataItems<T>(payload: unknown): T[] {
  const data = (payload as { data?: { items?: T[] } })?.data;
  return Array.isArray(data?.items) ? data.items : [];
}

function getUserName(user: ApiUser) {
  return user.name_th || user.name_en || user.email || `User #${user.id}`;
}

function getRoleCodes(user: ApiUser) {
  const fromRoles = Array.isArray(user.roles) ? user.roles.map((role) => role.code).filter(Boolean) : [];
  const fromCodes = Array.isArray(user.role_codes) ? user.role_codes.filter(Boolean) : [];
  return Array.from(new Set([...fromRoles, ...fromCodes].map((code) => code.toUpperCase())));
}

const ADMIN_ROLE_CODES = new Set(["ADMIN", "SAFETY_ADMIN"]);

export default function AdminUsersPage() {
  const { user: sessionUser } = useSessionUser();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const safetyAdminRole = useMemo(
    () => roles.find((role) => role.code?.toUpperCase() === "SAFETY_ADMIN") ?? roles.find((role) => role.code?.toUpperCase() === "ADMIN"),
    [roles],
  );

  const adminRoleIds = useMemo(
    () => new Set(roles.filter((role) => ADMIN_ROLE_CODES.has(role.code?.toUpperCase())).map((role) => String(role.id))),
    [roles],
  );

  const loadData = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}&pageSize=50` : "?pageSize=50";
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`/api/users${query}`, { credentials: "include", cache: "no-store" }),
        fetch("/api/roles?pageSize=500", { credentials: "include", cache: "no-store" }),
      ]);

      if (!usersRes.ok) throw new Error("โหลดรายชื่อผู้ใช้ไม่สำเร็จ");
      if (!rolesRes.ok) throw new Error("โหลด role ไม่สำเร็จ");

      const [usersPayload, rolesPayload] = await Promise.all([usersRes.json(), rolesRes.json()]);
      setUsers(dataItems<ApiUser>(usersPayload));
      setRoles(dataItems<ApiRole>(rolesPayload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const updateAdminRole = async (target: ApiUser, shouldBeAdmin: boolean) => {
    if (!safetyAdminRole) {
      setError("ยังไม่มี role SAFETY_ADMIN ใน DB กรุณารัน migration seed role ก่อน");
      return;
    }

    const currentRoleIds = Array.isArray(target.roles) ? target.roles.map((role) => String(role.id)).filter(Boolean) : [];
    const nextRoleIds = shouldBeAdmin
      ? Array.from(new Set([...currentRoleIds, String(safetyAdminRole.id)]))
      : currentRoleIds.filter((roleId) => !adminRoleIds.has(roleId));

    setSavingUserId(String(target.id));
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/users/${target.id}/roles`, {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roleIds: nextRoleIds }),
      });

      if (!response.ok) throw new Error("บันทึกสิทธิ์ไม่สำเร็จ");
      setMessage(`${shouldBeAdmin ? "เพิ่ม" : "ถอด"}สิทธิ์ Admin ให้ ${getUserName(target)} แล้ว`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกสิทธิ์ไม่สำเร็จ");
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] px-3.5 pt-4 pb-10 font-sarabun sm:px-5 lg:px-8">
      <section className="rounded-[20px] bg-[linear-gradient(135deg,var(--brand-hero-start),var(--brand-hero-end))] px-4 py-5 text-white shadow-[0_12px_28px_var(--brand-shadow)] md:px-7 md:py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--brand-hero-label)]">
              <UserCog className="h-4 w-4" strokeWidth={2.5} />
              Admin Access
            </p>
            <h1 className="mt-2 text-[26px] font-black leading-tight md:text-[34px]">จัดการผู้ใช้และสิทธิ์ Admin</h1>
            <p className="mt-2 max-w-[720px] text-[13px] font-bold leading-relaxed text-white/75 md:text-[14px]">
              ค้นผู้ใช้จาก DB จริง ดู role ปัจจุบัน และเพิ่มหรือถอดสิทธิ์ Admin ได้จากหน้านี้
            </p>
          </div>
          <div className="rounded-[14px] border border-white/16 bg-white/10 px-4 py-3">
            <p className="text-[11px] font-bold text-white/65">ผู้ใช้งานปัจจุบัน</p>
            <p className="mt-1 text-[13px] font-black">{getSessionDisplayName(sessionUser)}</p>
          </div>
        </div>
      </section>

      <Card className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] p-4 shadow-[0_10px_26px_var(--brand-shadow)]">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-muted-text)]" strokeWidth={2.4} />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void loadData();
              }}
              className="h-10 rounded-xl border-[var(--border)] bg-background pl-9 text-[14px] font-bold"
              placeholder="ค้นด้วยชื่อ อีเมล หรือรหัสพนักงาน"
            />
          </div>
          <Button onClick={() => void loadData()} className="h-10 rounded-xl bg-[var(--brand-accent)] px-4 font-black text-[var(--brand-accent-contrast)]">
            <Search className="h-4 w-4" strokeWidth={2.5} />
            ค้นหา
          </Button>
          <Button variant="outline" onClick={() => void loadData()} className="h-10 rounded-xl px-4 font-black">
            <RefreshCcw className="h-4 w-4" strokeWidth={2.5} />
            รีเฟรช
          </Button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[#f2c6bd] bg-[#fff5f2] px-4 py-3 text-[13px] font-bold text-[#b3271a]">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-xl border border-[#9eddbb] bg-[#eafaf1] px-4 py-3 text-[13px] font-bold text-[#19734a]">
            {message}
          </div>
        )}
      </Card>

      <section className="mt-4 grid gap-3">
        {loading ? (
          <Card className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-5 py-10 text-center">
            <p className="text-[14px] font-black text-[var(--foreground)]">กำลังโหลดข้อมูลจาก DB</p>
          </Card>
        ) : users.length === 0 ? (
          <Card className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--brand-surface)] px-5 py-10 text-center">
            <UsersRound className="mx-auto h-9 w-9 text-[var(--brand-muted-text)]" strokeWidth={1.8} />
            <p className="mt-3 text-[15px] font-black text-[var(--foreground)]">ยังไม่มีผู้ใช้ตามเงื่อนไขค้นหา</p>
            <p className="mt-1 text-[12px] font-bold text-[var(--brand-muted-text)]">หน้านี้ไม่เติมรายชื่อจำลอง และจะแสดงเฉพาะ user จาก DB เท่านั้น</p>
          </Card>
        ) : (
          users.map((item) => {
            const roleCodes = getRoleCodes(item);
            const isAdmin = roleCodes.some((role) => ADMIN_ROLE_CODES.has(role));
            const isSaving = savingUserId === String(item.id);

            return (
              <Card key={item.id} className="rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] p-4 shadow-[0_8px_22px_var(--brand-shadow)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-[18px] font-black text-[var(--foreground)]">{getUserName(item)}</h2>
                      <Badge className={cn("h-6 rounded-full px-2.5 text-[11px] font-black", isAdmin ? "bg-[#eafaf1] text-[#19734a]" : "bg-[var(--secondary)] text-[var(--brand-muted-text)]")}>
                        {isAdmin ? "Admin" : "User"}
                      </Badge>
                      {item.status && (
                        <Badge variant="outline" className="h-6 rounded-full px-2.5 text-[11px] font-black">
                          {item.status}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 truncate text-[12px] font-bold text-[var(--brand-muted-text)]">
                      {[item.email, item.employee_no, item.position_name].filter(Boolean).join(" · ") || "ไม่มีรายละเอียดเพิ่มเติม"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {roleCodes.length > 0 ? roleCodes.map((role) => (
                        <Badge key={role} variant="outline" className="h-6 rounded-full px-2.5 text-[11px] font-black">
                          {role}
                        </Badge>
                      )) : (
                        <span className="text-[12px] font-bold text-[var(--brand-muted-text)]">ยังไม่มี role</span>
                      )}
                    </div>
                  </div>

                  {isAdmin ? (
                    <Button
                      variant="destructive"
                      disabled={isSaving}
                      onClick={() => void updateAdminRole(item, false)}
                      className="h-10 rounded-xl px-4 font-black"
                    >
                      <ShieldMinus className="h-4 w-4" strokeWidth={2.5} />
                      ถอด Admin
                    </Button>
                  ) : (
                    <Button
                      disabled={isSaving || !safetyAdminRole}
                      onClick={() => void updateAdminRole(item, true)}
                      className="h-10 rounded-xl bg-[var(--brand-accent)] px-4 font-black text-[var(--brand-accent-contrast)]"
                    >
                      <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
                      เพิ่ม Admin
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
