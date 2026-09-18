const KEY = "vexora_auth";

export function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function saveAuth(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}

export function getToken() {
  return getAuth()?.token || "";
}

export function getUser() {
  return getAuth()?.user || null;
}
