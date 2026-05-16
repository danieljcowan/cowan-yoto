export function resolveIconUrl(ref: string | undefined): string | null {
  if (!ref) return null;
  if (ref.startsWith('http://') || ref.startsWith('https://')) return ref;
  if (ref.startsWith('yoto:#')) {
    const mediaId = ref.slice('yoto:#'.length);
    return `https://card-content.yotoplay.com/yoto/pub/${mediaId}`;
  }
  return null;
}
