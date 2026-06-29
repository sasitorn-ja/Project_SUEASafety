import type { AdminRole, AdminUser } from "@/types/adminUsersType";

export const ADMIN_ROLE_CODES = new Set(["ADMIN", "SAFETY_ADMIN"]);

export const ADMIN_USERS_PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 แถว" },
  { value: "25", label: "25 แถว" },
  { value: "50", label: "50 แถว" },
  { value: "100", label: "100 แถว" },
];

export function getAdminUserName(user: AdminUser) {
  return user.name_th || user.name_en || user.email || `User #${user.id}`;
}

export function getAdminUserRoleCodes(user: AdminUser) {
  const fromRoles = Array.isArray(user.roles) ? user.roles.map((role) => role.code).filter(Boolean) : [];
  const fromCodes = Array.isArray(user.role_codes) ? user.role_codes.filter(Boolean) : [];
  return Array.from(new Set([...fromRoles, ...fromCodes].map((code) => code.toUpperCase())));
}

export function getVisibleAdminUserPages(
  current: number,
  total: number,
): Array<number | "ellipsis-start" | "ellipsis-end"> {
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

export function getSafetyAdminRole(roles: AdminRole[]) {
  return roles.find((role) => role.code?.toUpperCase() === "SAFETY_ADMIN")
    ?? roles.find((role) => role.code?.toUpperCase() === "ADMIN");
}

export function getAdminRoleIds(roles: AdminRole[]) {
  return new Set(
    roles
      .filter((role) => ADMIN_ROLE_CODES.has(role.code?.toUpperCase()))
      .map((role) => String(role.id)),
  );
}
