INSERT IGNORE INTO point_transactions (
  user_id,
  point_rule_id,
  transaction_type,
  amount,
  source_type,
  source_id,
  idempotency_key,
  description,
  occurred_at
)
SELECT
  earn.user_id,
  earn.point_rule_id,
  'SPEND',
  -ABS(earn.amount),
  'POST_DELETION',
  p.id,
  CONCAT('post:', p.id, ':delete-reversal'),
  CONCAT('Reverse points for deleted Safety Post #', p.id),
  COALESCE(p.deleted_at, UTC_TIMESTAMP(3))
FROM posts p
JOIN point_transactions earn
  ON earn.user_id = p.author_id
 AND earn.idempotency_key = CONCAT('post:', p.id, ':approved')
WHERE p.deleted_at IS NOT NULL
  AND earn.amount > 0;

INSERT INTO point_balances (user_id, balance)
SELECT user_id, SUM(amount)
FROM point_transactions
GROUP BY user_id
ON DUPLICATE KEY UPDATE
  balance = VALUES(balance),
  updated_at = UTC_TIMESTAMP(3);
