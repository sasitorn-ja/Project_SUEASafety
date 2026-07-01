export type ApiResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const getRequestInFlight = new Map<string, Promise<ApiResult<unknown>>>();
const getRequestCache = new Map<string, { value: ApiResult<unknown>; expiresAt: number }>();
const GET_DEDUPE_CACHE_MS = 2_000;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const method = String(init?.method || "GET").toUpperCase();
  const canDedupe = method === "GET" && !init?.body && path.startsWith("/api/");
  if (canDedupe) {
    const cached = getRequestCache.get(path);
    if (cached && cached.expiresAt > Date.now()) return cached.value as ApiResult<T>;
    const inFlight = getRequestInFlight.get(path);
    if (inFlight) return inFlight as Promise<ApiResult<T>>;
  }

  const request = (async (): Promise<ApiResult<T>> => {
    try {
      const response = await fetch(path, {
        ...init,
        credentials: init?.credentials || "include",
        headers: {
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...(init?.headers || {}),
        },
      });
      const payload = (await response.json().catch(() => null)) as ApiResult<T> | null;
      if (!payload) return { ok: false, error: `invalid_json:${response.status}` };
      return payload;
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "network_error",
      };
    }
  })();

  if (canDedupe) {
    getRequestInFlight.set(path, request as Promise<ApiResult<unknown>>);
    request.then((value) => {
      getRequestCache.set(path, { value: value as ApiResult<unknown>, expiresAt: Date.now() + GET_DEDUPE_CACHE_MS });
    }).finally(() => {
      getRequestInFlight.delete(path);
    });
  }

  return request;
}

export function clearApiGetCache(path?: string) {
  if (path) {
    getRequestCache.delete(path);
    getRequestInFlight.delete(path);
    return;
  }
  getRequestCache.clear();
  getRequestInFlight.clear();
}

export async function uncachedApiFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      credentials: init?.credentials || "include",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers || {}),
      },
    });
    const payload = (await response.json().catch(() => null)) as ApiResult<T> | null;
    if (!payload) return { ok: false, error: `invalid_json:${response.status}` };
    return payload;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "network_error",
    };
  }
}

export function apiJson(method: "POST" | "PATCH" | "PUT" | "DELETE", body?: unknown): RequestInit {
  return {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}
