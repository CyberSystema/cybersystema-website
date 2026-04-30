// Reads the CSRF cookie set by the server and returns it.
// Cookie is non-HttpOnly and same-origin, so this is safe.
export function readCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )cs_admin_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function csrfFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.method && init.method.toUpperCase() !== "GET") {
    headers.set("x-csrf-token", readCsrfToken());
    if (!headers.has("content-type") && init.body) {
      headers.set("content-type", "application/json");
    }
  }
  return fetch(input, { ...init, headers });
}
