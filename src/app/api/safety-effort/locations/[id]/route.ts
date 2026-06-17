import { NextRequest } from "next/server";

import { apiError, apiOk, requireAdminApiSession, requireApiSession } from "@backend/components/core/api";
import {
  deleteSafetyEffortLocation,
  getSafetyEffortLocation,
  normalizeLocationType,
  updateSafetyEffortLocation,
} from "@backend/components/safety-effort/locations/repository";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parsePatchInput(raw: unknown) {
  if (!raw || typeof raw !== "object") throw new Error("Invalid location payload");
  const body = raw as Record<string, unknown>;
  const locationType = body.locationType || body.type ? normalizeLocationType(String(body.locationType || body.type)) : undefined;
  if (locationType === null) throw new Error("locationType must be PLANT, OFFICE, SITE, or CUSTOM");

  return {
    locationType,
    nameTh: body.nameTh || body.name ? String(body.nameTh || body.name).trim() : undefined,
    lat: body.lat === undefined ? undefined : Number(body.lat),
    lng: body.lng === undefined ? undefined : Number(body.lng),
    code: body.code === undefined ? undefined : body.code ? String(body.code).trim() : null,
    externalKey: body.externalKey === undefined ? undefined : body.externalKey ? String(body.externalKey).trim() : null,
    source: body.source === undefined ? undefined : body.source ? String(body.source).trim().toUpperCase() : null,
    nameEn: body.nameEn === undefined ? undefined : body.nameEn ? String(body.nameEn).trim() : null,
    provinceName: body.provinceName === undefined ? undefined : body.provinceName ? String(body.provinceName).trim() : null,
    districtName: body.districtName === undefined ? undefined : body.districtName ? String(body.districtName).trim() : null,
    status: body.status === undefined ? undefined : body.status ? String(body.status).trim().toUpperCase() : null,
    mapVisible: body.mapVisible === undefined ? undefined : body.mapVisible !== false,
    checkinEnabled: body.checkinEnabled === undefined ? undefined : body.checkinEnabled !== false,
    organizationId: body.organizationId === undefined ? undefined : body.organizationId ? String(body.organizationId) : null,
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { response } = await requireApiSession();
  if (response) return response;

  try {
    const { id } = await context.params;
    const location = await getSafetyEffortLocation(id);
    if (!location) return apiError(new Error("location_not_found"), 404);
    return apiOk({ location });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { id } = await context.params;
    const location = await updateSafetyEffortLocation(id, parsePatchInput(await request.json()));
    if (!location) return apiError(new Error("location_not_found"), 404);
    return apiOk({ location });
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { id } = await context.params;
    await deleteSafetyEffortLocation(id);
    return apiOk({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
