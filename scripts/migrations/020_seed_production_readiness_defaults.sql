INSERT INTO point_rules (code, source_type, points, status)
VALUES
  ('safetyAwarenessCompleted', 'SAFETY_AWARENESS', 1, 'ACTIVE'),
  ('safetyPostApproved', 'SAFETY_CULTURE_POST', 3, 'ACTIVE'),
  ('commentCreated', 'SAFETY_CULTURE_COMMENT', 2, 'ACTIVE'),
  ('reactionCreated', 'SAFETY_CULTURE_REACTION', 1, 'ACTIVE'),
  ('safetyEffortCompleted', 'SAFETY_EFFORT', 10, 'ACTIVE')
ON DUPLICATE KEY UPDATE
  source_type = VALUES(source_type),
  points = VALUES(points),
  status = 'ACTIVE',
  updated_at = UTC_TIMESTAMP(3);

INSERT INTO permissions (code, description)
VALUES
  ('ADMIN.ACCESS', 'Access the admin area'),
  ('SAFETY.ADMIN', 'Manage Safety settings and admin pages'),
  ('SAFETY_EFFORT.ADMIN', 'Manage Safety Effort templates, locations, reports, and exports'),
  ('SAFETY_CULTURE.ADMIN', 'Manage Safety Culture events, rewards, points, teams, and users'),
  ('API_DOCS.ACCESS', 'Access API documentation')
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  updated_at = UTC_TIMESTAMP(3);

INSERT INTO roles (code, name, description)
VALUES
  ('ADMIN', 'Administrator', 'Full administrator for Safety Caring'),
  ('SAFETY_ADMIN', 'Safety Administrator', 'Safety administrator for operational admin pages')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  updated_at = UTC_TIMESTAMP(3);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'ADMIN.ACCESS',
  'SAFETY.ADMIN',
  'SAFETY_EFFORT.ADMIN',
  'SAFETY_CULTURE.ADMIN',
  'API_DOCS.ACCESS'
)
WHERE r.code IN ('ADMIN', 'SAFETY_ADMIN');
