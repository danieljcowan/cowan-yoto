import { authedFetch, ApiError } from './client';
import type { IconUploadResponse } from '../types';

export async function uploadAnimatedIcon(
  gif: Blob,
  filename: string,
): Promise<{ mediaId: string; url?: string }> {
  const base = filename.replace(/\.[^.]+$/, '') || 'icon';
  const params = new URLSearchParams({ autoConvert: 'false', filename: base });
  const res = await authedFetch(
    `/media/displayIcons/user/me/upload?${params.toString()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'image/gif' },
      body: gif,
    },
  );
  const data = (await res.json()) as IconUploadResponse;
  return { mediaId: data.displayIcon.mediaId, url: data.displayIcon.url };
}

export interface UserIcon {
  mediaId: string;
  url?: string;
  displayIconId?: string;
}

interface IconListEntry {
  mediaId?: string;
  url?: string;
  displayIconId?: string;
  displayIcon?: IconListEntry;
  [key: string]: unknown;
}

function normalizeIcon(raw: IconListEntry): UserIcon | null {
  const node: IconListEntry = raw.displayIcon ?? raw;
  if (!node.mediaId) return null;
  return {
    mediaId: node.mediaId,
    url: node.url,
    displayIconId: node.displayIconId,
  };
}

export async function listUserIcons(): Promise<UserIcon[]> {
  const candidates = [
    '/media/displayIcons/user/me',
    '/media/displayIcons/user/me/list',
    '/media/displayIcons/user/me?all=true',
  ];
  let lastErr: unknown = null;
  for (const path of candidates) {
    try {
      const res = await authedFetch(path);
      const data = await res.json();
      const list: IconListEntry[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.displayIcons)
        ? data.displayIcons
        : Array.isArray(data?.icons)
        ? data.icons
        : Array.isArray(data?.items)
        ? data.items
        : [];
      const out = list
        .map(normalizeIcon)
        .filter((x): x is UserIcon => x !== null);
      if (out.length > 0 || Array.isArray(data) || data?.displayIcons || data?.icons || data?.items) {
        return out;
      }
    } catch (e) {
      lastErr = e;
      if (e instanceof ApiError && e.status !== 404 && e.status !== 405) {
        if (e.status === 403) continue;
        throw e;
      }
    }
  }
  console.warn('Could not list user icons:', lastErr);
  return [];
}
