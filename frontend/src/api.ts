export const API_BASE = process.env.REACT_APP_API_URL ?? '';

export function apiFetch(path: string, opts?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, opts);
}
