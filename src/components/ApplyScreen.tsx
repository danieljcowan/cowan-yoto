import { useEffect, useMemo, useState } from 'react';
import { getCard, saveCard } from '../api/content';
import { uploadAnimatedIcon } from '../api/icons';
import { rememberIcon } from '../lib/iconCache';
import { flattenTracks, setTrackIcon, type FlatTrack } from '../lib/mutate';
import type { Card } from '../types';
import { CardsScreen } from './CardsScreen';
import { IconPreview } from './IconPreview';

interface Props {
  gif: Blob;
  onBack: () => void;
  onDone: () => void;
  toast: (msg: string, kind?: 'good' | 'bad') => void;
}

function keyOf(t: FlatTrack): string {
  return `${t.chapterKey}::${t.trackKey}`;
}

export function ApplyScreen({ gif, onBack, onDone, toast }: Props) {
  const [cardId, setCardId] = useState<string | null>(null);
  const gifUrl = useMemo(() => URL.createObjectURL(gif), [gif]);
  useEffect(() => () => URL.revokeObjectURL(gifUrl), [gifUrl]);

  if (!cardId) {
    return (
      <div>
        <button className="back-link" onClick={onBack}>
          ← Back to editor
        </button>
        <div className="apply-header">
          <img src={gifUrl} alt="your icon" className="apply-gif" />
          <h2>Choose a card for your icon</h2>
        </div>
        <CardsScreen onOpen={setCardId} />
      </div>
    );
  }

  return (
    <TrackPicker
      cardId={cardId}
      gif={gif}
      gifUrl={gifUrl}
      onBack={() => setCardId(null)}
      onDone={onDone}
      toast={toast}
    />
  );
}

function TrackPicker({
  cardId,
  gif,
  gifUrl,
  onBack,
  onDone,
  toast,
}: {
  cardId: string;
  gif: Blob;
  gifUrl: string;
  onBack: () => void;
  onDone: () => void;
  toast: (msg: string, kind?: 'good' | 'bad') => void;
}) {
  const [card, setCard] = useState<Card | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCard(cardId)
      .then(setCard)
      .catch((e) => setErr(String(e)));
  }, [cardId]);

  const tracks = useMemo(() => (card ? flattenTracks(card) : []), [card]);

  function toggle(t: FlatTrack) {
    setSelected((s) => {
      const n = new Set(s);
      const k = keyOf(t);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  }

  async function apply() {
    if (!card || selected.size === 0) return;
    setSaving(true);
    try {
      const { mediaId, url } = await uploadAnimatedIcon(gif, 'yoto-icon.gif');
      if (url) rememberIcon(mediaId, url);
      let mutated = card;
      for (const t of tracks) {
        if (selected.has(keyOf(t))) {
          mutated = setTrackIcon(mutated, t.chapterKey, t.trackKey, mediaId);
        }
      }
      await saveCard(mutated);
      toast(
        `Icon applied to ${selected.size} track${selected.size === 1 ? '' : 's'} on “${card.title ?? 'card'}”`,
        'good',
      );
      onDone();
    } catch (e) {
      toast(`Apply failed: ${e}`, 'bad');
      setSaving(false);
    }
  }

  if (err) return <div className="empty-state">Couldn't load card: {err}</div>;
  if (!card) return <div className="empty-state">Loading card…</div>;

  return (
    <div>
      <button className="back-link" onClick={onBack}>
        ← Choose a different card
      </button>
      <div className="apply-header">
        <img src={gifUrl} alt="your icon" className="apply-gif" />
        <div>
          <h2 style={{ margin: 0 }}>{card.title ?? 'Untitled'}</h2>
          <div className="apply-hint">Tap the tracks that should get this icon.</div>
        </div>
        <button disabled={selected.size === 0 || saving} onClick={apply} style={{ marginLeft: 'auto' }}>
          {saving
            ? 'Applying…'
            : selected.size === 0
            ? 'Apply'
            : `Apply to ${selected.size} track${selected.size === 1 ? '' : 's'}`}
        </button>
      </div>

      <div className="track-list">
        {tracks.map((t) => {
          const isSel = selected.has(keyOf(t));
          return (
            <div
              key={keyOf(t)}
              className={`track-row selectable${isSel ? ' selected' : ''}`}
              onClick={() => toggle(t)}
            >
              <div className="num">{String(t.number).padStart(2, '0')}</div>
              <div className="icon-cell">
                {isSel ? (
                  <img src={gifUrl} alt="" style={{ width: 48, height: 48, imageRendering: 'pixelated' }} />
                ) : (
                  <IconPreview iconRef={t.iconRef} />
                )}
              </div>
              <div>
                <div className="title">{t.title}</div>
                {isSel && <div className="pending">Will get your icon</div>}
              </div>
              <div className="checkmark">{isSel ? '✓' : ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
