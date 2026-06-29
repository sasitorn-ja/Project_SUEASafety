import { NextRequest, NextResponse } from "next/server";

import { canAccessApiDocs } from "@backend/components/core/api-docs-access";
import { buildOpenApiDocument } from "@backend/components/api-catalog/openapi";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await canAccessApiDocs())) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const baseUrl = request.nextUrl.origin;
  return NextResponse.json(buildOpenApiDocument(baseUrl));
}
