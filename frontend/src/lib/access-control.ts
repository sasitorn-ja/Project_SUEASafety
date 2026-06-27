export type AccessControlledUser = {
  roles?: string[];
  permissions?: string[];
  isAdmin?: boolean;
} | null | undefined;

const ADMIN_ROLE_CODES = new Set(["ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN", "SAFETY_ADMIN"]);
const ADMIN_PERMISSION_CODES = new Set(["ADMIN.ACCESS", "SYSTEM.ADMIN", "SAFETY.ADMIN"]);

export function hasAdminAccess(user: AccessControlledUser) {
  if (!user) return false;
  if (user.isAdmin) return true;

  const roles = user.roles ?? [];
  if (roles.some((role) => ADMIN_ROLE_CODES.has(role.toUpperCase()))) return true;

  const permissions = user.permissions ?? [];
  return permissions.some((permission) => ADMIN_PERMISSION_CODES.has(permission.toUpperCase()));
}
