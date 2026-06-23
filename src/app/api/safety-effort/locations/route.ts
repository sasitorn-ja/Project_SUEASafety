import { NextRequest } from "next/server";

import { apiError, apiOk, requireAdminApiSession, requireApiSession } from "@backend/components/core/api";
import {
  createSafetyEffortLocation,
  listSafetyEffortLocations,
  normalizeLocationType,
  parseLocationInput,
} from "@backend/components/safety-effort/locations/repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { response } = await requireApiSession();
  if (response) return response;

  try {
    const type = normalizeLocationType(request.nextUrl.searchParams.get("type"));
    const search = request.nextUrl.searchParams.get("search");
    const source = request.nextUrl.searchParams.get("source");
    const limit = Number(request.nextUrl.searchParams.get("limit") || 200);
    const locations = await listSafetyEffortLocations({ type, search, source, limit });
    return apiOk({ items: locations, locations });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const input = parseLocationInput(await request.json(), session?.user.id);
    const location = await createSafetyEffortLocation(input);
    return apiOk({ location }, { status: 201 });
  } catch (error) {
    return apiError(error, 400);
  }
}
