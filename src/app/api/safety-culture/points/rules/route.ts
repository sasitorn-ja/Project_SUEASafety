import { NextResponse } from "next/server";

import { SAFETY_POINT_RULE_LABELS, SAFETY_POINT_RULES } from "@backend/components/points/rules";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      rules: SAFETY_POINT_RULES,
      labels: SAFETY_POINT_RULE_LABELS,
    },
  });
}
