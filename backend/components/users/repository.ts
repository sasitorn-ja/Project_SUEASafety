import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { queryRows, withTransaction } from "@backend/components/core/db";
import type { SsoUser } from "@backend/components/auth/sso";
import { syncUserFixedTeamMembership } from "@backend/components/safety-culture/fixed-teams";
import { hasAdminAccess } from "@/lib/access-control";

export type DbUser = {
  id: string;
  ssoExternalId: string;
  employeeNo: string | null;
  email: string;
  username: string | null;
  nameTh: string;
  nameEn: string | null;
  firstNameTh: string | null;
  lastNameTh: string | null;
  firstNameEn: string | null;
  lastNameEn: string | null;
  positionName: string | null;
  division: string | null;
  positionTh: string | null;
  positionEn: string | null;
  reportToEmail: string | null;
  profileImageUrl: string | null;
  lineProfileImageUrl: string | null;
  ssoProvider: string | null;
  ssoSubject: string | null;
  ssoLastLoginAt: string | null;
  status: string;
};

export type SessionDbUser = SsoUser & {
  id: string;
  profileImageUrl?: string;
  roles?: string[];
  permissions?: string[];
  isAdmin?: boolean;
};

export type UserAccess = {
  roles: string[];
  permissions: string[];
};

type DbUserRow = RowDataPacket & {
  id: string;
  sso_external_id: string;
  employee_no: string | null;
  email: string;
  username: string | null;
  name_th: string;
  name_en: string | null;
  first_name_th: string | null;
  last_name_th: string | null;
  first_name_en: string | null;
  last_name_en: string | null;
  position_name: string | null;
  division: string | null;
  position_th: string | null;
  position_en: string | null;
  report_to_email: string | null;
  profile_image_url: string | null;
  line_profile_image_url: string | null;
  sso_provider: string | null;
  sso_subject: string | null;
  sso_last_login_at: Date | string | null;
  status: string;
};

type RoleCodeRow = RowDataPacket & {
  role_code: string;
};

type PermissionCodeRow = RowDataPacket & {
  permission_code: string;
};

function mapUser(row: DbUserRow): DbUser {
  return {
    id: String(row.id),
    ssoExternalId: row.sso_external_id,
    employeeNo: row.employee_no,
    email: row.email,
    username: row.username,
    nameTh: row.name_th,
    nameEn: row.name_en,
    firstNameTh: row.first_name_th,
    lastNameTh: row.last_name_th,
    firstNameEn: row.first_name_en,
    lastNameEn: row.last_name_en,
    positionName: row.position_name,
    division: row.division,
    positionTh: row.position_th,
    positionEn: row.position_en,
    reportToEmail: row.report_to_email,
    profileImageUrl: row.profile_image_url,
    lineProfileImageUrl: row.line_profile_image_url,
    ssoProvider: row.sso_provider,
    ssoSubject: row.sso_subject,
    ssoLastLoginAt: row.sso_last_login_at ? new Date(row.sso_last_login_at).toISOString() : null,
    status: row.status,
  };
}

function nameEn(user: SsoUser) {
  return [user.firstNameEn, user.lastNameEn].filter(Boolean).join(" ") || null;
}

function nameTh(user: SsoUser) {
  return [user.firstNameTh, user.lastNameTh].filter(Boolean).join(" ") || user.name || user.username || user.email || user.sub;
}

function emailForUser(user: SsoUser) {
  return user.email || `${encodeURIComponent(user.username || user.sub)}@sso.local`;
}

function varcharOrNull(value: string | null | undefined, maxLength: number) {
  if (!value) return null;
  return value.length <= maxLength ? value : null;
}

const SELECT_USER_SQL = `
  SELECT
    id,
    sso_external_id,
    employee_no,
    email,
    username,
    name_th,
    name_en,
    first_name_th,
    last_name_th,
    first_name_en,
    last_name_en,
    position_name,
    division,
    position_th,
    position_en,
    report_to_email,
    profile_image_url,
    line_profile_image_url,
    sso_provider,
    sso_subject,
    sso_last_login_at,
    status
  FROM users
`;

export async function getUserBySsoExternalId(ssoExternalId: string) {
  const rows = await queryRows<DbUserRow>(
    `${SELECT_USER_SQL} WHERE sso_external_id = :ssoExternalId AND deleted_at IS NULL LIMIT 1`,
    { ssoExternalId },
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function getUserAccess(userId: string): Promise<UserAccess> {
  const [roleRows, permissionRows] = await Promise.all([
    queryRows<RoleCodeRow>(
      `
        SELECT DISTINCT r.code AS role_code
        FROM user_roles ur
        INNER JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :userId
        ORDER BY r.code
      `,
      { userId },
    ),
    queryRows<PermissionCodeRow>(
      `
        SELECT DISTINCT p.code AS permission_code
        FROM user_roles ur
        INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
        INNER JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = :userId
        ORDER BY p.code
      `,
      { userId },
    ),
  ]);

  return {
    roles: roleRows.map((row) => row.role_code).filter(Boolean),
    permissions: permissionRows.map((row) => row.permission_code).filter(Boolean),
  };
}

export function dbUserToSessionUser(user: DbUser, access: UserAccess = { roles: [], permissions: [] }): SessionDbUser {
  const customProfileImageUrl =
    user.profileImageUrl && user.profileImageUrl !== user.lineProfileImageUrl
      ? user.profileImageUrl
      : undefined;

  return {
    id: user.id,
    sub: user.ssoExternalId,
    name: user.nameTh || user.nameEn || user.username || user.email,
    email: user.email,
    username: user.username || undefined,
    division: user.division || undefined,
    firstNameEn: user.firstNameEn || undefined,
    firstNameTh: user.firstNameTh || undefined,
    lastNameEn: user.lastNameEn || undefined,
    lastNameTh: user.lastNameTh || undefined,
    lineProfileImageUrl: user.lineProfileImageUrl || undefined,
    profileImageUrl: customProfileImageUrl,
    positionEn: user.positionEn || undefined,
    positionTh: user.positionTh || user.positionName || undefined,
    reportToEmail: user.reportToEmail || undefined,
    roles: access.roles,
    permissions: access.permissions,
    isAdmin: hasAdminAccess(access),
  };
}

export async function getSessionUserBySsoExternalId(ssoExternalId: string) {
  const user = await getUserBySsoExternalId(ssoExternalId);
  if (!user) return null;
  const access = await getUserAccess(user.id);
  return dbUserToSessionUser(user, access);
}

export async function upsertSsoUser(user: SsoUser, rawClaims: Record<string, unknown>, providerSlug: string) {
  const lineProfileImageUrl = varcharOrNull(user.lineProfileImageUrl, 1000);
  const payload = {
    ssoExternalId: user.sub,
    email: emailForUser(user),
    username: user.username || null,
    nameTh: nameTh(user),
    nameEn: nameEn(user),
    firstNameTh: user.firstNameTh || null,
    lastNameTh: user.lastNameTh || null,
    firstNameEn: user.firstNameEn || null,
    lastNameEn: user.lastNameEn || null,
    positionName: user.positionTh || user.positionEn || null,
    division: user.division || null,
    positionTh: user.positionTh || null,
    positionEn: user.positionEn || null,
    reportToEmail: user.reportToEmail || null,
    lineProfileImageUrl,
    ssoProvider: providerSlug,
    ssoSubject: user.sub,
    rawClaims: JSON.stringify(rawClaims),
  };

  const id = await withTransaction(async (connection) => {
    await connection.execute<ResultSetHeader>(
      `
        INSERT INTO users (
          sso_external_id,
          email,
          username,
          name_th,
          name_en,
          first_name_th,
          last_name_th,
          first_name_en,
          last_name_en,
          position_name,
          division,
          position_th,
          position_en,
          report_to_email,
          line_profile_image_url,
          sso_provider,
          sso_subject,
          sso_raw_claims,
          sso_last_login_at,
          status
        ) VALUES (
          :ssoExternalId,
          :email,
          :username,
          :nameTh,
          :nameEn,
          :firstNameTh,
          :lastNameTh,
          :firstNameEn,
          :lastNameEn,
          :positionName,
          :division,
          :positionTh,
          :positionEn,
          :reportToEmail,
          :lineProfileImageUrl,
          :ssoProvider,
          :ssoSubject,
          :rawClaims,
          UTC_TIMESTAMP(3),
          'ACTIVE'
        )
        ON DUPLICATE KEY UPDATE
          sso_external_id = VALUES(sso_external_id),
          email = VALUES(email),
          username = VALUES(username),
          name_th = VALUES(name_th),
          name_en = VALUES(name_en),
          first_name_th = VALUES(first_name_th),
          last_name_th = VALUES(last_name_th),
          first_name_en = VALUES(first_name_en),
          last_name_en = VALUES(last_name_en),
          position_name = VALUES(position_name),
          division = VALUES(division),
          position_th = VALUES(position_th),
          position_en = VALUES(position_en),
          report_to_email = VALUES(report_to_email),
          line_profile_image_url = VALUES(line_profile_image_url),
          sso_provider = VALUES(sso_provider),
          sso_subject = VALUES(sso_subject),
          sso_raw_claims = VALUES(sso_raw_claims),
          sso_last_login_at = UTC_TIMESTAMP(3),
          status = 'ACTIVE',
          deleted_at = NULL
      `,
      payload,
    );

    const [rows] = await connection.query<DbUserRow[]>(
      `${SELECT_USER_SQL} WHERE (sso_external_id = :ssoExternalId OR email = :email) AND deleted_at IS NULL LIMIT 1`,
      { ssoExternalId: user.sub, email: payload.email },
    );

    if (!rows[0]) throw new Error("Unable to load SSO user after upsert.");
    await syncUserFixedTeamMembership(connection, String(rows[0].id), payload.division);
    return String(rows[0].id);
  });

  const dbUser = await getUserBySsoExternalId(user.sub);
  if (!dbUser || dbUser.id !== id) throw new Error("Unable to resolve SSO user from database.");
  return dbUser;
}
