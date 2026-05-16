const KEY = 'yoto.tokens.v1';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}

export function loadTokens(): StoredTokens | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: StoredTokens): void {
  localStorage.setItem(KEY, JSON.stringify(tokens));
}

export function clearTokens(): void {
  localStorage.removeItem(KEY);
}
