import { useEffect, useState } from 'react';
import { extractMediaId, getIconMap, lookupIcon } from '../lib/iconCache';

interface Props {
  iconRef?: string;
  fallbackUrl?: string | null;
  size?: number;
}

function resolveBuiltin(ref: string): string | null {
  if (ref.startsWith('http://') || ref.startsWith('https://')) return ref;
  if (ref.startsWith('yoto:#')) {
    return `https://card-content.yotoplay.com/yoto/pub/${ref.slice('yoto:#'.length)}`;
  }
  return null;
}

export function IconPreview({ iconRef, fallbackUrl, size = 48 }: Props) {
  const mediaId = extractMediaId(iconRef);
  const [url, setUrl] = useState<string | null>(() => {
    if (fallbackUrl) return fallbackUrl;
    if (mediaId) return lookupIcon(mediaId) ?? null;
    return iconRef ? resolveBuiltin(iconRef) : null;
  });

  useEffect(() => {
    if (fallbackUrl) {
      setUrl(fallbackUrl);
      return;
    }
    if (!mediaId) {
      setUrl(iconRef ? resolveBuiltin(iconRef) : null);
      return;
    }
    const cached = lookupIcon(mediaId);
    if (cached) {
      setUrl(cached);
      return;
    }
    let alive = true;
    getIconMap().then((map) => {
      if (!alive) return;
      const found = map.get(mediaId);
      setUrl(found ?? resolveBuiltin(iconRef!) ?? null);
    });
    return () => {
      alive = false;
    };
  }, [iconRef, fallbackUrl, mediaId]);

  if (!url) return <span className="empty">no icon</span>;
  return (
    <img
      src={url}
      width={size}
      height={size}
      alt="icon"
      style={{ imageRendering: 'pixelated' }}
      onError={() => setUrl(null)}
    />
  );
}
