import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const sourcePath = process.argv[2];

if (!sourcePath) {
  console.error("Usage: node scripts/import-awareness-questions.mjs <questions.txt>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const source = (await fs.readFile(sourcePath, "utf8"))
  .replace(/[\u2028\u2029]/g, "\n")
  .replace(/\r\n?/g, "\n");

const questions = [];
let category = "";
let inferredCategoryNumber = 8;

for (const rawLine of source.split("\n")) {
  const line = rawLine.trim();
  if (!line) continue;

  if (line.startsWith("หมวด")) {
    const explicitNumber = line.match(/^หมวดที่\s*(\d+)\s*:/)?.[1];
    if (explicitNumber) {
      inferredCategoryNumber = Number(explicitNumber);
    } else {
      inferredCategoryNumber += 1;
    }

    const label = line
      .replace(/^หมวด(?:ที่)?\s*(?:\d+)?\s*:\s*/, "")
      .replace(/\s*\(ข้อ\s*\d+\s*-\s*\d+\)\s*$/, "")
      .trim();
    category = `หมวดที่ ${inferredCategoryNumber}: ${label}`;
    continue;
  }

  const normalized = line
    .replace(/^[•*-]\s*/, "")
    .replace(/^\d+\.\s*/, "")
    .trim();
  const match = normalized.match(/^(.*?)\s*\((ถูก|ผิด)(?:\s*-\s*(.*?))?\)\s*$/);
  if (!match) continue;

  questions.push({
    text: match[1].trim(),
    category,
    answer: match[2] === "ถูก",
    note: (match[3] || "").trim(),
  });
}

if (questions.length !== 120) {
  console.error(`Expected 120 questions, parsed ${questions.length}. Import aborted.`);
  process.exit(1);
}

if (questions.some((question) => !question.category || !question.text)) {
  console.error("A question is missing its category or text. Import aborted.");
  process.exit(1);
}

const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  charset: "utf8mb4",
  namedPlaceholders: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  timezone: "Z",
});

let inserted = 0;
let updated = 0;

try {
  await connection.beginTransaction();

  for (const question of questions) {
    const [rows] = await connection.execute(
      "SELECT id FROM awareness_questions WHERE question_text = :text ORDER BY id LIMIT 1",
      { text: question.text },
    );

    const optionsJson = JSON.stringify({
      category: question.category,
      answer: question.answer,
      note: question.note,
    });
    const correctAnswerJson = JSON.stringify({ answer: question.answer });

    if (rows.length > 0) {
      await connection.execute(
        `UPDATE awareness_questions
         SET options_json = :optionsJson,
             correct_answer_json = :correctAnswerJson,
             status = 'ACTIVE',
             updated_at = UTC_TIMESTAMP(3)
         WHERE id = :id`,
        {
          id: rows[0].id,
          optionsJson,
          correctAnswerJson,
        },
      );
      updated += 1;
    } else {
      await connection.execute(
        `INSERT INTO awareness_questions
           (question_text, options_json, correct_answer_json, status)
         VALUES
           (:text, :optionsJson, :correctAnswerJson, 'ACTIVE')`,
        {
          text: question.text,
          optionsJson,
          correctAnswerJson,
        },
      );
      inserted += 1;
    }
  }

  await connection.commit();

  const [summary] = await connection.query(
    `SELECT COUNT(*) AS total,
            SUM(status = 'ACTIVE') AS active,
            COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(options_json, '$.category'))) AS categories
     FROM awareness_questions`,
  );
  const [samples] = await connection.query(
    `SELECT id, question_text,
            JSON_UNQUOTE(JSON_EXTRACT(options_json, '$.category')) AS category,
            JSON_EXTRACT(options_json, '$.answer') AS answer
     FROM awareness_questions
     WHERE status = 'ACTIVE'
     ORDER BY id
     LIMIT 3`,
  );

  console.log({ parsed: questions.length, inserted, updated, summary: summary[0] });
  console.log(samples);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
