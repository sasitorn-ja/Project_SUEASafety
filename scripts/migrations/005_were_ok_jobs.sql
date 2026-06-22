CREATE TABLE IF NOT EXISTS were_ok_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  job_code VARCHAR(80) NOT NULL,
  job_label VARCHAR(120) NULL,
  start_node VARCHAR(120) NULL,
  end_node VARCHAR(120) NULL,
  distance_km DECIMAL(10,2) NULL,
  estimated_minutes INT UNSIGNED NULL,
  slump VARCHAR(80) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'ASSIGNED',
  scheduled_at DATETIME(3) NULL,
  acknowledged_at DATETIME(3) NULL,
  payload JSON NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_were_ok_jobs_job_code (job_code),
  KEY idx_were_ok_jobs_user_status (user_id, status, scheduled_at, id),
  KEY idx_were_ok_jobs_status_deleted (status, deleted_at, id),
  KEY fk_were_ok_jobs_user (user_id),
  KEY fk_were_ok_jobs_created_by (created_by),
  CONSTRAINT fk_were_ok_jobs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT fk_were_ok_jobs_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS were_ok_route_warnings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_id BIGINT UNSIGNED NOT NULL,
  warning_type VARCHAR(40) NOT NULL DEFAULT 'warning',
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  km_label VARCHAR(40) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_were_ok_route_warnings_job (job_id, sort_order, id),
  CONSTRAINT fk_were_ok_route_warnings_job
    FOREIGN KEY (job_id) REFERENCES were_ok_jobs(id)
    ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS were_ok_sleep_summaries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_id BIGINT UNSIGNED NOT NULL,
  sleep_minutes INT UNSIGNED NULL,
  summary_text VARCHAR(255) NULL,
  description VARCHAR(255) NULL,
  payload JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_were_ok_sleep_summaries_job (job_id),
  CONSTRAINT fk_were_ok_sleep_summaries_job
    FOREIGN KEY (job_id) REFERENCES were_ok_jobs(id)
    ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
