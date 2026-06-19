SET @leader_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'teams'
    AND COLUMN_NAME = 'leader_user_id'
);

SET @add_leader_column_sql = IF(
  @leader_column_exists = 0,
  'ALTER TABLE teams ADD COLUMN leader_user_id BIGINT UNSIGNED NULL AFTER organization_id',
  'SELECT 1'
);
PREPARE add_leader_column_stmt FROM @add_leader_column_sql;
EXECUTE add_leader_column_stmt;
DEALLOCATE PREPARE add_leader_column_stmt;

SET @leader_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'teams'
    AND INDEX_NAME = 'idx_teams_leader_user'
);

SET @add_leader_index_sql = IF(
  @leader_index_exists = 0,
  'ALTER TABLE teams ADD KEY idx_teams_leader_user (leader_user_id)',
  'SELECT 1'
);
PREPARE add_leader_index_stmt FROM @add_leader_index_sql;
EXECUTE add_leader_index_stmt;
DEALLOCATE PREPARE add_leader_index_stmt;

SET @leader_fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'teams'
    AND CONSTRAINT_NAME = 'fk_teams_leader_user'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @add_leader_fk_sql = IF(
  @leader_fk_exists = 0,
  'ALTER TABLE teams ADD CONSTRAINT fk_teams_leader_user FOREIGN KEY (leader_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE NO ACTION',
  'SELECT 1'
);
PREPARE add_leader_fk_stmt FROM @add_leader_fk_sql;
EXECUTE add_leader_fk_stmt;
DEALLOCATE PREPARE add_leader_fk_stmt;
