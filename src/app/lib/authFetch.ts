export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/auth";

// Simple, centralized fetch with Bearer + auto-refresh on 401/403
export async function fetchWithAuth(url: string, init: RequestInit = {}): Promise<any> {
  const buildHeaders = (extra?: HeadersInit): HeadersInit => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    const access = typeof window !== "undefined" ? localStorage.getItem("access") : null;
    if (access) h["Authorization"] = `Bearer ${access}`;
    return { ...h, ...(extra || {}) } as HeadersInit;
  };

  const doFetch = async () => {
    const res = await fetch(url, { ...init, headers: buildHeaders(init.headers as HeadersInit) });
    const ct = res.headers.get("content-type") || "";
    let data: any = null; try { data = ct.includes("application/json") ? await res.json() : await res.text(); } catch {}
    return { res, data };
  };

  let { res, data } = await doFetch();
  if (res.ok) return data;

  if (res.status === 401 || res.status === 403) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const retry = await doFetch();
      if (retry.res.ok) return retry.data;
      data = retry.data; res = retry.res;
    }
  }

  const base = `[${res.status} ${res.statusText}] ${url}`;
  const detail = typeof data === "string" ? data : (data?.detail || data || "Error");
  throw new Error(`${base} — ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
}

async function tryRefreshToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return false;
  const candidates = [
    `${API_BASE}/token/refresh/`,
    `${API_BASE}/refresh/`,
    `${API_BASE}/jwt/refresh/`,
  ];
  for (const url of candidates) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (r.ok) {
        const data = await r.json();
        const access = data?.access || data?.access_token;
        if (access) {
          localStorage.setItem("access", access);
          try { window.dispatchEvent(new Event("tokenRefreshed")); } catch {}
          return true;
        }
      }
    } catch {}
  }
  // Refresh falló: limpiar sesión básica
  try {
    localStorage.removeItem("access");
    // Nota: dejamos el refresh por si el backend está caído momentáneamente
  } catch {}
  return false;
}

