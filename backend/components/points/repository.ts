import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { queryRows, withTransaction } from "@backend/components/core/db";
import { SAFETY_POINT_RULES, SAFETY_POINT_RULE_LABELS, type SafetyPointAction } from "@/lib/point-rules";

type PointRuleRow = RowDataPacket & {
  id: string;
  code: SafetyPointAction | string;
  source_type: string;
  points: number;
  status: string;
};

type PointBalanceRow = RowDataPacket & {
  user_id: string;
  balance: number | string;
  updated_at: Date | string;
};

type PointTransactionRow = RowDataPacket & {
  id: string;
  user_id: string;
  point_rule_id: string | null;
  transaction_type: string;
  amount: number;
  source_type: string;
  source_id: string | null;
  idempotency_key: string;
  description: string | null;
  occurred_at: Date | string;
};

type MappedPointRule = {
  id: string | null;
  code: string;
  label: string;
  sourceType: string;
  points: number;
  status: string;
  source: string;
};

const RULE_SOURCE_TYPES: Record<SafetyPointAction, string> = {
  safetyAwarenessCompleted: "SAFETY_AWARENESS",
  safetyPostApproved: "SAFETY_CULTURE_POST",
  commentCreated: "SAFETY_CULTURE_COMMENT",
  reactionCreated: "SAFETY_CULTURE_REACTION",
  safetyEffortCompleted: "SAFETY_EFFORT",
};

export function fallbackPointRules(): MappedPointRule[] {
  return Object.entries(SAFETY_POINT_RULES).map(([code, points]) => ({
    id: null,
    code,
    label: SAFETY_POINT_RULE_LABELS[code as SafetyPointAction],
    sourceType: RULE_SOURCE_TYPES[code as SafetyPointAction],
    points,
    status: "ACTIVE",
    source: "code-default",
  }));
}

function mapRule(row: PointRuleRow): MappedPointRule {
  const code = row.code as SafetyPointAction;
  return {
    id: String(row.id),
    code: row.code,
    label: SAFETY_POINT_RULE_LABELS[code] || row.code,
    sourceType: row.source_type,
    points: Number(row.points),
    status: row.status,
    source: "database",
  };
}

export async function listPointRules() {
  try {
    const rows = await queryRows<PointRuleRow>(
      `
        SELECT id, code, source_type, points, status
        FROM point_rules
        WHERE status = 'ACTIVE'
        ORDER BY source_type, code
      `,
    );

    const byCode = new Map(fallbackPointRules().map((rule) => [rule.code, rule]));
    for (const row of rows) {
      byCode.set(row.code, mapRule(row));
    }
    return Array.from(byCode.values());
  } catch {
    return fallbackPointRules();
  }
}

export async function getPointRule(action: SafetyPointAction) {
  const rows = await queryRows<PointRuleRow>(
    `
      SELECT id, code, source_type, points, status
      FROM point_rules
      WHERE code = :action AND status = 'ACTIVE'
      LIMIT 1
    `,
    { action },
  ).catch(() => []);

  if (rows[0]) return mapRule(rows[0]);
  return fallbackPointRules().find((rule) => rule.code === action)!;
}

export async function getPointBalance(userId: string) {
  const rows = await queryRows<PointBalanceRow>(
    `
      SELECT user_id, balance, updated_at
      FROM point_balances
      WHERE user_id = :userId
      LIMIT 1
    `,
    { userId },
  );

  return rows[0]
    ? { userId: String(rows[0].user_id), balance: Number(rows[0].balance), updatedAt: new Date(rows[0].updated_at).toISOString() }
    : { userId, balance: 0, updatedAt: null };
}

export async function listPointTransactions(userId: string, options: { limit?: number; cursor?: string | null } = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 50, 1), 100);
  const where = ["user_id = :userId"];
  const params: Record<string, unknown> = { userId, limit };

  if (options.cursor) {
    where.push("id < :cursor");
    params.cursor = options.cursor;
  }

  const rows = await queryRows<PointTransactionRow>(
    `
      SELECT id, user_id, point_rule_id, transaction_type, amount, source_type, source_id, idempotency_key, description, occurred_at
      FROM point_transactions
      WHERE ${where.join(" AND ")}
      ORDER BY id DESC
      LIMIT :limit
    `,
    params,
  );

  return {
    items: rows.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      pointRuleId: row.point_rule_id ? String(row.point_rule_id) : null,
      transactionType: row.transaction_type,
      amount: Number(row.amount),
      sourceType: row.source_type,
      sourceId: row.source_id ? String(row.source_id) : null,
      idempotencyKey: row.idempotency_key,
      description: row.description,
      occurredAt: new Date(row.occurred_at).toISOString(),
    })),
    nextCursor: rows.length === limit ? String(rows[rows.length - 1].id) : null,
  };
}

export async function awardPoints(input: {
  userId: string;
  action: SafetyPointAction;
  sourceType?: string;
  sourceId?: string | number | null;
  idempotencyKey: string;
  description?: string | null;
}) {
  const rule = await getPointRule(input.action);
  const amount = Number(rule.points);
  const sourceType = input.sourceType || rule.sourceType || RULE_SOURCE_TYPES[input.action];

  await withTransaction(async (connection) => {
    const [transactionResult] = await connection.execute<ResultSetHeader>(
      `
        INSERT IGNORE INTO point_transactions (
          user_id,
          point_rule_id,
          transaction_type,
          amount,
          source_type,
          source_id,
          idempotency_key,
          description
        ) VALUES (
          :userId,
          :pointRuleId,
          'EARN',
          :amount,
          :sourceType,
          :sourceId,
          :idempotencyKey,
          :description
        )
      `,
      {
        userId: input.userId,
        pointRuleId: rule.id,
        amount,
        sourceType,
        sourceId: input.sourceId ?? null,
        idempotencyKey: input.idempotencyKey,
        description: input.description || SAFETY_POINT_RULE_LABELS[input.action],
      },
    );

    if (transactionResult.affectedRows === 0) return;

    await connection.execute<ResultSetHeader>(
      `
        INSERT INTO point_balances (user_id, balance)
        VALUES (:userId, :amount)
        ON DUPLICATE KEY UPDATE
          balance = balance + :amount,
          updated_at = UTC_TIMESTAMP(3)
      `,
      { userId: input.userId, amount },
    );
  });

  return getPointBalance(input.userId);
}
