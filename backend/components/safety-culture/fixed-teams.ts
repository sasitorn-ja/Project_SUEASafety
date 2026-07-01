import type { PoolConnection, RowDataPacket } from "mysql2/promise";

import {
  fixedTeamByCode,
  fixedTeamCodeForDivision,
} from "@/lib/safety-culture-fixed-teams";

type TeamIdRow = RowDataPacket & { id: string };

export async function syncUserFixedTeamMembership(
  connection: PoolConnection,
  userId: string,
  division: string | null | undefined,
) {
  const [manualRows] = await connection.query<TeamIdRow[]>(
    `SELECT t.id
     FROM team_members tm
     JOIN teams t ON t.id = tm.team_id
     WHERE tm.user_id = :userId
       AND tm.left_at IS NULL
       AND t.deleted_at IS NULL
       AND t.status = 'ACTIVE'
       AND t.team_code IS NULL
     LIMIT 1`,
    { userId },
  );
  if (manualRows[0]?.id) {
    return { teamId: String(manualRows[0].id), teamCode: null };
  }

  const team = fixedTeamByCode(fixedTeamCodeForDivision(division));

  await connection.execute(
    `INSERT INTO teams (team_code, name, status, deleted_at)
     VALUES (:code, :name, 'ACTIVE', NULL)
     ON DUPLICATE KEY UPDATE name = VALUES(name), status = 'ACTIVE', deleted_at = NULL`,
    { code: team.code, name: team.name },
  );

  const [rows] = await connection.query<TeamIdRow[]>(
    "SELECT id FROM teams WHERE team_code = :code AND deleted_at IS NULL LIMIT 1",
    { code: team.code },
  );
  const teamId = rows[0]?.id;
  if (!teamId) throw new Error(`Unable to resolve fixed team ${team.code}.`);

  await connection.execute(
    `UPDATE team_members
     SET left_at = UTC_TIMESTAMP(3)
     WHERE user_id = :userId AND left_at IS NULL AND team_id <> :teamId`,
    { userId, teamId },
  );
  await connection.execute(
    `INSERT INTO team_members (team_id, user_id, joined_at, left_at)
     VALUES (:teamId, :userId, UTC_TIMESTAMP(3), NULL)
     ON DUPLICATE KEY UPDATE
       joined_at = IF(left_at IS NULL, joined_at, VALUES(joined_at)),
       left_at = NULL`,
    { userId, teamId },
  );

  return { teamId: String(teamId), teamCode: team.code };
}
