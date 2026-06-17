export type ApiResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      ...init,
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
