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

type PointRuleCondition = {
  dailyLimit: number | null;
  minCommentLength: number | null;
  awardPostOwner: boolean;
};

type MappedPointRule = {
  id: string | null;
  code: string;
  label: string;
  sourceType: string;
  points: number;
  status: string;
  source: string;
  dailyLimit: number | null;
  minCommentLength: number | null;
  awardPostOwner: boolean;
};

const POINT_RULE_SETTINGS_KEY = "safety_point_rule_conditions";

const RULE_SOURCE_TYPES: Record<SafetyPointAction, string> = {
  safetyAwarenessCompleted: "SAFETY_AWARENESS",
  safetyPostApproved: "SAFETY_CULTURE_POST",
  commentCreated: "SAFETY_CULTURE_COMMENT",
  reactionCreated: "SAFETY_CULTURE_REACTION",
  safetyEffortCompleted: "SAFETY_EFFORT",
};

const DEFAULT_RULE_CONDITIONS: Record<SafetyPointAction, PointRuleCondition> = {
  safetyAwarenessCompleted: { dailyLimit: 1, minCommentLength: null, awardPostOwner: false },
  safetyPostApproved: { dailyLimit: 3, minCommentLength: null, awardPostOwner: false },
  commentCreated: { dailyLimit: 3, minCommentLength: 15, awardPostOwner: false },
  reactionCreated: { dailyLimit: 3, minCommentLength: null, awardPostOwner: true },
  safetyEffortCompleted: { dailyLimit: null, minCommentLength: null, awardPostOwner: false },
};

const ACTION_SOURCE_TYPES: Record<SafetyPointAction, string[]> = {
  safetyAwarenessCompleted: ["AWARENESS_ATTEMPT"],
  safetyPostApproved: ["POST"],
  commentCreated: ["COMMENT"],
  reactionCreated: ["REACTION"],
  safetyEffortCompleted: ["SAFETY_EFFORT"],
};

export function getPointRuleSourceType(action: SafetyPointAction) {
  return RULE_SOURCE_TYPES[action];
}

function normalizeConditionNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed);
}

function normalizeCondition(action: SafetyPointAction, value: unknown): PointRuleCondition {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const fallback = DEFAULT_RULE_CONDITIONS[action];
  return {
    dailyLimit: Object.prototype.hasOwnProperty.call(record, "dailyLimit")
      ? normalizeConditionNumber(record.dailyLimit)
      : fallback.dailyLimit,
    minCommentLength: Object.prototype.hasOwnProperty.call(record, "minCommentLength")
      ? normalizeConditionNumber(record.minCommentLength)
      : fallback.minCommentLength,
    awardPostOwner: typeof record.awardPostOwner === "boolean" ? record.awardPostOwner : fallback.awardPostOwner,
  };
}

async function loadPointRuleConditions(): Promise<Record<SafetyPointAction, PointRuleCondition>> {
  const defaults = Object.fromEntries(
    (Object.keys(DEFAULT_RULE_CONDITIONS) as SafetyPointAction[]).map((action) => [action, { ...DEFAULT_RULE_CONDITIONS[action] }]),
  ) as Record<SafetyPointAction, PointRuleCondition>;

  try {
    const rows = await queryRows<RowDataPacket & { setting_value: string | null }>(
      `
        SELECT setting_value
        FROM safety_settings
        WHERE setting_key = :key
        LIMIT 1
      `,
      { key: POINT_RULE_SETTINGS_KEY },
    );
    const raw = rows[0]?.setting_value;
    if (!raw) return defaults;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const action of Object.keys(DEFAULT_RULE_CONDITIONS) as SafetyPointAction[]) {
      defaults[action] = normalizeCondition(action, parsed[action]);
    }
    return defaults;
  } catch {
    return defaults;
  }
}

async function savePointRuleConditions(input: Partial<Record<SafetyPointAction, Partial<PointRuleCondition>>>) {
  const current = await loadPointRuleConditions();
  for (const action of Object.keys(input) as SafetyPointAction[]) {
    current[action] = {
      ...current[action],
      ...input[action],
    };
  }

  await withTransaction(async (connection) => {
    await connection.execute<ResultSetHeader>(
      `
        INSERT INTO safety_settings (setting_key, setting_value, updated_by)
        VALUES (:key, :value, NULL)
        ON DUPLICATE KEY UPDATE
          setting_value = VALUES(setting_value),
          updated_by = NULL,
          updated_at = UTC_TIMESTAMP(3)
      `,
      {
        key: POINT_RULE_SETTINGS_KEY,
        value: JSON.stringify(current),
      },
    );
  });
}

function applyConditions(
  rule: Omit<MappedPointRule, "dailyLimit" | "minCommentLength" | "awardPostOwner">,
  conditions: Record<SafetyPointAction, PointRuleCondition>,
): MappedPointRule {
  const action = rule.code as SafetyPointAction;
  const condition = conditions[action] || DEFAULT_RULE_CONDITIONS[action];
  return {
    ...rule,
    dailyLimit: condition.dailyLimit,
    minCommentLength: condition.minCommentLength,
    awardPostOwner: condition.awardPostOwner,
  };
}

export async function getPointRuleConditions() {
  return loadPointRuleConditions();
}

export async function fallbackPointRules(): Promise<MappedPointRule[]> {
  const conditions = await loadPointRuleConditions();
  return Object.entries(SAFETY_POINT_RULES).map(([code, points]) => applyConditions({
    id: null,
    code,
    label: SAFETY_POINT_RULE_LABELS[code as SafetyPointAction],
    sourceType: RULE_SOURCE_TYPES[code as SafetyPointAction],
    points,
    status: "ACTIVE",
    source: "code-default",
  }, conditions));
}

function mapRule(row: PointRuleRow, conditions: Record<SafetyPointAction, PointRuleCondition>): MappedPointRule {
  const code = row.code as SafetyPointAction;
  return applyConditions({
    id: String(row.id),
    code: row.code,
    label: SAFETY_POINT_RULE_LABELS[code] || row.code,
    sourceType: row.source_type,
    points: Number(row.points),
    status: row.status,
    source: "database",
  }, conditions);
}

export async function listPointRules() {
  const conditions = await loadPointRuleConditions();
  try {
    const rows = await queryRows<PointRuleRow>(
      `
        SELECT id, code, source_type, points, status
        FROM point_rules
        WHERE status = 'ACTIVE'
        ORDER BY source_type, code
      `,
    );

    const byCode = new Map((await fallbackPointRules()).map((rule) => [rule.code, rule]));
    for (const row of rows) {
      byCode.set(row.code, mapRule(row, conditions));
    }
    return Array.from(byCode.values());
  } catch {
    return fallbackPointRules();
  }
}

export async function getPointRule(action: SafetyPointAction) {
  const conditions = await loadPointRuleConditions();
  const rows = await queryRows<PointRuleRow>(
    `
      SELECT id, code, source_type, points, status
      FROM point_rules
      WHERE code = :action AND status = 'ACTIVE'
      LIMIT 1
    `,
    { action },
  ).catch(() => []);

  if (rows[0]) return mapRule(rows[0], conditions);
  return (await fallbackPointRules()).find((rule) => rule.code === action)!;
}

export async function savePointRule(input: {
  id?: string | null;
  code: SafetyPointAction;
  points: number;
  status?: string;
  dailyLimit?: number | null;
  minCommentLength?: number | null;
  awardPostOwner?: boolean;
}) {
  const code = input.code;
  const points = Math.max(0, Number(input.points) || 0);
  const status = String(input.status || "ACTIVE").toUpperCase();
  const sourceType = RULE_SOURCE_TYPES[code];

  await withTransaction(async (connection) => {
    let targetId = input.id ? String(input.id) : null;

    if (!targetId) {
      const [existingRows] = await connection.execute<PointRuleRow[]>(
        `
          SELECT id, code, source_type, points, status
          FROM point_rules
          WHERE code = :code
          ORDER BY id DESC
          LIMIT 1
        `,
        { code },
      );
      targetId = existingRows[0]?.id ? String(existingRows[0].id) : null;
    }

    if (targetId) {
      await connection.execute<ResultSetHeader>(
        `
          UPDATE point_rules
          SET source_type = :sourceType,
              points = :points,
              status = :status
          WHERE id = :id
          LIMIT 1
        `,
        { id: targetId, sourceType, points, status },
      );
      return;
    }

    await connection.execute<ResultSetHeader>(
      `
        INSERT INTO point_rules (code, source_type, points, status)
        VALUES (:code, :sourceType, :points, :status)
      `,
      { code, sourceType, points, status },
    );
  });

  await savePointRuleConditions({
    [code]: {
      dailyLimit: normalizeConditionNumber(input.dailyLimit),
      minCommentLength: normalizeConditionNumber(input.minCommentLength),
      awardPostOwner: typeof input.awardPostOwner === "boolean" ? input.awardPostOwner : undefined,
    },
  });

  return getPointRule(code);
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

async function countAwardsToday(input: {
  userId: string;
  action: SafetyPointAction;
  pointRuleId?: string | null;
  sourceType?: string;
}) {
  const sourceTypes = Array.from(new Set([
    ...(ACTION_SOURCE_TYPES[input.action] || []),
    ...(input.sourceType ? [input.sourceType] : []),
  ]));
  const params: Record<string, unknown> = {
    userId: input.userId,
  };
  const sourceTypeClause = sourceTypes.map((sourceType, index) => {
    const key = `sourceType${index}`;
    params[key] = sourceType;
    return `source_type = :${key}`;
  });

  let awardScope = sourceTypeClause.length > 0 ? `(${sourceTypeClause.join(" OR ")})` : "1 = 0";
  if (input.pointRuleId) {
    params.pointRuleId = input.pointRuleId;
    awardScope = `point_rule_id = :pointRuleId OR ${awardScope}`;
  }

  const rows = await queryRows<RowDataPacket & { total: number | string }>(
    `
      SELECT COUNT(*) AS total
      FROM point_transactions
      WHERE user_id = :userId
        AND transaction_type = 'EARN'
        AND (${awardScope})
        AND DATE(CONVERT_TZ(occurred_at, '+00:00', '+07:00')) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+07:00'))
    `,
    params,
  ).catch(() => []);

  return Number(rows[0]?.total || 0);
}

export async function awardPoints(input: {
  userId: string;
  action: SafetyPointAction;
  sourceType?: string;
  sourceId?: string | number | null;
  idempotencyKey: string;
  description?: string | null;
  amountOverride?: number | null;
}) {
  const rule = await getPointRule(input.action);
  const amount = Math.max(0, Number(input.amountOverride ?? rule.points) || 0);
  const sourceType = input.sourceType || rule.sourceType || RULE_SOURCE_TYPES[input.action];
  const dailyLimit = Math.max(0, Number(rule.dailyLimit) || 0);

  if (dailyLimit > 0) {
    const awardedToday = await countAwardsToday({
      userId: input.userId,
      action: input.action,
      pointRuleId: rule.id,
      sourceType,
    });
    if (awardedToday >= dailyLimit) {
      return getPointBalance(input.userId);
    }
  }

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

export async function retractPoints(input: {
  userId: string;
  idempotencyKey: string;
}) {
  await withTransaction(async (connection) => {
    // FOR UPDATE locks the row so concurrent retract calls (rapid unlike clicks)
    // serialize here instead of both reading the amount and double-decrementing.
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT amount FROM point_transactions WHERE user_id = :userId AND idempotency_key = :idempotencyKey LIMIT 1 FOR UPDATE",
      { userId: input.userId, idempotencyKey: input.idempotencyKey },
    );
    const txn = rows[0] as (RowDataPacket & { amount: number | string }) | undefined;
    if (!txn) return;

    const amount = Number(txn.amount);

    const [deleteResult] = await connection.execute<ResultSetHeader>(
      "DELETE FROM point_transactions WHERE user_id = :userId AND idempotency_key = :idempotencyKey",
      { userId: input.userId, idempotencyKey: input.idempotencyKey },
    );
    // Only adjust the balance if this call actually removed the transaction.
    if (deleteResult.affectedRows === 0) return;

    const negAmount = -amount;
    await connection.execute<ResultSetHeader>(
      `
        INSERT INTO point_balances (user_id, balance)
        VALUES (:userId, :negAmount)
        ON DUPLICATE KEY UPDATE
          balance = balance + :negAmount,
          updated_at = UTC_TIMESTAMP(3)
      `,
      { userId: input.userId, negAmount },
    );
  });

  return getPointBalance(input.userId);
}
