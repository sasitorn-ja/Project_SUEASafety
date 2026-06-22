INSERT INTO safety_effort_submissions (
  user_id,
  checkin_id,
  activity_id,
  activity_type,
  activity_label,
  loc_type,
  location_name,
  location_tag,
  submission_date,
  pms,
  name,
  email,
  safety_contact_text,
  answers_json,
  metadata,
  created_at,
  updated_at
)
SELECT
  c.user_id,
  a.checkin_id,
  a.id,
  a.activity_type,
  a.title,
  COALESCE(JSON_UNQUOTE(JSON_EXTRACT(a.notes, '$.locType')), 'factory'),
  JSON_UNQUOTE(JSON_EXTRACT(a.notes, '$.locationName')),
  JSON_UNQUOTE(JSON_EXTRACT(a.notes, '$.locationTag')),
  COALESCE(
    STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(a.notes, '$.date')), '%Y-%m-%d'),
    DATE(a.completed_at),
    DATE(a.created_at)
  ),
  JSON_UNQUOTE(JSON_EXTRACT(a.notes, '$.pms')),
  JSON_UNQUOTE(JSON_EXTRACT(a.notes, '$.name')),
  JSON_UNQUOTE(JSON_EXTRACT(a.notes, '$.email')),
  JSON_UNQUOTE(JSON_EXTRACT(a.notes, '$.safetyContactText')),
  COALESCE(JSON_EXTRACT(a.notes, '$.answers'), JSON_ARRAY()),
  JSON_OBJECT('migratedFrom', 'safety_activities'),
  a.created_at,
  a.updated_at
FROM safety_activities a
JOIN checkins c ON c.id = a.checkin_id
WHERE a.deleted_at IS NULL
  AND JSON_VALID(a.notes)
  AND NOT EXISTS (
    SELECT 1 FROM safety_effort_submissions s WHERE s.activity_id = a.id
  );
