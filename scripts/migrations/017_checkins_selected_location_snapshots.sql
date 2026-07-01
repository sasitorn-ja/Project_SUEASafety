SET @schema_name = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND COLUMN_NAME = 'selected_location_code_snapshot') = 0,
  'ALTER TABLE checkins ADD COLUMN selected_location_code_snapshot VARCHAR(100) NULL AFTER selected_location_name_snapshot',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND COLUMN_NAME = 'selected_location_type_snapshot') = 0,
  'ALTER TABLE checkins ADD COLUMN selected_location_type_snapshot VARCHAR(20) NULL AFTER selected_location_code_snapshot',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND COLUMN_NAME = 'selected_location_source_snapshot') = 0,
  'ALTER TABLE checkins ADD COLUMN selected_location_source_snapshot VARCHAR(40) NULL AFTER selected_location_type_snapshot',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE checkins c
LEFT JOIN locations l ON l.id = c.selected_location_id
SET
  c.selected_location_code_snapshot = COALESCE(c.selected_location_code_snapshot, l.code, l.external_key),
  c.selected_location_type_snapshot = COALESCE(c.selected_location_type_snapshot, l.location_type),
  c.selected_location_source_snapshot = COALESCE(c.selected_location_source_snapshot, l.source)
WHERE c.selected_location_id IS NOT NULL;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND INDEX_NAME = 'idx_checkins_selected_location_snapshot') = 0,
  'ALTER TABLE checkins ADD KEY idx_checkins_selected_location_snapshot (selected_location_source_snapshot, selected_location_code_snapshot, checked_in_at, id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND INDEX_NAME = 'idx_checkins_selected_location_type_time_id') = 0,
  'ALTER TABLE checkins ADD KEY idx_checkins_selected_location_type_time_id (selected_location_type_snapshot, checked_in_at, id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
