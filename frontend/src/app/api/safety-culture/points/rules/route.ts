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

    if (!code) {
      return NextResponse.json({ ok: false, error: "missing_code" }, { status: 400 });
    }
    if (!Number.isFinite(points) || points < 0) {
      return NextResponse.json({ ok: false, error: "invalid_points" }, { status: 400 });
    }

    const rule = await savePointRule({
      id: body?.id ? String(body.id) : null,
      code,
      points,
      status: body?.status ? String(body.status) : "ACTIVE",
    });

    return NextResponse.json({ ok: true, data: { rule } }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "save_failed" },
      { status: 500 },
    );
  }
}
