SET @schema_name := DATABASE();

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'posts') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'posts' AND COLUMN_NAME IN ('status', 'deleted_at', 'id')) = 3
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'posts' AND INDEX_NAME = 'idx_posts_status_deleted_id') = 0,
    'ALTER TABLE posts ADD KEY idx_posts_status_deleted_id (status, deleted_at, id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'posts') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'posts' AND COLUMN_NAME IN ('author_id', 'status', 'id')) = 3
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'posts' AND INDEX_NAME = 'idx_posts_author_status_id') = 0,
    'ALTER TABLE posts ADD KEY idx_posts_author_status_id (author_id, status, id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'comments') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'comments' AND COLUMN_NAME IN ('post_id', 'deleted_at', 'id')) = 3
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'comments' AND INDEX_NAME = 'idx_comments_post_deleted_id') = 0,
    'ALTER TABLE comments ADD KEY idx_comments_post_deleted_id (post_id, deleted_at, id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'reactions') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'reactions' AND COLUMN_NAME IN ('post_id', 'user_id')) = 2
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'reactions' AND INDEX_NAME = 'idx_reactions_post_user') = 0,
    'ALTER TABLE reactions ADD KEY idx_reactions_post_user (post_id, user_id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'post_media') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'post_media' AND COLUMN_NAME IN ('media_asset_id', 'post_id')) = 2
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'post_media' AND INDEX_NAME = 'idx_post_media_media_post') = 0,
    'ALTER TABLE post_media ADD KEY idx_post_media_media_post (media_asset_id, post_id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'media_assets') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'media_assets' AND COLUMN_NAME IN ('status', 'deleted_at', 'created_at', 'id')) = 4
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'media_assets' AND INDEX_NAME = 'idx_media_assets_status_deleted_created') = 0,
    'ALTER TABLE media_assets ADD KEY idx_media_assets_status_deleted_created (status, deleted_at, created_at, id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'media_assets') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'media_assets' AND COLUMN_NAME IN ('created_by', 'created_at', 'id')) = 3
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'media_assets' AND INDEX_NAME = 'idx_media_assets_created_by_created') = 0,
    'ALTER TABLE media_assets ADD KEY idx_media_assets_created_by_created (created_by, created_at, id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'media_assets') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'media_assets' AND COLUMN_NAME IN ('provider', 'provider_asset_id')) = 2
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'media_assets' AND INDEX_NAME = 'idx_media_assets_provider_asset') = 0,
    'ALTER TABLE media_assets ADD KEY idx_media_assets_provider_asset (provider, provider_asset_id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND COLUMN_NAME IN ('user_id', 'checked_in_at', 'id')) = 3
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND INDEX_NAME = 'idx_checkins_user_time_id') = 0,
    'ALTER TABLE checkins ADD KEY idx_checkins_user_time_id (user_id, checked_in_at, id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND COLUMN_NAME IN ('selected_location_id', 'checked_in_at', 'id')) = 3
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'checkins' AND INDEX_NAME = 'idx_checkins_location_time_id') = 0,
    'ALTER TABLE checkins ADD KEY idx_checkins_location_time_id (selected_location_id, checked_in_at, id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'locations') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'locations' AND COLUMN_NAME IN ('location_type', 'status', 'deleted_at', 'id')) = 4
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'locations' AND INDEX_NAME = 'idx_locations_type_status_deleted') = 0,
    'ALTER TABLE locations ADD KEY idx_locations_type_status_deleted (location_type, status, deleted_at, id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'locations') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'locations' AND COLUMN_NAME IN ('checkin_enabled', 'status', 'deleted_at', 'id')) = 4
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'locations' AND INDEX_NAME = 'idx_locations_checkin_status_deleted') = 0,
    'ALTER TABLE locations ADD KEY idx_locations_checkin_status_deleted (checkin_enabled, status, deleted_at, id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'notifications') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'notifications' AND COLUMN_NAME IN ('user_id', 'id')) = 2
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'notifications' AND INDEX_NAME = 'idx_notifications_user_id') = 0,
    'ALTER TABLE notifications ADD KEY idx_notifications_user_id (user_id, id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'notifications') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'notifications' AND COLUMN_NAME IN ('user_id', 'read_at', 'id')) = 3
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'notifications' AND INDEX_NAME = 'idx_notifications_user_read_id') = 0,
    'ALTER TABLE notifications ADD KEY idx_notifications_user_read_id (user_id, read_at, id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'rewards') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'rewards' AND COLUMN_NAME IN ('status', 'points_required', 'id')) = 3
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'rewards' AND INDEX_NAME = 'idx_rewards_status_points_id') = 0,
    'ALTER TABLE rewards ADD KEY idx_rewards_status_points_id (status, points_required, id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'reward_redemptions') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'reward_redemptions' AND COLUMN_NAME IN ('user_id', 'id')) = 2
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'reward_redemptions' AND INDEX_NAME = 'idx_reward_redemptions_user_id') = 0,
    'ALTER TABLE reward_redemptions ADD KEY idx_reward_redemptions_user_id (user_id, id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'awareness_attempts') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'awareness_attempts' AND COLUMN_NAME IN ('user_id', 'attempt_date', 'id')) = 3
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'awareness_attempts' AND INDEX_NAME = 'idx_awareness_attempts_user_date_id') = 0,
    'ALTER TABLE awareness_attempts ADD KEY idx_awareness_attempts_user_date_id (user_id, attempt_date, id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'team_members') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'team_members' AND COLUMN_NAME IN ('user_id', 'left_at', 'joined_at', 'team_id')) = 4
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'team_members' AND INDEX_NAME = 'idx_team_members_user_active_joined') = 0,
    'ALTER TABLE team_members ADD KEY idx_team_members_user_active_joined (user_id, left_at, joined_at, team_id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'team_members') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'team_members' AND COLUMN_NAME IN ('team_id', 'left_at', 'user_id')) = 3
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'team_members' AND INDEX_NAME = 'idx_team_members_team_active_user') = 0,
    'ALTER TABLE team_members ADD KEY idx_team_members_team_active_user (team_id, left_at, user_id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'point_balances') = 1
      AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'point_balances' AND COLUMN_NAME IN ('balance', 'user_id')) = 2
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'point_balances' AND INDEX_NAME = 'idx_point_balances_balance_user') = 0,
    'ALTER TABLE point_balances ADD KEY idx_point_balances_balance_user (balance, user_id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
