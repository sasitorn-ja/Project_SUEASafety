import { NextRequest } from "next/server";

import { apiError, requireApiSession } from "@backend/components/core/api";

export const dynamic = "force-dynamic";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemma-4-31b-it:free";
const MAX_MESSAGES = 12;
const MAX_CHARS = 2000;
const MAX_IMAGE_CHARS = 1_400_000; // ~1MB base64 guard
const OUT_OF_SCOPE_REPLY =
  "ขออภัยค่ะ พี่ Safety+  ไม่มีข้อมูลเกี่ยวกับสิ่งที่คุณพี่ถามค่ะ ถ้าพี่มีคำถามเกี่ยวกับด้านความปลอดภัย  สามารถถาม Safety+ ได้เลยนะคะ ยินดีให้คำแนะนำค่ะ";

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
  "ตรวจรูป PPE/ความปลอดภัยเท่านั้น ถ้ารูปไม่เกี่ยวกับความปลอดภัยให้ตอบประโยคปฏิเสธมาตรฐาน",
  `ประโยคปฏิเสธมาตรฐาน: ${OUT_OF_SCOPE_REPLY}`,
  "ถ้าเกี่ยวข้อง ให้ตอบไทยสั้นๆ แบบนี้เท่านั้น:",
  "ชื่นชม\n1.\n2.\nควรปรับปรุง\n1.\n2.",
].join("\n");

function buildSystemPrompt(context: AssistantContext): string {
  const lines: string[] = [
    "คุณคือ Safety+ ผู้ช่วยด้านความปลอดภัยในแอป SUEA Safety",
    "ตอบไทย กระชับ สุภาพ เน้นความปลอดภัยก่อนเสมอ",
    "ตอบเฉพาะเรื่อง Safety Awareness, KYT, Pre-Trip/Fit-to-Drive, Work Permit, PPE, อุบัติเหตุ/ความเสี่ยง/เหตุฉุกเฉิน, คะแนน/รางวัล/อันดับ Safety Culture",
    `ถ้าคำถามไม่เกี่ยวกับความปลอดภัยหรือแอปนี้ ให้ตอบเท่านี้: ${OUT_OF_SCOPE_REPLY}`,
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

const SAFETY_TERMS = [
  "safety",
  "ppe",
  "kyt",
  "pre-trip",
  "pre trip",
  "fit-to-drive",
  "fit to drive",
  "work permit",
  "permit",
  "hazard",
  "risk",
  "incident",
  "accident",
  "near miss",
  "emergency",
  "evacuation",
  "fire",
  "chemical",
  "forklift",
  "helmet",
  "glove",
  "mask",
  "harness",
  "first aid",
  "toolbox",
  "audit",
  "leaderboard",
  "reward",
  "point",
  "ความปลอดภัย",
  "ปลอดภัย",
  "พีพีอี",
  "แต่งกาย",
  "หมวก",
  "รองเท้า",
  "แว่น",
  "ถุงมือ",
  "หน้ากาก",
  "เสื้อสะท้อนแสง",
  "เข็มขัดนิรภัย",
  "อุบัติเหตุ",
  "อันตราย",
  "ความเสี่ยง",
  "เสี่ยง",
  "ฉุกเฉิน",
  "อพยพ",
  "ไฟไหม้",
  "ถังดับเพลิง",
  "สารเคมี",
  "รถยก",
  "รถบรรทุก",
  "ปฐมพยาบาล",
  "ใบอนุญาตทำงาน",
  "ที่อับอากาศ",
  "ทำงานบนที่สูง",
  "ล็อกเอาต์",
  "แท็กเอาต์",
  "จป",
  "ตรวจหน้างาน",
  "หน้างาน",
  "คะแนน",
  "รางวัล",
  "อันดับ",
  "กิจกรรม",
  "วัฒนธรรมความปลอดภัย",
  "suea",
  "cpac",
];

function isSafetyRelatedText(text: string): boolean {
  const normalized = text.toLowerCase();
  return SAFETY_TERMS.some((term) => normalized.includes(term));
}

function latestUserText(messages: ChatMessage[]): string {
  return [...messages].reverse().find((message) => message.role === "user")?.content.trim() ?? "";
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
  let maxTokens = 380;
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
    maxTokens = 260;
    temperature = 0.3;
  } else {
    const messages = sanitizeMessages(body.messages ?? []);
    if (messages.length === 0 && !hasImage) {
      return apiError("empty_messages", 400);
    }
    const userText = latestUserText(messages);
    if (!isSafetyRelatedText(userText)) {
      return Response.json({ ok: true, data: { reply: OUT_OF_SCOPE_REPLY, model: "local-safety-guard" } });
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

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return apiError("OpenRouter ยังไม่ถูกตั้งค่า (ขาด OPENROUTER_API_KEY)", 503);
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
