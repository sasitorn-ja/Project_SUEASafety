SET @team_code_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'teams'
    AND COLUMN_NAME = 'team_code'
);

SET @add_team_code_column_sql = IF(
  @team_code_column_exists = 0,
  'ALTER TABLE teams ADD COLUMN team_code VARCHAR(50) NULL AFTER id',
  'SELECT 1'
);
PREPARE add_team_code_column_stmt FROM @add_team_code_column_sql;
EXECUTE add_team_code_column_stmt;
DEALLOCATE PREPARE add_team_code_column_stmt;

SET @team_code_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'teams'
    AND INDEX_NAME = 'uq_teams_team_code'
);

SET @add_team_code_index_sql = IF(
  @team_code_index_exists = 0,
  'ALTER TABLE teams ADD UNIQUE KEY uq_teams_team_code (team_code)',
  'SELECT 1'
);
PREPARE add_team_code_index_stmt FROM @add_team_code_index_sql;
EXECUTE add_team_code_index_stmt;
DEALLOCATE PREPARE add_team_code_index_stmt;

INSERT INTO teams (team_code, name, status, deleted_at)
VALUES
  ('RMC_METRO', 'RMC Metro', 'ACTIVE', NULL),
  ('RMC_EAST', 'RMC East', 'ACTIVE', NULL),
  ('RMC_WEST', 'RMC West', 'ACTIVE', NULL),
  ('RMC_SOUTH', 'RMC South', 'ACTIVE', NULL),
  ('RMC_NORTH', 'RMC North', 'ACTIVE', NULL),
  ('RMC_NORTHEAST', 'RMC Northeast', 'ACTIVE', NULL),
  ('SSB', 'SSB', 'ACTIVE', NULL),
  ('OTHER', 'Other', 'ACTIVE', NULL)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  status = 'ACTIVE',
  deleted_at = NULL;

UPDATE team_members tm
JOIN users u ON u.id = tm.user_id
JOIN teams target ON target.team_code = CASE
  WHEN UPPER(REPLACE(REPLACE(TRIM(COALESCE(u.division, '')), '-', ' '), '_', ' ')) LIKE '%SMART STRUCTURE%'
    OR UPPER(TRIM(COALESCE(u.division, ''))) REGEXP '(^|[^A-Z])SSB([^A-Z]|$)' THEN 'SSB'
  WHEN UPPER(REPLACE(REPLACE(TRIM(COALESCE(u.division, '')), '-', ' '), '_', ' ')) LIKE '%NORTHEAST%'
    OR UPPER(REPLACE(REPLACE(TRIM(COALESCE(u.division, '')), '-', ' '), '_', ' ')) LIKE '%NORTH EAST%' THEN 'RMC_NORTHEAST'
  WHEN UPPER(COALESCE(u.division, '')) LIKE '%METRO%' THEN 'RMC_METRO'
  WHEN UPPER(COALESCE(u.division, '')) LIKE '%EAST%' THEN 'RMC_EAST'
  WHEN UPPER(COALESCE(u.division, '')) LIKE '%WEST%' THEN 'RMC_WEST'
  WHEN UPPER(COALESCE(u.division, '')) LIKE '%SOUTH%' THEN 'RMC_SOUTH'
  WHEN UPPER(COALESCE(u.division, '')) LIKE '%NORTH%' THEN 'RMC_NORTH'
  ELSE 'OTHER'
END
SET tm.left_at = UTC_TIMESTAMP(3)
WHERE tm.left_at IS NULL
  AND tm.team_id <> target.id;

INSERT INTO team_members (team_id, user_id, joined_at, left_at)
SELECT
  target.id,
  u.id,
  UTC_TIMESTAMP(3),
  NULL
FROM users u
JOIN teams target ON target.team_code = CASE
  WHEN UPPER(REPLACE(REPLACE(TRIM(COALESCE(u.division, '')), '-', ' '), '_', ' ')) LIKE '%SMART STRUCTURE%'
    OR UPPER(TRIM(COALESCE(u.division, ''))) REGEXP '(^|[^A-Z])SSB([^A-Z]|$)' THEN 'SSB'
  WHEN UPPER(REPLACE(REPLACE(TRIM(COALESCE(u.division, '')), '-', ' '), '_', ' ')) LIKE '%NORTHEAST%'
    OR UPPER(REPLACE(REPLACE(TRIM(COALESCE(u.division, '')), '-', ' '), '_', ' ')) LIKE '%NORTH EAST%' THEN 'RMC_NORTHEAST'
  WHEN UPPER(COALESCE(u.division, '')) LIKE '%METRO%' THEN 'RMC_METRO'
  WHEN UPPER(COALESCE(u.division, '')) LIKE '%EAST%' THEN 'RMC_EAST'
  WHEN UPPER(COALESCE(u.division, '')) LIKE '%WEST%' THEN 'RMC_WEST'
  WHEN UPPER(COALESCE(u.division, '')) LIKE '%SOUTH%' THEN 'RMC_SOUTH'
  WHEN UPPER(COALESCE(u.division, '')) LIKE '%NORTH%' THEN 'RMC_NORTH'
  ELSE 'OTHER'
END
WHERE u.deleted_at IS NULL AND u.status = 'ACTIVE'
ON DUPLICATE KEY UPDATE
  joined_at = IF(team_members.left_at IS NULL, team_members.joined_at, VALUES(joined_at)),
  left_at = NULL;

UPDATE teams
SET status = 'INACTIVE', deleted_at = COALESCE(deleted_at, UTC_TIMESTAMP(3))
WHERE team_code IS NULL
   OR team_code NOT IN ('RMC_METRO', 'RMC_EAST', 'RMC_WEST', 'RMC_SOUTH', 'RMC_NORTH', 'RMC_NORTHEAST', 'SSB', 'OTHER');
