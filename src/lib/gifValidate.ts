export interface GifInfo {
  width: number;
  height: number;
  isGif: boolean;
}

export async function readGifInfo(file: File | Blob): Promise<GifInfo> {
  const buf = await file.slice(0, 10).arrayBuffer();
  const bytes = new Uint8Array(buf);
  const header = String.fromCharCode(...bytes.slice(0, 6));
  const isGif = header === 'GIF87a' || header === 'GIF89a';
  if (!isGif) return { width: 0, height: 0, isGif: false };
  const width = bytes[6] | (bytes[7] << 8);
  const height = bytes[8] | (bytes[9] << 8);
  return { width, height, isGif: true };
}

export async function validateAnimatedIcon(file: File): Promise<string | null> {
  if (!/\.gif$/i.test(file.name) && file.type !== 'image/gif') {
    return 'File must be a .gif';
  }
  const info = await readGifInfo(file);
  if (!info.isGif) return 'Not a valid GIF file';
  if (info.width !== 16 || info.height !== 16) {
    return `GIF must be exactly 16×16 (got ${info.width}×${info.height})`;
  }
  return null;
}
