import { apiFetch, apiJson, type ApiResult } from "@/lib/api-client";
import type {
  AdminRole,
  AdminUser,
  AdminUsersListPayload,
  AdminUsersQuery,
  UpdateUserRolesPayload,
} from "@/types/adminUsersType";

function toListPayload<T>(payload: unknown): AdminUsersListPayload<T> {
  const data = (payload as { data?: Partial<AdminUsersListPayload<T>> })?.data;
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    page: Number(data?.page || 1),
    pageSize: Number(data?.pageSize || 25),
    total: Number(data?.total || 0),
    totalPages: Math.max(1, Number(data?.totalPages || 1)),
  };
}

export async function getAdminUsers(query: AdminUsersQuery): Promise<ApiResult<AdminUsersListPayload<AdminUser>>> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.search) params.set("search", query.search);

  const response = await fetch(`/api/users?${params}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    return { ok: false, error: "โหลดรายชื่อผู้ใช้ไม่สำเร็จ" };
  }

  return {
    ok: true,
    data: toListPayload<AdminUser>(await response.json()),
  };
}

export async function getAdminRoles(): Promise<ApiResult<AdminUsersListPayload<AdminRole>>> {
  const response = await fetch("/api/roles?pageSize=500", {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    return { ok: false, error: "โหลด role ไม่สำเร็จ" };
  }

  return {
    ok: true,
    data: toListPayload<AdminRole>(await response.json()),
  };
}

export async function updateAdminUserRoles(
  userId: string | number,
  payload: UpdateUserRolesPayload,
): Promise<ApiResult<unknown>> {
  return apiFetch(`/api/users/${userId}/roles`, apiJson("PUT", payload));
}
