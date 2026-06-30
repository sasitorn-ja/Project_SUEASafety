SET @schema_name := DATABASE();

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND COLUMN_NAME = 'actual_location_id_snapshot') = 0,
    'ALTER TABLE checkins ADD COLUMN actual_location_id_snapshot BIGINT UNSIGNED NULL AFTER actual_accuracy_m',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND COLUMN_NAME = 'actual_location_name_snapshot') = 0,
    'ALTER TABLE checkins ADD COLUMN actual_location_name_snapshot VARCHAR(255) NULL AFTER actual_location_id_snapshot',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND COLUMN_NAME = 'actual_location_code_snapshot') = 0,
    'ALTER TABLE checkins ADD COLUMN actual_location_code_snapshot VARCHAR(80) NULL AFTER actual_location_name_snapshot',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND COLUMN_NAME = 'actual_location_distance_m_snapshot') = 0,
    'ALTER TABLE checkins ADD COLUMN actual_location_distance_m_snapshot DECIMAL(12,2) NULL AFTER actual_location_code_snapshot',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins') = 1
      AND (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'locations') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND COLUMN_NAME IN ('actual_position', 'actual_location_id_snapshot', 'actual_location_name_snapshot', 'actual_location_code_snapshot', 'actual_location_distance_m_snapshot')) = 5
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'locations' AND COLUMN_NAME IN ('id', 'name_th', 'code', 'position', 'deleted_at')) = 5,
    'UPDATE checkins c
      SET
        actual_location_id_snapshot = COALESCE(actual_location_id_snapshot, (
          SELECT nl.id FROM locations nl
          WHERE nl.deleted_at IS NULL AND nl.position IS NOT NULL AND c.actual_position IS NOT NULL
          ORDER BY ST_Distance_Sphere(c.actual_position, nl.position) ASC
          LIMIT 1
        )),
        actual_location_name_snapshot = COALESCE(actual_location_name_snapshot, (
          SELECT nl.name_th FROM locations nl
          WHERE nl.deleted_at IS NULL AND nl.position IS NOT NULL AND c.actual_position IS NOT NULL
          ORDER BY ST_Distance_Sphere(c.actual_position, nl.position) ASC
          LIMIT 1
        )),
        actual_location_code_snapshot = COALESCE(actual_location_code_snapshot, (
          SELECT nl.code FROM locations nl
          WHERE nl.deleted_at IS NULL AND nl.position IS NOT NULL AND c.actual_position IS NOT NULL
          ORDER BY ST_Distance_Sphere(c.actual_position, nl.position) ASC
          LIMIT 1
        )),
        actual_location_distance_m_snapshot = COALESCE(actual_location_distance_m_snapshot, (
          SELECT ST_Distance_Sphere(c.actual_position, nl.position) FROM locations nl
          WHERE nl.deleted_at IS NULL AND nl.position IS NOT NULL AND c.actual_position IS NOT NULL
          ORDER BY ST_Distance_Sphere(c.actual_position, nl.position) ASC
          LIMIT 1
        ))
      WHERE c.actual_position IS NOT NULL
        AND (
          c.actual_location_id_snapshot IS NULL
          OR c.actual_location_name_snapshot IS NULL
          OR c.actual_location_distance_m_snapshot IS NULL
        )',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND COLUMN_NAME IN ('actual_location_id_snapshot', 'checked_in_at', 'id')) = 3
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND INDEX_NAME = 'idx_checkins_actual_location_time_id') = 0,
    'ALTER TABLE checkins ADD KEY idx_checkins_actual_location_time_id (actual_location_id_snapshot, checked_in_at, id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
