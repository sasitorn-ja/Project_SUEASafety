import { apiOk } from "@backend/components/core/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiOk({
    module: "safety-effort",
    endpoints: [
      {
        method: "GET",
        path: "/api/components/safety-effort/locations",
        description: "List real locations from CPAC_Safety.locations",
        query: ["type=PLANT|OFFICE|SITE|CUSTOM", "search=<text>", "limit=<number>"],
      },
      {
        method: "POST",
        path: "/api/components/safety-effort/locations",
        description: "Create a location. Admin role required.",
      },
      {
        method: "GET/PATCH/DELETE",
        path: "/api/components/safety-effort/locations/[id]",
        description: "Read, update, or soft-delete one location. Write operations require admin role.",
      },
    ],
  });
}
