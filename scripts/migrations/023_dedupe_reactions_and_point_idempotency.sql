-- 023: กันไลก์ซ้ำและคะแนนซ้ำจากการกดรัวๆ (race condition)
-- 1) ลบ reaction ที่ซ้ำ (post_id, user_id) แล้วบังคับ UNIQUE key
-- 2) ลบ point_transactions ที่ idempotency_key ซ้ำ แล้วบังคับ UNIQUE key
-- 3) คำนวณ point_balances ใหม่จาก ledger

SET @schema_name := DATABASE();

-- 1a) ลบ reactions ซ้ำ เก็บแถวที่เก่าสุดไว้
DELETE r1 FROM reactions r1
INNER JOIN reactions r2
  ON r1.post_id = r2.post_id
 AND r1.user_id = r2.user_id
 AND (r1.created_at > r2.created_at
      OR (r1.created_at = r2.created_at AND r1.reaction_type > r2.reaction_type));

-- 1b) เพิ่ม UNIQUE key ถ้ายังไม่มี (ตาราง legacy อาจไม่มี PRIMARY KEY (post_id, user_id))
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'reactions') = 1
      AND (SELECT COUNT(*) FROM information_schema.STATISTICS s1
           JOIN information_schema.STATISTICS s2
             ON s2.TABLE_SCHEMA = s1.TABLE_SCHEMA AND s2.TABLE_NAME = s1.TABLE_NAME AND s2.INDEX_NAME = s1.INDEX_NAME
           WHERE s1.TABLE_SCHEMA = @schema_name AND s1.TABLE_NAME = 'reactions' AND s1.NON_UNIQUE = 0
             AND s1.SEQ_IN_INDEX = 1 AND s1.COLUMN_NAME = 'post_id'
             AND s2.SEQ_IN_INDEX = 2 AND s2.COLUMN_NAME = 'user_id') = 0,
    'ALTER TABLE reactions ADD UNIQUE KEY uq_reactions_post_user (post_id, user_id)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2a) ลบ point_transactions ที่ (user_id, idempotency_key) ซ้ำ เก็บ id ต่ำสุดไว้
DELETE pt1 FROM point_transactions pt1
INNER JOIN point_transactions pt2
  ON pt1.user_id = pt2.user_id
 AND pt1.idempotency_key = pt2.idempotency_key
 AND pt1.idempotency_key IS NOT NULL
 AND pt1.idempotency_key <> ''
 AND pt1.id > pt2.id;

-- 2b) เพิ่ม UNIQUE key ให้ idempotency ทำงานจริง (INSERT IGNORE ใน awardPoints ต้องพึ่ง key นี้)
SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE point_transactions ADD UNIQUE KEY uq_point_txn_user_idem (user_id, idempotency_key)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'point_transactions' AND INDEX_NAME = 'uq_point_txn_user_idem'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) คำนวณ balance ใหม่จาก ledger เพื่อแก้ยอดที่เพี้ยนจากการกดรัว
UPDATE point_balances pb
LEFT JOIN (
  SELECT user_id, COALESCE(SUM(amount), 0) AS ledger_balance
  FROM point_transactions
  GROUP BY user_id
) ledger ON ledger.user_id = pb.user_id
SET pb.balance = COALESCE(ledger.ledger_balance, 0),
    pb.updated_at = UTC_TIMESTAMP(3);
