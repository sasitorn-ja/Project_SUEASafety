"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search, ShieldCheck, ShieldMinus, UsersRound } from "lucide-react";

import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getAdminRoles, getAdminUsers, updateAdminUserRoles } from "@/services/adminUsersServices";
import type { AdminRole, AdminUser } from "@/types/adminUsersType";
import {
  ADMIN_ROLE_CODES,
  ADMIN_USERS_PAGE_SIZE_OPTIONS,
  getAdminRoleIds,
  getAdminUserName,
  getAdminUserRoleCodes,
  getSafetyAdminRole,
  getVisibleAdminUserPages,
} from "@/utils/admin-users/adminUsersTable";

export function AdminUsersManager() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const safetyAdminRole = useMemo(() => getSafetyAdminRole(roles), [roles]);
  const adminRoleIds = useMemo(() => getAdminRoleIds(roles), [roles]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await getAdminUsers({ page, pageSize, search: query || undefined });
    if (!result.ok || !result.data) {
      setError(result.error || "เกิดข้อผิดพลาด");
      setLoading(false);
      return;
    }

    setUsers(result.data.items);
    setTotal(result.data.total);
    setTotalPages(result.data.totalPages);
    if (result.data.page !== page) setPage(result.data.page);
    setLoading(false);
  }, [page, pageSize, query]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void (async () => {
      const result = await getAdminRoles();
      if (!result.ok || !result.data) {
        setError(result.error || "โหลด role ไม่สำเร็จ");
        return;
      }
      setRoles(result.data.items);
    })();
  }, []);

  const submitSearch = () => {
    const nextQuery = search.trim();
    setMessage("");
    if (page === 1 && query === nextQuery) {
      void loadUsers();
      return;
    }
    setPage(1);
    setQuery(nextQuery);
  };

  const onUpdateAdminRole = async (target: AdminUser, shouldBeAdmin: boolean) => {
    if (!safetyAdminRole) {
      setError("ยังไม่มีสิทธิ์ SAFETY_ADMIN ในระบบ กรุณาตั้งค่าสิทธิ์ก่อน");
      return;
    }

    const currentRoleIds = Array.isArray(target.roles)
      ? target.roles.map((role) => String(role.id)).filter(Boolean)
      : [];
    const nextRoleIds = shouldBeAdmin
      ? Array.from(new Set([...currentRoleIds, String(safetyAdminRole.id)]))
      : currentRoleIds.filter((roleId) => !adminRoleIds.has(roleId));

    setSavingUserId(String(target.id));
    setError("");
    setMessage("");

    try {
      const result = await updateAdminUserRoles(target.id, { roleIds: nextRoleIds });
      if (!result.ok) throw new Error("บันทึกสิทธิ์ไม่สำเร็จ");
      setMessage(`${shouldBeAdmin ? "เพิ่ม" : "ถอด"}สิทธิ์ Admin ให้ ${getAdminUserName(target)} แล้ว`);
      await loadUsers();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "บันทึกสิทธิ์ไม่สำเร็จ");
    } finally {
      setSavingUserId(null);
    }
  };

  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);

  return (
    <div className="page-shell-wide bg-[var(--background)] pt-2.5 pb-8 font-sarabun">
      <SafetyCultureHero
        eyebrow="ADMIN ACCESS"
        title={<>จัดการผู้ใช้และสิทธิ์ Admin</>}
        description="แสดงรายชื่อผู้ใช้แบบแบ่งหน้า รองรับผู้ใช้จำนวนมากโดยไม่โหลดทั้งหมดพร้อมกัน"
        variant="community"
        backgroundImage="/images/heroes/Home01.png"
        backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.82) 0%, rgba(210,235,255,.60) 32%, rgba(210,235,255,.10) 56%, rgba(210,235,255,0) 74%)"
        mascotSrc="/images/mascots/wangjai/31.png"
        mascotAction="shield"
      />

      <Card className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] p-4 shadow-[0_10px_26px_var(--brand-shadow)]">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-muted-text)]" strokeWidth={2.4} />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitSearch();
              }}
              className="h-10 rounded-xl border-[var(--border)] bg-background pl-9 text-[14px] font-bold"
              placeholder="ค้นด้วยชื่อ อีเมล หรือรหัสพนักงาน"
            />
          </div>
          <Combobox
            aria-label="จำนวนรายการต่อหน้า"
            value={String(pageSize)}
            onValueChange={(value) => {
              setPage(1);
              setPageSize(Number(value));
            }}
            searchable={false}
            className="h-10 min-w-[130px] rounded-xl border-[var(--border)] bg-background text-[13px] font-black"
            contentClassName="min-w-[130px]"
            options={ADMIN_USERS_PAGE_SIZE_OPTIONS}
          />
          <Button onClick={submitSearch} className="h-10 rounded-full bg-[#0B82F0] px-4 font-black text-white hover:bg-[#0973d6] transition-colors">
            <Search className="h-4 w-4" strokeWidth={2.5} />
            ค้นหา
          </Button>
          <Button variant="outline" onClick={() => void loadUsers()} className="h-10 rounded-full px-4 font-black">
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} strokeWidth={2.5} />
            รีเฟรช
          </Button>
        </div>

        {error && <div className="mt-4 rounded-xl border border-[#f2c6bd] bg-[#fff5f2] px-4 py-3 text-[13px] font-bold text-[#b3271a]">{error}</div>}
        {message && <div className="mt-4 rounded-xl border border-[#9eddbb] bg-[#eafaf1] px-4 py-3 text-[13px] font-bold text-[#19734a]">{message}</div>}
      </Card>

      <Card className="mt-4 overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] shadow-[0_10px_26px_var(--brand-shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
          <div>
            <h2 className="text-[16px] font-black text-[var(--foreground)]">รายชื่อผู้ใช้</h2>
            <p className="text-[11px] font-bold text-[var(--brand-muted-text)]">
              {loading ? "กำลังโหลดข้อมูล..." : `แสดง ${firstRow.toLocaleString()}–${lastRow.toLocaleString()} จาก ${total.toLocaleString()} คน`}
            </p>
          </div>
          {query && <Badge variant="outline" className="rounded-full px-3 py-1 font-bold">ค้นหา: {query}</Badge>}
        </div>

        {!loading && users.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <UsersRound className="mx-auto h-9 w-9 text-[var(--brand-muted-text)]" strokeWidth={1.8} />
            <p className="mt-3 text-[15px] font-black text-[var(--foreground)]">ยังไม่มีผู้ใช้ตามเงื่อนไขค้นหา</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-[var(--secondary)]/65">
              <TableRow>
                <TableHead className="min-w-[220px]">ชื่อผู้ใช้</TableHead>
                <TableHead className="min-w-[190px]">อีเมล / รหัสพนักงาน</TableHead>
                <TableHead className="min-w-[150px]">ตำแหน่ง</TableHead>
                <TableHead className="min-w-[170px]">Role</TableHead>
                <TableHead className="w-[100px]">สถานะ</TableHead>
                <TableHead className="w-[150px] text-right">จัดการสิทธิ์</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: Math.min(pageSize, 8) }, (_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={6}>
                      <div className="h-8 animate-pulse rounded-lg bg-[var(--secondary)]" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.map((item) => {
                const roleCodes = getAdminUserRoleCodes(item);
                const isAdmin = roleCodes.some((role) => ADMIN_ROLE_CODES.has(role));
                const isSaving = savingUserId === String(item.id);

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="max-w-[260px] truncate text-[14px] font-black text-[var(--foreground)]">{getAdminUserName(item)}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-[var(--brand-muted-text)]">ID: {item.id}</p>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[230px] truncate text-[12px] font-bold">{item.email || "–"}</p>
                      <p className="mt-0.5 text-[11px] font-bold text-[var(--brand-muted-text)]">{item.employee_no || "ไม่มีรหัสพนักงาน"}</p>
                    </TableCell>
                    <TableCell className="text-[12px] font-bold">{item.position_name || "–"}</TableCell>
                    <TableCell>
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {roleCodes.length > 0 ? roleCodes.map((role) => (
                          <Badge key={role} variant="outline" className={cn("h-6 rounded-full px-2 text-[10px] font-black", ADMIN_ROLE_CODES.has(role) && "border-[#9eddbb] bg-[#eafaf1] text-[#19734a]")}>
                            {role}
                          </Badge>
                        )) : <span className="text-[11px] font-bold text-[var(--brand-muted-text)]">ยังไม่มี role</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("rounded-full px-2.5 text-[10px] font-black", item.status === "ACTIVE" ? "bg-[#eafaf1] text-[#19734a]" : "bg-[var(--secondary)] text-[var(--brand-muted-text)]")}>
                        {item.status || "UNKNOWN"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdmin ? (
                        <Button variant="destructive" size="sm" disabled={isSaving} onClick={() => void onUpdateAdminRole(item, false)} className="rounded-full font-black">
                          <ShieldMinus strokeWidth={2.5} />
                          ถอด Admin
                        </Button>
                      ) : (
                        <Button size="sm" disabled={isSaving || !safetyAdminRole} onClick={() => void onUpdateAdminRole(item, true)} className="rounded-full bg-[#0B82F0] font-black text-white hover:bg-[#0973d6] transition-colors">
                          <ShieldCheck strokeWidth={2.5} />
                          เพิ่ม Admin
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <div className="flex flex-col gap-3 border-t border-[var(--border)] px-4 py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-center text-[11px] font-bold text-[var(--brand-muted-text)] md:text-left">
            หน้า {page.toLocaleString()} จาก {totalPages.toLocaleString()}
          </p>
          <Pagination className="mx-0 w-auto justify-center md:justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} />
              </PaginationItem>
              {getVisibleAdminUserPages(page, totalPages).map((item) => (
                typeof item === "number" ? (
                  <PaginationItem key={item}>
                    <PaginationLink isActive={item === page} disabled={loading} onClick={() => setPage(item)}>
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              ))}
              <PaginationItem>
                <PaginationNext disabled={page >= totalPages || loading} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>
    </div>
  );
}
