import { generatePkcePair, generateState } from './pkce';
import { loadTokens, saveTokens, clearTokens, type StoredTokens } from './storage';

const AUTH_BASE = 'https://login.yotoplay.com';
const AUDIENCE = 'https://api.yotoplay.com';
const REDIRECT_URI = `${window.location.origin}${import.meta.env.BASE_URL}`;
const SCOPES = 'user:content:view user:content:manage user:icons:manage';

const VERIFIER_KEY = 'yoto.pkce.verifier';
const STATE_KEY = 'yoto.pkce.state';

function getClientId(): string {
  const id = import.meta.env.VITE_YOTO_CLIENT_ID as string | undefined;
  if (!id) {
    throw new Error(
      'VITE_YOTO_CLIENT_ID is not set. Register an app at https://dashboard.yoto.dev/applications/new and put the client id in .env.local',
    );
  }
  return id;
}

export async function startLogin(): Promise<void> {
  const { verifier, challenge } = await generatePkcePair();
  const state = generateState();
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    audience: AUDIENCE,
    client_id: getClientId(),
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });
  window.location.assign(`${AUTH_BASE}/authorize?${params.toString()}`);
}

export function hasOAuthCallback(): boolean {
  const sp = new URLSearchParams(window.location.search);
  return sp.has('code') || sp.has('error');
}

export async function handleCallback(): Promise<void> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const err = url.searchParams.get('error');
  if (err) throw new Error(`${err}: ${url.searchParams.get('error_description') ?? ''}`);
  if (!code) throw new Error('Missing authorization code');

  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  const expectedState = sessionStorage.getItem(STATE_KEY);
  if (!verifier) throw new Error('Missing PKCE verifier; restart login');
  if (returnedState !== expectedState) throw new Error('State mismatch; possible CSRF');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: getClientId(),
    code_verifier: verifier,
    code,
    redirect_uri: REDIRECT_URI,
  });
  const res = await fetch(`${AUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  saveTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: Date.now() + data.expires_in * 1000,
  });
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
}

async function refresh(refreshToken: string): Promise<StoredTokens> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: getClientId(),
    refresh_token: refreshToken,
  });
  const res = await fetch(`${AUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Refresh failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  const next: StoredTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  saveTokens(next);
  return next;
}

export async function getAccessToken(): Promise<string | null> {
  const tokens = loadTokens();
  if (!tokens) return null;
  if (Date.now() < tokens.expiresAt - 30_000) return tokens.accessToken;
  if (!tokens.refreshToken) {
    clearTokens();
    return null;
  }
  try {
    const next = await refresh(tokens.refreshToken);
    return next.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

export function isLoggedIn(): boolean {
  return loadTokens() !== null;
}

export function logout(): void {
  clearTokens();
}
