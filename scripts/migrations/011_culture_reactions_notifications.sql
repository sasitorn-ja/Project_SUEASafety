CREATE TABLE IF NOT EXISTS comment_reactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  comment_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  reaction_type VARCHAR(40) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_comment_reactions_comment_user (comment_id, user_id),
  KEY idx_comment_reactions_user (user_id, id),
  CONSTRAINT fk_comment_reactions_comment
    FOREIGN KEY (comment_id) REFERENCES comments(id)
    ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT fk_comment_reactions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @schema_name = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'metadata') = 0,
  'ALTER TABLE notifications ADD COLUMN metadata JSON NULL AFTER body',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
