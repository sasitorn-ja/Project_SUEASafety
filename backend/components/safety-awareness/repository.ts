import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { queryRows, withTransaction } from "@backend/components/core/db";
import { awardPoints } from "@backend/components/points/repository";

function bangkokDateKey(date = new Date()) {
  const bangkok = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return bangkok.toISOString().slice(0, 10);
}

async function isExcludedAwarenessDate(dateKey: string) {
  const day = new Date(`${dateKey}T00:00:00+07:00`).getDay();
  if (day === 0 || day === 6) return true;

  const rows = await queryRows<RowDataPacket & { id: number | string }>(
    `
      SELECT id
      FROM holidays
      WHERE holiday_date = :dateKey
      LIMIT 1
    `,
    { dateKey },
  ).catch(() => []);

  return rows.length > 0;
}

export async function createAwarenessAttempt(input: {
  userId: string;
  score: number;
  total: number;
  questions?: Array<{ id: string; correct: boolean; category?: string; text?: string }>;
}) {
  const today = bangkokDateKey();
  const numericScore = Math.max(0, Number(input.score) || 0);
  const total = Math.max(0, Number(input.total) || 0);
  const percentScore = total > 0 ? (numericScore / total) * 100 : 0;

  const attemptId = await withTransaction(async (connection) => {
    const [existingRows] = await connection.execute<Array<RowDataPacket & { id: number | string }>>(
      `
        SELECT id
        FROM awareness_attempts
        WHERE user_id = :userId AND attempt_date = :attemptDate
        ORDER BY id DESC
        LIMIT 1
      `,
      {
        userId: input.userId,
        attemptDate: today,
      },
    );
    const existingId = existingRows[0]?.id ? String(existingRows[0].id) : "";

    if (existingId) {
      await connection.execute<ResultSetHeader>(
        `
          UPDATE awareness_attempts
          SET score = :score, completed_at = UTC_TIMESTAMP(3)
          WHERE id = :attemptId AND user_id = :userId
        `,
        {
          attemptId: existingId,
          userId: input.userId,
          score: percentScore,
        },
      );
      await connection.execute<ResultSetHeader>(
        "DELETE FROM awareness_answers WHERE attempt_id = :attemptId",
        { attemptId: existingId },
      );
    }

    let attemptId = existingId;
    if (!attemptId) {
      const [result] = await connection.execute<ResultSetHeader>(
        `
          INSERT INTO awareness_attempts (user_id, attempt_date, score, completed_at)
          VALUES (:userId, :attemptDate, :score, UTC_TIMESTAMP(3))
        `,
        {
          userId: input.userId,
          attemptDate: today,
          score: percentScore,
        },
      );
      attemptId = String(result.insertId);
    }
    for (const question of input.questions || []) {
      const questionId = Number(question.id);
      if (!Number.isFinite(questionId)) continue;

      await connection.execute<ResultSetHeader>(
        `
          INSERT INTO awareness_answers (attempt_id, question_id, answer_json, is_correct)
          VALUES (:attemptId, :questionId, :answerJson, :isCorrect)
        `,
        {
          attemptId,
          questionId,
          answerJson: JSON.stringify(question),
          isCorrect: Boolean(question.correct),
        },
      );
    }

    return attemptId;
  });

  const excluded = await isExcludedAwarenessDate(today);
  if (!excluded) {
    await awardPoints({
      userId: input.userId,
      action: "safetyAwarenessCompleted",
      sourceType: "AWARENESS_ATTEMPT",
      sourceId: attemptId,
      idempotencyKey: `awareness:${input.userId}:${today}`,
      description: "ผ่าน Safety Awareness",
    }).catch(() => null);
  }

  return {
    id: attemptId,
    attemptDate: today,
    score: numericScore,
    total,
  };
}
