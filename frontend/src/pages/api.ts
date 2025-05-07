export const API_BASE = process.env.REACT_APP_API_URL ?? '';

export function apiFetch(path: string, opts?: RequestInit) {
  return fetch(`${API_BASE}${path}`, {
    // include credentials so cookies (session) get sent/received
    credentials: 'include',
    ...opts,
  });
}

