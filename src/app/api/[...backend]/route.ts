import { NextRequest } from "next/server";

import { handleCatalogApiRoute } from "@backend/components/api-catalog/router";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ backend: string[] }>;
};

async function handle(request: NextRequest, context: RouteContext, method: string) {
  const { backend } = await context.params;
  return handleCatalogApiRoute(request, method, backend || []);
}

export function GET(request: NextRequest, context: RouteContext) {
  return handle(request, context, "GET");
}

export function POST(request: NextRequest, context: RouteContext) {
  return handle(request, context, "POST");
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return handle(request, context, "PATCH");
}

export function PUT(request: NextRequest, context: RouteContext) {
  return handle(request, context, "PUT");
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return handle(request, context, "DELETE");
}
