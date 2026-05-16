import { resolveIconUrl } from '../lib/iconUrl';

interface Props {
  iconRef?: string;
  fallbackUrl?: string | null;
  size?: number;
}

export function IconPreview({ iconRef, fallbackUrl, size = 48 }: Props) {
  const url = fallbackUrl ?? resolveIconUrl(iconRef);
  if (!url) return <span className="empty">no icon</span>;
  return (
    <img
      src={url}
      width={size}
      height={size}
      alt="icon"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
