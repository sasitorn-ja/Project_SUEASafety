"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search, ShieldCheck, ShieldMinus, UserCog, UsersRound } from "lucide-react";
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

type ListPayload<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function listPayload<T>(payload: unknown): ListPayload<T> {
  const data = (payload as { data?: Partial<ListPayload<T>> })?.data;
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    page: Number(data?.page || 1),
    pageSize: Number(data?.pageSize || 25),
    total: Number(data?.total || 0),
    totalPages: Math.max(1, Number(data?.totalPages || 1)),
  };
}

function getUserName(user: ApiUser) {
  return user.name_th || user.name_en || user.email || `User #${user.id}`;
}

function getRoleCodes(user: ApiUser) {
  const fromRoles = Array.isArray(user.roles) ? user.roles.map((role) => role.code).filter(Boolean) : [];
  const fromCodes = Array.isArray(user.role_codes) ? user.role_codes.filter(Boolean) : [];
  return Array.from(new Set([...fromRoles, ...fromCodes].map((code) => code.toUpperCase())));
}

function visiblePages(current: number, total: number): Array<number | "ellipsis-start" | "ellipsis-end"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages: Array<number | "ellipsis-start" | "ellipsis-end"> = [1];
  if (current > 4) pages.push("ellipsis-start");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (current < total - 3) pages.push("ellipsis-end");
  pages.push(total);
  return pages;
}

const ADMIN_ROLE_CODES = new Set(["ADMIN", "SAFETY_ADMIN"]);

export default function AdminUsersPage() {
  const { user: sessionUser } = useSessionUser();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
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

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (query) params.set("search", query);
      const response = await fetch(`/api/users?${params}`, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("โหลดรายชื่อผู้ใช้ไม่สำเร็จ");
      const result = listPayload<ApiUser>(await response.json());
      setUsers(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/roles?pageSize=500", { credentials: "include", cache: "no-store" });
        if (!response.ok) throw new Error("โหลด role ไม่สำเร็จ");
        setRoles(listPayload<ApiRole>(await response.json()).items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "โหลด role ไม่สำเร็จ");
      }
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
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกสิทธิ์ไม่สำเร็จ");
    } finally {
      setSavingUserId(null);
    }
  };

  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);

  return (
    <div className="mx-auto w-full max-w-[1380px] px-3.5 pb-10 pt-4 font-sarabun sm:px-5 lg:px-8">
      <section className="rounded-[20px] bg-[linear-gradient(135deg,var(--brand-hero-start),var(--brand-hero-end))] px-4 py-5 text-white shadow-[0_12px_28px_var(--brand-shadow)] md:px-7 md:py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--brand-hero-label)]">
              <UserCog className="h-4 w-4" strokeWidth={2.5} />
              Admin Access
            </p>
            <h1 className="mt-2 text-[26px] font-black leading-tight md:text-[34px]">จัดการผู้ใช้และสิทธิ์ Admin</h1>
            <p className="mt-2 max-w-[720px] text-[13px] font-bold leading-relaxed text-white/75 md:text-[14px]">
              แสดงข้อมูลจาก DB แบบแบ่งหน้า รองรับรายชื่อผู้ใช้จำนวนมากโดยไม่โหลดทั้งหมดพร้อมกัน
            </p>
          </div>
          <div className="rounded-[14px] border border-white/16 bg-white/10 px-4 py-3">
            <p className="text-[11px] font-bold text-white/65">ผู้ใช้งานปัจจุบัน</p>
            <p className="mt-1 text-[13px] font-black">{getSessionDisplayName(sessionUser)}</p>
          </div>
        </div>
      </section>

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
            options={[
              { value: "10", label: "10 แถว" },
              { value: "25", label: "25 แถว" },
              { value: "50", label: "50 แถว" },
              { value: "100", label: "100 แถว" },
            ]}
          />
          <Button onClick={submitSearch} className="h-10 rounded-xl bg-[var(--brand-accent)] px-4 font-black text-[var(--brand-accent-contrast)]">
            <Search className="h-4 w-4" strokeWidth={2.5} />
            ค้นหา
          </Button>
          <Button variant="outline" onClick={() => void loadUsers()} className="h-10 rounded-xl px-4 font-black">
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
                const roleCodes = getRoleCodes(item);
                const isAdmin = roleCodes.some((role) => ADMIN_ROLE_CODES.has(role));
                const isSaving = savingUserId === String(item.id);

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="max-w-[260px] truncate text-[14px] font-black text-[var(--foreground)]">{getUserName(item)}</p>
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
                        <Button variant="destructive" size="sm" disabled={isSaving} onClick={() => void updateAdminRole(item, false)} className="font-black">
                          <ShieldMinus strokeWidth={2.5} />
                          ถอด Admin
                        </Button>
                      ) : (
                        <Button size="sm" disabled={isSaving || !safetyAdminRole} onClick={() => void updateAdminRole(item, true)} className="bg-[var(--brand-accent)] font-black text-[var(--brand-accent-contrast)]">
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
              {visiblePages(page, totalPages).map((item) => (
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
