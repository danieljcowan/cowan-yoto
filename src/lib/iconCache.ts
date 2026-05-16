import { listUserIcons, type UserIcon } from '../api/icons';

let cache: Map<string, string> | null = null;
let inflight: Promise<Map<string, string>> | null = null;

async function load(): Promise<Map<string, string>> {
  const icons = await listUserIcons();
  const map = new Map<string, string>();
  for (const i of icons) {
    if (i.url) map.set(i.mediaId, i.url);
  }
  return map;
}

export async function getIconMap(): Promise<Map<string, string>> {
  if (cache) return cache;
  if (!inflight) {
    inflight = load().then((m) => {
      cache = m;
      inflight = null;
      return m;
    });
  }
  return inflight;
}

export function rememberIcon(mediaId: string, url: string): void {
  if (!cache) cache = new Map();
  cache.set(mediaId, url);
}

export function lookupIcon(mediaId: string): string | undefined {
  return cache?.get(mediaId);
}

export function resetIconCache(): void {
  cache = null;
  inflight = null;
}

export function extractMediaId(ref: string | undefined): string | null {
  if (!ref) return null;
  if (ref.startsWith('yoto:#')) return ref.slice('yoto:#'.length);
  return null;
}

export type { UserIcon };
