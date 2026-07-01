-- Allow live master locations from rmc_sso.* to be stored via snapshot columns
-- without requiring a mirrored row in CPAC_Safety.locations.

SET @schema_name := DATABASE();

SET @drop_fk_sql := (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = @schema_name
        AND TABLE_NAME = 'checkins'
        AND CONSTRAINT_NAME = 'fk_checkins_location'
    ),
    'ALTER TABLE checkins DROP FOREIGN KEY fk_checkins_location',
    'SELECT 1'
  )
);
PREPARE drop_fk_stmt FROM @drop_fk_sql;
EXECUTE drop_fk_stmt;
DEALLOCATE PREPARE drop_fk_stmt;

ALTER TABLE checkins
  MODIFY COLUMN selected_location_id BIGINT UNSIGNED NULL;
