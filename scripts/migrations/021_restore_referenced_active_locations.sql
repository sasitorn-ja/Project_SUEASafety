UPDATE locations
SET
  status = 'ACTIVE',
  map_visible = 1,
  checkin_enabled = 1,
  deleted_at = NULL,
  updated_at = UTC_TIMESTAMP(3)
WHERE id IN (
  SELECT selected_location_id
  FROM (
    SELECT DISTINCT selected_location_id
    FROM checkins
    WHERE selected_location_id IS NOT NULL
  ) referenced_locations
)
AND deleted_at IS NOT NULL;
