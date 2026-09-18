import { getToken, clearAuth } from "./auth";

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(options.body instanceof FormData) && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (response.status === 401) {
    clearAuth();
    window.dispatchEvent(new Event("vexora:auth-expired"));
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload?.message
        ? payload.message
        : "Request failed";
    throw new Error(message);
  }

  return payload;
}

export const get = (path) => api(path);
export const post = (path, body) =>
  api(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) });
export const put = (path, body) =>
  api(path, { method: "PUT", body: JSON.stringify(body) });
export const del = (path) => api(path, { method: "DELETE" });
