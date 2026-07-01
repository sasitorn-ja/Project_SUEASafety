import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiSession, requireApiSession } from "@backend/components/core/api";
import { API_CATALOG_ROUTES, type ApiCatalogRoute } from "@backend/components/api-catalog/registry";
import { handlePersistedCatalogRoute } from "@backend/components/api-catalog/persistence";
import { createCheckin, getCheckin, listCheckins } from "@backend/components/checkins/repository";
import { awardPoints, getPointBalance, listPointRules, listPointTransactions } from "@backend/components/points/repository";
import { createAwarenessAttempt } from "@backend/components/safety-awareness/repository";
import { isLocationHubDatabaseConfigured } from "@backend/components/core/location-hub-db";
import {
  createSafetyEffortLocation,
  deleteSafetyEffortLocation,
  getSafetyEffortLocation,
  listSafetyEffortLocations,
  normalizeLocationType,
  parseLocationInput,
  updateSafetyEffortLocation,
  type SafetyEffortLocationType,
} from "@backend/components/safety-effort/locations/repository";
import { listLocationHubOffices, listLocationHubPlants, searchLocationHubSites } from "@backend/components/safety-effort/locations/location-hub-search";
import {
  createComment,
  createPost,
  deleteComment,
  deletePost,
  deleteCommentReaction,
  deleteReaction,
  getPost,
  listComments,
  listPosts,
  setReaction,
  setCommentReaction,
  updateComment,
  updatePost,
} from "@backend/components/safety-culture/posts/repository";

type RouteMatch = {
  route: ApiCatalogRoute;
  params: Record<string, string>;
};

const LIST_HINTS = [
  "/api/locations/",
  "/api/checkins",
  "/api/safety-effort/assessment-runs",
  "/api/safety-effort/reports",
  "/api/safety-culture/posts",
  "/api/safety-culture/events",
  "/api/safety-culture/rewards",
  "/api/notifications",
  "/api/users",
  "/api/organizations",
  "/api/audit-logs",
];

function splitPath(path: string) {
  return path.replace(/\/+$/, "").split("/").filter(Boolean);
}

function matchPattern(pattern: string, path: string) {
  const patternParts = splitPath(pattern);
  const pathParts = splitPath(path);
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index];
    const pathPart = pathParts[index];
    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
      continue;
    }
    if (patternPart !== pathPart) return null;
  }

  return params;
}

function findRoute(method: string, path: string): RouteMatch | null {
  for (const route of API_CATALOG_ROUTES) {
    if (route.method !== method) continue;
    const params = matchPattern(route.path, path);
    if (params) return { route, params };
  }
  return null;
}

function queryObject(request: NextRequest) {
  return Object.fromEntries(request.nextUrl.searchParams.entries());
}

function isPublicRoute(auth: string) {
  return auth.includes("Public") || auth === "No";
}

function requiresAdmin(auth: string) {
  if (isPublicRoute(auth)) return false;
  if (auth === "Admin") return true;
  if (auth.startsWith("Admin")) return true;
  if (auth === "System/Admin") return true;
  return false;
}

async function authorize(route: ApiCatalogRoute) {
  if (isPublicRoute(route.auth)) return { session: null, response: null };

  const result = requiresAdmin(route.auth)
    ? await requireAdminApiSession()
    : await requireApiSession();

  return result;
}

async function readBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const fields: Record<string, string> = {};
    const files: Array<{ field: string; name: string; type: string; size: number; bytes: Uint8Array }> = [];

    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        fields[key] = value;
      } else {
        const bytes = new Uint8Array(await value.arrayBuffer());
        files.push({
          field: key,
          name: value.name,
          type: value.type,
          size: value.size,
          bytes,
        });
      }
    }

    return { contentType: "multipart/form-data", fields, files };
  }

  if (contentType.includes("application/json")) {
    return { contentType: "application/json", json: await request.json().catch(() => null) };
  }

  const text = await request.text().catch(() => "");
  return { contentType: contentType || "text/plain", text: text.slice(0, 4000) };
}

function responseShape(route: ApiCatalogRoute, method: string, params: Record<string, string>, request: NextRequest, body?: unknown) {
  const path = request.nextUrl.pathname;
  const isList = method === "GET" && LIST_HINTS.some((hint) => route.path.startsWith(hint)) && !route.path.includes("/:id");

  if (path === "/api/health") {
    return {
      ok: true,
      data: {
        status: "ok",
        service: "suea-safety-api",
        checkedAt: new Date().toISOString(),
      },
    };
  }

  if (path === "/api/version") {
    return {
      ok: true,
      data: {
        name: "suea-safety",
        version: process.env.npm_package_version || "1.0.0",
        apiCatalogRoutes: API_CATALOG_ROUTES.length,
      },
    };
  }

  if (isList) {
    return {
      ok: true,
      data: {
        items: [],
        page: Number(request.nextUrl.searchParams.get("page") || 1),
        pageSize: Number(request.nextUrl.searchParams.get("pageSize") || request.nextUrl.searchParams.get("limit") || 50),
        nextCursor: null,
        route: catalogPayload(route, params, request),
      },
    };
  }

  if (method === "GET") {
    return {
      ok: true,
      data: {
        item: null,
        route: catalogPayload(route, params, request),
      },
    };
  }

  return {
    ok: true,
    data: {
      accepted: true,
      id: params.id || `draft_${Date.now()}`,
      route: catalogPayload(route, params, request),
      received: body,
      persistence: route.status === "Existing" ? "implemented_by_specific_route_or_backend_component" : "contract_ready_pending_domain_persistence",
    },
  };
}

function catalogPayload(route: ApiCatalogRoute, params: Record<string, string>, request: NextRequest) {
  return {
    module: route.module,
    method: route.method,
    path: route.path,
    documentedPath: route.documentedPath,
    purpose: route.purpose,
    caller: route.caller,
    whenCalled: route.whenCalled,
    auth: route.auth,
    pagination: route.pagination,
    responseSizeRisk: route.responseSizeRisk,
    status: route.status,
    notes: route.notes,
    params,
    query: queryObject(request),
  };
}

export async function handleCatalogApiRoute(request: NextRequest, method: string, segments: string[]) {
  const path = `/api/${segments.join("/")}`;

  if (path === "/api/catalog" && method === "GET") {
    return NextResponse.json({
      ok: true,
      data: {
        routes: API_CATALOG_ROUTES,
        count: API_CATALOG_ROUTES.length,
      },
    });
  }

  const match = findRoute(method, path);
  if (!match) {
    return NextResponse.json(
      {
        ok: false,
        error: "api_route_not_found",
        data: {
          method,
          path,
          catalog: "/api/catalog",
        },
      },
      { status: 404 },
    );
  }

  const auth = await authorize(match.route);
  if (auth.response) return auth.response;

  const body = ["POST", "PATCH", "PUT", "DELETE"].includes(method)
    ? await readBody(request)
    : undefined;

  const concreteResponse = await tryHandleConcreteRoute(request, method, match, auth.session, body);
  if (concreteResponse) return concreteResponse;

  const persistedResponse = await handlePersistedCatalogRoute(request, method, match, auth.session, body);
  if (persistedResponse) return persistedResponse;

  return NextResponse.json(
    {
      ok: false,
      error: "api_route_not_implemented",
      data: catalogPayload(match.route, match.params, request),
    },
    { status: 501 },
  );
}

function jsonData(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

function jsonError(error: unknown, status = 400) {
  return NextResponse.json(
    { ok: false, error: error instanceof Error ? error.message : String(error || "error") },
    { status },
  );
}

function jsonBody(body: unknown) {
  if (!body || typeof body !== "object" || !("json" in body)) return {};
  return (body as { json?: unknown }).json && typeof (body as { json?: unknown }).json === "object"
    ? ((body as { json: Record<string, unknown> }).json)
    : {};
}

function optionalScalar(value: unknown): string | number | null {
  if (typeof value === "string" || typeof value === "number") return value;
  return null;
}

function locationTypeForPath(path: string): SafetyEffortLocationType | null {
  if (path === "/api/locations/plants") return "PLANT";
  if (path === "/api/locations/offices") return "OFFICE";
  if (path === "/api/locations/sites") return "SITE";
  if (path === "/api/locations/custom") return "CUSTOM";
  return null;
}

async function listLocationsWithPlantBootstrap(
  options: Parameters<typeof listSafetyEffortLocations>[0],
) {
  if (options.source?.trim().toUpperCase() === "ADMIN") {
    return listSafetyEffortLocations(options);
  }
  return listSafetyEffortLocations({ ...options, source: "ADMIN" });
}

function mergeLocations(...groups: Array<Array<{ id: string } & Record<string, unknown>>>) {
  const merged = new Map<string, { id: string } & Record<string, unknown>>();
  groups.flat().forEach((item) => merged.set(item.id, item));
  return Array.from(merged.values());
}

async function tryHandleConcreteRoute(
  request: NextRequest,
  method: string,
  match: RouteMatch,
  session: Awaited<ReturnType<typeof requireApiSession>>["session"],
  body: unknown,
) {
  const path = request.nextUrl.pathname;
  const query = request.nextUrl.searchParams;
  const userId = session?.user?.id;
  const nearPoint = {
    lat: query.has("lat") ? Number(query.get("lat")) : null,
    lng: query.has("lng") ? Number(query.get("lng")) : null,
  };

  try {
    if (method === "GET" && path === "/api/locations/offices" && isLocationHubDatabaseConfigured()) {
      const [masterLocations, customLocations] = await Promise.all([
        listLocationHubOffices({
          search: query.get("search") || query.get("q") || "",
          limit: Number(query.get("limit") || query.get("pageSize") || 200),
          near: nearPoint,
        }),
        listSafetyEffortLocations({
          type: "OFFICE",
          source: "ADMIN",
          search: query.get("search") || query.get("q"),
          limit: Number(query.get("limit") || query.get("pageSize") || 200),
        }),
      ]);
      const locations = mergeLocations(masterLocations, customLocations);
      return jsonData({ items: locations, locations });
    }
    if (method === "GET" && path === "/api/locations/plants" && isLocationHubDatabaseConfigured()) {
      const [masterLocations, customLocations] = await Promise.all([
        listLocationHubPlants({
          search: query.get("search") || query.get("q") || "",
          limit: Number(query.get("limit") || query.get("pageSize") || 1000),
          near: nearPoint,
        }),
        listSafetyEffortLocations({
          type: "PLANT",
          source: "ADMIN",
          search: query.get("search") || query.get("q"),
          limit: Number(query.get("limit") || query.get("pageSize") || 1000),
        }),
      ]);
      const locations = mergeLocations(masterLocations, customLocations);
      return jsonData({ items: locations, locations });
    }
    if (method === "GET" && path === "/api/locations/sites" && isLocationHubDatabaseConfigured()) {
      const search = query.get("search") || query.get("q") || "";
      const [masterLocations, customLocations] = await Promise.all([
        searchLocationHubSites(search, Number(query.get("limit") || query.get("pageSize") || 30), nearPoint),
        listSafetyEffortLocations({
          type: "SITE",
          source: "ADMIN",
          search,
          limit: Number(query.get("limit") || query.get("pageSize") || 30),
        }),
      ]);
      const locations = mergeLocations(masterLocations, customLocations);
      return jsonData({ items: locations, locations, minimumSearchLength: 3 });
    }
    if (method === "GET" && path === "/api/locations/search"
      && normalizeLocationType(query.get("type")) === "SITE" && isLocationHubDatabaseConfigured()) {
      const search = query.get("q") || query.get("search") || "";
      const [masterLocations, customLocations] = await Promise.all([
        searchLocationHubSites(search, Number(query.get("limit") || 30), nearPoint),
        listSafetyEffortLocations({ type: "SITE", source: "ADMIN", search, limit: Number(query.get("limit") || 30) }),
      ]);
      const locations = mergeLocations(masterLocations, customLocations);
      return jsonData({ items: locations, locations, minimumSearchLength: 3 });
    }
    const typeFromPath = locationTypeForPath(path);
    if (method === "GET" && typeFromPath) {
      const locations = await listLocationsWithPlantBootstrap({
        type: typeFromPath,
        search: query.get("search") || query.get("q"),
        limit: Number(query.get("pageSize") || query.get("limit") || 50),
      });
      return jsonData({ items: locations, locations });
    }

    if (method === "GET" && path === "/api/locations/search") {
      const searchType = normalizeLocationType(query.get("type"));
      const search = query.get("q") || query.get("search") || "";
      const limit = Number(query.get("limit") || 30);

      if (!searchType && isLocationHubDatabaseConfigured()) {
        const [customLocations, plantLocations, officeLocations, siteLocations] = await Promise.all([
          listLocationsWithPlantBootstrap({
            search,
            limit,
          }),
          listLocationHubPlants({ search, limit, near: nearPoint }),
          listLocationHubOffices({ search, limit, near: nearPoint }),
          search.trim().length >= 3 ? searchLocationHubSites(search, limit, nearPoint) : Promise.resolve([]),
        ]);
        const locations = mergeLocations(customLocations, plantLocations, officeLocations, siteLocations);
        return jsonData({ items: locations, locations, minimumSearchLength: 3 });
      }

      const locations = searchType === "PLANT" && isLocationHubDatabaseConfigured()
        ? mergeLocations(
            await listLocationHubPlants({ search, limit: Number(query.get("limit") || 20), near: nearPoint }),
            await listSafetyEffortLocations({ type: "PLANT", source: "ADMIN", search, limit: Number(query.get("limit") || 20) }),
          )
        : searchType === "OFFICE" && isLocationHubDatabaseConfigured()
          ? mergeLocations(
              await listLocationHubOffices({ search, limit: Number(query.get("limit") || 20), near: nearPoint }),
              await listSafetyEffortLocations({ type: "OFFICE", source: "ADMIN", search, limit: Number(query.get("limit") || 20) }),
            )
          : await listLocationsWithPlantBootstrap({
              type: searchType,
              search,
              limit: Number(query.get("limit") || 20),
            });
      return jsonData({ items: locations, locations });
    }

    if (method === "GET" && path === "/api/locations/map") {
      const requestedType = normalizeLocationType(query.get("type"));
      const limit = Number(query.get("limit") || 500);
      const customLocations = await listLocationsWithPlantBootstrap({
        type: requestedType,
        search: query.get("search"),
        limit,
      });
      const masterLocations = !isLocationHubDatabaseConfigured()
        ? []
        : requestedType === "OFFICE"
          ? await listLocationHubOffices({ search: query.get("search") || "", limit, near: nearPoint })
          : requestedType === "SITE"
            ? await searchLocationHubSites(query.get("search") || query.get("q") || "", limit, nearPoint)
            : await listLocationHubPlants({ search: query.get("search") || "", limit, near: nearPoint });
      const locations = mergeLocations(customLocations, masterLocations);
      const bbox = query.get("bbox")?.split(",").map(Number);
      const bounded = bbox?.length === 4 && bbox.every(Number.isFinite)
        ? locations.filter((location) => {
            const lng = typeof location.lng === "number" ? location.lng : null;
            const lat = typeof location.lat === "number" ? location.lat : null;
            return lng !== null && lat !== null && lng >= bbox[0] && lat >= bbox[1] && lng <= bbox[2] && lat <= bbox[3];
          })
        : locations;
      return jsonData({ items: bounded, locations: bounded });
    }

    if (path === "/api/locations" && method === "POST") {
      const location = await createSafetyEffortLocation(parseLocationInput(jsonBody(body), userId));
      return jsonData({ location }, { status: 201 });
    }

    if (match.route.path === "/api/locations/:id") {
      if (method === "GET") {
        const location = await getSafetyEffortLocation(match.params.id);
        return location ? jsonData({ location }) : jsonError("location_not_found", 404);
      }
      if (method === "PATCH") {
        const location = await updateSafetyEffortLocation(match.params.id, parseLocationInput({ ...jsonBody(body), locationType: jsonBody(body).locationType || jsonBody(body).type || "CUSTOM" }));
        return location ? jsonData({ location }) : jsonError("location_not_found", 404);
      }
      if (method === "DELETE") {
        await deleteSafetyEffortLocation(match.params.id);
        return jsonData({ deleted: true });
      }
    }

    if (path === "/api/checkins" && method === "POST" && userId) {
      const input = jsonBody(body);
      const checkin = await createCheckin({
        userId,
        locationId: String(input.locationId || input.selectedLocationId || ""),
        locationCode: optionalScalar(input.locationCode || input.code || input.tag)?.toString() || null,
        locationName: optionalScalar(input.locationName || input.name || input.selectedLocationName)?.toString() || null,
        selectedLocationType: optionalScalar(input.selectedLocationType || input.locationType || input.type)?.toString() || null,
        selectedLocationSource: optionalScalar(input.selectedLocationSource || input.source)?.toString() || null,
        actualLat: Number(input.actualLat ?? input.lat),
        actualLng: Number(input.actualLng ?? input.lng),
        actualAccuracyM: input.actualAccuracyM === undefined ? null : Number(input.actualAccuracyM),
        locationSource: input.locationSource ? String(input.locationSource) : "GPS",
        deviceMetadata: input.deviceMetadata || null,
      });
      return jsonData({ checkin }, { status: 201 });
    }

    if ((path === "/api/checkins" || path === "/api/checkins/me") && method === "GET") {
      const result = await listCheckins({
        userId: path === "/api/checkins/me" ? userId || undefined : query.get("userId") || undefined,
        locationId: query.get("locationId"),
        from: query.get("from"),
        to: query.get("to"),
        page: Number(query.get("page") || 1),
        pageSize: Number(query.get("pageSize") || 50),
      });
      return jsonData(result);
    }

    if (match.route.path === "/api/checkins/:id" && method === "GET") {
      const checkin = await getCheckin(match.params.id, userId || undefined);
      return checkin ? jsonData({ checkin }) : jsonError("checkin_not_found", 404);
    }

    if (path === "/api/safety-culture/points/rules" && method === "GET") {
      return jsonData({ rules: await listPointRules() });
    }

    if (path === "/api/safety-culture/points/me" && method === "GET" && userId) {
      return jsonData({ balance: await getPointBalance(userId) });
    }

    if (path === "/api/safety-culture/points/me/transactions" && method === "GET" && userId) {
      return jsonData(await listPointTransactions(userId, { limit: Number(query.get("limit") || 50), cursor: query.get("cursor") }));
    }

    if (path === "/api/safety-culture/points/adjustments" && method === "POST" && userId) {
      const input = jsonBody(body);
      const balance = await awardPoints({
        userId: String(input.userId || userId),
        action: "safetyEffortCompleted",
        sourceType: "MANUAL_ADJUSTMENT",
        sourceId: input.sourceId ? String(input.sourceId) : null,
        idempotencyKey: String(input.idempotencyKey || `manual:${Date.now()}:${input.userId || userId}`),
        description: input.description ? String(input.description) : "Manual point adjustment",
      });
      return jsonData({ balance }, { status: 201 });
    }

    if (path === "/api/safety-culture/posts" && method === "GET" && userId) {
      return jsonData(await listPosts({
        viewerId: userId,
        limit: Number(query.get("limit") || 20),
        cursor: query.get("cursor"),
        scope: (query.get("scope") || "all") as "all" | "my-team" | "mine",
        category: query.get("category"),
      }));
    }

    if (path === "/api/safety-awareness/attempts" && method === "POST" && userId) {
      const input = jsonBody(body);
      const attempt = await createAwarenessAttempt({
        userId,
        score: Number(input.score || 0),
        total: Number(input.total || 0),
        questions: Array.isArray(input.questions) ? input.questions as Array<{ id: string; correct: boolean; category?: string; text?: string }> : [],
      });
      return jsonData({ attempt }, { status: 201 });
    }

    if (path === "/api/safety-culture/posts" && method === "POST" && userId) {
      const input = jsonBody(body);
      const post = await createPost({
        authorId: userId,
        content: String(input.content || input.body || ""),
        category: input.category ? String(input.category) : null,
        attachmentIds: Array.isArray(input.attachmentIds) ? input.attachmentIds as Array<string | number> : [],
        eventId: optionalScalar(input.eventId) || optionalScalar(input.feedEventId),
      });
      return jsonData({ post }, { status: 201 });
    }

    if (match.route.path === "/api/safety-culture/posts/:id" && userId) {
      if (method === "GET") {
        const post = await getPost(match.params.id, userId);
        return post ? jsonData({ post }) : jsonError("post_not_found", 404);
      }
      if (method === "PATCH") {
        const input = jsonBody(body);
        const post = await updatePost(match.params.id, userId, { content: input.content ? String(input.content) : undefined, status: input.status ? String(input.status) : undefined });
        return post ? jsonData({ post }) : jsonError("post_not_found", 404);
      }
      if (method === "DELETE") {
        const result = await deletePost(match.params.id, userId);
        return result.deleted ? jsonData(result) : jsonError("post_not_found_or_not_owner", 404);
      }
    }

    if (match.route.path === "/api/safety-culture/posts/:id/comments" && userId) {
      if (method === "GET") {
        return jsonData(await listComments(match.params.id, { limit: Number(query.get("limit") || 30), cursor: query.get("cursor"), viewerId: userId }));
      }
      if (method === "POST") {
        const comment = await createComment(match.params.id, userId, String(jsonBody(body).content || jsonBody(body).text || ""));
        return jsonData({ comment }, { status: 201 });
      }
    }

    if (match.route.path === "/api/safety-culture/comments/:id" && userId) {
      if (method === "PATCH") {
        const input = jsonBody(body);
        const comment = await updateComment(match.params.id, userId, String(input.content || input.text || ""));
        return comment ? jsonData({ comment }) : jsonError("comment_not_found", 404);
      }
      if (method === "DELETE") {
        return jsonData(await deleteComment(match.params.id, userId));
      }
    }

    if (match.route.path === "/api/safety-culture/comments/:id/reactions" && userId) {
      if (method === "POST") {
        return jsonData({ reaction: await setCommentReaction(match.params.id, userId, String(jsonBody(body).reactionType || "like")) }, { status: 201 });
      }
      if (method === "DELETE") {
        return jsonData(await deleteCommentReaction(match.params.id, userId));
      }
    }

    if (match.route.path === "/api/safety-culture/posts/:id/reactions" && userId) {
      if (method === "POST") {
        return jsonData({ reaction: await setReaction(match.params.id, userId, String(jsonBody(body).reactionType || "LIKE")) }, { status: 201 });
      }
      if (method === "DELETE") {
        return jsonData(await deleteReaction(match.params.id, userId));
      }
    }
  } catch (error) {
    return jsonError(error, 400);
  }

  return null;
}
