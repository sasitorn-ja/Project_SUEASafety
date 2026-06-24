import { NextRequest } from "next/server";

import { apiError, apiOk, requireAdminApiSession, requireApiSession } from "@backend/components/core/api";
import {
  listAssessmentChecklists,
  saveAssessmentChecklists,
} from "@backend/components/safety-effort/assessment-checklists/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requireApiSession();
  if (response) return response;

  try {
    return apiOk(await listAssessmentChecklists());
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();
    const checklists = body?.checklists || body?.value || body;
    if (!session?.user.id) throw new Error("missing_user_id");
    return apiOk(await saveAssessmentChecklists(checklists, session.user.id));
  } catch (error) {
    return apiError(error, 400);
  }
}
