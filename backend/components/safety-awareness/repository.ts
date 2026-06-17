import "server-only";

import type { ResultSetHeader } from "mysql2/promise";

import { withTransaction } from "@backend/components/core/db";
import { awardPoints } from "@backend/components/points/repository";

export async function createAwarenessAttempt(input: {
  userId: string;
  score: number;
  total: number;
  questions?: Array<{ id: string; correct: boolean; category?: string; text?: string }>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const numericScore = Math.max(0, Number(input.score) || 0);
  const total = Math.max(0, Number(input.total) || 0);

  const attemptId = await withTransaction(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      `
        INSERT INTO awareness_attempts (user_id, attempt_date, score, completed_at)
        VALUES (:userId, :attemptDate, :score, UTC_TIMESTAMP(3))
      `,
      {
        userId: input.userId,
        attemptDate: today,
        score: total > 0 ? (numericScore / total) * 100 : 0,
      },
    );

    const attemptId = String(result.insertId);
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

  await awardPoints({
    userId: input.userId,
    action: "safetyAwarenessCompleted",
    sourceType: "AWARENESS_ATTEMPT",
    sourceId: attemptId,
    idempotencyKey: `awareness:${input.userId}:${today}`,
    description: "ผ่าน Safety Awareness",
  }).catch(() => null);

  return {
    id: attemptId,
    attemptDate: today,
    score: numericScore,
    total,
  };
}
