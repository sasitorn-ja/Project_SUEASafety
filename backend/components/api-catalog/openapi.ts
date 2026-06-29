import "server-only";

import { API_CATALOG_ROUTES, type ApiCatalogRoute } from "@backend/components/api-catalog/registry";

type OpenApiOperation = {
  tags: string[];
  summary: string;
  description: string;
  operationId: string;
  parameters?: Array<Record<string, unknown>>;
  requestBody?: Record<string, unknown>;
  responses: Record<string, unknown>;
  security?: Array<Record<string, string[]>>;
};

function toOpenApiPath(path: string) {
  return path.replaceAll(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function normalizeMethod(method: string) {
  return method.toLowerCase();
}

function buildOperationId(route: ApiCatalogRoute) {
  const raw = `${route.method}_${route.path}`
    .replaceAll("/api/", "")
    .replaceAll("/", "_")
    .replaceAll(":", "")
    .replaceAll(/[^A-Za-z0-9_]/g, "_");

  return raw.replaceAll(/_+/g, "_").replace(/^_+|_+$/g, "");
}

function buildDescription(route: ApiCatalogRoute) {
  return [
    route.purpose,
    `Caller: ${route.caller}`,
    `When: ${route.whenCalled}`,
    `Auth: ${route.auth}`,
    `Status: ${route.status}`,
    `Notes: ${route.notes}`,
  ].join("\n");
}

function buildPathParameters(route: ApiCatalogRoute) {
  const matches = [...route.path.matchAll(/:([A-Za-z0-9_]+)/g)];
  return matches.map((match) => ({
    name: match[1],
    in: "path",
    required: true,
    schema: { type: "string" },
    description: `Path parameter: ${match[1]}`,
  }));
}

function buildQueryParameters(route: ApiCatalogRoute) {
  const documentedPath = route.documentedPath || route.path;
  const [, query] = documentedPath.split("?");
  if (!query) return [];

  return query
    .split("&")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [name] = entry.split("=");
      return {
        name,
        in: "query",
        required: false,
        schema: { type: "string" },
        description: `Query parameter: ${name}`,
      };
    });
}

function buildPaginationParameters(route: ApiCatalogRoute) {
  if (!route.pagination || route.pagination === "No" || !route.pagination.includes("page")) {
    return [];
  }

  return [
    {
      name: "page",
      in: "query",
      required: route.pagination.includes("Required"),
      schema: { type: "integer", minimum: 1, default: 1 },
      description: "Page number",
    },
    {
      name: "pageSize",
      in: "query",
      required: route.pagination.includes("Required"),
      schema: { type: "integer", minimum: 1, default: 50 },
      description: "Items per page",
    },
  ];
}

function buildParameters(route: ApiCatalogRoute) {
  const params = [...buildPathParameters(route), ...buildQueryParameters(route), ...buildPaginationParameters(route)];
  const seen = new Set<string>();

  return params.filter((param) => {
    const key = `${param.in}:${param.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSecurity(route: ApiCatalogRoute) {
  if (route.auth.includes("Public") || route.auth === "No") return [];
  return [{ cookieAuth: [] }];
}

function buildRequestBody(route: ApiCatalogRoute) {
  if (route.method === "GET" || route.method === "DELETE") return undefined;

  return {
    required: route.method === "POST" || route.method === "PUT",
    content: {
      "application/json": {
        schema: {
          type: "object",
          additionalProperties: true,
          description: "Payload placeholder. Replace with detailed schema as endpoint contracts are refined.",
        },
      },
    },
  };
}

function buildResponses(route: ApiCatalogRoute) {
  const responses: Record<string, unknown> = {
    "200": {
      description: "Successful response",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              ok: { type: "boolean", example: true },
              data: {
                type: "object",
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
    "401": {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              ok: { type: "boolean", example: false },
              error: { type: "string", example: "unauthorized" },
            },
          },
        },
      },
    },
  };

  if (route.auth.startsWith("Admin") || route.auth === "System/Admin" || route.auth === "Admin") {
    responses["403"] = {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              ok: { type: "boolean", example: false },
              error: { type: "string", example: "forbidden" },
            },
          },
        },
      },
    };
  }

  if (route.method === "POST") {
    responses["201"] = responses["200"];
  }

  return responses;
}

function buildOperation(route: ApiCatalogRoute): OpenApiOperation {
  const parameters = buildParameters(route);
  const security = buildSecurity(route);

  return {
    tags: [route.module],
    summary: route.purpose,
    description: buildDescription(route),
    operationId: buildOperationId(route),
    ...(parameters.length > 0 ? { parameters } : {}),
    ...(buildRequestBody(route) ? { requestBody: buildRequestBody(route) } : {}),
    responses: buildResponses(route),
    ...(security.length > 0 ? { security } : {}),
  };
}

export function buildOpenApiDocument(baseUrl?: string) {
  const paths: Record<string, Record<string, OpenApiOperation>> = {};

  for (const route of API_CATALOG_ROUTES) {
    const openApiPath = toOpenApiPath(route.path);
    const method = normalizeMethod(route.method);
    if (!paths[openApiPath]) paths[openApiPath] = {};
    paths[openApiPath][method] = buildOperation(route);
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "SUEA Safety API",
      version: process.env.npm_package_version || "1.0.0",
      description: "Auto-generated Swagger document based on the in-repo API catalog.",
    },
    servers: baseUrl
      ? [
          {
            url: baseUrl,
            description: "Current environment",
          },
        ]
      : [],
    tags: [...new Set(API_CATALOG_ROUTES.map((route) => route.module))].map((name) => ({ name })),
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "session",
          description: "Session cookie used by the app. Swagger UI sends browser cookies on same-origin requests.",
        },
      },
    },
    paths,
  };
}
