CREATE TABLE IF NOT EXISTS safety_effort_submissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  checkin_id BIGINT UNSIGNED NULL,
  activity_id BIGINT UNSIGNED NULL,
  activity_type VARCHAR(80) NOT NULL,
  activity_label VARCHAR(255) NULL,
  loc_type VARCHAR(40) NULL,
  location_name VARCHAR(255) NULL,
  location_tag VARCHAR(255) NULL,
  submission_date DATE NULL,
  pms VARCHAR(80) NULL,
  name VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  safety_contact_text TEXT NULL,
  answers_json JSON NOT NULL,
  metadata JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_safety_effort_submissions_user_created (user_id, created_at, id),
  KEY idx_safety_effort_submissions_activity_created (activity_type, created_at, id),
  KEY idx_safety_effort_submissions_checkin (checkin_id),
  KEY idx_safety_effort_submissions_activity (activity_id),
  CONSTRAINT fk_safety_effort_submissions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT fk_safety_effort_submissions_checkin
    FOREIGN KEY (checkin_id) REFERENCES checkins(id)
    ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT fk_safety_effort_submissions_activity
    FOREIGN KEY (activity_id) REFERENCES safety_activities(id)
    ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
