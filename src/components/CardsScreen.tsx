import { useEffect, useState } from 'react';
import { listMyContent } from '../api/content';
import type { Card } from '../types';
import { flattenTracks, getCardId } from '../lib/mutate';

interface Props {
  onOpen: (id: string) => void;
}

export function CardsScreen({ onOpen }: Props) {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listMyContent()
      .then(setCards)
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <div className="empty-state">Couldn't load cards: {err}</div>;
  if (!cards) return <div className="empty-state">Loading your cards…</div>;
  if (cards.length === 0) {
    return (
      <div className="empty-state">
        No MYO cards found. Create one in the Yoto app, then come back.
      </div>
    );
  }

  return (
    <div className="cards-grid">
      {cards.map((card) => {
        const id = getCardId(card);
        const trackCount = flattenTracks(card).length;
        const coverUrl = card.metadata?.cover?.imageL ?? card.metadata?.cover?.imageS;
        return (
          <div
            key={id ?? card.title}
            className="card-tile"
            onClick={() => id && onOpen(id)}
          >
            <div className="cover">
              {coverUrl ? <img src={coverUrl} alt="" /> : null}
            </div>
            <div className="title">{card.title ?? 'Untitled'}</div>
            <div className="meta">
              {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
