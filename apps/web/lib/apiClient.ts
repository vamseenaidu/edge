export type ApiResponse<T = any> = {
  ok: boolean;
  status: number;
  body: T | null;
};

export function getApiBase(): string {
  const envBase = process.env.NEXT_PUBLIC_EDGE_API_BASE;
  const base = envBase && envBase.trim().length > 0 ? envBase.trim() : "http://localhost:3000";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

async function request(path: string, options: RequestInit): Promise<ApiResponse> {
  const base = getApiBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      cache: "no-store",
    });
    const text = await res.text();
    let body: any = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    return { ok: res.ok, status: res.status, body };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: {
        kind: "edge.error",
        error: {
          code: "NETWORK",
          message: error instanceof Error ? error.message : "Network error",
        },
      },
    };
  }
}

export async function apiGet(path: string): Promise<ApiResponse> {
  return request(path, { method: "GET" });
}

export async function apiPost(path: string, jsonBody: unknown): Promise<ApiResponse> {
  return request(path, { method: "POST", body: JSON.stringify(jsonBody ?? {}) });
}
