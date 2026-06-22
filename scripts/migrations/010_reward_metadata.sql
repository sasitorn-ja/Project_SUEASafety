SET @schema_name := DATABASE();

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'rewards') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'rewards' AND COLUMN_NAME = 'metadata') = 0,
    'ALTER TABLE rewards ADD COLUMN metadata JSON NULL AFTER status',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
