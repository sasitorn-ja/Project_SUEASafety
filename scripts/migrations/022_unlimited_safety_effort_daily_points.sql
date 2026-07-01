INSERT INTO safety_settings (setting_key, setting_value, updated_by)
VALUES (
  'safety_point_rule_conditions',
  JSON_OBJECT(
    'safetyEffortCompleted',
    JSON_OBJECT('dailyLimit', NULL, 'minCommentLength', NULL, 'awardPostOwner', FALSE)
  ),
  NULL
)
ON DUPLICATE KEY UPDATE
  setting_value = JSON_SET(
    COALESCE(setting_value, JSON_OBJECT()),
    '$.safetyEffortCompleted.dailyLimit', CAST('null' AS JSON),
    '$.safetyEffortCompleted.minCommentLength', CAST('null' AS JSON),
    '$.safetyEffortCompleted.awardPostOwner', FALSE
  ),
  updated_by = NULL,
  updated_at = UTC_TIMESTAMP(3);
