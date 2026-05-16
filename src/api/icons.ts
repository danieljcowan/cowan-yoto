import { authedFetch } from './client';
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
