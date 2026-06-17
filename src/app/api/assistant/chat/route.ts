import { NextRequest } from "next/server";

import { apiError, requireApiSession } from "@backend/components/core/api";

export const dynamic = "force-dynamic";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemma-4-31b-it:free";
const MAX_MESSAGES = 12;
const MAX_CHARS = 2000;
const MAX_IMAGE_CHARS = 1_400_000; // ~1MB base64 guard

type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

type AssistantContext = {
  page?: string;
  points?: number;
  awarenessDoneToday?: boolean;
  rank?: number | null;
  team?: string | null;
};

type RequestBody = {
  messages?: ChatMessage[];
  context?: AssistantContext;
  image?: string;
  mode?: "chat" | "ppe";
};

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
type OutboundMessage = { role: "user" | "assistant"; content: string | Array<TextPart | ImagePart> };

const PPE_PROMPT = [
  "คุณคือ \"น้องวางใจ\" ผู้ช่วยตรวจความปลอดภัยในการแต่งกาย",
  "วิเคราะห์ภาพที่ส่งให้ว่าแต่งกายด้วยชุดความปลอดภัยส่วนบุคคล (PPE) ครบถ้วนหรือไม่",
  "ให้ตอบกลับด้วยการชื่นชมในสิ่งที่ทำถูกต้องตามมาตรฐาน และสิ่งที่ควรปรับปรุง อย่างละ 2-3 ข้อ",
  "ตอบเป็นภาษาไทย และใช้รูปแบบนี้เท่านั้น ห้ามมีหัวข้อหรือสัญลักษณ์พิเศษอื่นเพิ่ม:",
  "",
  "ชื่นชม",
  "1.",
  "2.",
  "3.",
  "ควรปรับปรุง",
  "1.",
  "2.",
].join("\n");

function buildSystemPrompt(context: AssistantContext): string {
  const lines: string[] = [
    "คุณคือ \"น้องวางใจ\" ผู้ช่วย AI ด้านความปลอดภัย (Safety Buddy) ในแอป SUEA Safety / CPAC Safety",
    "บทบาท: เป็นเพื่อนคู่คิดที่อบอุ่น ให้กำลังใจ และช่วยพนักงานทำงานอย่างปลอดภัย",
    "ขอบเขตหลักที่ช่วยได้: Safety Awareness ประจำวัน, KYT (Kiken Yochi Training), Pre-Trip / Fit-to-Drive, Work Permit, การสะสมคะแนนและแลกรางวัล, การดูอันดับ (Leaderboard) และวัฒนธรรมความปลอดภัย (Safety Culture)",
    "แนวทางการตอบ: ตอบเป็นภาษาไทยที่สุภาพ กระชับ เข้าใจง่าย ใช้คำพูดให้กำลังใจ และเน้นความปลอดภัยมาก่อนเสมอ",
    "ถ้าผู้ใช้ดูเครียดหรือไม่พร้อมทำงาน ให้รับฟังอย่างเห็นอกเห็นใจ และแนะนำให้หยุดพักหรือปรึกษาหัวหน้างานเมื่อจำเป็น อย่ากดดันให้ฝืนทำงานที่เสี่ยง",
    "ถ้าถูกถามเรื่องที่อยู่นอกขอบเขตความปลอดภัย/แอป ให้ตอบสั้น ๆ อย่างสุภาพและชวนกลับมาที่เรื่องความปลอดภัย",
    "อย่าแต่งข้อมูลคะแนนหรืออันดับเกินจากบริบทที่ได้รับ",
  ];

  const ctx: string[] = [];
  if (typeof context.points === "number") ctx.push(`คะแนนปัจจุบันของผู้ใช้: ${context.points} แต้ม`);
  if (typeof context.awarenessDoneToday === "boolean") {
    ctx.push(`สถานะ Safety Awareness วันนี้: ${context.awarenessDoneToday ? "ทำครบแล้ว" : "ยังไม่ได้ทำ"}`);
  }
  if (context.rank) ctx.push(`อันดับของผู้ใช้: ${context.rank}`);
  if (context.team) ctx.push(`ทีม: ${context.team}`);
  if (context.page) ctx.push(`หน้าจอที่ผู้ใช้กำลังเปิด: ${context.page}`);
  if (ctx.length > 0) {
    lines.push("", "บริบทผู้ใช้ปัจจุบัน:", ...ctx.map((c) => `- ${c}`));
  }

  return lines.join("\n");
}

function sanitizeMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
}

function isValidImage(image: unknown): image is string {
  return (
    typeof image === "string" &&
    image.startsWith("data:image/") &&
    image.length <= MAX_IMAGE_CHARS
  );
}

export async function POST(request: NextRequest) {
  const { response } = await requireApiSession();
  if (response) return response;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return apiError("OpenRouter ยังไม่ถูกตั้งค่า (ขาด OPENROUTER_API_KEY)", 503);
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return apiError("invalid_json", 400);
  }

  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const hasImage = isValidImage(body.image);
  if (body.image && !hasImage) {
    return apiError("invalid_image", 400);
  }

  let outboundMessages: OutboundMessage[];
  let maxTokens = 600;
  let temperature = 0.6;

  if (body.mode === "ppe") {
    // PPE photo analysis — single-shot, requires an image. Keep it short for low cost.
    if (!hasImage) {
      return apiError("image_required", 400);
    }
    outboundMessages = [
      {
        role: "user",
        content: [
          { type: "text", text: PPE_PROMPT },
          { type: "image_url", image_url: { url: body.image as string } },
        ],
      },
    ];
    maxTokens = 400;
    temperature = 0.3;
  } else {
    const messages = sanitizeMessages(body.messages ?? []);
    if (messages.length === 0 && !hasImage) {
      return apiError("empty_messages", 400);
    }

    const systemPrompt = buildSystemPrompt(body.context ?? {});
    // Gemma instruct models on OpenRouter do not accept a separate "system" role,
    // so fold the system prompt into the first user turn for compatibility.
    const firstUserIndex = messages.findIndex((m) => m.role === "user");
    const lastUserIndex = messages.map((m) => m.role).lastIndexOf("user");

    outboundMessages = messages.map((m, index): OutboundMessage => {
      const text = index === firstUserIndex ? `${systemPrompt}\n\n---\n\nผู้ใช้: ${m.content}` : m.content;
      if (hasImage && index === lastUserIndex) {
        return {
          role: m.role,
          content: [
            { type: "text", text },
            { type: "image_url", image_url: { url: body.image as string } },
          ],
        };
      }
      return { role: m.role, content: text };
    });

    // Image with no accompanying text message.
    if (hasImage && lastUserIndex === -1) {
      outboundMessages.push({
        role: "user",
        content: [
          { type: "text", text: `${systemPrompt}\n\n---\n\nผู้ใช้ส่งรูปมาให้ช่วยดู` },
          { type: "image_url", image_url: { url: body.image as string } },
        ],
      });
    }
  }

  try {
    const upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_BASE_URL || "https://safety.cipcloud.net",
        "X-Title": "SUEA Safety - Nong Wangjai",
      },
      body: JSON.stringify({
        model,
        messages: outboundMessages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return apiError(`openrouter_error: ${upstream.status} ${detail.slice(0, 300)}`, 502);
    }

    const data = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return apiError("empty_reply", 502);
    }

    return Response.json({ ok: true, data: { reply, model } });
  } catch (error) {
    return apiError(error, 500);
  }
}
