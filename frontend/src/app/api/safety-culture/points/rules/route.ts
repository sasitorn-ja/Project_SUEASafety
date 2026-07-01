import { NextRequest, NextResponse } from "next/server";

import { listPointRules, savePointRule } from "@backend/components/points/repository";
import { type SafetyPointAction } from "@backend/components/points/rules";

export const dynamic = "force-dynamic";

export async function GET() {
  const rules = await listPointRules();
  return NextResponse.json({
    ok: true,
    data: {
      rules,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const code = String(body?.code || "") as SafetyPointAction;
    const points = Number(body?.points);
    const dailyLimit = body?.dailyLimit === null || body?.dailyLimit === undefined || body?.dailyLimit === ""
      ? null
      : Number(body.dailyLimit);
    const minCommentLength = body?.minCommentLength === null || body?.minCommentLength === undefined || body?.minCommentLength === ""
      ? null
      : Number(body.minCommentLength);

    if (!code) {
      return NextResponse.json({ ok: false, error: "missing_code" }, { status: 400 });
    }
    if (!Number.isFinite(points) || points < 0) {
      return NextResponse.json({ ok: false, error: "invalid_points" }, { status: 400 });
    }
    if (dailyLimit !== null && (!Number.isFinite(dailyLimit) || dailyLimit < 0)) {
      return NextResponse.json({ ok: false, error: "invalid_daily_limit" }, { status: 400 });
    }
    if (minCommentLength !== null && (!Number.isFinite(minCommentLength) || minCommentLength < 0)) {
      return NextResponse.json({ ok: false, error: "invalid_min_comment_length" }, { status: 400 });
    }

    const rule = await savePointRule({
      id: body?.id ? String(body.id) : null,
      code,
      points,
      status: body?.status ? String(body.status) : "ACTIVE",
      dailyLimit,
      minCommentLength,
      awardPostOwner: typeof body?.awardPostOwner === "boolean" ? body.awardPostOwner : undefined,
    });

    return NextResponse.json({ ok: true, data: { rule } }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "save_failed" },
      { status: 500 },
    );
  }
}
