CREATE TABLE IF NOT EXISTS safety_culture_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  event_start_at DATETIME(3) NULL,
  event_end_at DATETIME(3) NULL,
  location_text VARCHAR(255) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
  metadata JSON NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_safety_culture_events_status (status),
  KEY idx_safety_culture_events_start (event_start_at),
  KEY fk_safety_culture_events_created_by (created_by),
  CONSTRAINT fk_safety_culture_events_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_assets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NULL,
  mime_type VARCHAR(120) NULL,
  size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  status VARCHAR(40) NOT NULL DEFAULT 'READY',
  module VARCHAR(80) NULL,
  owner_type VARCHAR(80) NULL,
  owner_id BIGINT UNSIGNED NULL,
  link_type VARCHAR(80) NULL,
  upload_mode VARCHAR(40) NOT NULL DEFAULT 'server',
  storage_path VARCHAR(1000) NULL,
  public_url VARCHAR(1000) NULL,
  metadata JSON NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_media_assets_owner (owner_type, owner_id),
  KEY idx_media_assets_status (status),
  KEY fk_media_assets_created_by (created_by),
  CONSTRAINT fk_media_assets_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS export_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_type VARCHAR(80) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
  params JSON NULL,
  result_json JSON NULL,
  file_name VARCHAR(255) NULL,
  created_by BIGINT UNSIGNED NULL,
  started_at DATETIME(3) NULL,
  completed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_export_jobs_status (status),
  KEY idx_export_jobs_type (job_type),
  KEY fk_export_jobs_created_by (created_by),
  CONSTRAINT fk_export_jobs_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id BIGINT UNSIGNED NOT NULL,
  email_enabled TINYINT(1) NOT NULL DEFAULT 1,
  in_app_enabled TINYINT(1) NOT NULL DEFAULT 1,
  preferences_json JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_notification_preferences_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_attachments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  assessment_run_id BIGINT UNSIGNED NOT NULL,
  media_asset_id BIGINT UNSIGNED NULL,
  file_url VARCHAR(1000) NULL,
  attachment_type VARCHAR(80) NOT NULL DEFAULT 'EVIDENCE',
  metadata JSON NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_assessment_attachments_run (assessment_run_id),
  KEY fk_assessment_attachments_media (media_asset_id),
  KEY fk_assessment_attachments_created_by (created_by),
  CONSTRAINT fk_assessment_attachments_run
    FOREIGN KEY (assessment_run_id) REFERENCES assessment_runs(id)
    ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT fk_assessment_attachments_media
    FOREIGN KEY (media_asset_id) REFERENCES media_assets(id)
    ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT fk_assessment_attachments_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS corrective_action_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  corrective_action_id BIGINT UNSIGNED NOT NULL,
  author_id BIGINT UNSIGNED NULL,
  content TEXT NOT NULL,
  metadata JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_corrective_action_comments_action (corrective_action_id),
  KEY fk_corrective_action_comments_author (author_id),
  CONSTRAINT fk_corrective_action_comments_action
    FOREIGN KEY (corrective_action_id) REFERENCES corrective_actions(id)
    ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT fk_corrective_action_comments_author
    FOREIGN KEY (author_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS archived_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  notification_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  notification_type VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NULL,
  read_at DATETIME(3) NULL,
  original_created_at DATETIME(3) NULL,
  archived_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_archived_notifications_user (user_id, archived_at),
  CONSTRAINT fk_archived_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS safety_settings (
  setting_key VARCHAR(120) NOT NULL,
  setting_value JSON NOT NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (setting_key),
  KEY fk_safety_settings_updated_by (updated_by),
  CONSTRAINT fk_safety_settings_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
