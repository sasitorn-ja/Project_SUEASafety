import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { queryRows, withTransaction } from "@backend/components/core/db";

export type AssessmentChecklistLocationType = "factory" | "office" | "site";

type ChecklistQuestionInput = {
  id?: string;
  title?: string;
  guideTitle?: string | false;
  guidelines?: string[];
  format?: "original" | "text_box";
  image?: string;
  imageMediaId?: string;
  active?: boolean;
};

export type AssessmentChecklistCollectionInput = Record<
  AssessmentChecklistLocationType,
  ChecklistQuestionInput[]
>;

type TemplateRow = RowDataPacket & {
  id: string | number;
  code: string;
  name: string;
  version: number | string;
  status: string;
};

type QuestionRow = RowDataPacket & {
  id: string | number;
  template_id: string | number;
  question_code: string;
  question_text: string;
  answer_type: string;
  options_json: string | Record<string, unknown> | null;
  is_required: 0 | 1 | boolean;
  sort_order: number | string;
};

const LOCATION_TYPES: AssessmentChecklistLocationType[] = ["factory", "office", "site"];

const TEMPLATE_META: Record<AssessmentChecklistLocationType, { code: string; name: string }> = {
  factory: { code: "SAFETY_CHECKLIST_FACTORY", name: "โรงงาน" },
  office: { code: "SAFETY_CHECKLIST_OFFICE", name: "สำนักงาน" },
  site: { code: "SAFETY_CHECKLIST_SITE", name: "Site งาน" },
};

function parseOptions(value: QuestionRow["options_json"]) {
  if (!value) return {};
  if (typeof value === "object") return value as Record<string, unknown>;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function sanitizeQuestion(question: ChecklistQuestionInput, index: number) {
  const title = String(question.title || `หัวข้อ ${index + 1}`).trim();
  const id = String(question.id || title || `question-${index + 1}`)
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50);

  return {
    id: id || `question-${index + 1}`,
    title: title || `หัวข้อ ${index + 1}`,
    guideTitle: question.guideTitle === false ? false : question.guideTitle ? String(question.guideTitle) : undefined,
    guidelines: Array.isArray(question.guidelines)
      ? question.guidelines
          .map((line: any) => {
            if (!line) return "";
            if (typeof line === "object") {
              return String(line.text || line.guideline || line.value || JSON.stringify(line));
            }
            return String(line);
          })
          .filter(Boolean)
      : [],
    format: question.format === "text_box" ? "text_box" : "original",
    image: question.image ? String(question.image) : undefined,
    imageMediaId: question.imageMediaId ? String(question.imageMediaId) : undefined,
    active: question.active === false ? false : true,
  };
}

function questionFromRow(row: QuestionRow) {
  const options = parseOptions(row.options_json);
  return {
    id: row.question_code,
    title: row.question_text,
    guideTitle: options.guideTitle === false ? false : options.guideTitle ? String(options.guideTitle) : undefined,
    guidelines: Array.isArray(options.guidelines)
      ? options.guidelines
          .map((line: any) => {
            if (!line) return "";
            if (typeof line === "object") {
              return String(line.text || line.guideline || line.value || JSON.stringify(line));
            }
            return String(line);
          })
          .filter(Boolean)
      : [],
    format: row.answer_type === "TEXT_BOX" ? "text_box" : "original",
    image: options.image ? String(options.image) : undefined,
    imageMediaId: options.imageMediaId ? String(options.imageMediaId) : undefined,
    active: options.active === false ? false : true,
  };
}

export async function listAssessmentChecklists() {
  const templates = await queryRows<TemplateRow>(
    `
      SELECT id, code, name, version, status
      FROM assessment_templates
      WHERE code IN (:codes) AND deleted_at IS NULL
      ORDER BY code, version DESC, id DESC
    `,
    { codes: LOCATION_TYPES.map((type) => TEMPLATE_META[type].code) },
  );

  const latestTemplateByCode = new Map<string, TemplateRow>();
  for (const template of templates) {
    if (!latestTemplateByCode.has(template.code)) latestTemplateByCode.set(template.code, template);
  }

  const templateIds = Array.from(latestTemplateByCode.values()).map((template) => String(template.id));
  const questionRows = templateIds.length
    ? await queryRows<QuestionRow>(
        `
          SELECT id, template_id, question_code, question_text, answer_type, options_json, is_required, sort_order
          FROM assessment_questions
          WHERE template_id IN (:templateIds)
          ORDER BY template_id, sort_order, id
        `,
        { templateIds },
      )
    : [];

  const questionsByTemplateId = new Map<string, QuestionRow[]>();
  for (const question of questionRows) {
    const templateId = String(question.template_id);
    questionsByTemplateId.set(templateId, [...(questionsByTemplateId.get(templateId) || []), question]);
  }

  const checklists = {} as Record<AssessmentChecklistLocationType, ReturnType<typeof questionFromRow>[]>;
  const templatesOut = {} as Record<AssessmentChecklistLocationType, Record<string, unknown> | null>;

  for (const type of LOCATION_TYPES) {
    const meta = TEMPLATE_META[type];
    const template = latestTemplateByCode.get(meta.code);
    templatesOut[type] = template
      ? {
          id: String(template.id),
          code: template.code,
          name: template.name,
          version: Number(template.version),
          status: template.status,
        }
      : null;
    checklists[type] = template
      ? (questionsByTemplateId.get(String(template.id)) || []).map(questionFromRow)
      : [];
  }

  return { checklists, templates: templatesOut };
}

export async function saveAssessmentChecklists(
  rawChecklists: AssessmentChecklistCollectionInput,
  userId: string | number,
) {
  const savedTemplateIds: Record<AssessmentChecklistLocationType, string> = {
    factory: "",
    office: "",
    site: "",
  };

  await withTransaction(async (connection) => {
    for (const type of LOCATION_TYPES) {
      const meta = TEMPLATE_META[type];
      const questions = (Array.isArray(rawChecklists[type]) ? rawChecklists[type] : []).map(sanitizeQuestion);

      const [templateRows] = await connection.execute<TemplateRow[]>(
        `
          SELECT id
          FROM assessment_templates
          WHERE code = :code AND deleted_at IS NULL
          ORDER BY version DESC, id DESC
          LIMIT 1
          FOR UPDATE
        `,
        { code: meta.code },
      );

      let templateId = templateRows[0]?.id ? String(templateRows[0].id) : "";
      if (templateId) {
        await connection.execute<ResultSetHeader>(
          `
            UPDATE assessment_templates
            SET name = :name, status = 'PUBLISHED', updated_at = UTC_TIMESTAMP(3)
            WHERE id = :templateId
          `,
          { templateId, name: meta.name },
        );
        await connection.execute<ResultSetHeader>(
          "DELETE FROM assessment_questions WHERE template_id = :templateId",
          { templateId },
        );
      } else {
        const [result] = await connection.execute<ResultSetHeader>(
          `
            INSERT INTO assessment_templates (code, name, version, status, created_by)
            VALUES (:code, :name, 1, 'PUBLISHED', :createdBy)
          `,
          { code: meta.code, name: meta.name, createdBy: userId },
        );
        templateId = String(result.insertId);
      }

      savedTemplateIds[type] = templateId;

      for (const [index, question] of questions.entries()) {
        await connection.execute<ResultSetHeader>(
          `
            INSERT INTO assessment_questions (
              template_id,
              question_code,
              question_text,
              answer_type,
              options_json,
              is_required,
              sort_order
            ) VALUES (
              :templateId,
              :questionCode,
              :questionText,
              :answerType,
              :optionsJson,
              1,
              :sortOrder
            )
          `,
          {
            templateId,
            questionCode: question.id,
            questionText: question.title,
            answerType: question.format === "text_box" ? "TEXT_BOX" : "CHOICE",
            optionsJson: JSON.stringify({
              guideTitle: question.guideTitle,
              guidelines: question.guidelines,
              format: question.format,
              image: question.image,
              imageMediaId: question.imageMediaId,
              active: question.active,
            }),
            sortOrder: index + 1,
          },
        );
      }
    }
  });

  const saved = await listAssessmentChecklists();
  return { ...saved, templateIds: savedTemplateIds };
}
