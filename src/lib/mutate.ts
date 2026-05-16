import type { Card, Chapter, Track } from '../types';

export function setTrackIcon(card: Card, chapterKey: string, trackKey: string, mediaId: string): Card {
  const iconRef = `yoto:#${mediaId}`;
  const chapters = (card.content?.chapters ?? []).map((ch): Chapter => {
    if (ch.key !== chapterKey) return ch;
    const tracks = (ch.tracks ?? []).map((t): Track => {
      if (t.key !== trackKey) return t;
      return { ...t, display: { ...(t.display ?? {}), icon16x16: iconRef } };
    });
    const onlyTrack = (ch.tracks ?? []).length === 1 && (ch.tracks ?? [])[0].key === trackKey;
    const chapterDisplay = onlyTrack
      ? { ...(ch.display ?? {}), icon16x16: iconRef }
      : ch.display;
    return { ...ch, tracks, display: chapterDisplay };
  });
  return { ...card, content: { ...(card.content ?? {}), chapters } };
}

export interface FlatTrack {
  chapterKey: string;
  trackKey: string;
  number: number;
  title: string;
  iconRef?: string;
}

export function flattenTracks(card: Card): FlatTrack[] {
  const out: FlatTrack[] = [];
  let n = 0;
  for (const ch of card.content?.chapters ?? []) {
    for (const t of ch.tracks ?? []) {
      n++;
      out.push({
        chapterKey: ch.key,
        trackKey: t.key,
        number: n,
        title: t.title ?? ch.title ?? `Track ${n}`,
        iconRef: t.display?.icon16x16 ?? ch.display?.icon16x16,
      });
    }
  }
  return out;
}

export function getCardId(card: Card): string | undefined {
  return (card.id as string | undefined) ?? (card.cardId as string | undefined);
}
