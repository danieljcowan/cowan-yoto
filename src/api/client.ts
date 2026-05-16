import { getAccessToken } from '../auth/oauth';

export const API_BASE = 'https://api.yotoplay.com';

export class ApiError extends Error {
  constructor(public status: number, public body: string, message: string) {
    super(message);
  }
}

export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  if (!token) throw new ApiError(401, '', 'Not authenticated');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, body, `${res.status} ${res.statusText} on ${path}: ${body.slice(0, 200)}`);
  }
  return res;
}
