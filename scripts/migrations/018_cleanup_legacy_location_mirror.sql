SET @schema_name = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
   WHERE TABLE_SCHEMA = @schema_name
     AND TABLE_NAME = 'checkins'
     AND COLUMN_NAME = 'selected_location_id'
     AND CONSTRAINT_NAME = 'fk_checkins_location') > 0,
  'ALTER TABLE checkins DROP FOREIGN KEY fk_checkins_location',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT IS_NULLABLE FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND COLUMN_NAME = 'selected_location_id') = 'NO',
  'ALTER TABLE checkins MODIFY COLUMN selected_location_id BIGINT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE checkins c
JOIN locations l ON l.id = c.selected_location_id
SET c.selected_location_id = NULL
WHERE l.source IN ('LOCATION_HUB_PLANT', 'LOCATION_HUB_OFFICE', 'LOCATION_HUB_SITE');

DELETE FROM locations
WHERE source IN ('LOCATION_HUB_PLANT', 'LOCATION_HUB_OFFICE', 'LOCATION_HUB_SITE');

DROP TABLE IF EXISTS plant_location_details;
DROP TABLE IF EXISTS office_location_details;
DROP TABLE IF EXISTS site_location_details;
DROP TABLE IF EXISTS location_import_rows;
DROP TABLE IF EXISTS location_import_batches;
