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
  aa.user_id,
  earn.point_rule_id,
  'SPEND',
  -ABS(earn.amount),
  'AWARENESS_EXCLUDED',
  aa.id,
  CONCAT('awareness:', aa.user_id, ':', DATE_FORMAT(aa.attempt_date, '%Y-%m-%d'), ':excluded:', h.id),
  CONCAT('Reverse Awareness points for excluded date ', DATE_FORMAT(aa.attempt_date, '%Y-%m-%d')),
  UTC_TIMESTAMP(3)
FROM awareness_attempts aa
JOIN holidays h ON h.holiday_date = aa.attempt_date
JOIN point_transactions earn
  ON earn.user_id = aa.user_id
 AND earn.idempotency_key = CONCAT('awareness:', aa.user_id, ':', DATE_FORMAT(aa.attempt_date, '%Y-%m-%d'))
WHERE earn.amount > 0;

INSERT INTO point_balances (user_id, balance)
SELECT user_id, SUM(amount)
FROM point_transactions
GROUP BY user_id
ON DUPLICATE KEY UPDATE
  balance = VALUES(balance),
  updated_at = UTC_TIMESTAMP(3);
